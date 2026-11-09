import { z } from "zod";
import { getPool, sql } from "../../config/db";
import { conversationalText } from "./chat.language";
import { preferenceKeySchema, preferenceLabels, type PreferenceKey, type ProfileSuggestion } from "./chat.contract";

export const sensitivePreference = (key: PreferenceKey) => key.startsWith("allergy_");
const oppositeGroups: PreferenceKey[][] = [["food_spicy", "food_mild", "food_light"], ["food_seafood", "avoid_seafood"], ["vegetarian", "vegan"], ["pace_gentle", "pace_active"], ["stay_budget", "stay_premium"], ["taxi", "motorbike", "walk"]];
export function mergePreferences(previous: PreferenceKey[], updates: PreferenceKey[]) {
  let result = [...previous];
  for (const key of updates) {
    const group = oppositeGroups.find(group => group.includes(key));
    if (group) result = result.filter(item => !group.includes(item));
    if (!result.includes(key)) result.push(key);
  }
  return result.slice(-30);
}
/** Only explicit, whitelisted statements. No income, diagnosis, identity or free text. */
export function explicitPreferences(text: string): PreferenceKey[] {
  const n = conversationalText(text);
  const result: PreferenceKey[] = [];
  const rules: [PreferenceKey, RegExp][] = [
    ["food_spicy", /\b(?:thich|muon) (?:an |mon )?cay\b/], ["food_mild", /\b(?:khong(?: thich| muon)?|it) (?:an )?cay\b/], ["food_light", /\b(?:thich|muon|an|mon) (?:an |mon )?thanh dam\b/],
    ["food_local", /\bthich (?:mon|am thuc|do an) (?:dia phuong|mien trung)\b/], ["food_seafood", /\bthich (?:an )?hai san\b/], ["avoid_seafood", /\bkhong an hai san\b/],
    ["vegetarian", /\ban chay\b/], ["vegan", /\b(?:an )?thuan chay\b/],
    ["allergy_peanut", /\bdi ung (?:voi )?(?:dau phong|lac)\b/], ["allergy_seafood", /\bdi ung (?:voi )?(?:hai san|tom|cua)\b/], ["allergy_milk", /\bdi ung (?:voi )?sua\b/], ["allergy_egg", /\bdi ung (?:voi )?trung\b/], ["avoid_gluten", /\b(?:khong chua|tranh|khong an|khong dung) gluten\b/],
    ["beach", /\bthich (?:di |o gan |gan |ngam )?bien\b/], ["photos", /\bthich (?:chup anh|chup hinh|check in)\b/], ["quiet", /\b(?:thich|muon|uu tien) (?:noi |cho |quan )?yen tinh\b/], ["avoid_crowds", /\b(?:khong thich|tranh) (?:noi |cho )?(?:qua )?dong\b/],
    ["avoid_walking", /\b(?:khong (?:thich|muon) di bo(?: nhieu)?|han che di bo|it di bo)\b/], ["pace_gentle", /\b(?:lich trinh|di|lich) (?:nhe|nhe nhang|thu tha)\b/], ["pace_active", /\b(?:lich trinh|lich|di) nang dong\b/],
    ["stay_budget", /\b(?:thich|uu tien) (?:khach san|luu tru|cho o) (?:gia re|tiet kiem)\b/], ["stay_premium", /\b(?:thich|uu tien) (?:khach san|luu tru|cho o) cao cap\b/],
    ["taxi", /\b(?:thich |uu tien |di chuyen bang |di )taxi\b/], ["motorbike", /\b(?:thich |uu tien |di chuyen bang |di )xe may\b/], ["walk", /\b(?:thich|uu tien) di bo\b/],
    ["usually_children", /\bthuong (?:di )?cung tre (?:em|nho)\b/], ["usually_seniors", /\bthuong (?:di )?cung (?:nguoi lon tuoi|ong ba)\b/],
  ];
  for (const [key, pattern] of rules) {
    const match = n.match(pattern);
    if (!match) continue;
    const before = n.slice(Math.max(0, match.index! - 20), match.index);
    if (/\b(?:khong|dung|chua)\s*(?:con\s*)?$/.test(before)) continue;
    result.push(key);
  }
  return mergePreferences([], result);
}
export function profileSuggestions(keys: PreferenceKey[]): ProfileSuggestion[] {
  return keys.map(key => ({ key, label: preferenceLabels[key], sensitive: sensitivePreference(key) }));
}
export const profileWriteSchema = z.object({ keys: z.array(preferenceKeySchema).min(1).max(30), consent: z.literal(true) }).strict();
export async function readProfile(userId: number, transaction?: sql.Transaction): Promise<PreferenceKey[]> {
  const result = await (transaction ? new sql.Request(transaction) : getPool().request()).input("userId", sql.Int, userId).query<{ preference_key: string }>("SELECT preference_key FROM dbo.ai_user_preferences WHERE user_id=@userId ORDER BY updated_at,preference_key");
  return result.recordset.flatMap(row => { const parsed = preferenceKeySchema.safeParse(row.preference_key); return parsed.success ? [parsed.data] : []; });
}
export async function writeProfile(userId: number, keys: PreferenceKey[], source: "CHAT_EXPLICIT" | "UI_CONFIRM", transaction?: sql.Transaction) {
  const tx = transaction ?? new sql.Transaction(getPool());
  if (!transaction) await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    for (const key of mergePreferences([], keys)) {
      const opposites = oppositeGroups.find(group => group.includes(key))?.filter(item => item !== key) ?? [];
      for (const other of opposites) await new sql.Request(tx).input("userId", sql.Int, userId).input("key", sql.VarChar(40), other).query("DELETE dbo.ai_user_preferences WHERE user_id=@userId AND preference_key=@key");
      await new sql.Request(tx).input("userId", sql.Int, userId).input("key", sql.VarChar(40), key).input("source", sql.VarChar(20), source).query(`
        MERGE dbo.ai_user_preferences WITH(HOLDLOCK) AS t USING(SELECT @userId AS user_id,@key AS preference_key) AS s ON t.user_id=s.user_id AND t.preference_key=s.preference_key
        WHEN MATCHED THEN UPDATE SET consent_source=@source,consented_at=SYSUTCDATETIME(),updated_at=SYSUTCDATETIME()
        WHEN NOT MATCHED THEN INSERT(user_id,preference_key,consent_source) VALUES(@userId,@key,@source);`);
    }
    if (!transaction) await tx.commit();
  } catch (error) { if (!transaction) await tx.rollback(); throw error; }
}
export async function deleteProfile(userId: number, keys?: PreferenceKey[], transaction?: sql.Transaction) {
  const request = transaction ? new sql.Request(transaction) : getPool().request();
  request.input("userId", sql.Int, userId);
  const where = keys ? ` AND preference_key IN (${keys.map((key, index) => { request.input(`key${index}`, sql.VarChar(40), key); return `@key${index}`; }).join(",") || "NULL"})` : "";
  await request.query(`DELETE dbo.ai_user_preferences WHERE user_id=@userId${where}`);
}
