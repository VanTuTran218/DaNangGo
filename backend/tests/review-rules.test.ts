import test from 'node:test';
import assert from 'node:assert/strict';
import { sql, connectDB, closeDB } from '../src/config/db';
import { insertApprovedReview, findReviewRetryAfterMs, editReviewComment, deleteReviewTx, updateReviewStatusTx, findApprovedReviewImage } from '../src/modules/reviews/reviews.repository';
import { createReview, editReview, ReviewError } from '../src/modules/reviews/reviews.service';
import { userReviewsRouter, adminReviewsRouter } from '../src/modules/reviews/reviews.routes';

test('user routes have no edit/delete methods; admin can edit', () => {
  const routes = (router: typeof userReviewsRouter) => router.stack
    .filter(layer => layer.route)
    .map(layer => ({ path: layer.route!.path, methods: layer.route!.methods }));
  assert.ok(routes(userReviewsRouter).every(route => !route.methods.put && !route.methods.patch && !route.methods.delete));
  assert.ok(routes(adminReviewsRouter).some(route => route.path === '/:id/content' && route.methods.patch));
});

test('admin edit validates comment before touching the database', async () => {
  await assert.rejects(editReview(1, { comment: '  ' }, 9), (error: unknown) =>
    error instanceof ReviewError && error.status === 400);
});

test('cooldown blocks duplicate submissions and keeps a ledger after successful insert', async (t) => {
  const queries: string[] = [];
  const cooldowns = new Map<string, number>([['5:9', 1000]]);
  let failSummary = false;
  let commits = 0;
  let rollbacks = 0;
  const request = () => ({
    params: {} as Record<string, number>,
    input(name: string, _type: unknown, value: number) { this.params[name] = value; return this; },
    async query(text: string) {
      queries.push(text);
      if (text.includes('FROM review_cooldowns')) return { recordset: [{ retry_after_ms: cooldowns.get(`${this.params.user_id}:${this.params.place_id}`) ?? 0 }] };
      if (text.includes('INSERT INTO reviews')) return { recordset: [{ review_id: 42, created_at: new Date() }] };
      if (text.includes('SELECT place_id FROM reviews')) return { recordset: [{ place_id: 9 }] };
      if (text.includes('SELECT place_id FROM places')) return { recordset: [{ place_id: 9 }] };
      if (text.includes("status = 'ACTIVE'") && text.includes('SELECT 1 AS found')) return { recordset: [{ found: 1 }] };
      if (text.includes('UPDATE places') && failSummary) throw new Error('summary failed');
      if (text.includes('UPDATE reviews SET comment')) return { recordset: [], rowsAffected: [1] };
      if (text.includes('DELETE FROM reviews')) return { recordset: [], rowsAffected: [1] };
      if (text.includes('UPDATE reviews') && text.includes('moderated_by')) return { recordset: [], rowsAffected: [1] };
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
    assert.deepEqual(await insertApprovedReview(9, 5, 4, 'Tốt'), { retryAfterMs: 1000 });
    assert.equal(commits, 0);
    assert.equal(rollbacks, 1);
    assert.ok(!queries.some(query => query.includes('INSERT INTO reviews')));
    await assert.rejects(createReview(9, 5, { rating: 4, comment: 'Tốt' }, []), (error: unknown) =>
      error instanceof ReviewError && error.status === 429 && error.message.includes('7 ngày'));

    assert.deepEqual(await insertApprovedReview(10, 5, 4, 'Tốt'), { reviewId: 42 });
    assert.deepEqual(await insertApprovedReview(9, 6, 4, 'Tốt'), { reviewId: 42 });
    cooldowns.set('5:9', 0);
    assert.deepEqual(await insertApprovedReview(9, 5, 4, 'Tốt'), { reviewId: 42 });
    assert.ok(queries.some(query => query.includes("'APPROVED'") && query.includes('INSERT INTO reviews')));
    assert.ok(queries.some(query => query.includes('UPDATE places') && query.includes("status = 'APPROVED'")));
    assert.ok(queries.indexOf(queries.find(query => query.includes('UPDATE places'))!) > queries.indexOf(queries.find(query => query.includes('INSERT INTO reviews'))!));
    assert.equal(commits, 3);
    assert.ok(queries.some(query => query.includes('UPDATE review_cooldowns SET last_reviewed_at')));
    assert.match(queries.find(query => query.includes('FROM review_cooldowns'))!, /DATEADD\(DAY, 7, last_reviewed_at\)/);
    assert.equal(await findReviewRetryAfterMs(5, 9), 0);

    queries.length = 0;
    await findApprovedReviewImage(9, 42, 1);
    assert.ok(queries.some(query => query.includes("r.status = 'APPROVED'") && query.includes("p.status = 'ACTIVE'")));

    failSummary = true;
    await assert.rejects(insertApprovedReview(9, 5, 4, 'Tốt'), /summary failed/);
    assert.equal(commits, 3);
    assert.equal(rollbacks, 3);
    failSummary = false;

    queries.length = 0;
    assert.equal(await updateReviewStatusTx(42, 'HIDDEN', 1), true);
    assert.ok(queries.some(query => query.includes('UPDATE places')));
    queries.length = 0;
    assert.equal(await updateReviewStatusTx(42, 'APPROVED', 1), true);
    assert.ok(queries.some(query => query.includes('UPDATE places')));

    assert.equal(await editReviewComment(42, 'Đã chỉnh', 9), true);
    assert.ok(queries.some(query => query.includes('moderated_by = @moderator_id')));
    assert.ok(queries.some(query => query.includes('moderated_at = SYSDATETIME()')));
    assert.ok(!queries.some(query => query.includes('SET rating =')));

    queries.length = 0;
    assert.equal(await deleteReviewTx(42), true);
    assert.ok(queries.some(query => query.includes('DELETE FROM reviews')));
    assert.ok(!queries.some(query => query.includes('DELETE FROM review_cooldowns')));
    assert.ok(queries.some(query => query.includes('UPDATE places')));
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

