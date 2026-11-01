import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { closeDB, connectDB, getPool, sql } from '../config/db';
import { createPlaceCommon } from '../modules/places/places.service';
import { recalculatePlaceReviewSummary } from '../modules/reviews/reviews.repository';
import { generatePublicId } from '../utils/id';

const root = resolve(__dirname, '../../..');
const domain = 'restaurant-ranking.dananggo.test';
const source = 'https://danangfantasticity.com/ru/am-thuc/co-so-an-uong-dat-chuan-phuc-vuc-khach-du-lich-tai-dia-ban-thanh-pho-da-nang';
const bepHenSource = 'https://danangfantasticity.com/en/kham-pha/bep-hen';
const districtIds: Record<string, number> = { 'Hải Châu': 1, 'Sơn Trà': 2, 'Thanh Khê': 4 };
const ratings = [
  [5, 5, 5, 5, 5, 5, 5, 5], [5, 5, 5], [5, 5, 5, 5, 5, 5, 5, 5, 4, 4],
  [5, 5, 5, 5, 4], [5, 5, 5, 5, 4, 4], [5, 5, 4], [5, 5, 5, 5, 4, 4, 4, 4],
  [5, 5, 4, 4], [5, 5, 4, 4, 4], [5, 5, 4, 4, 4, 4], [5, 4, 4],
  [5, 4, 4, 4, 4], [4, 4, 4, 4, 4, 4, 4], [4, 4, 4], [4, 4, 4, 3, 3],
];
const sampleSchema = z.array(z.object({
  account: z.string().regex(/^food(0[1-9]|1[0-5])$/),
  name: z.string().min(1).max(150),
  address: z.string().min(1).max(255),
  district: z.enum(['Hải Châu', 'Sơn Trà', 'Thanh Khê']),
  summary: z.string().min(1),
  imageUrl: z.url(),
})).length(15);

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Seed chỉ dành cho development.');
  const password = process.env.SEED_RANKING_PASSWORD;
  if (!password || password.length < 12) throw new Error('Cần SEED_RANKING_PASSWORD ít nhất 12 ký tự.');
  const samples = sampleSchema.parse(JSON.parse(readFileSync(
    resolve(root, 'database/seeds/danang-real-restaurants.json'), 'utf8',
  )));
  if (new Set(samples.map(sample => sample.account)).size !== 15 ||
      samples.some((sample, i) => sample.account !== `food${String(i + 1).padStart(2, '0')}`)) {
    throw new Error('Manifest phải có đúng food01 đến food15 theo thứ tự.');
  }
  if (ratings.length !== samples.length || ratings.some(group =>
    group.length < 3 || group.length > 10 || group.some(rating => rating < 1 || rating > 5))) {
    throw new Error('Mỗi nhà hàng cần 3–10 đánh giá hợp lệ để thử Top ranking.');
  }
  for (const sample of samples) {
    if (!existsSync(resolve(root, `frontend/public/places/real-restaurants/${sample.account}.jpg`))) {
      throw new Error(`Thiếu ảnh của ${sample.account}.`);
    }
  }

  await connectDB();
  const tx = getPool().transaction();
  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const existing = await tx.request().input('suffix', sql.VarChar(150), `%@${domain}`)
      .query<{ count: number }>('SELECT COUNT(*) AS count FROM users WITH (UPDLOCK, HOLDLOCK) WHERE email LIKE @suffix');
    if (existing.recordset[0].count > 0) {
      const counts = await tx.request().input('suffix', sql.VarChar(150), `%@${domain}`).query(`
        SELECT COUNT(DISTINCT pp.partner_id) AS partners, COUNT(DISTINCT p.place_id) AS places,
          COUNT(DISTINCT r.place_id) AS restaurants
        FROM users u JOIN partner_profiles pp ON pp.user_id=u.user_id
        JOIN places p ON p.partner_id=pp.partner_id
        JOIN restaurants r ON r.place_id=p.place_id
        WHERE u.email LIKE @suffix`);
      if (existing.recordset[0].count !== 25 || counts.recordset[0].partners !== 15 ||
          counts.recordset[0].places !== 15 || counts.recordset[0].restaurants !== 15) {
        throw new Error('Bộ seed nhà hàng đã tồn tại một phần; cần kiểm tra trước khi chạy lại.');
      }
      await tx.commit();
      console.log('Đã có 15 đối tác và 15 nhà hàng mẫu; không tạo trùng hoặc đổi mật khẩu.');
      return;
    }

    const roles = await tx.request().query<{ role_id: number; role_name: string }>('SELECT role_id, role_name FROM roles');
    const roleId = (role: 'USER' | 'PARTNER') => {
      const found = roles.recordset.find(row => row.role_name.toUpperCase() === role);
      if (!found) throw new Error(`Thiếu role ${role}`);
      return found.role_id;
    };
    const admin = await tx.request().query<{ user_id: number }>(`
      SELECT TOP (1) u.user_id FROM users u JOIN roles r ON r.role_id=u.role_id
      WHERE UPPER(r.role_name)='ADMIN' AND u.status='ACTIVE' ORDER BY u.user_id`);
    const adminId = admin.recordset[0]?.user_id;
    if (!adminId) throw new Error('Cần tài khoản ADMIN ACTIVE để ghi nhận người duyệt.');
    const districts = await tx.request().query<{ district_id: number }>('SELECT district_id FROM districts');
    if (Object.values(districtIds).some(id => !districts.recordset.some(row => row.district_id === id))) {
      throw new Error('Thiếu quận cần dùng trong bảng districts.');
    }
    const hash = await bcrypt.hash(password, 12);
    async function createUser(role: 'USER' | 'PARTNER', email: string, name: string) {
      const result = await tx.request()
        .input('publicId', sql.NVarChar(20), generatePublicId(role))
        .input('roleId', sql.Int, roleId(role)).input('email', sql.VarChar(150), email)
        .input('name', sql.NVarChar(100), name).input('hash', sql.VarChar(255), hash)
        .query<{ user_id: number }>(`INSERT users (public_id,role_id,full_name,email,password_hash,status,email_verified)
          OUTPUT INSERTED.user_id VALUES (@publicId,@roleId,@name,@email,@hash,'ACTIVE',1)`);
      return result.recordset[0].user_id;
    }
    const reviewers: number[] = [];
    for (let i = 1; i <= 10; i++) {
      reviewers.push(await createUser('USER', `reviewer${String(i).padStart(2, '0')}@${domain}`, `[Test Ranking] Khách ${i}`));
    }
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      const userId = await createUser('PARTNER', `${sample.account}@${domain}`, `[Test Ranking] ${sample.name}`);
      const partner = await tx.request().input('uid', sql.Int, userId)
        .input('name', sql.NVarChar(150), sample.name).input('address', sql.NVarChar(255), sample.address)
        .input('admin', sql.Int, adminId).query<{ partner_id: number }>(`
          INSERT partner_profiles (user_id,business_name,address,service_type,approval_status,approved_by,approved_at)
          OUTPUT INSERTED.partner_id VALUES (@uid,@name,@address,'TABLE','APPROVED',@admin,SYSUTCDATETIME())`);
      const placeId = await createPlaceCommon({
        place_type: 'RESTAURANT', name: sample.name, address: sample.address,
        district_id: districtIds[sample.district], partner_id: partner.recordset[0].partner_id,
        status: 'ACTIVE', promo_label: 'Dữ liệu test Ranking',
        description: `${sample.summary}\n\nĐịa điểm và ảnh tham khảo từ cơ sở có thật tại Đà Nẵng. Tài khoản đối tác, trạng thái duyệt và đánh giá ở đây là dữ liệu giả lập để kiểm thử xếp hạng; không thể hiện quan hệ đối tác hay chất lượng thực tế.\nNguồn địa điểm: ${i === 14 ? bepHenSource : source}\nNguồn ảnh: ${sample.imageUrl}`,
      }, tx);
      await tx.request().input('pid', sql.Int, placeId)
        .input('image', sql.VarChar(255), `/places/real-restaurants/${sample.account}.jpg`)
        .query(`INSERT restaurants (place_id,place_type) VALUES (@pid,'RESTAURANT');
          INSERT place_images (place_id,image_url,is_cover) VALUES (@pid,@image,1);
          UPDATE places SET verified_at=SYSUTCDATETIME() WHERE place_id=@pid;`);
      for (let j = 0; j < ratings[i].length; j++) {
        await tx.request().input('pid', sql.Int, placeId).input('uid', sql.Int, reviewers[j])
          .input('rating', sql.TinyInt, ratings[i][j]).input('admin', sql.Int, adminId)
          .input('comment', sql.NVarChar(1000), `[Dữ liệu test Ranking] Đánh giá giả lập ${j + 1} để kiểm thử thứ tự xếp hạng.`)
          .query(`INSERT reviews (user_id,place_id,rating,comment,status,moderated_by,moderated_at)
            VALUES (@uid,@pid,@rating,@comment,'APPROVED',@admin,SYSUTCDATETIME())`);
      }
      await recalculatePlaceReviewSummary(tx, placeId);
    }
    await tx.commit();
    console.log('Đã tạo 15 đối tác APPROVED, 15 nhà hàng ACTIVE và review APPROVED để test Top ranking.');
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(closeDB);
