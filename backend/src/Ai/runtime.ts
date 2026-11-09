import { createHash } from "node:crypto";
import { z } from "zod";
import { safeParseJson, toGeminiContents, type PromptBundle } from "./promt";

const metrics = new Map<
  string,
  {
    calls: number;
    success: number;
    fallback: number;
    retries: number;
    cacheHits: number;
    durationMs: number;
  }
>();
let lastProviderIssue: { code: string; at: string } | null = null;
const providerIssue = (code: string) => { lastProviderIssue = { code, at: new Date().toISOString() }; };
const cache = new Map<string, { until: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();
let client: any;
let busy = 0;
const cooldowns = new Map<string, number>();
export const fingerprint = (data: unknown) =>
  createHash("sha256").update(JSON.stringify(data)).digest("hex");
function stat(task: string) {
  if (!metrics.has(task))
    metrics.set(task, {
      calls: 0,
      success: 0,
      fallback: 0,
      retries: 0,
      cacheHits: 0,
      durationMs: 0,
    });
  return metrics.get(task)!;
}
export function aiMetrics() {
  return {
    model: process.env.GEMINI_MODEL || "gemini-3-flash-preview",
    keyConfigured: Boolean(process.env.GEMINI_API_KEY),
    lastProviderIssue,
    activeRequests: busy,
    cooldownSeconds: Math.max(
      0,
      Math.ceil(
        ((cooldowns.get(process.env.GEMINI_MODEL || "gemini-3-flash-preview") ??
          0) -
          Date.now()) /
          1000,
      ),
    ),
    embeddingCooldownSeconds: Math.max(
      0,
      Math.ceil(
        ((cooldowns.get(
          process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
        ) ?? 0) -
          Date.now()) /
          1000,
      ),
    ),
    tasks: Object.fromEntries(metrics),
    cacheEntries: cache.size,
  };
}
export async function geminiClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) {
    const { GoogleGenAI } = await import("@google/genai");
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}
export async function runPrompt(
  bundle: PromptBundle,
  deadline = Date.now() + 15_000,
  task = "chat",
): Promise<string | null> {
  const start = Date.now();
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const record = stat(task);
  record.calls++;
  if (busy >= 8 || (cooldowns.get(model) ?? 0) > start) {
    record.fallback++;
    return null;
  }
  busy++;
  try {
    const sdk = await geminiClient();
    if (!sdk) {
      providerIssue("NO_KEY");
      record.fallback++;
      return null;
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      const timeout = Math.min(
        Math.max(1000, Number(process.env.GEMINI_TIMEOUT_MS) || 15000),
        deadline - Date.now(),
      );
      if (timeout <= 0) break;
      try {
        const response = await sdk.models.generateContent({
          model,
          contents: toGeminiContents(bundle.history, bundle.user),
          config: {
            systemInstruction: bundle.system,
            ...bundle.config,
            ...(model.startsWith("gemini-3-flash")
              ? { thinkingConfig: { thinkingLevel: "minimal" } }
              : {}),
            abortSignal: AbortSignal.timeout(timeout),
          },
        });
        if (response.text) {
          record.success++;
          return response.text;
        }
        break;
      } catch (error) {
        const text = String(error instanceof Error ? error.message : error);
        providerIssue(/429|RESOURCE_EXHAUSTED/.test(text) ? "RATE_LIMITED" : /503|UNAVAILABLE/.test(text) ? "UNAVAILABLE" : /401|403|API_KEY_INVALID/.test(text) ? "AUTH_REJECTED" : /timeout|abort/i.test(text) ? "TIMEOUT" : /400|INVALID_ARGUMENT/.test(text) ? "INVALID_REQUEST" : "PROVIDER_ERROR");
        const transient = /429|503|UNAVAILABLE|RESOURCE_EXHAUSTED/.test(text);
        if (transient) cooldowns.set(model, Date.now() + 30_000);
        if (!transient || attempt || deadline - Date.now() < 2500) break;
        record.retries++;
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  } catch {
    /* Provider unavailable: caller keeps DB/rule-based path. */
  } finally {
    busy--;
    record.durationMs += Date.now() - start;
  }
  record.fallback++;
  return null;
}
export async function structured<T>(
  task: string,
  bundle: PromptBundle,
  schema: z.ZodType<T>,
): Promise<T | null> {
  const raw = await runPrompt(
    {
      ...bundle,
      config: {
        ...bundle.config,
        maxOutputTokens: Math.max(
          bundle.config.maxOutputTokens,
          (
            { reviewSummary: 6000, moderation: 5000, survey: 4000 } as Record<
              string,
              number
            >
          )[task] ?? 1400,
        ),
        responseJsonSchema: z.toJSONSchema(schema),
      },
    },
    Date.now() + 15_000,
    task,
  );
  if (!raw) return null;
  try {
    return safeParseJson(schema, raw);
  } catch {
    stat(task).success--;
    stat(task).fallback++;
    return null;
  }
}
export async function cached<T>(
  task: string,
  input: unknown,
  ttl: number,
  load: () => Promise<T>,
): Promise<T> {
  const key = `${task}:${fingerprint(input)}`;
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) {
    stat(task).cacheHits++;
    return structuredClone(hit.value) as T;
  }
  if (pending.has(key)) return structuredClone(await pending.get(key)) as T;
  const work = load()
    .then((value) => {
      if (cache.size >= 300) cache.delete(cache.keys().next().value!);
      cache.set(key, {
        until:
          Date.now() +
          ((value as { mode?: string })?.mode === "fallback"
            ? Math.min(ttl, 30_000)
            : ttl),
        value,
      });
      return value;
    })
    .finally(() => pending.delete(key));
  pending.set(key, work);
  return structuredClone(await work);
}

export async function runEmbedding(model: string, contents: string[]) {
  const start = Date.now(),
    record = stat("embedding");
  record.calls++;
  if (busy >= 8 || (cooldowns.get(model) ?? 0) > start) {
    record.fallback++;
    return null;
  }
  busy++;
  try {
    const sdk = await geminiClient();
    if (!sdk) {
      record.fallback++;
      return null;
    }
    const response = await sdk.models.embedContent({
      model,
      contents,
      config: {
        taskType: "SEMANTIC_SIMILARITY",
        outputDimensionality: 768,
        abortSignal: AbortSignal.timeout(15000),
      },
    });
    record.success++;
    return response;
  } catch (error) {
    if (/429|503|UNAVAILABLE|RESOURCE_EXHAUSTED/.test(String(error)))
      cooldowns.set(model, Date.now() + 30_000);
    record.fallback++;
    return null;
  } finally {
    busy--;
    record.durationMs += Date.now() - start;
  }
}
