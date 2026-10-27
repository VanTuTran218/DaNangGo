import bcrypt from 'bcryptjs';
import { closeDB, connectDB, getPool, sql } from '../config/db';
import { generatePublicId } from '../utils/id';
import { createPlaceCommon } from '../modules/places/places.service';
import { recalculatePlaceReviewSummary } from '../modules/reviews/reviews.repository';
import { syncRealAccommodationSamples } from './sync-real-accommodation-samples';

// Development fixtures only. Existing accounts/reviews are never reset on rerun.
const samples = [
  { name: 'Resort Biển Ngọc', kind: 'RESORT', price: 2500000, ratings: [5, 5, 5, 5, 5, 5, 5, 5] },
  { name: 'Resort Sơn Trà', kind: 'RESORT', price: 2200000, ratings: [5, 5, 5] },
  { name: 'Resort Cát Trắng', kind: 'RESORT', price: 1900000, ratings: [5, 5, 5, 5, 5, 5, 5, 5, 4, 4] },
  { name: 'Hostel Balo Xanh', kind: 'HOSTEL', price: 180000, ratings: [5, 5, 5, 5, 4] },
  { name: 'Hostel Cầu Rồng', kind: 'HOSTEL', price: 200000, ratings: [5, 5, 5, 5, 4, 4] },
  { name: 'Hostel Phố Biển', kind: 'HOSTEL', price: 220000, ratings: [5, 5, 4] },
  { name: 'Homestay Nắng Sớm', kind: 'HOMESTAY', price: 350000, ratings: [5, 5, 5, 5, 4, 4, 4, 4] },
  { name: 'Homestay Vườn Nhỏ', kind: 'HOMESTAY', price: 400000, ratings: [5, 5, 4, 4] },
  { name: 'Homestay Sông Hàn', kind: 'HOMESTAY', price: 450000, ratings: [5, 5, 4, 4, 4] },
  { name: 'Apartment An Thượng', kind: 'APARTMENT', price: 700000, ratings: [5, 5, 4, 4, 4, 4] },
  { name: 'Apartment Mỹ Khê', kind: 'APARTMENT', price: 850000, ratings: [5, 4, 4] },
  { name: 'Apartment Bạch Đằng', kind: 'APARTMENT', price: 950000, ratings: [5, 4, 4, 4, 4] },
  { name: 'Hotel Bình Minh', kind: 'HOTEL', price: 600000, ratings: [4, 4, 4, 4, 4, 4, 4] },
  { name: 'Hotel Hải Âu', kind: 'HOTEL', price: 750000, ratings: [4, 4, 4] },
  { name: 'Hotel Thành Phố', kind: 'HOTEL', price: 500000, ratings: [4, 4, 4, 3, 3] },
];
const domain = 'ranking.dananggo.test';

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Seed chỉ dành cho development.');
  const password = process.env.SEED_RANKING_PASSWORD;
  if (!password || password.length < 12) throw new Error('Cần SEED_RANKING_PASSWORD ít nhất 12 ký tự.');
  await connectDB();
  const tx = getPool().transaction();
  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const existing = await tx.request().input('suffix', sql.VarChar(150), `%@${domain}`)
      .query<{ count: number }>('SELECT COUNT(*) AS count FROM users WITH (UPDLOCK, HOLDLOCK) WHERE email LIKE @suffix');
    if (existing.recordset[0].count > 0) {
      // A partial/deleted fixture needs manual inspection, not silent account overwrites.
      const counts = await tx.request().input('suffix', sql.VarChar(150), `%@${domain}`).query(`
        SELECT COUNT(DISTINCT pp.partner_id) AS partners, COUNT(DISTINCT p.place_id) AS places
        FROM users u JOIN partner_profiles pp ON pp.user_id=u.user_id
        JOIN places p ON p.partner_id=pp.partner_id WHERE u.email LIKE @suffix`);
      if (existing.recordset[0].count !== 25 || counts.recordset[0].partners !== 15 || counts.recordset[0].places !== 15)
        throw new Error('Bộ seed đã tồn tại một phần; cần kiểm tra trước khi chạy lại.');
      await tx.commit();
      console.log('Đã có 15 đối tác và 15 cơ sở mẫu; không tạo trùng hoặc đổi mật khẩu.');
      return;
    }
    const roles = await tx.request().query<{ role_id: number; role_name: string }>('SELECT role_id, role_name FROM roles');
    const roleId = (role: string) => {
      const found = roles.recordset.find(row => row.role_name.toUpperCase() === role);
      if (!found) throw new Error(`Thiếu role ${role}`);
      return found.role_id;
    };
    const admin = await tx.request().query<{ user_id: number }>(`
      SELECT TOP (1) u.user_id FROM users u JOIN roles r ON r.role_id=u.role_id
      WHERE UPPER(r.role_name)='ADMIN' AND u.status='ACTIVE' ORDER BY u.user_id`);
    const adminId = admin.recordset[0]?.user_id;
    if (!adminId) throw new Error('Cần một tài khoản ADMIN ACTIVE để ghi nhận người duyệt.');
    const districts = await tx.request().query<{ district_id: number }>('SELECT district_id FROM districts ORDER BY district_id');
    if (!districts.recordset.length) throw new Error('Cần dữ liệu districts trước khi seed.');

    async function createUser(role: 'USER' | 'PARTNER', email: string, name: string) {
      const hash = await bcrypt.hash(password!, 12);
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
      reviewers.push(await createUser('USER', `reviewer${String(i).padStart(2, '0')}@${domain}`, `[Mẫu Ranking] Khách ${i}`));
    }
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      const number = String(i + 1).padStart(2, '0');
      const name = `[Mẫu Ranking] ${sample.name}`;
      const address = `${10 + i * 2} đường lưu trú mẫu, Đà Nẵng (dữ liệu kiểm thử)`;
      const email = `stay${number}@${domain}`;
      const userId = await createUser('PARTNER', email, `[Mẫu Ranking] Đối tác ${number}`);
      const partner = await tx.request().input('uid', sql.Int, userId)
        .input('name', sql.NVarChar(150), name).input('address', sql.NVarChar(255), address)
        .input('admin', sql.Int, adminId).query<{ partner_id: number }>(`
          INSERT partner_profiles (user_id,business_name,address,service_type,approval_status,approved_by,approved_at)
          OUTPUT INSERTED.partner_id VALUES (@uid,@name,@address,'STAY','APPROVED',@admin,SYSUTCDATETIME())`);
      const placeId = await createPlaceCommon({
        place_type: 'ACCOMMODATION', name, address, status: 'ACTIVE',
        partner_id: partner.recordset[0].partner_id,
        district_id: districts.recordset[i % districts.recordset.length].district_id,
        description: `${name} giới thiệu không gian nghỉ dưỡng thoải mái, phòng sạch sẽ và vị trí thuận tiện khám phá Đà Nẵng. Có phòng đôi và phòng gia đình. Đây là cơ sở giả lập dùng để kiểm thử xếp hạng, không nhận đặt phòng thật.`,
        latitude: 16.04 + i * 0.001, longitude: 108.23 + i * 0.0005,
        promo_label: 'Dữ liệu mẫu Ranking',
      }, tx);
      await tx.request().input('pid', sql.Int, placeId).input('kind', sql.VarChar(20), sample.kind)
        .input('stars', sql.TinyInt, sample.kind === 'RESORT' ? 5 : sample.kind === 'HOTEL' ? 3 : null)
        .query(`INSERT accommodations (place_id,accommodation_type,star_rating,check_in_time,check_out_time)
          VALUES (@pid,@kind,@stars,'14:00','12:00');
          UPDATE places SET verified_at=SYSUTCDATETIME() WHERE place_id=@pid;`);
      await tx.request().input('pid', sql.Int, placeId).input('price', sql.Decimal(18, 0), sample.price)
        .query(`INSERT room_types (place_id,name,capacity,price_per_night,room_count,status)
          VALUES (@pid,N'Phòng đôi',2,@price,8,'ACTIVE'),(@pid,N'Phòng gia đình',4,@price*1.5,4,'ACTIVE');`);
      await tx.request().input('pid', sql.Int, placeId)
        .input('url', sql.VarChar(255), 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80')
        .query('INSERT place_images (place_id,image_url,is_cover) VALUES (@pid,@url,1)');
      for (let j = 0; j < sample.ratings.length; j++) {
        await tx.request().input('pid', sql.Int, placeId).input('uid', sql.Int, reviewers[j])
          .input('rating', sql.TinyInt, sample.ratings[j]).input('admin', sql.Int, adminId)
          .input('comment', sql.NVarChar(1000), `[Mẫu Ranking] Trải nghiệm lưu trú ${sample.ratings[j]}/5. Phòng sạch, nhân viên thân thiện. Đánh giá giả lập số ${j + 1}.`)
          .query(`INSERT reviews (user_id,place_id,rating,comment,status,moderated_by,moderated_at)
            VALUES (@uid,@pid,@rating,@comment,'APPROVED',@admin,SYSUTCDATETIME())`);
      }
      await recalculatePlaceReviewSummary(tx, placeId);
    }
    await tx.commit();
    console.log('Đã tạo 15 đối tác APPROVED, 15 cơ sở ACTIVE, 30 loại phòng và 10 tài khoản đánh giá mẫu.');
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

main().then(syncRealAccommodationSamples)
  .catch(error => { console.error(error); process.exitCode = 1; }).finally(closeDB);
