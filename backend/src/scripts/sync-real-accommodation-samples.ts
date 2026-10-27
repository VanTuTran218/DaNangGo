import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { connectDB, closeDB, getPool, sql } from '../config/db';

const root = resolve(__dirname, '../../..');
const manifestSchema = z.array(z.object({
  account: z.string().regex(/^stay(0[1-9]|1[0-5])$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(150),
  kind: z.enum(['RESORT', 'HOSTEL', 'HOMESTAY', 'APARTMENT', 'HOTEL']),
  address: z.string().min(1).max(255),
  districtId: z.number().int().positive(),
  summary: z.string().min(1),
  source: z.url(),
  website: z.url().max(255).nullable(),
  imageSource: z.url(),
  imageUrl: z.url(),
  localImage: z.string().regex(/^\/places\/real-stays\/[a-z0-9-]+\.(jpg|jpeg|webp|png)$/),
  imageCheckedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})).length(15);

/** Updates only the 15 ranking fixtures; credentials, reviews and rankings remain intact. */
export async function syncRealAccommodationSamples(): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new Error('Chỉ cập nhật bộ dữ liệu development.');
  const samples = manifestSchema.parse(JSON.parse(readFileSync(
    resolve(root, 'database/seeds/danang-real-accommodations.json'), 'utf8',
  )));
  if (new Set(samples.map(p => p.account)).size !== 15) throw new Error('Account bị trùng trong manifest.');
  for (const sample of samples) {
    if (!existsSync(resolve(root, `frontend/public${sample.localImage}`))) {
      throw new Error(`Thiếu ảnh local: ${sample.localImage}`);
    }
  }
  await connectDB();
  const tx = getPool().transaction();
  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    for (const sample of samples) {
      const target = await tx.request()
        .input('email', sql.VarChar(150), `${sample.account}@ranking.dananggo.test`)
        .query<{ place_id: number; partner_id: number; promo_label: string | null }>(`
          SELECT p.place_id, pp.partner_id, p.promo_label
          FROM users u JOIN partner_profiles pp ON pp.user_id=u.user_id
          JOIN places p WITH (UPDLOCK, HOLDLOCK) ON p.partner_id=pp.partner_id
          WHERE u.email=@email AND p.place_type='ACCOMMODATION'`);
      const row = target.recordset[0];
      if (target.recordset.length !== 1 || !row ||
          !['Dữ liệu mẫu Ranking', 'Test: điểm & giá phòng mẫu'].includes(row.promo_label ?? '')) {
        throw new Error(`Không xác định được duy nhất cơ sở seed của ${sample.account}.`);
      }
      const description = `${sample.summary}\n\nTên, địa chỉ và ảnh tham khảo từ cơ sở có thật tại Đà Nẵng. Tài khoản quản lý, trạng thái duyệt, đánh giá, giá và số phòng trong bản ghi này là dữ liệu giả lập để test; không thể hiện quan hệ đối tác thực tế hoặc giá bán của cơ sở.\nNguồn thông tin: ${sample.source}\nNguồn ảnh: ${sample.imageSource}\nẢnh gốc: ${sample.imageUrl}\nNgày đối chiếu: ${sample.imageCheckedAt}`;
      await tx.request().input('pid', sql.Int, row.place_id).input('partner', sql.Int, row.partner_id)
        .input('name', sql.NVarChar(200), sample.name).input('address', sql.NVarChar(255), sample.address)
        .input('district', sql.Int, sample.districtId).input('description', sql.NVarChar(sql.MAX), description)
        .input('website', sql.VarChar(255), sample.website).input('kind', sql.VarChar(20), sample.kind)
        .input('image', sql.VarChar(255), sample.localImage)
        .query(`
          UPDATE places SET name=@name, address=@address, district_id=@district,
            description=@description, website=@website, latitude=NULL, longitude=NULL,
            promo_label=N'Test: điểm & giá phòng mẫu', updated_at=SYSUTCDATETIME()
          WHERE place_id=@pid;
          UPDATE partner_profiles SET business_name=@name, address=@address WHERE partner_id=@partner;
          UPDATE accommodations SET accommodation_type=@kind, star_rating=NULL,
            check_in_time=NULL, check_out_time=NULL WHERE place_id=@pid;
          UPDATE place_images SET image_url=@image WHERE place_id=@pid AND is_cover=1;
          IF @@ROWCOUNT=0 INSERT place_images (place_id,image_url,is_cover) VALUES (@pid,@image,1);
          UPDATE room_types SET name=N'[Mẫu] '+name
          WHERE place_id=@pid AND name IN (N'Phòng đôi',N'Phòng gia đình');
        `);
    }
    await tx.commit();
    console.log('Đã đồng bộ 15 địa điểm thật và ảnh local; giữ nguyên 15 tài khoản và bộ review test.');
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

if (require.main === module) {
  syncRealAccommodationSamples()
    .catch(error => { console.error(error); process.exitCode = 1; })
    .finally(closeDB);
}
