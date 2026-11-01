import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import { sql, connectDB, closeDB } from '../src/config/db';
import placesRouter from '../src/modules/places/places.routes';
import { validateTopPlacesQuery } from '../src/modules/places/places.validation';

test('top query requires one valid type and a bounded integer limit', () => {
  for (const type of ['RESTAURANT', 'ACCOMMODATION', 'ATTRACTION']) {
    assert.deepEqual(validateTopPlacesQuery({ type }).data, { type, limit: 10 });
  }
  assert.equal(validateTopPlacesQuery({ type: ' restaurant ', limit: '50' }).data?.limit, 50);
  for (const type of [undefined, '', 'CAFE', ['RESTAURANT'], {}]) {
    assert.ok(validateTopPlacesQuery({ type }).error);
  }
  for (const limit of ['', '0', '-1', '51', '1.5', '1e1', 'Infinity', ['10'], {}]) {
    assert.ok(validateTopPlacesQuery({ type: 'RESTAURANT', limit }).error);
  }
});

test('public /top route validates before SQL and enforces ranking independently of query overrides', async (t) => {
  const queries: { text: string; params: Record<string, unknown> }[] = [];
  const row = { place_id: 42, place_type: 'RESTAURANT', name: 'Test', status: 'ACTIVE', avg_rating: 4.8, review_count: 3 };
  const pool = {
    request() {
      const params: Record<string, unknown> = {};
      return {
        input(name: string, _type: unknown, value: unknown) { params[name] = value; return this; },
        async query(text: string) {
          queries.push({ text, params });
          return { recordset: text.includes('COUNT(DISTINCT') ? [{ total: 1 }] : [row] };
        },
      };
    },
    async close() {},
  };
  t.mock.method(sql, 'connect', async () => pool);
  await connectDB();
  const app = express();
  app.use('/api/places', placesRouter);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}/api/places`;
  try {
    for (const query of ['', '?type=INVALID', '?type=RESTAURANT&type=ATTRACTION', '?type=RESTAURANT&limit=51']) {
      const response = await fetch(`${base}/top${query}`);
      assert.equal(response.status, 400);
      assert.equal((await response.json()).success, false);
    }
    assert.equal(queries.length, 0);
    const response = await fetch(`${base}/top?type=RESTAURANT&limit=1&include_hidden=true&min_review_count=0&sort=newest&page=5`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.data[0].place_id, 42);
    assert.equal(queries.length, 2);
    for (const query of queries) {
      assert.match(query.text, /p.status = 'ACTIVE'/);
      assert.match(query.text, /p.place_type = @type/);
      assert.match(query.text, /p.review_count >= @minimum_review_count/);
      assert.equal(query.params.type, 'RESTAURANT');
      assert.equal(query.params.minimum_review_count, 3);
    }
    assert.match(queries[1].text, /ORDER BY p.avg_rating DESC, p.review_count DESC, p.place_id DESC/);
    assert.match(queries[1].text, /OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY/);
    assert.equal(queries[1].params.offset, 0);
    assert.equal(queries[1].params.limit, 1);
    queries.length = 0;
    assert.equal((await fetch(base)).status, 200);
    assert.ok(queries.every(query => !query.text.includes('@minimum_review_count')));
  } finally {
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
    await closeDB();
  }
});
