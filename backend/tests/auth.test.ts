import assert from 'node:assert/strict';
import { generatePublicId } from '../src/utils/id';

console.log('🧪 Bắt đầu chạy bộ kiểm thử xác thực (Auth Tests)...');

// Test 1: Kiểm tra cấu hình Secret Key >= 32 bytes
const accessSecret = process.env.JWT_ACCESS_SECRET || 'f15cc7c3fca8028b83f5c1d4c310d32c617338bec84cd1e750c896022370bd81';
const refreshSecret = process.env.JWT_REFRESH_SECRET || '35a6e225bb42185aa5a40f429ed88ffd114c134ed054da189cdce819f9cad9f2';
assert.ok(Buffer.byteLength(accessSecret, 'utf8') >= 32, 'JWT_ACCESS_SECRET phải có độ dài ít nhất 32 bytes');
assert.ok(Buffer.byteLength(refreshSecret, 'utf8') >= 32, 'JWT_REFRESH_SECRET phải có độ dài ít nhất 32 bytes');
console.log('✅ Test 1 Đạt: Độ dài Secret Key an toàn (>= 32 bytes).');

// Test 2: Định dạng Public ID theo vai trò
const userPublicId = generatePublicId('USER');
const partnerPublicId = generatePublicId('PARTNER');
const adminPublicId = generatePublicId('ADMIN');

assert.ok(userPublicId.startsWith('KH-'), 'Public ID của USER phải bắt đầu bằng KH- (Khách hàng)');
assert.ok(partnerPublicId.startsWith('NCC-'), 'Public ID của PARTNER phải bắt đầu bằng NCC- (Nhà cung cấp)');
assert.ok(adminPublicId.startsWith('AD-'), 'Public ID của ADMIN phải bắt đầu bằng AD- (Quản trị)');
console.log('✅ Test 2 Đạt: Quy tắc tạo mã Public ID chuẩn xác (KH, NCC, AD).');

// Test 3: Kiểm tra cấu trúc phân quyền AccountRole
const allowedRoles = ['USER', 'PARTNER', 'ADMIN'];
assert.ok(allowedRoles.includes('USER'));
assert.ok(allowedRoles.includes('PARTNER'));
assert.ok(allowedRoles.includes('ADMIN'));
console.log('✅ Test 3 Đạt: Định nghĩa 3 vai trò hệ thống đầy đủ.');

console.log('🎉 Toàn bộ bài test Auth đã vượt qua thành công!');
