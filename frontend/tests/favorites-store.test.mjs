import test from 'node:test';
import assert from 'node:assert/strict';
import { FavoritesStore } from '../lib/favorites-store.ts';
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return {promise,resolve,reject}; };
async function readyStore(transport = {}) {
  const store=new FavoritesStore({getIds:async()=>[1,2],set:async()=>{},...transport});
  store.changeOwner('A'); await store.reload(); return store;
}
test('Tải lỗi giữ trạng thái error, chặn sửa và có thể retry; không coi là rỗng đã xác nhận',async()=>{
  let bad=true, writes=0;
  const store=new FavoritesStore({getIds:async()=>{if(bad)throw new Error('offline');return[2];},set:async()=>{writes++;}});
  store.changeOwner('A');assert.equal(await store.reload(),false);assert.equal(store.getSnapshot().status,'error');
  assert.equal(await store.toggle(2),false);assert.equal(writes,0);
  bad=false;assert.equal(await store.reload(),true);assert.equal(store.getSnapshot().status,'ready');assert.ok(store.getSnapshot().ids.has(2));
});
test('Hai nút cùng địa điểm chỉ gửi một thao tác; thay đổi chỉ hiện sau server xác nhận',async()=>{
  const pending=deferred();let calls=0;
  const store=await readyStore({set:()=>{calls++;return pending.promise;}});
  const first=store.toggle(1);assert.ok(store.getSnapshot().pending.has(1));assert.ok(store.getSnapshot().ids.has(1));
  assert.equal(await store.toggle(1),false);assert.equal(calls,1);
  pending.resolve();assert.equal(await first,true);assert.ok(!store.getSnapshot().ids.has(1));assert.equal(store.getSnapshot().pending.size,0);
});
test('Thêm/bỏ rõ ràng không bị đảo vì local state cũ',async()=>{
  const calls=[];const store=await readyStore({getIds:async()=>[],set:async(id,saved)=>{calls.push([id,saved]);}});
  assert.equal(await store.setFavorite(20,false),true);assert.deepEqual(calls,[[20,false]]);
  await store.setFavorite(20,true);assert.ok(store.getSnapshot().ids.has(20));
  await store.setFavorite(20,false);assert.ok(!store.getSnapshot().ids.has(20));
});
test('Phản hồi thành công/lỗi của A không đổi ID, pending hoặc revision của B',async()=>{
  for(const failing of [false,true]) {
    const pending=deferred();const store=await readyStore({set:()=>pending.promise});
    const first=store.setFavorite(1,false);store.changeOwner('B');await store.reload();const before=store.getSnapshot();
    if(failing)pending.reject(new Error('A failed'));else pending.resolve();
    assert.equal(await first,false);assert.deepEqual(store.getSnapshot(),before);
  }
});
test('Tải dữ liệu A muộn không ghi đè B; request cũ được abort',async()=>{
  const old=deferred();let firstSignal;let owner='A';
  const store=new FavoritesStore({getIds:signal=>{if(owner==='A'){firstSignal=signal;return old.promise;}return Promise.resolve([99]);},set:async()=>{}});
  store.changeOwner('A');const first=store.reload();owner='B';store.changeOwner('B');await store.reload();
  assert.ok(firstSignal.aborted);old.resolve([1]);assert.equal(await first,false);assert.deepEqual([...store.getSnapshot().ids],[99]);
});
test('Mất phản hồi sau khi server ghi: báo thất bại nhưng tải lại trạng thái thực',async()=>{
  let ids=[1];const store=await readyStore({getIds:async()=>ids,set:async()=>{ids=[];throw new Error('lost response');}});
  assert.equal(await store.setFavorite(1,false),false);assert.equal(store.getSnapshot().status,'ready');assert.equal(store.getSnapshot().ids.size,0);
});
test('Tải lại trong lúc ghi được hoãn; không để snapshot đọc cũ xóa kết quả mới',async()=>{
  const pending=deferred();let ids=[1],reads=0;
  const store=await readyStore({getIds:async()=>{reads++;return ids;},set:async()=>{await pending.promise;ids=[1,3];}});
  const writing=store.setFavorite(3,true);assert.equal(await store.reload(),false);assert.equal(reads,1);
  pending.resolve();await writing;assert.equal(reads,2);assert.deepEqual([...store.getSnapshot().ids],[1,3]);
});
test('Các địa điểm khác nhau có thể ghi; phản hồi đảo thứ tự không làm mất nhau',async()=>{
  const a=deferred(),b=deferred();const store=await readyStore({set:id=>id===3?a.promise:b.promise});
  const pa=store.setFavorite(3,true),pb=store.setFavorite(4,true);b.resolve();await pb;a.resolve();await pa;
  assert.deepEqual([...store.getSnapshot().ids].sort(),[1,2,3,4]);
});
test('Logout xóa dữ liệu và chặn ghi; ID ngoài SQL INT không được gửi',async()=>{
  let calls=0;const store=await readyStore({set:async()=>{calls++;}});
  for(const id of [0,-1,1.5,2147483648,NaN])assert.equal(await store.setFavorite(id,true),false);
  store.changeOwner(null);assert.equal(store.getSnapshot().ids.size,0);assert.equal(await store.setFavorite(3,true),false);assert.equal(calls,0);
});
test('Payload IDs sai không bị biến thành danh sách rỗng thành công',async()=>{
  for(const data of [null,{},[0],['1'],[2147483648]]) {
    const store=new FavoritesStore({getIds:async()=>data,set:async()=>{}});store.changeOwner('A');
    assert.equal(await store.reload(),false);assert.equal(store.getSnapshot().status,'error');
  }
});

test('Đăng xuất rồi đăng nhập lại cùng ID vẫn bỏ qua request của phiên trước',async()=>{
  const pending=deferred();const store=await readyStore({set:()=>pending.promise});
  const oldSession=store.getSession(),write=store.setFavorite(1,false);
  store.changeOwner(null);store.changeOwner('A');await store.reload();
  assert.notEqual(store.getSession(),oldSession);
  const snapshot=store.getSnapshot();pending.reject(new Error('old session'));assert.equal(await write,false);assert.deepEqual(store.getSnapshot(),snapshot);
});
test('Hai lần tải đảo thứ tự chỉ nhận snapshot mới nhất',async()=>{
  const old=deferred();let calls=0;
  const store=new FavoritesStore({getIds:()=>++calls===1?old.promise:Promise.resolve([8]),set:async()=>{}});
  store.changeOwner('A');const first=store.reload();await store.reload();old.resolve([1]);await first;
  assert.deepEqual([...store.getSnapshot().ids],[8]);
});
