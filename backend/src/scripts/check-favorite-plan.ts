import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB,closeDB,getPool,sql } from '../config/db';
import * as repo from '../modules/favorites/favorites.repository';
import { searchPlacesForChat } from '../modules/chat/chat.repository';
import { favoritePlanReply } from '../modules/chat/chat.favorite-plan';

async function main(){
  await connectDB();
  try{
    const pool=getPool();
    const count=async()=>(await pool.request().query<{n:number}>('SELECT COUNT(*) AS n FROM dbo.favorites')).recordset[0]!.n;
    const originalCount=await count();
    const users=(await pool.request().query<{user_id:number}>('SELECT TOP(2) user_id FROM dbo.users ORDER BY user_id')).recordset;
    const places=(await pool.request().query<{place_id:number;place_type:repo.FavoritePlaceType}>("SELECT place_id,place_type FROM (SELECT place_id,place_type,ROW_NUMBER() OVER(PARTITION BY place_type ORDER BY place_id) AS rn FROM dbo.places WHERE status='ACTIVE' AND name NOT LIKE N'[[]Mẫu]%' AND name NOT LIKE N'[[]Test]%' AND name NOT LIKE N'[[]Demo]%') p WHERE rn<=2")).recordset;
    assert.equal(users.length,2);assert.ok(places.some(p=>p.place_type==='ATTRACTION'));
    const a=users[0]!.user_id,b=users[1]!.user_id;
    const beforeA=await repo.listFavoriteIds(a),beforeB=await repo.listFavoriteIds(b);
    const checks:Record<string,string>={};
    const tx=new sql.Transaction(pool);await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try{
      for(const id of [a,b])await new sql.Request(tx).input('u',sql.Int,id).query('DELETE FROM dbo.favorites WHERE user_id=@u');
      const personal=places.filter(p=>p.place_type!=='ACCOMMODATION'||p===places.find(p=>p.place_type==='ACCOMMODATION'));
      const other=places.find(p=>!personal.includes(p));assert.ok(other);
      for(const place of personal)await repo.insertFavorite(a,place.place_id,tx);
      await repo.insertFavorite(b,other.place_id,tx);
      const read=(input:Parameters<typeof searchPlacesForChat>[0])=>searchPlacesForChat(input,tx);
      const owner={userId:a,userRole:'USER' as const};
      const prompt='Lập lịch từ yêu thích của tôi 2 ngày 1 đêm, 2 người, tổng ngân sách 100 triệu, khởi hành ngày mai, đến 08:00, về 21:00, đi taxi';
      const result=await favoritePlanReply(prompt,owner,undefined,false,read);
      assert.ok(result?.travelPlan,result?.content ?? 'Missing favorite plan');
      const plan=result.travelPlan;
      const all=plan.groups.flatMap(g=>g.places).concat(plan.days.flatMap(d=>d.periods.flatMap(p=>p.items.flatMap(i=>i.place?[i.place]:[]))));
      const allowed=new Set(personal.map(p=>p.place_id));
      assert.ok(all.length);assert.ok(all.every(p=>allowed.has(p.placeId)));assert.ok(!all.some(p=>p.placeId===other.place_id));
      checks.publicIdsAndIsolation='PASS: all plan/group IDs are current favorites of owner A; owner B-only place excluded';
      assert.equal(plan.source,'FAVORITES');assert.equal(plan.dayCount,2);assert.equal(plan.guestCount,2);
      checks.realPlan='PASS: two-day plan built from real SQL price/location/duration data';
      if(plan.costs.projectedSubtotal!==undefined)assert.equal(plan.costs.remaining,100000000-plan.costs.projectedSubtotal);
      checks.costs='PASS: projected amounts and remaining budget consistent when known subtotal exists';
      const hidden=(await new sql.Request(tx).query<{place_id:number}>("SELECT TOP(1) place_id FROM dbo.places WHERE status<>'ACTIVE' ORDER BY place_id")).recordset[0];
      if(hidden){
        await new sql.Request(tx).input('u',sql.Int,a).input('p',sql.Int,hidden.place_id).query('INSERT INTO dbo.favorites(user_id,place_id) VALUES(@u,@p)');
        const candidates=await read({favoriteUserId:a,limit:501,strictKeywords:true});
        assert.ok(!candidates.some(p=>p.placeId===hidden.place_id));checks.hidden='PASS: hidden saved place excluded from planner candidates';
      }else checks.hidden='SKIP: no existing inactive place in local DB';
      for(const place of personal)await repo.deleteFavorite(a,place.place_id,tx);
      const empty=await favoritePlanReply(prompt,owner,undefined,false,read);assert.equal(empty!.travelPlan,undefined);assert.match(empty!.content,/Chưa có địa điểm/);
      checks.freshRead='PASS: rebuilding after removals does not reuse old candidates or other-owner places';
    }finally{await tx.rollback();}
    assert.deepEqual((await repo.listFavoriteIds(a)).sort(),beforeA.sort());assert.deepEqual((await repo.listFavoriteIds(b)).sort(),beforeB.sort());assert.equal(await count(),originalCount);
    checks.rollback='PASS: original favorite IDs/count restored; no permanent fixture relationships';
    const report={checkedAt:new Date().toISOString(),status:'PASS',mode:'real local SQL; favorite fixtures rolled back; no model calls',checks};
    writeFileSync(resolve(__dirname,'../../../docs/ai-knowledge/favorites-stage5-sql-tests.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
  }finally{await closeDB();}
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Favorite plan SQL test failed');process.exitCode=1;});
