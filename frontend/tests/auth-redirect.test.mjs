import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getAuthRedirect } from '../lib/auth-redirect.ts';

test('Đối tác luôn vào kênh quản lý khi URL cũ trỏ tới ẩm thực hoặc VIP', () => {
  for (const redirect of ['/amthuc', '/amthuc?sort=rating_desc', '/', '/bando']) {
    assert.equal(getAuthRedirect('PARTNER', redirect), '/partner');
    assert.equal(getAuthRedirect('PARTNER', redirect, 'vip'), '/partner');
  }
});
test('Giữ điểm đến trong khu vực đối tác, không nhầm đường dẫn cùng tiền tố', () => {
  for (const redirect of ['/partner', '/partner/co-so', '/partner/co-so/tao-moi?from=login']) assert.equal(getAuthRedirect('PARTNER', redirect), redirect);
  assert.equal(getAuthRedirect('PARTNER', '/partnership'), '/partner');
});
test('Khách du lịch giữ điểm đến và ý định nâng cấp VIP', () => {
  assert.equal(getAuthRedirect('USER', '/amthuc'), '/amthuc');
  assert.equal(getAuthRedirect('USER', '/lich-trinh/tao-moi'), '/lich-trinh/tao-moi');
  assert.equal(getAuthRedirect('USER', '/amthuc', 'vip'), '/vip?action=register-vip');
});
test('Chặn đường dẫn ngoài website và ký tự điều khiển', () => {
  for (const redirect of ['https://example.com', '//example.com', '/\\example.com', '/\n/example.com', 'javascript:alert(1)', '']) {
    assert.equal(getAuthRedirect('USER', redirect), '/');
    assert.equal(getAuthRedirect('PARTNER', redirect), '/partner');
  }
});
