import test from 'node:test';
import assert from 'node:assert/strict';
import { connectDB, closeDB, sql } from '../src/config/db';
import { recommendationRequestSchema } from '../src/modules/recommendations/recommendations.validation';
import { getRecommendations } from '../src/modules/recommendations/recommendations.service';

test('budget recommendation request validates positive budget, at least one type, and type-specific filters', () => {
  assert.deepEqual(recommendationRequestSchema.parse({ budget: 1000000, types: ['RESTAURANT'] }), {
    budget: 1000000, types: ['RESTAURANT'], cuisineIds: [], tasteIds: [], attractionCategoryIds: [], accommodationTypes: [], starRatings: [],
  });
  for (const input of [
    { budget: 0, types: ['RESTAURANT'] },
    { budget: 1.5, types: ['RESTAURANT'] },
    { budget: 1000000, types: [] },
    { budget: 1000000, types: ['UNKNOWN'] },
    { budget: 1000000, types: ['ACCOMMODATION'], tasteIds: [1] },
    { budget: 1000000, types: ['ATTRACTION'], attractionCategoryIds: [-1] },
    { budget: 1000000, types: ['RESTAURANT'], starRatings: [4] },
    { budget: 1000000, types: ['RESTAURANT', 'RESTAURANT'] },
  ]) assert.equal(recommendationRequestSchema.safeParse(input).success, false);
});

test('recommendation service queries selected categories and returns matching price fields', async (t) => {
  const queries: { text: string; params: Record<string, unknown> }[] = [];
  const pool = {
    request() {
      const params: Record<string, unknown> = {};
      return {
        input(name: string, _type: unknown, value: unknown) { params[name] = value; return this; },
        async query(text: string) {
          queries.push({ text, params });
          if (text.includes('JOIN dbo.room_types')) return { recordset: [{ place_id: 1, place_type: 'ACCOMMODATION', name: 'Stay', price_min: 800000, price_max: 800000, avg_rating: 4.9, review_count: 8 }] };
          if (text.includes('JOIN dbo.restaurants')) return { recordset: [{ place_id: 2, place_type: 'RESTAURANT', name: 'Food', price_min: 50000, price_max: 200000, avg_rating: 4.8, review_count: 7 }] };
          if (text.includes('JOIN dbo.attractions')) return { recordset: [{ place_id: 3, place_type: 'ATTRACTION', name: 'Free place', ticket_price: 0, price_min: 0, price_max: 0, avg_rating: 4.7, review_count: 6 }] };
          throw new Error(`Unexpected recommendation query: ${text}`);
        },
      };
    },
    async close() {},
  };
  t.mock.method(sql, 'connect', async () => pool);
  await connectDB();
  try {
    const result = await getRecommendations({ budget: 1000000, types: ['ACCOMMODATION', 'RESTAURANT', 'ATTRACTION'] });
    assert.equal(result.groups.accommodations[0].price_min, 800000);
    assert.equal(result.groups.restaurants[0].price_max, 200000);
    assert.equal(result.groups.attractions[0].ticket_price, 0);
    assert.equal(queries.length, 3);
    for (const query of queries) {
      assert.match(query.text, /p.status='ACTIVE'/);
      assert.match(query.text, /ORDER BY p.avg_rating DESC,p.review_count DESC,p.place_id DESC/);
      assert.equal(query.params.budget, 1000000);
    }
    assert.match(queries[0].text, /rt.status='ACTIVE'/);
    assert.match(queries[1].text, /r.price_min IS NOT NULL AND r.price_max IS NOT NULL/);
    assert.match(queries[1].text, /\(r.price_min \+ r.price_max\) \/ 2\.0 <= @budget/);
    assert.match(queries[2].text, /a.ticket_price <= @budget/);
  } finally {
    await closeDB();
  }
});
