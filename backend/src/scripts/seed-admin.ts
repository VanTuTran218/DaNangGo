import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { closeDB, connectDB } from '../config/db';
import { findAccountByEmail, findRoleId, insertAdminAccount } from '../modules/auth/auth.repository';

const PUBLIC_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createPublicId(): string {
  const year = String(new Date().getUTCFullYear()).slice(-2);
  const randomPart = Array.from({ length: 8 }, () => PUBLIC_ID_ALPHABET[randomInt(PUBLIC_ID_ALPHABET.length)]).join('');
  return `AD-${year}-${randomPart}`;
}

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim();

  if (!email || !password || !name) {
    throw new Error('Cần cấu hình ADMIN_EMAIL, ADMIN_PASSWORD và ADMIN_NAME trong backend/.env.');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD phải có ít nhất 12 ký tự.');
  }
  if (email.length > 150 || name.length > 50) {
    throw new Error('ADMIN_EMAIL tối đa 150 ký tự và ADMIN_NAME tối đa 50 ký tự theo schema hiện tại.');
  }

  await connectDB();
  const roleId = await findRoleId('Admin');
  if (roleId === null) {
    throw new Error('Không tìm thấy role Admin trong dbo.roles. Hãy chạy migration 003_auth_upgrade.sql trước.');
  }

  const existing = await findAccountByEmail(email);
  if (existing) {
    if (existing.role_name.toUpperCase() !== 'ADMIN') {
      throw new Error('Email ADMIN_EMAIL đã được dùng bởi tài khoản không phải Admin.');
    }
    console.log(`Tài khoản admin đã tồn tại (${existing.public_id}); không thay đổi mật khẩu hoặc dữ liệu.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await insertAdminAccount({ publicId: createPublicId(), roleId, name, email, passwordHash });
      console.log('Đã tạo tài khoản admin. Mật khẩu không được in ra console.');
      return;
    } catch (error) {
      if (attempt === 4) {
        console.error('Lần thử cuối tạo admin thất bại:', error);
      }
    }
  }
  throw new Error('Không tạo được public_id admin duy nhất sau 5 lần thử.');
}

main()
  .catch((error: unknown) => {
    console.error('Seed admin thất bại:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDB();
  });
