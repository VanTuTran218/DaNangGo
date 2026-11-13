import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getAuthRedirect, shouldRedirectPartner } from '../lib/auth-redirect.ts';

test('Phiên đối tác mở trực tiếp trang khách sẽ quay về khu quản lý', () => {
  for (const route of ['/', '/amthuc', '/ca-nhan', '/lich-trinh/tao-moi', '/vip']) {
    assert.equal(shouldRedirectPartner('PARTNER', route), true);
    assert.equal(shouldRedirectPartner('USER', route), false);
    assert.equal(shouldRedirectPartner(undefined, route), false);
  }
  for (const route of ['/partner', '/partner/co-so', '/admin/login', '/dang-nhap', '/dieu-khoan']) {
    assert.equal(shouldRedirectPartner('PARTNER', route), false);
  }
});

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
test('Giữ đường dẫn admin để khu vực quản trị kiểm tra phiên riêng', () => {
  for (const redirect of ['/admin', '/admin/login', '/admin/dia-diem?tab=pending']) {
    assert.equal(getAuthRedirect('PARTNER', redirect), redirect);
  }
  assert.equal(getAuthRedirect('PARTNER', '/administrator'), '/partner');
});
test('Chặn đường dẫn ngoài website và ký tự điều khiển', () => {
  for (const redirect of ['https://example.com', '//example.com', '/\\example.com', '/\n/example.com', 'javascript:alert(1)', '']) {
    assert.equal(getAuthRedirect('USER', redirect), '/');
    assert.equal(getAuthRedirect('PARTNER', redirect), '/partner');
  }
});
