import test from "node:test";
import assert from "node:assert/strict";
import {
  geminiClient,
  runPrompt,
  runEmbedding,
  aiMetrics,
} from "../src/Ai/runtime";
import { buildIntentPrompt } from "../src/Ai/promt";

test("Quota model chat không chặn embedding; model đang cooldown không bị gọi lại", async (t) => {
  const key = process.env.GEMINI_API_KEY,
    model = process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = "test-no-network";
  process.env.GEMINI_MODEL = "text-quota-test";
  const client = await geminiClient();
  let calls = 0,
    embeddings = 0;
  t.mock.method(client.models, "generateContent", async () => {
    calls++;
    throw new Error("429 RESOURCE_EXHAUSTED");
  });
  t.mock.method(client.models, "embedContent", async () => {
    embeddings++;
    return { embeddings: [{ values: Array.from({ length: 768 }, () => 0.1) }] };
  });
  try {
    assert.equal(
      await runPrompt(buildIntentPrompt("Quán ăn"), Date.now() + 1500),
      null,
    );
    assert.ok(aiMetrics().cooldownSeconds > 0);
    const r = await runEmbedding("embedding-independent", ["Du lịch Đà Nẵng"]);
    assert.equal(r?.embeddings?.[0]?.values?.length, 768);
    assert.equal(embeddings, 1);
    assert.equal(await runPrompt(buildIntentPrompt("Quán ăn")), null);
    assert.equal(calls, 1);
  } finally {
    if (key == null) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = key;
    if (model == null) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = model;
  }
});
