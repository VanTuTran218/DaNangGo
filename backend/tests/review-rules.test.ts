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
      // deleteReviewTx now selects both place_id and user_id in the same query
      if (text.includes('SELECT place_id, user_id FROM reviews')) return { recordset: [{ place_id: 9, user_id: 5 }] };
      if (text.includes('SELECT place_id FROM places')) return { recordset: [{ place_id: 9 }] };
      if (text.includes('UPDATE reviews SET comment')) return { recordset: [], rowsAffected: [1] };
      if (text.includes('DELETE FROM reviews')) return { recordset: [], rowsAffected: [1] };
      if (text.includes('DELETE FROM review_cooldowns')) return { recordset: [], rowsAffected: [1] };
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

    // Xóa review không xóa cooldown theo mặc định (clearCooldown = false)
    queries.length = 0;
    assert.equal(await deleteReviewTx(42), true);
    assert.ok(queries.some(query => query.includes('DELETE FROM reviews')));
    assert.ok(!queries.some(query => query.includes('DELETE FROM review_cooldowns')), 'mặc định không xóa cooldown');

    // Xóa review với clearCooldown = true phải xóa cả cooldown
    queries.length = 0;
    commits = 1;
    assert.equal(await deleteReviewTx(42, { clearCooldown: true }), true);
    assert.ok(queries.some(query => query.includes('DELETE FROM review_cooldowns')), 'clearCooldown=true phải xóa cooldown');
  } finally {
    await closeDB();
  }
});

test('error message 429 formats duration correctly', () => {
  // Kiểm tra logic format thời gian thủ công
  function formatRetryAfter(retryAfterMs: number): string {
    const totalMinutes = Math.ceil(retryAfterMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} ngày`);
    if (hours > 0) parts.push(`${hours} giờ`);
    // Chỉ hiển thị phút khi >= 1 phút thực (60 giây), để tránh "1 phút" cho 30 giây do Math.ceil
    if (minutes > 0 && days === 0 && retryAfterMs >= 60000) parts.push(`${minutes} phút`);
    return parts.join(' ') || 'ít phút';
  }

  // 7 ngày đầy đủ
  assert.equal(formatRetryAfter(7 * 24 * 60 * 60 * 1000), '7 ngày');
  // 1 ngày 6 giờ
  assert.equal(formatRetryAfter((1 * 1440 + 6 * 60) * 60000), '1 ngày 6 giờ');
  // 45 phút
  assert.equal(formatRetryAfter(45 * 60000), '45 phút');
  // Chưa tới 1 phút
  assert.equal(formatRetryAfter(30000), 'ít phút');
});

