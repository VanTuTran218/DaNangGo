import { z } from "zod";

const marker = "\n\u001eDANANGGO_ADVISOR:";
const schema = z
  .object({
    stayId: z.number().int().positive().nullable(),
    tripContext: z.string().max(2000).optional(),
    excludedStayIds: z.array(z.number().int().positive()).max(60),
    dietaryRestricted: z.boolean().optional(),
    excludedNames: z.array(z.string().max(100)).max(60).optional(),
  })
  .strict();
export type AdvisorState = z.infer<typeof schema>;

/** Internal state travels with the owned AI turn, never with untrusted user text. */
export function readAdvisorTurn(content: string) {
  const at = content.lastIndexOf(marker);
  if (at < 0) return { content, state: undefined as AdvisorState | undefined };
  try {
    return {
      content: content.slice(0, at),
      state: schema.parse(JSON.parse(content.slice(at + marker.length))),
    };
  } catch {
    return {
      content: content.slice(0, at),
      state: undefined as AdvisorState | undefined,
    };
  }
}
export function writeAdvisorTurn(content: string, state: AdvisorState) {
  return content + marker + JSON.stringify(schema.parse(state));
}
