import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
import router from '../src/modules/favorites/favorites.routes';
import { connectDB, closeDB, sql } from '../src/config/db';
import { errorHandler } from '../src/middleware/error-handler';

test('Favorites API: xác thực, vai trò, ID/offset, chống giả chủ thể, idempotency và lỗi SQL', async t => {
  const oldSecret=process.env.JWT_ACCESS_SECRET;
  const secret='favorites-test-only-secret-at-least-32-bytes';process.env.JWT_ACCESS_SECRET=secret;
  const records=new Map<number,Set<number>>([[11,new Set([1])],[22,new Set([2])]]);
  let fail=false;const queries:{owner:unknown;text:string}[]=[];
  const pool={request(){const values:Record<string,any>={};return{input(name:string,_type:unknown,value:unknown){values[name]=value;return this;},async query(text:string){
    if(text.includes('FROM dbo.users AS u')) return{recordset:[{user_id:values.userId,role_name:values.userId===33?'ADMIN':values.userId===22?'PARTNER':'USER',status:'ACTIVE'}]};
    if(text.includes('SELECT public_id FROM dbo.users'))return{recordset:[{public_id:`TEST-${values.userId}`}]};
    queries.push({owner:values.userId,text});
    if(fail)throw new Error('Simulated DB unavailable');
    if(text.includes('SELECT TOP (1) 1 AS found'))return{recordset:values.placeId===9?[]:[{found:1}]};
    const ids=records.get(values.userId)??new Set<number>();
    if(text.includes('INSERT INTO dbo.favorites')){ids.add(values.placeId);records.set(values.userId,ids);return{recordset:[]};}
    if(text.includes('DELETE FROM dbo.favorites')){ids.delete(values.placeId);return{recordset:[]};}
    if(text.includes('SELECT COUNT(*) AS total'))return{recordset:[{total:ids.size}]};
    if(text.includes('SELECT p.place_id'))return{recordset:[...ids].map(place_id=>({place_id,place_type:'RESTAURANT',name:`DB ${place_id}`,address:null,avg_rating:0,review_count:0,cover_image:null,favorited_at:new Date()}))};
    return{recordset:[...ids].map(place_id=>({place_id}))};
  }};},async close(){}};
  t.mock.method(sql,'connect',async()=>pool as never);await connectDB();
  const app=express();app.use(express.json(),cookieParser());app.use('/api/favorites',router);app.use(errorHandler);
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');const addr=server.address();assert.ok(addr&&typeof addr!=='string');const base=`http://127.0.0.1:${addr.port}/api/favorites`;
  const headers=(id:number)=>({Authorization:`Bearer ${jwt.sign({sessionType:id===33?'ADMIN':'USER'},secret,{subject:String(id),expiresIn:'5m'})}`,'Content-Type':'application/json'});
  try{
    for(const [method,suffix] of [['GET',''],['GET','/ids'],['POST',''],['DELETE','/1']])assert.equal((await fetch(base+suffix,{method})).status,401);
    assert.equal((await fetch(base+'/ids',{headers:headers(33)})).status,403);
    const list=await fetch(base+'/ids?userId=22',{headers:headers(11)});assert.equal(list.status,200);assert.equal(list.headers.get('cache-control'),'no-store');assert.deepEqual((await list.json()).data,[1]);
    const wrongOwner=await fetch(base,{method:'POST',headers:{...headers(11),'X-Favorites-Owner':'TEST-22'},body:JSON.stringify({place_id:5})});
    assert.equal(wrongOwner.status,409);assert.ok(!records.get(11)!.has(5));assert.ok(!records.get(22)!.has(5));
    const rightOwner=await fetch(base+'/ids',{headers:{...headers(11),'X-Favorites-Owner':'TEST-11'}});assert.equal(rightOwner.status,200);
    const before=queries.length;
    for(const body of [{place_id:1,userId:22},{place_id:2147483648},{place_id:1.5},{place_id:0},{place_id:'1'}])assert.equal((await fetch(base,{method:'POST',headers:headers(11),body:JSON.stringify(body)})).status,400);
    for(const query of ['?page=2147483647&limit=100','?limit=101','?page=0','?type=UNKNOWN'])assert.equal((await fetch(base+query,{headers:headers(11)})).status,400);
    assert.equal((await fetch(base+'/2147483648',{method:'DELETE',headers:headers(11)})).status,400);assert.equal(queries.length,before);
    assert.equal((await fetch(base,{method:'POST',headers:headers(11),body:JSON.stringify({place_id:9})})).status,404);
    for(let i=0;i<2;i++)assert.equal((await fetch(base,{method:'POST',headers:headers(11),body:JSON.stringify({place_id:3})})).status,200);
    assert.deepEqual([...records.get(11)!],[1,3]);
    for(let i=0;i<2;i++)assert.equal((await fetch(base+'/2',{method:'DELETE',headers:headers(11)})).status,200);
    assert.deepEqual([...records.get(22)!],[2]);
    assert.equal((await fetch(base+'/ids',{headers:headers(22)})).status,200);
    const page=await fetch(base+'?page=1&limit=12',{headers:headers(11)});assert.equal(page.status,200);const pageBody=await page.json();assert.equal(pageBody.pagination.total,2);assert.deepEqual(pageBody.data.map((p:any)=>p.place_id),[1,3]);
    fail=true;t.mock.method(console,'error',()=>{});
    const error=await fetch(base+'/ids',{headers:headers(11)});assert.equal(error.status,500);assert.equal((await error.json()).success,false);
    assert.ok(queries.filter(q=>q.text.includes('FROM dbo.favorites')||q.text.includes('INSERT INTO dbo.favorites')).every(q=>q.owner===11||q.owner===22));
  }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));await closeDB();if(oldSecret===undefined)delete process.env.JWT_ACCESS_SECRET;else process.env.JWT_ACCESS_SECRET=oldSecret;}
});
