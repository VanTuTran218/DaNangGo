import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { connectDB, closeDB, getPool, sql } from "../config/db";
import { processUserMessage } from "../modules/chat/chat.service";
import { readProfile, writeProfile, deleteProfile } from "../modules/chat/chat.profile";
import { conversationMessages } from "../modules/chat/chat.history";
import type { ChatMessageDto } from "../modules/chat/chat.types";

async function main() {
  process.env.GEMINI_API_KEY = "";
  await connectDB();
  const results: unknown[] = [];
  try {
    const guestId = randomUUID(); let sessionId: number | undefined;
    const ask = async (question: string): Promise<ChatMessageDto> => {
      const begin = Date.now(); const r = await processUserMessage({ guestId, sessionId, message: question }); sessionId = r.sessionId;
      results.push({ question, content: r.message.content, intent: r.message.intent, secondaryIntents: r.message.secondaryIntents, context: r.message.confirmedContext, questions: r.message.questions, groups: r.message.recommendationGroups?.map(g => ({ category: g.category, names: g.places.map(p => p.name) })), plan: !!r.message.travelPlan, elapsedMs: Date.now() - begin });
      return r.message;
    };
    const initial = await ask("tôi đang có 4 triệu và tôi muốn đi ăn và tham quan bạn hãy gợi ý cho tôi");
    assert.deepEqual(initial.secondaryIntents, ["FOOD", "SIGHT"]);
    assert.equal(initial.confirmedContext?.budget, 4_000_000); assert.equal(initial.confirmedContext?.budgetScope, null);
    assert.ok(initial.needsClarification); assert.equal(initial.questions?.length, 3); assert.equal(initial.travelPlan, undefined);
    const complete = await ask("2 người, tổng cả nhóm, 1 ngày, không qua đêm, ngày mai");
    assert.ok(complete.travelPlan, complete.content); assert.equal(complete.travelPlan.budget, 4_000_000);
    assert.equal(complete.travelPlan.guestCount, 2); assert.equal(complete.travelPlan.costs.accommodation, 0);
    const cards = complete.travelPlan.days.flatMap(day => day.periods.flatMap(period => period.items.flatMap(item => item.place ? [item.place] : [])));
    assert.ok(cards.some(p => p.placeType === "ATTRACTION")); assert.ok(cards.some(p => p.placeType === "RESTAURANT"));
    const food = cards.filter(p => p.placeType === "RESTAURANT");
    const ids = [...new Set(food.map(p => p.placeId))];
    const request = getPool().request(); ids.forEach((id, i) => request.input(`p${i}`, sql.Int, id));
    const menus = await request.query<{ place_id: number; name: string; price: number }>(`SELECT place_id,name,price FROM dbo.menu_items WHERE is_available=1 AND place_id IN (${ids.map((_, i) => `@p${i}`).join(",")})`);
    for (const p of food) for (const item of p.menuItems ?? []) assert.ok(menus.recordset.some(row => row.place_id === p.placeId && row.name === item.name && Number(row.price) === item.price));
    const edit = await ask("Đi taxi, giữ 500k dự phòng");
    assert.equal(edit.travelPlan?.budget, 4_000_000); assert.equal(edit.confirmedContext?.reserve, 500_000);
    const guest = await ask("Hãy lưu tôi thích biển"); assert.match(guest.content, /phiên khách/);
    const allNeeds = await processUserMessage({ guestId: randomUUID(), message: "Gợi ý quán ăn, điểm tham quan và khách sạn ở Hải Châu" });
    assert.deepEqual(allNeeds.message.secondaryIntents, ["FOOD", "SIGHT", "STAY"]);
    assert.deepEqual(allNeeds.message.recommendationGroups?.map(group => group.category), ["food", "sight", "stay"]);
    for (const group of allNeeds.message.recommendationGroups ?? []) for (const place of group.places) assert.equal(place.placeType, ({food: "RESTAURANT", sight: "ATTRACTION", stay: "ACCOMMODATION"})[group.category]);
    results.push({ question: "Gợi ý quán ăn, điểm tham quan và khách sạn ở Hải Châu", groups: allNeeds.message.recommendationGroups?.map(group => ({category:group.category, places:group.places.map(place=>({name:place.name,menuItems:place.menuItems}))})) });
    const liveAndFood = await processUserMessage({ guestId: randomUUID(), message: "Mai thời tiết thế nào và gợi ý quán ăn ở Hải Châu" });
    assert.match(liveAndFood.message.content, /chưa tích hợp dữ liệu thời tiết/);
    assert.ok(liveAndFood.message.places?.some(place => place.placeType === "RESTAURANT"));
    assert.ok(liveAndFood.message.secondaryIntents?.includes("WEATHER"));
    results.push({ question: "Mai thời tiết thế nào và gợi ý quán ăn ở Hải Châu", content:liveAndFood.message.content, secondaryIntents:liveAndFood.message.secondaryIntents, foodCards:liveAndFood.message.places?.length });
    const history = await conversationMessages(sessionId!, { guestId }); assert.ok(!JSON.stringify(history).includes("DANANGGO_ADVISOR"));
    await assert.rejects(conversationMessages(sessionId!, { guestId: randomUUID() }));
    // Exercise real SQL constraints/ownership without committing preferences or creating fake users.
    const owners = await getPool().request().query<{ user_id: number }>("SELECT TOP(2) user_id FROM dbo.users ORDER BY user_id");
    assert.equal(owners.recordset.length, 2);
    const [a, b] = owners.recordset.map(row => row.user_id);
    const beforeA = await readProfile(a!); const beforeB = await readProfile(b!);
    const tx = new sql.Transaction(getPool()); await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      await deleteProfile(a!, undefined, tx); await deleteProfile(b!, undefined, tx);
      await writeProfile(a!, ["food_spicy", "beach"], "UI_CONFIRM", tx);
      await writeProfile(b!, ["quiet"], "UI_CONFIRM", tx);
      assert.deepEqual(new Set(await readProfile(a!, tx)), new Set(["food_spicy", "beach"]));
      assert.deepEqual(await readProfile(b!, tx), ["quiet"]);
      await writeProfile(a!, ["food_mild"], "CHAT_EXPLICIT", tx);
      assert.deepEqual(new Set(await readProfile(a!, tx)), new Set(["food_mild", "beach"]));
      const audit = await new sql.Request(tx).input("userId", sql.Int, a!).query<{preference_key:string;consent_source:string;consented_at:Date}>("SELECT preference_key,consent_source,consented_at FROM dbo.ai_user_preferences WHERE user_id=@userId");
      assert.ok(audit.recordset.some(row => row.preference_key === "food_mild" && row.consent_source === "CHAT_EXPLICIT" && row.consented_at));
      assert.ok(audit.recordset.some(row => row.preference_key === "beach" && row.consent_source === "UI_CONFIRM" && row.consented_at));
      await deleteProfile(a!, ["beach"], tx); assert.deepEqual(await readProfile(a!, tx), ["food_mild"]);
      assert.deepEqual(await readProfile(b!, tx), ["quiet"]);
    } finally { await tx.rollback(); }
    assert.deepEqual(await readProfile(a!), beforeA); assert.deepEqual(await readProfile(b!), beforeB);
    results.push({ profileSql: "PASS; consent audit, opposite preference replacement, scoped delete, account isolation, rollback verified; no user data persisted" });
    writeFileSync(resolve(__dirname, "../../../docs/ai-knowledge/go-policy-test-results.json"), JSON.stringify({ status: "PASS", mode: "real SQL catalog; Gemini disabled; guest sessions; profile writes rolled back", results }, null, 2) + "\n");
    console.log("PASS: mixed needs, budget, follow-up, actual menu, guest memory, account isolation, profile SQL rollback.");
  } finally { await closeDB(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
