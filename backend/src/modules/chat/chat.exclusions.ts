import { normalize } from "../ai/ai.rules";

const names = ["Bà Nà", "Cầu Rồng", "Mỹ Khê", "Ngũ Hành Sơn", "Sơn Trà", "Furama", "Hilton", "Hyatt", "HAIAN", "Sala", "Mì Quảng", "bánh xèo", "hải sản"];

/** Explicit named exclusions only; ambiguous “bỏ cái đó” is clarified by knowledgeReply. */
export function excludedNames(texts: string[], initial: string[] = []) {
  const excluded = new Set(initial);
  for (const text of texts) {
    const n = normalize(text);
    for (const name of names) {
      const key = normalize(name);
      if (new RegExp(`\\b(?:bo|khong (?:di|chon|goi y|an)|dung (?:di|chon|goi y)|da di)\\s+(?:lai\\s+)?${key}\\b|\\bdi\\s+${key}\\s+roi\\b`).test(n)) excluded.add(name);
      if (new RegExp(`\\b(?:cho phep|chon lai|di lai)\\s+${key}\\b`).test(n)) excluded.delete(name);
    }
  }
  return [...excluded];
}
export function isExcluded(name: string, exclusions: string[]) {
  const n = normalize(name);
  return exclusions.some(term => n.includes(normalize(term)));
}
