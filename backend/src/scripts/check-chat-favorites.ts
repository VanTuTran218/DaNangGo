import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB, closeDB, getPool, sql } from '../config/db';
import * as repo from '../modules/favorites/favorites.repository';
import { favoritesReply } from '../modules/chat/chat.favorites';

async function main() {
  await connectDB();
  const checks: Record<string, string> = {};
  try {
    const pool = getPool();
    const count = async () => (await pool.request().query<{n:number}>('SELECT COUNT(*) AS n FROM dbo.favorites')).recordset[0]!.n;
    const originalCount = await count();
    const users = (await pool.request().query<{user_id:number}>('SELECT TOP(2) user_id FROM dbo.users ORDER BY user_id')).recordset;
    const places = (await pool.request().query<{place_id:number;place_type:repo.FavoritePlaceType}>("SELECT TOP(8) place_id,place_type FROM dbo.places WHERE status='ACTIVE' ORDER BY place_id")).recordset;
    assert.equal(users.length,2); assert.equal(places.length,8);
    const a=users[0]!.user_id,b=users[1]!.user_id;
    const beforeA=await repo.listFavoriteIds(a),beforeB=await repo.listFavoriteIds(b);
    const tx = new sql.Transaction(pool); await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      // Isolated fixture relationships only; existing place/account details stay unchanged.
      for (const id of [a,b]) await new sql.Request(tx).input('u',sql.Int,id).query('DELETE FROM dbo.favorites WHERE user_id=@u');
      for (const place of places.slice(0,7)) await repo.insertFavorite(a,place.place_id,tx);
      await repo.insertFavorite(b,places[7]!.place_id,tx);
      const read = async(input: Parameters<typeof repo.listFavorites>[0]) => {
        const result=await repo.listFavorites(input,tx);
        return {...result,page:input.page,limit:input.limit,totalPages:Math.ceil(result.total/input.limit)};
      };
      const owner={userId:a,userRole:'USER' as const};
      const first=await favoritesReply('Xem danh sách yêu thích của tôi',owner,undefined,read);
      assert.equal(first!.places!.length,6);assert.match(first!.content,/7 địa điểm/);
      const second=await favoritesReply('Xem tiếp',owner,first!.cursor,read);
      assert.equal(second!.places!.length,1);
      assert.equal(new Set([...first!.places!,...second!.places!].map(p=>p.placeId)).size,7);
      checks.pagination='PASS: two pages, seven distinct active public IDs';
      assert.ok(!first!.places!.some(p=>p.placeId===places[7]!.place_id));
      assert.ok(!second!.places!.some(p=>p.placeId===places[7]!.place_id));
      const other=await favoritesReply('Xem danh sách yêu thích của tôi',{userId:b,userRole:'PARTNER'},undefined,read);
      assert.deepEqual(other!.places!.map(p=>p.placeId),[places[7]!.place_id]);
      checks.isolation='PASS: USER and PARTNER see only their own favorites';
      const type=places[0]!.place_type;
      const question={RESTAURANT:'quán ăn',ACCOMMODATION:'lưu trú',ATTRACTION:'điểm tham quan'}[type];
      const filtered=await favoritesReply(`Xem ${question} yêu thích của tôi`,owner,undefined,read);
      assert.ok(filtered!.places!.every(p=>p.placeType===type));
      checks.category='PASS: SQL filters by requested place type';
      const hidden=(await new sql.Request(tx).query<{place_id:number}>("SELECT TOP(1) place_id FROM dbo.places WHERE status<>'ACTIVE' ORDER BY place_id")).recordset[0];
      if(hidden){
        // Represents an earlier favorite whose place is no longer public, never a new UI save.
        await new sql.Request(tx).input('u',sql.Int,a).input('p',sql.Int,hidden.place_id).query('INSERT INTO dbo.favorites(user_id,place_id) VALUES(@u,@p)');
        const visible=await favoritesReply('Xem danh sách yêu thích của tôi',owner,undefined,read);
        assert.match(visible!.content,/7 địa điểm/);assert.ok(!visible!.places!.some(p=>p.placeId===hidden.place_id));
        checks.hidden='PASS: hidden favorite excluded from visible count/cards';
      } else checks.hidden='SKIP: no existing inactive place in local DB';
      for(const place of places.slice(0,7)) await repo.deleteFavorite(a,place.place_id,tx);
      const empty=await favoritesReply('Xem danh sách yêu thích của tôi',owner,undefined,read);
      assert.equal(empty!.places,undefined);assert.match(empty!.content,/Chưa có/);
      checks.freshRead='PASS: removals reflected on the next read; hidden rows do not imply visible favorites';
    } finally { await tx.rollback(); }
    assert.deepEqual((await repo.listFavoriteIds(a)).sort(),beforeA.sort());
    assert.deepEqual((await repo.listFavoriteIds(b)).sort(),beforeB.sort());
    assert.equal(await count(),originalCount);
    checks.rollback='PASS: original favorite IDs/count restored; no permanent fixture relationships';
    const report={checkedAt:new Date().toISOString(),status:'PASS',mode:'real local SQL; favorite fixtures rolled back; no model calls',checks};
    writeFileSync(resolve(__dirname,'../../../docs/ai-knowledge/favorites-stage4-sql-tests.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  } finally { await closeDB(); }
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Chat favorites integration failed');process.exitCode=1;});
