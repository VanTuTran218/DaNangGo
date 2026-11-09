import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { once } from "node:events";
import router from "../src/modules/chat/chat.routes";
import { connectDB, closeDB, sql } from "../src/config/db";

test("API hồ sơ: khách 401, consent bắt buộc, không nhận tài khoản giả trong body; SQL dùng chủ thể xác thực", async t => {
  const queries: { sql: string; owner: unknown }[] = [];
  const pool = { request() {
    const params: Record<string, unknown> = {};
    return { input(name: string, _type: unknown, value: unknown) { params[name] = value; return this; }, async query(statement: string) {
      queries.push({ sql: statement, owner: params.userId });
      return { recordset: [{ preference_key: "beach" }] };
    } };
  }, async close() {} };
  t.mock.method(sql, "connect", async () => pool as never);
  await connectDB();
  const app = express(); app.use(express.json());
  // Test-only stand-in for the already-tested authentication middleware.
  // It sets req.user before the router, never from the JSON body.
  app.use((req, _res, next) => { if (req.get("x-test-owner") === "11") req.user = { user_id: 11, role: "USER" }; next(); });
  app.use("/chat", router);
  const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/chat/profile`;
  try {
    for (const method of ["GET", "PATCH", "DELETE"]) {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, ...(method !== "GET" ? { body: JSON.stringify({ keys: ["beach"], consent: true }) } : {}) });
      assert.equal(res.status, 401);
    }
    assert.equal(queries.length, 0);
    const headers = { "Content-Type": "application/json", "x-test-owner": "11" };
    for (const body of [{ keys: ["beach"] }, { keys: ["beach"], consent: false }, { keys: ["beach"], consent: true, userId: 12 }, { keys: ["income"], consent: true }]) {
      assert.equal((await fetch(url, { method: "PATCH", headers, body: JSON.stringify(body) })).status, 400);
    }
    assert.equal(queries.length, 0);
    const listing = await fetch(url, { headers }); assert.equal(listing.status, 200);
    assert.deepEqual(await listing.json(), { preferences: [{ key: "beach", label: "Thích biển", sensitive: false }] });
    assert.equal((await fetch(url, { method: "DELETE", headers, body: JSON.stringify({ keys: ["beach"], userId: 12 }) })).status, 400);
    assert.equal((await fetch(url, { method: "DELETE", headers, body: JSON.stringify({ keys: ["beach"] }) })).status, 200);
    assert.ok(queries.length >= 2); assert.ok(queries.every(q => q.owner === 11));
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); await closeDB(); }
});
