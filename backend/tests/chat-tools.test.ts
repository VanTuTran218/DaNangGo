import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";
import { once } from "node:events";
import chatRouter, { chatInputSchema } from "../src/modules/chat/chat.routes";
import {
  guests,
  GuestChatSessions,
  ChatSessionError,
} from "../src/modules/chat/chat.sessions";
import {
  conversationMessages,
  listConversations,
  updateMessage,
  estimatePlan,
} from "../src/modules/chat/chat.history";
import { itineraryDraft } from "../src/modules/chat/chat.saved-plan";
import { ruleIntent } from "../src/modules/chat/chat.intent";
import { connectDB, closeDB, sql } from "../src/config/db";
import { searchPlacesForChat } from "../src/modules/chat/chat.repository";
import type {
  ChatMessageDto,
  ChatTravelPlan,
} from "../src/modules/chat/chat.types";

const plan: ChatTravelPlan = {
  title: "Chuyến đi",
  dayCount: 2,
  guestCount: 2,
  startDate: "2026-12-01",
  budget: 2000000,
  assumptions: [],
  days: [1, 2].map((day) => ({
    day,
    date: `2026-12-0${day}`,
    area: "Sơn Trà",
    periods: [
      {
        label: "Sáng",
        time: "08:00–11:00",
        items: [
          {
            title: "Tham quan",
            detail: "Chi tiết",
            place: {
              placeId: 999,
              name: "Điểm từ DB",
              placeType: "ATTRACTION",
              address: "Sơn Trà",
              rating: 0,
              reviewCount: 0,
              detailUrl: "/places/999",
            },
          },
        ],
      },
    ],
  })),
  groups: [],
  costs: {
    accommodation: 500000,
    tickets: 200000,
    knownSubtotal: 700000,
    foodAllowance: 300000,
    remaining: 1300000,
    roomNote: "Dự kiến",
  },
  notes: [],
};
const message: ChatMessageDto = {
  id: "ai_tools_test",
  sender: "AI",
  content: "Lịch trình thật",
  travelPlan: plan,
  createdAt: "2026-11-04T00:00:00Z",
};

test("Danh sách khách chỉ chứa hội thoại thật của đúng chủ, giữ DTO và hết hạn", () => {
  let now = 0;
  const store = new GuestChatSessions(100, 5, () => now);
  const id = store.open("a"),
    empty = store.open("a");
  store.save(id, "a", "USER", "Hai ngày ở Đà Nẵng");
  store.save(id, "a", "AI", message.content, message);
  assert.deepEqual(store.list("b"), []);
  assert.equal(store.list("a").length, 1);
  assert.equal(store.list("a")[0]?.id, id);
  assert.ok(!store.list("a").some((s) => s.id === empty));
  assert.throws(() => store.messages(id, "b"), ChatSessionError);
  const copy = store.messages(id, "a");
  copy[1]!.travelPlan!.title = "Bị đổi";
  assert.equal(store.messages(id, "a")[1]!.travelPlan!.title, "Chuyến đi");
  store.update(id, "a", { ...message, feedback: "helpful" });
  assert.equal(store.messages(id, "a")[1]!.feedback, "helpful");
  assert.throws(() => store.update(id, "b", message), ChatSessionError);
  now = 101;
  assert.deepEqual(store.list("a"), []);
  assert.throws(() => store.messages(id, "a"), ChatSessionError);
});

test("GPS giới hạn tọa độ/bán kính; hiểu khẩu vị và không coi “không cay” là thích cay", () => {
  assert.equal(
    chatInputSchema.safeParse({
      message: "Quán ăn quanh đây",
      location: { latitude: 16, longitude: 108, radiusKm: 5 },
    }).success,
    true,
  );
  for (const location of [
    { latitude: 91, longitude: 108, radiusKm: 5 },
    { latitude: 16, longitude: 181, radiusKm: 5 },
    { latitude: 16, longitude: 108, radiusKm: 50 },
    { latitude: 16, longitude: 108, radiusKm: 5, userId: 1 },
  ])
    assert.equal(
      chatInputSchema.safeParse({ message: "Quanh đây", location }).success,
      false,
    );
  assert.deepEqual(ruleIntent("Gợi ý món ăn thanh đạm").tastes, ["Thanh đạm"]);
  assert.deepEqual(ruleIntent("Món ăn cay").tastes, ["Cay"]);
  assert.deepEqual(ruleIntent("Tôi không ăn cay").tastes, []);
});

