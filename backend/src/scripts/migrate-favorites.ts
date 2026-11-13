import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, closeDB, getPool, sql } from '../config/db';

/** Preserve legacy rows; refuse migration on inconsistent data instead of deleting it. */
export async function migrateFavorites(transaction?: sql.Transaction) {
  const tx = transaction ?? new sql.Transaction(getPool());
  if (!transaction) await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    await new sql.Request(tx).query(`
      IF OBJECT_ID('dbo.user_favorites','U') IS NOT NULL
      BEGIN
        IF EXISTS(SELECT user_id,place_id FROM dbo.user_favorites GROUP BY user_id,place_id HAVING COUNT(*)>1)
          THROW 50010,N'Dữ liệu yêu thích cũ bị trùng. Cần kiểm tra trước khi chuyển đổi.',1;
        IF EXISTS(SELECT 1 FROM dbo.user_favorites f LEFT JOIN dbo.users u ON u.user_id=f.user_id
          LEFT JOIN dbo.places p ON p.place_id=f.place_id WHERE u.user_id IS NULL OR p.place_id IS NULL)
          THROW 50011,N'Dữ liệu yêu thích cũ có liên kết không hợp lệ. Chưa thực hiện chuyển đổi.',1;
      END;
    `);
    const migration = readFileSync(resolve(__dirname, '../../../database/migrations/009_create_favorites.sql'), 'utf8');
    for (const batch of migration.split(/^\s*GO\s*$/gim).filter(s => s.trim())) await new sql.Request(tx).query(batch);
    const verified = await new sql.Request(tx).query<{ uniquePair: number; trustedForeignKeys: number }>(`
      SELECT
        (SELECT COUNT(*) FROM sys.indexes i WHERE i.object_id=OBJECT_ID('dbo.favorites') AND i.is_unique=1
          AND (SELECT COUNT(*) FROM sys.index_columns c WHERE c.object_id=i.object_id AND c.index_id=i.index_id AND c.key_ordinal>0)=2
          AND EXISTS(SELECT 1 FROM sys.index_columns c JOIN sys.columns d ON d.object_id=c.object_id AND d.column_id=c.column_id WHERE c.object_id=i.object_id AND c.index_id=i.index_id AND c.key_ordinal>0 AND d.name='user_id')
          AND EXISTS(SELECT 1 FROM sys.index_columns c JOIN sys.columns d ON d.object_id=c.object_id AND d.column_id=c.column_id WHERE c.object_id=i.object_id AND c.index_id=i.index_id AND c.key_ordinal>0 AND d.name='place_id')) AS uniquePair,
        (SELECT COUNT(*) FROM sys.foreign_keys WHERE parent_object_id=OBJECT_ID('dbo.favorites') AND is_disabled=0 AND is_not_trusted=0
          AND referenced_object_id IN(OBJECT_ID('dbo.users'),OBJECT_ID('dbo.places'))) AS trustedForeignKeys;
    `);
    if (!verified.recordset[0]?.uniquePair || verified.recordset[0].trustedForeignKeys !== 2) throw new Error('Bảng favorites chưa đủ unique/FK; migration đã hủy, không xóa dữ liệu.');
    if (!transaction) await tx.commit();
    return verified.recordset[0];
  } catch (error) { if (!transaction) await tx.rollback().catch(() => {}); throw error; }
}
async function main() {
  await connectDB();
  try { const checks = await migrateFavorites(); console.log('Favorites migration hoàn tất; giữ dữ liệu cũ, không seed:', checks); }
  finally { await closeDB(); }
}
if (require.main === module) main().catch(error => { console.error(error instanceof Error ? error.message : 'Favorites migration thất bại.'); process.exitCode = 1; });
