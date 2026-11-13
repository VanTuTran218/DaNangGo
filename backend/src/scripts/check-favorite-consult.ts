import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {connectDB,closeDB,getPool,sql} from '../config/db';
import * as repo from '../modules/favorites/favorites.repository';
import {searchPlacesForChat} from '../modules/chat/chat.repository';
import {favoriteConsultReply} from '../modules/chat/chat.favorite-consult';

async function main(){
 await connectDB();
 try{
  const pool=getPool();
  const count=async()=>(await pool.request().query<{n:number}>('SELECT COUNT(*) AS n FROM dbo.favorites')).recordset[0]!.n;
  const original=await count();
  const users=(await pool.request().query<{user_id:number}>('SELECT TOP(2) user_id FROM dbo.users ORDER BY user_id')).recordset;
  const places=(await pool.request().query<{place_id:number;place_type:string}>("SELECT place_id,place_type FROM (SELECT place_id,place_type,ROW_NUMBER() OVER(PARTITION BY place_type ORDER BY place_id) rn FROM dbo.places WHERE status='ACTIVE' AND name NOT LIKE N'[[]Mẫu]%' AND name NOT LIKE N'[[]Test]%' AND name NOT LIKE N'[[]Demo]%') p WHERE rn<=2")).recordset;
  assert.equal(users.length,2);const a=users[0]!.user_id,b=users[1]!.user_id;
  const beforeA=await repo.listFavoriteIds(a),beforeB=await repo.listFavoriteIds(b);
  const hotels=places.filter(p=>p.place_type==='ACCOMMODATION');assert.equal(hotels.length,2);
  const other=places.find(p=>p.place_type==='ATTRACTION');assert.ok(other);
  const personal=places.filter(p=>p!==other);
  const checks:Record<string,string>={};const tx=new sql.Transaction(pool);await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try{
   for(const u of [a,b])await new sql.Request(tx).input('u',sql.Int,u).query('DELETE FROM dbo.favorites WHERE user_id=@u');
   for(const place of personal)await repo.insertFavorite(a,place.place_id,tx);
   await repo.insertFavorite(b,other.place_id,tx);
   const search=(input:Parameters<typeof searchPlacesForChat>[0])=>searchPlacesForChat(input,tx);
   const candidates=await search({favoriteUserId:a,limit:501,strictKeywords:true});
   const pair=hotels.map(h=>candidates.find(p=>p.placeId===h.place_id)!);assert.ok(pair.every(Boolean));
   const owner={userId:a,userRole:'USER' as const};
   const first=await favoriteConsultReply(`So sánh ${pair[0]!.name} và ${pair[1]!.name} trong danh sách yêu thích của tôi`,owner,undefined,false,search);
   assert.deepEqual(first!.comparison!.places.map(p=>p.placeId),hotels.map(p=>p.place_id));
   const price=await favoriteConsultReply('Nơi nào rẻ hơn?',owner,first!.state,false,search);assert.ok(price!.comparison);
   checks.compare='PASS: owned real SQL pair survives price follow-up; same source re-read';
   const alternative=await favoriteConsultReply(`Tìm nơi thay thế ${pair[0]!.name} trong yêu thích`,owner,undefined,false,search);
   assert.ok(alternative!.places?.length);assert.ok(alternative!.places.every(p=>p.placeType==='ACCOMMODATION'&&p.placeId!==pair[0]!.placeId));
   checks.alternative='PASS: same-type favorites only, excludes source place';
   const anchor=candidates.find(p=>p.latitude!=null&&p.longitude!=null);assert.ok(anchor);
   const near=await favoriteConsultReply(`Tìm địa điểm yêu thích gần ${anchor.name} 10km`,owner,undefined,false,search);
   assert.ok(near?.places?.length,near?.content??'Missing nearby results');assert.ok(near.places.every(p=>p.distanceKm!=null&&p.distanceKm<=10&&p.placeId!==anchor.placeId));
   assert.ok((near.places??[]).every(p=>personal.some(item=>item.place_id===p.placeId)));
   checks.near='PASS: returned distances <=10km; all candidates owned; origin excluded';
   const hidden=(await new sql.Request(tx).query<{place_id:number}>("SELECT TOP(1) place_id FROM dbo.places WHERE status<>'ACTIVE' ORDER BY place_id")).recordset[0];
   if(hidden){await new sql.Request(tx).input('u',sql.Int,a).input('p',sql.Int,hidden.place_id).query('INSERT INTO dbo.favorites(user_id,place_id) VALUES(@u,@p)');assert.ok(!(await search({favoriteUserId:a,limit:501})).some(p=>p.placeId===hidden.place_id));checks.hidden='PASS: hidden favorite excluded';}
   await repo.deleteFavorite(a,pair[1]!.placeId,tx);
   const removed=await favoriteConsultReply('Nơi nào rẻ hơn?',owner,first!.state,false,search);assert.equal(removed!.comparison,undefined);
   const otherOwner=await favoriteConsultReply('Nơi nào rẻ hơn?',{userId:b,userRole:'PARTNER'},first!.state,false,search);assert.equal(otherOwner!.comparison,undefined);
   checks.freshAndIsolated='PASS: removed favorite and foreign-owner pair cannot be reused from cursor';
  }finally{await tx.rollback();}
  assert.deepEqual((await repo.listFavoriteIds(a)).sort(),beforeA.sort());assert.deepEqual((await repo.listFavoriteIds(b)).sort(),beforeB.sort());assert.equal(await count(),original);
  checks.rollback='PASS: original IDs/count restored; no permanent fixture relationships';
  const report={checkedAt:new Date().toISOString(),status:'PASS',mode:'real local SQL, rollback, no model calls',checks};
  writeFileSync(resolve(__dirname,'../../../docs/ai-knowledge/favorites-stage6-sql-tests.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{await closeDB();}
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Favorite consult SQL test failed');process.exitCode=1;});