test("Dự trù không đổi knownSubtotal; bản lưu không dùng public place ID làm catalog ID", () => {
  const updated = estimatePlan(plan, {
    food: 400000,
    transport: 200000,
    contingencyPercent: 10,
  });
  assert.equal(updated.costs.knownSubtotal, 700000);
  assert.equal(updated.costs.contingencyAllowance, 130000);
  assert.equal(updated.costs.projectedSubtotal, 1430000);
  assert.equal(plan.costs.foodAllowance, 300000);
  const draft = itineraryDraft(updated);
  assert.equal(draft.output.summary.estimatedTotal, 1430000);
  assert.equal(
    draft.output.days
      .flatMap((d) => d.items)
      .reduce((s, i) => s + i.estimatedCost, 0) +
      draft.output.summary.costs.contingency,
    1430000,
  );
  assert.ok(
    draft.output.days
      .flatMap((d) => d.items)
      .every((i) => i.catalogPlaceId === undefined),
  );
  assert.match(draft.output.notices.join(" "), /chưa đặt dịch vụ/);
  assert.throws(
    () => itineraryDraft({ ...plan, guestCount: null }),
    /số khách/,
  );
});

test("Đọc/ghi lịch sử DB luôn khóa đúng user; GPS/khẩu vị lọc trước LIMIT bằng tham số", async (t) => {
  const queries: { text: string; params: Record<string, unknown> }[] = [];
  const pool = {
    request() {
      const params: Record<string, unknown> = {};
      return {
        input(k: string, _type: unknown, v: unknown) {
          params[k] = v;
          return this;
        },
        async query(text: string) {
          queries.push({ text, params });
          return { recordset: [], rowsAffected: [0] };
        },
      };
    },
    async close() {},
  };
  t.mock.method(sql, "connect", async () => pool as never);
  await connectDB();
  try {
    await listConversations({ userId: 10 });
    await assert.rejects(
      conversationMessages(7, { userId: 11 }),
      ChatSessionError,
    );
    await assert.rejects(
      updateMessage(7, { userId: 11 }, message),
      ChatSessionError,
    );
    for (const q of queries) {
      assert.ok(q.params.userId);
      assert.match(q.text, /user_id=@userId/);
    }
    await searchPlacesForChat({
      placeType: "RESTAURANT",
      tastes: ["Cay"],
      location: { latitude: 16, longitude: 108, radiusKm: 2 },
    });
    const q = queries.at(-1)!;
    assert.equal(q.params.lat, 16);
    assert.equal(q.params.radius, 2);
    assert.equal(q.params.taste0, "Cay");
    assert.match(q.text, /mi.is_available=1/);
    assert.match(q.text, /STDistance/);
    assert.ok(
      q.text.indexOf("x.distance_km <= @radius") < q.text.indexOf("OFFSET 0"),
    );
    assert.doesNotMatch(q.text, /t.name='Cay'/);
  } finally {
    await closeDB();
  }
});

test("API khách: lịch sử và feedback thật; chặn người khác, vote sai, lưu chưa đăng nhập", async () => {
  const owner = "12345678-1234-4123-8123-123456789abc";
  const id = guests.open(owner);
  guests.save(id, owner, "USER", "Lịch trình thử");
  guests.save(id, owner, "AI", message.content, message);
  const app = express();
  app.use(express.json(), cookieParser(), chatRouter);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const headers = {
    "Content-Type": "application/json",
    Cookie: `dananggo_chat_guest=${owner}`,
  };
  try {
    assert.ok(
      (await (await fetch(`${base}/sessions`, { headers })).json()).some(
        (s: { id: number }) => s.id === id,
      ),
    );
    assert.equal((await fetch(`${base}/sessions/${id}`)).status, 404);
    const mutate = (body: unknown) =>
      fetch(`${base}/sessions/${id}/messages/${message.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });
    let response = await mutate({ action: "feedback", vote: "helpful" });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).feedback, "helpful");
    assert.equal(
      (await mutate({ action: "feedback", vote: "hacked" })).status,
      400,
    );
    response = await mutate({ action: "feedback", vote: null });
    assert.equal((await response.json()).feedback, null);
    assert.equal((await mutate({ action: "save" })).status, 401);
    response = await mutate({
      action: "costs",
      food: 400000,
      transport: 200000,
      contingencyPercent: 10,
    });
    assert.equal(
      (await response.json()).travelPlan.costs.projectedSubtotal,
      1430000,
    );
    assert.equal(
      (
        await mutate({
          action: "costs",
          food: -1,
          transport: 0,
          contingencyPercent: 10,
        })
      ).status,
      400,
    );
    const restored = await (
      await fetch(`${base}/sessions/${id}`, { headers })
    ).json();
    assert.equal(restored.at(-1).travelPlan.costs.projectedSubtotal, 1430000);
    assert.equal(
      (
        await fetch(`${base}/sessions/${id}/messages/${message.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "feedback", vote: "helpful" }),
        })
      ).status,
      404,
    );
  } finally {
    server.close();
    server.closeAllConnections();
  }
});
