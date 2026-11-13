import test from 'node:test';
import assert from 'node:assert/strict';
import { favoritesReply, favoritesRequest } from '../src/modules/chat/chat.favorites';
import { readAdvisorTurn, writeAdvisorTurn } from '../src/modules/chat/chat.advisor-state';
import { connectDB, closeDB, sql } from '../src/config/db';
import { processUserMessage } from '../src/modules/chat/chat.service';

const record = (id: number) => ({ place_id: id, place_type: 'RESTAURANT' as const, name: `Quán ${id}`, address: null, avg_rating: 4.5, review_count: 2, cover_image: null, favorited_at: new Date() });
const owner = { userId: 11, userRole: 'USER' as const };
const page = (data = [record(93)], total = data.length) => ({ data, total, page: 1, limit: 6, totalPages: Math.ceil(total / 6) });

test('Nhận đúng danh sách bấm tim; không nhầm khẩu vị, menu hoặc câu nói thích', () => {
  for (const question of ['Xem địa điểm yêu thích của tôi', 'Liệt kê quán ăn yêu thích của tôi', 'Tôi đã lưu những địa điểm nào?', 'Xem danh sách yêu thích', 'Địa điểm đã lưu', 'Xem các quán tôi đã lưu', 'Đã lưu những địa điểm nào?', 'Có bao nhiêu nơi yêu thích của tôi?']) assert.ok(favoritesRequest(question), question);
  for (const question of ['Tôi thích ăn cay', 'Xem sở thích đã lưu của tôi', 'Món ăn yêu thích của người Đà Nẵng là gì?', 'Gợi ý quán ăn', 'Xem tiếp', 'Cho xem trang 2']) assert.equal(favoritesRequest(question), null, question);
  assert.equal(favoritesRequest('Chỉ quán ăn', {type:'ALL',page:2})?.type, 'RESTAURANT');
  assert.equal(favoritesRequest('Xem điểm tham quan yêu thích của tôi')?.type, 'ATTRACTION');
  assert.deepEqual(favoritesRequest('Xem tiếp danh sách yêu thích', {type:'ACCOMMODATION',page:2}), {type:'ACCOMMODATION',page:3});
  assert.deepEqual(favoritesRequest('Xem thêm', {type:'RESTAURANT',page:1}), {type:'RESTAURANT',page:2});
});

test('Khách, admin và thiếu vai trò không truy vấn dữ liệu riêng', async () => {
  const read = async () => { throw new Error('must not read'); };
  assert.match((await favoritesReply('Xem danh sách yêu thích', {}, undefined, read))!.content, /đăng nhập/);
  assert.equal((await favoritesReply('Xem danh sách yêu thích', {}, undefined, read))!.actionLink?.url, '/dang-nhap?redirect=%2Fchat');
  for (const identity of [{ userId:11 }, {userId:33,userRole:'ADMIN' as const}]) assert.match((await favoritesReply('Xem danh sách yêu thích',identity,undefined,read))!.content,/người dùng và đối tác/);
});

test('SQL chỉ nhận chủ thể xác thực, filter và phân trang; không lấy ID trong prompt', async () => {
  const calls: unknown[] = [];
  const result = await favoritesReply('Xem trang 2 danh sách quán ăn yêu thích của tôi, userId=22',owner,undefined,async input=>{calls.push(input);return page([record(93)],7);});
  assert.deepEqual(calls,[{userId:11,type:'RESTAURANT',page:2,limit:6}]);
  assert.deepEqual(result!.places?.map(p=>p.placeId),[93]);
  assert.equal(result!.places![0]!.detailUrl,'/places/93');
  assert.equal(result!.places![0]!.priceText,undefined);
  assert.match(result!.content,/Trang 2\/2/);
  assert.ok(result!.quickReplies.some(q=>q.includes('trang 1')));
});

test('Đối tác đọc được dữ liệu của chính mình; không truy vấn người khác theo lời yêu cầu', async () => {
  const calls:number[]=[];
  const read = async(input:{userId:number})=>{calls.push(input.userId);return page();};
  assert.ok((await favoritesReply('Xem yêu thích của tôi',{userId:22,userRole:'PARTNER'},undefined,read))?.places?.length);
  assert.match((await favoritesReply('Xem danh sách yêu thích của tài khoản khác',owner,undefined,read))!.content,/không đọc/);
  assert.deepEqual(calls,[22]);
});

test('Rỗng/ẩn không lộ tên hay ID; lỗi DB không giả danh sách rỗng',async()=>{
  const empty=await favoritesReply('Xem lưu trú yêu thích của tôi',owner,undefined,async()=>page([],0));
  assert.equal(empty!.places,undefined); assert.match(empty!.content,/đang công khai/);assert.match(empty!.content,/bị ẩn/);
  const failed=await favoritesReply('Xem yêu thích của tôi',owner,undefined,async()=>{throw new Error('secret SQL detail');});
  assert.match(failed!.content,/không có nghĩa danh sách.*trống/);assert.ok(!failed!.content.includes('secret'));assert.equal(failed!.places,undefined);
});

