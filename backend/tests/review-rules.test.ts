import test from 'node:test';
import assert from 'node:assert/strict';
import { sql, connectDB, closeDB } from '../src/config/db';
import { insertPendingReview, findReviewRetryAfterMs, editReviewComment, deleteReviewTx } from '../src/modules/reviews/reviews.repository';
import { editReview, ReviewError } from '../src/modules/reviews/reviews.service';
import { userReviewsRouter, adminReviewsRouter } from '../src/modules/reviews/reviews.routes';

test('user routes have no edit/delete methods; admin can edit', () => {
  const routes = (router: typeof userReviewsRouter) => router.stack
    .filter(layer => layer.route)
    .map(layer => ({ path: layer.route!.path, methods: layer.route!.methods }));
  assert.ok(routes(userReviewsRouter).every(route => !route.methods.put && !route.methods.patch && !route.methods.delete));
  assert.ok(routes(adminReviewsRouter).some(route => route.path === '/:id/content' && route.methods.patch));
});

test('admin edit validates comment before touching the database', async () => {
  await assert.rejects(editReview(1, { comment: '  ' }), (error: unknown) =>
    error instanceof ReviewError && error.status === 400);
});

test('cooldown blocks duplicate submissions and keeps a ledger after successful insert', async (t) => {
  const queries: string[] = [];
  let retryAfterMs = 1000;
  let commits = 0;
  let rollbacks = 0;
  const request = () => ({
    input() { return this; },
    async query(text: string) {
      queries.push(text);
      if (text.includes('FROM review_cooldowns')) return { recordset: [{ retry_after_ms: retryAfterMs }] };
      if (text.includes('INSERT INTO reviews')) return { recordset: [{ review_id: 42, created_at: new Date() }] };
      if (text.includes('SELECT place_id FROM reviews')) return { recordset: [{ place_id: 9 }] };
      if (text.includes('UPDATE reviews SET comment')) return { recordset: [], rowsAffected: [1] };
      if (text.includes('DELETE FROM reviews')) return { recordset: [], rowsAffected: [1] };
      return { recordset: [] };
    },
  });
  const pool = {
    request,
    transaction() { return { request, async begin() {}, async commit() { commits++; }, async rollback() { rollbacks++; } }; },
    async close() {},
  };
  t.mock.method(sql, 'connect', async () => pool);
  await connectDB();
  try {
    assert.deepEqual(await insertPendingReview(9, 5, 4, 'Tốt'), { retryAfterMs: 1000 });
    assert.equal(commits, 0);
    assert.equal(rollbacks, 1);
    assert.ok(!queries.some(query => query.includes('INSERT INTO reviews')));

    retryAfterMs = 0;
    assert.deepEqual(await insertPendingReview(9, 5, 4, 'Tốt'), { reviewId: 42 });
    assert.equal(commits, 1);
    assert.ok(queries.some(query => query.includes('UPDATE review_cooldowns SET last_reviewed_at')));
    assert.match(queries.find(query => query.includes('FROM review_cooldowns'))!, /DATEADD\(DAY, 7, last_reviewed_at\)/);
    assert.equal(await findReviewRetryAfterMs(5, 9), 0);

    assert.equal(await editReviewComment(42, 'Đã chỉnh'), true);
    assert.ok(queries.some(query => query.includes('UPDATE reviews SET comment')));
    assert.ok(!queries.some(query => query.includes('SET rating =')));
    assert.equal(await deleteReviewTx(42), true);
    assert.ok(queries.some(query => query.includes('DELETE FROM reviews')));
    assert.ok(!queries.some(query => query.includes('DELETE FROM review_cooldowns')));
  } finally {
    await closeDB();
  }
});
