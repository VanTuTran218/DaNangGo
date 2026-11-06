import { normalize } from "../ai/ai.rules";

/** Small lexical normalization; semantic classification still handles unseen phrasing. */
export function conversationalText(text: string) {
  return normalize(text).replace(/\b(ko|k0|khongg)\b/g, "khong").replace(/\bks\b/g, "khach san").replace(/\bhomstay\b/g, "homestay")
    .replace(/\bcheckin\b/g, "check in").replace(/\bdi an uon?g?\b/g, "di an")
    .replace(/\b(mot|hai|ba|bon|tu|nam|sau|bay|tam|chin|muoi)\s+(ngay|dem|nguoi|khach|tre em|be|tuoi|trieu)\b/g, (_all, number: string, unit: string) => `${({ mot: 1, hai: 2, ba: 3, bon: 4, tu: 4, nam: 5, sau: 6, bay: 7, tam: 8, chin: 9, muoi: 10 } as Record<string, number>)[number]} ${unit}`)
    .replace(/(\d+(?:[.,]\d+)?)\s*trieu\s*ruoi\b/g, (_all, value: string) => `${Number(value.replace(",", ".")) + 0.5} trieu`)
    .replace(/\b(mai|mot)\b(?=\s|$)/g, (match, _word: string, offset: number, whole: string) => match === "mai" && !/ngay\s*$/.test(whole.slice(0, offset)) ? "ngay mai" : match);
}
export type Need = "food" | "sight" | "stay";
export function requestedNeeds(text: string): Need[] {
  const n = conversationalText(text);
  const result: Need[] = [];
  for (const [kind, pattern] of [
    ["food", /\b(di an|an gi|an ngon|an uong|am thuc|mon (?:an|dia phuong|gi ngon)|dac san|quan (?:thit nuong|ban che|ban kem|phuc vu do an dem)|an cay|quan (?:an|hai san|ca phe|oc|lau|chay)|nha hang|hai san|mi quang|bun cha|banh xeo|com nieu|an sang|an trua|an toi|an vat|ca phe|cafe|an chay|di ung|khau vi)\b/g],
    ["sight", /\b(tham quan|di choi|kham pha|chup (?:vai |may )?(?:tam )?(?:anh|hinh)|check in|song ao|bien|nui|diem (?:den|du lich)|ba na|cau rong|son tra|ngu hanh son|co gi (?:vui|mien phi)|nen di dau|lan dau den|diem nao|noi nao.*(?:ngam|chup|cay xanh|di dao))\b/g],
    ["stay", /\b(khach san|homestay|resort|luu tru|cho o|noi o|cho nghi|ngu o dau|nghi o dau|phong nghi)\b/g],
  ] as const) {
    for (const match of n.matchAll(pattern)) {
      const before = n.slice(Math.max(0, match.index! - 30), match.index);
      // “quán gần biển/khách sạn” uses an anchor, not a second requested service.
      if (/(?:gan|quanh|sat|view|huong|cach|tu)\s*(?:bo\s*)?$/.test(before)) continue;
      if (kind === "stay" && /(?:khong can|da (?:dat|co))\s*$/.test(before)) continue;
      result.push(kind); break;
    }
  }
  return [...new Set(result)];
}
