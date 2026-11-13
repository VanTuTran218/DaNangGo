import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, closeDB, getPool, sql } from '../config/db';
import { migrateFavorites } from './migrate-favorites';
import * as repo from '../modules/favorites/favorites.repository';

async function main(){
  await connectDB();
  const checks:Record<string,unknown>={};
  try{
    const pool=getPool();
    const original=(await pool.request().query<{n:number}>('SELECT COUNT(*) AS n FROM dbo.favorites')).recordset[0]!.n;
    checks.schema=await migrateFavorites();
    assert.equal((await pool.request().query<{n:number}>('SELECT COUNT(*) AS n FROM dbo.favorites')).recordset[0]!.n,original);
    checks.idempotentMigration='PASS: migration rerun preserves favorite count';
    const users=(await pool.request().query<{user_id:number}>('SELECT TOP(2) user_id FROM dbo.users ORDER BY user_id')).recordset.map(r=>r.user_id);
    const places=(await pool.request().query<{place_id:number}>("SELECT TOP(2) place_id FROM dbo.places WHERE status='ACTIVE' ORDER BY place_id")).recordset.map(r=>r.place_id);
    assert.equal(users.length,2);assert.equal(places.length,2);
    const [a,b]=users as [number,number], [p,q]=places as [number,number];
    const beforeA=(await repo.listFavoriteIds(a)).sort(),beforeB=(await repo.listFavoriteIds(b)).sort();
    const tx=new sql.Transaction(pool);await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try{
      // Only the selected rows are changed temporarily, never committed.
      for(const owner of [a,b])for(const place of [p,q])await repo.deleteFavorite(owner,place,tx);
      const hasLegacy=(await new sql.Request(tx).query<{exists:number}>("SELECT CASE WHEN OBJECT_ID('dbo.user_favorites','U') IS NULL THEN 0 ELSE 1 END AS [exists]")).recordset[0]!.exists;
      if(hasLegacy){
        await new sql.Request(tx).input('u',sql.Int,a).input('p',sql.Int,p).query("IF NOT EXISTS(SELECT 1 FROM dbo.user_favorites WHERE user_id=@u AND place_id=@p) INSERT INTO dbo.user_favorites(user_id,place_id,created_at) VALUES(@u,@p,SYSUTCDATETIME())");
        await migrateFavorites(tx);
        assert.ok((await repo.listFavoriteIds(a,tx)).includes(p));
        checks.legacyCopy='PASS: legacy favorite is copied and preserved; test row rolled back';
      }
      await repo.insertFavorite(a,p,tx);await repo.insertFavorite(a,p,tx);await repo.insertFavorite(b,p,tx);await repo.insertFavorite(a,q,tx);
      assert.equal((await repo.listFavoriteIds(a,tx)).filter(id=>id===p).length,1);checks.duplicateAdd='PASS';
      await repo.deleteFavorite(a,p,tx);await repo.deleteFavorite(a,p,tx);
      assert.ok(!(await repo.listFavoriteIds(a,tx)).includes(p));assert.ok((await repo.listFavoriteIds(b,tx)).includes(p));checks.isolationAndRepeatedDelete='PASS';
      const list=await repo.listFavorites({userId:a,page:1,limit:100},tx);
      assert.ok(list.data.some(row=>row.place_id===q));assert.ok(list.data.every(row=>!Object.prototype.hasOwnProperty.call(row,'user_id')));checks.realList='PASS';
      const hidden=(await new sql.Request(tx).query<{place_id:number}>("SELECT TOP(1) place_id FROM dbo.places WHERE status<>'ACTIVE' ORDER BY place_id")).recordset[0];
      if(hidden){
        await repo.deleteFavorite(a,hidden.place_id,tx);
        await assert.rejects(repo.insertFavorite(a,hidden.place_id,tx));
        assert.ok(!(await repo.listFavoriteIds(a,tx)).includes(hidden.place_id));checks.inactiveAdd='PASS';
      }else checks.inactiveAdd='No existing inactive place available; HTTP mock test covers 404';
    }finally{await tx.rollback();}
    assert.deepEqual((await repo.listFavoriteIds(a)).sort(),beforeA);assert.deepEqual((await repo.listFavoriteIds(b)).sort(),beforeB);
    assert.equal((await pool.request().query<{n:number}>('SELECT COUNT(*) AS n FROM dbo.favorites')).recordset[0]!.n,original);
    checks.rollback='PASS: original IDs/count restored; no test favorites/users created permanently';
    const report={checkedAt:new Date().toISOString(),status:'PASS',mode:'real local SQL; migration verified; favorite operations rolled back',checks};
    writeFileSync(resolve(__dirname,'../../../docs/ai-knowledge/favorites-stage2-sql-tests.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
  }finally{await closeDB();}
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Favorites integration failed');process.exitCode=1;});