test('Bảo vệ số trang, xử lý trang đã mất sau bỏ lưu và đọc lại mỗi lần',async()=>{
  let calls=0;const read=async()=>{calls++;return page([record(1)],1);};
  for(const question of ['Xem trang 0 danh sách yêu thích','Xem trang -1 danh sách yêu thích','Xem trang 1,5 danh sách yêu thích','Xem trang 2147483648 danh sách yêu thích']) assert.match((await favoritesReply(question,owner,undefined,read))!.content,/không hợp lệ/);
  assert.equal(calls,0);
  const out=await favoritesReply('Xem trang 5 danh sách yêu thích',owner,undefined,read);
  assert.match(out!.content,/Trang 5 không còn dữ liệu/);assert.equal(out!.places,undefined);
  assert.ok(out!.quickReplies[0]!.includes('trang 1'));
  const changed=await favoritesReply('Xem địa điểm yêu thích của tôi',owner,undefined,async()=>page([],1));
  assert.match(changed!.content,/vừa thay đổi/);
  const fresh=await favoritesReply('Xem địa điểm yêu thích của tôi',owner,undefined,async()=>page([],0));
  assert.equal(fresh!.places,undefined);
});

test('Chỉ đọc danh sách; không ghi favorites hoặc tự nhận đã lập lịch',async()=>{
  const read=async()=>page();
  for(const question of ['Hãy lưu quán này vào yêu thích của tôi','Xóa tất cả địa điểm yêu thích của tôi','Thêm quán này vào yêu thích']) assert.match((await favoritesReply(question,owner,undefined,async()=>{throw new Error('must not read');}))!.content,/chưa thay đổi/);
  const result=await favoritesReply('Lập lịch từ các địa điểm yêu thích của tôi',owner,undefined,read);
  assert.match(result!.content,/chưa tạo lịch trình/);
});

test('Cursor chỉ nằm trong trạng thái AI nội bộ và giữ ngữ cảnh chuyến đi',()=>{
  const serialized=writeAdvisorTurn('Trang 2',{stayId:4,excludedStayIds:[2],favorites:{type:'ATTRACTION',page:2}});
  const turn=readAdvisorTurn(serialized);
  assert.equal(turn.content,'Trang 2');assert.deepEqual(turn.state?.favorites,{type:'ATTRACTION',page:2});assert.equal(turn.state?.stayId,4);
});

test('Luồng processUserMessage: khách nhận yêu cầu đăng nhập, không đọc DB hay gọi mô hình',async()=>{
  const response=await processUserMessage({guestId:'favorites-stage4-guest',message:'Xem địa điểm yêu thích của tôi'});
  assert.equal(response.message.intent,'FAVORITES');assert.equal(response.message.places,undefined);assert.match(response.message.content,/đăng nhập/);
});

test('Luồng chat xác thực: phân trang qua lịch sử, scope SQL, đọc mới và không tìm catalog',async t=>{
  const history:{sender:string;content:string}[]=[];
  const calls:{text:string;params:Record<string,unknown>}[]=[];
  let total=7;let broken=false;
  const pool={request(){const params:Record<string,unknown>={};return{input(name:string,_type:unknown,value:unknown){params[name]=value;return this;},async query(text:string){
    calls.push({text,params});
    if(text.includes('SELECT session_id FROM dbo.chat_sessions'))return{recordset:[{session_id:4}]};
    if(text.includes('SELECT sender, content FROM'))return{recordset:[...history]};
    if(text.includes('INSERT INTO dbo.chat_messages')){history.push({sender:params.sender as string,content:params.content as string});return{recordset:[{message_id:BigInt(history.length)}]};}
    if(text.includes('FROM dbo.favorites AS f')){
      if(broken)throw new Error('DB offline');
      assert.equal(params.userId,11);assert.match(text,/p.status = 'ACTIVE'/);
      if(text.includes('COUNT(*)'))return{recordset:[{total}]};
      assert.match(text,/ORDER BY f.created_at DESC, f.id DESC/);
      return{recordset:total?[record(Number(params.offset)===6?94:93)]:[]};
    }
    if(text.includes('dbo.menu_items'))return{recordset:[]};
    if(text.includes('dbo.places')&&!text.includes('dbo.favorites'))throw new Error('unexpected catalog search');
    return{recordset:[]};
  }};},async close(){}};
  t.mock.method(sql,'connect',async()=>pool as never);await connectDB();
  try{
    const input={...owner,sessionId:4};
    const first=await processUserMessage({...input,message:'Xem quán ăn yêu thích của tôi'});
    assert.equal(first.message.intent,'FAVORITES');assert.equal(first.message.places![0]!.placeId,93);
    const next=await processUserMessage({...input,message:'Xem tiếp'});
    assert.equal(next.message.places![0]!.placeId,94);assert.match(next.message.content,/Trang 2\/2/);
    total=0;
    const fresh=await processUserMessage({...input,message:'Xem danh sách yêu thích của tôi'});
    assert.equal(fresh.message.places,undefined);assert.match(fresh.message.content,/Chưa có/);
    broken=true;
    const failed=await processUserMessage({...input,message:'Xem danh sách yêu thích của tôi'});
    assert.match(failed.message.content,/lỗi truy cập dữ liệu/);
    assert.ok(calls.filter(c=>c.text.includes('dbo.favorites')).every(c=>c.params.userId===11));
  }finally{await closeDB();}
});
