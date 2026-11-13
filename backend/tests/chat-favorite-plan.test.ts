import test from 'node:test';
import assert from 'node:assert/strict';
import { favoritePlanReply, isFavoritePlanRequest } from '../src/modules/chat/chat.favorite-plan';
import { searchPlacesForChat, type PlaceSearchRow } from '../src/modules/chat/chat.repository';
import { connectDB,closeDB,sql } from '../src/config/db';
import { processUserMessage } from '../src/modules/chat/chat.service';

const owner={userId:11,userRole:'USER' as const};
const row=(id:number,type:PlaceSearchRow['placeType'],price:number|null=0):PlaceSearchRow=>({placeId:id,name:`Địa điểm ${id}`,placeType:type,address:'Địa chỉ test',districtName:'Hải Châu',rating:4,reviewCount:3,detailUrl:`/places/${id}`,priceMin:price,priceMax:price,priceText:price===null?null:`${price}đ`,description:null,latitude:16.06+id*0.0001,longitude:108.22,roomCapacity:type==='ACCOMMODATION'?2:null,visitDurationMinutes:type==='ATTRACTION'?90:null});
const rows=[row(101,'ATTRACTION'),row(102,'ATTRACTION',50000),row(201,'RESTAURANT',40000),row(202,'RESTAURANT',50000),row(301,'ACCOMMODATION',400000)];
const prompt='Lập lịch từ địa điểm yêu thích của tôi 2 ngày 1 đêm, 2 người, tổng ngân sách 3 triệu, khởi hành ngày mai, đến 08:00, về 21:00, đi taxi';
const scheduled=(plan:NonNullable<Awaited<ReturnType<typeof favoritePlanReply>>>['travelPlan'])=>plan!.days.flatMap(d=>d.periods.flatMap(p=>p.items.flatMap(i=>i.place?[i.place.placeId]:[])));

test('Nhận yêu cầu lập lịch, tham chiếu danh sách; không chiếm câu xem yêu thích',()=>{
  assert.ok(isFavoritePlanRequest(prompt));assert.ok(isFavoritePlanRequest('Lên lịch từ danh sách này',true));
  assert.equal(isFavoritePlanRequest('Xem địa điểm yêu thích của tôi'),false);
  assert.equal(isFavoritePlanRequest('Lên lịch 2 ngày tại Đà Nẵng'),false);
});

test('Khách/admin/thiếu vai trò/người khác không đọc dữ liệu',async()=>{
  const noRead=async()=>{throw new Error('must not read');};
  assert.match((await favoritePlanReply(prompt,{},undefined,false,noRead))!.content,/đăng nhập/);
  assert.match((await favoritePlanReply(prompt,{userId:33,userRole:'ADMIN'},undefined,false,noRead))!.content,/người dùng và đối tác/);
  assert.match((await favoritePlanReply(prompt.replace('của tôi','của Lan'),owner,undefined,false,noRead))!.content,/không dùng danh sách của người khác/);
});

test('Thiếu điều kiện hỏi trước, bổ sung nhiều lượt giữ ngày/khách/tiền',async()=>{
  let calls=0;const search=async()=>{calls++;return rows;};
  const first=await favoritePlanReply('Lập lịch từ yêu thích của tôi',owner,undefined,false,search);
  assert.equal(first!.travelPlan,undefined);assert.equal(first!.questions!.length,3);assert.equal(calls,0);
  const second=await favoritePlanReply('2 ngày 1 đêm, 2 người, tổng 3 triệu',owner,first!.state,false,search);
  assert.equal(second!.travelPlan,undefined);assert.ok(second!.questions?.some(q=>q.includes('ngày nào')));assert.equal(calls,0);
  const third=await favoritePlanReply('Khởi hành ngày mai',owner,second!.state,false,search);
  assert.ok(third!.travelPlan,third!.content);assert.equal(third!.travelPlan!.guestCount,2);assert.equal(third!.travelPlan!.budget,3000000);assert.equal(third!.travelPlan!.dayCount,2);
});

test('Lập từ toàn bộ nguồn yêu thích hiện tại; public ID, source và khoản chưa biết đúng',async()=>{
  const calls:unknown[]=[];
  const reply=await favoritePlanReply(prompt,owner,undefined,false,async input=>{calls.push(input);return rows;});
  assert.ok(reply!.travelPlan,reply!.content);assert.deepEqual(calls,[{favoriteUserId:11,limit:501,strictKeywords:true,partySize:2}]);
  assert.equal(reply!.travelPlan!.source,'FAVORITES');assert.ok(scheduled(reply!.travelPlan).every(id=>rows.some(p=>p.placeId===id)));
  assert.ok(reply!.travelPlan!.days.every(day=>day.periods.length>0));
  assert.ok(reply!.travelPlan!.notes.some(note=>note.includes('yêu thích không bị thay đổi')));
  for(const group of reply!.travelPlan!.groups)for(const p of group.places)assert.equal(p.detailUrl,`/places/${p.placeId}`);
});

test('Rỗng và lỗi DB không fallback catalog, không tạo lịch giả',async()=>{
  const empty=await favoritePlanReply(prompt,owner,undefined,false,async()=>[]);assert.equal(empty!.travelPlan,undefined);assert.match(empty!.content,/không tự lấy nơi ngoài/);
  const failed=await favoritePlanReply(prompt,owner,undefined,false,async()=>{throw new Error('SQL secret');});assert.equal(failed!.travelPlan,undefined);assert.match(failed!.content,/lỗi truy cập/);assert.ok(!failed!.content.includes('secret'));
  const tooMany=await favoritePlanReply(prompt,owner,undefined,false,async()=>Array.from({length:501},(_,i)=>row(i+1,'ATTRACTION')));assert.equal(tooMany!.travelPlan,undefined);assert.match(tooMany!.content,/hơn 500/);
});

test('Thiếu quán/chỗ ở và giá được báo rõ; không tự thêm địa điểm',async()=>{
  const reply=await favoritePlanReply(prompt,owner,undefined,false,async()=>[row(101,'ATTRACTION',null)]);
  assert.ok(reply!.travelPlan,reply!.content);assert.equal(reply!.travelPlan!.costs.tickets,null);
  assert.ok(reply!.travelPlan!.notes.some(n=>n.includes('Chưa có quán ăn')));assert.ok(reply!.travelPlan!.notes.some(n=>n.includes('Chưa có lưu trú')));
  assert.deepEqual([...new Set(scheduled(reply!.travelPlan))],[101]);
});

test('Thời gian/đi bộ/loại trừ và nơi chưa xếp không bị ép vào lịch',async()=>{
  const extra={...row(999,'ATTRACTION'),name:'Bà Nà Hills',visitDurationMinutes:90};
  const reply=await favoritePlanReply(prompt+'; không đi Bà Nà',owner,undefined,false,async()=>[...rows,extra]);
  assert.ok(reply!.travelPlan,reply!.content);assert.ok(!scheduled(reply!.travelPlan).includes(999));
  assert.ok(reply!.travelPlan!.groups.find(g=>g.title.includes('chưa xếp'))?.places.some(p=>p.placeId===999));
  const walk=await favoritePlanReply(prompt.replace('đi taxi','đi bộ'),owner,undefined,false,async()=>[{...row(101,'ATTRACTION'),latitude:null,longitude:null}]);
  assert.equal(walk!.travelPlan,undefined);assert.match(walk!.content,/chưa phù hợp/);
});

test('Không tạo lịch vượt ngân sách đã biết, ngày quá phạm vi hoặc sai số đêm',async()=>{
  const over=await favoritePlanReply(prompt.replace('3 triệu','100 nghìn'),owner,undefined,false,async()=>[row(101,'ATTRACTION',1000000)]);
  assert.equal(over!.travelPlan,undefined);assert.match(over!.content,/vượt tổng ngân sách/);
  const invalid=await favoritePlanReply(prompt.replace('2 ngày 1 đêm','4 ngày 3 đêm'),owner,undefined,false,async()=>rows);assert.equal(invalid!.travelPlan,undefined);assert.match(invalid!.content,/1–3 ngày/);
  const nights=await favoritePlanReply(prompt.replace('2 ngày 1 đêm','2 ngày 3 đêm'),owner,undefined,false,async()=>rows);assert.equal(nights!.travelPlan,undefined);assert.match(nights!.content,/chưa khớp/);
});

test('Lần lập lại đọc dữ liệu mới; đổi điểm không lén lấy nguồn ngoài',async()=>{
  const first=await favoritePlanReply(prompt,owner,undefined,false,async()=>rows);
  const rebuilt=await favoritePlanReply('Lập lại lịch từ yêu thích của tôi',owner,first!.state,false,async()=>[rows[0]!]);
  assert.ok(rebuilt!.travelPlan,rebuilt!.content);assert.equal(rebuilt!.travelPlan!.budget,3000000);
  const removed=await favoritePlanReply('Đổi ngân sách tổng thành 4 triệu',owner,first!.state,false,async()=>[rows[0]!]);
  assert.ok(removed!.travelPlan,removed!.content);assert.deepEqual([...new Set(scheduled(removed!.travelPlan))],[101]);
  const edit=await favoritePlanReply('Thay điểm tham quan bằng nơi khác',owner,first!.state,false,async()=>{throw new Error('must not read');});
  assert.equal(edit!.travelPlan,undefined);assert.match(edit!.content,/chưa thay điểm/);
});

test('SQL planner dùng EXISTS theo owner và public place ID; tham số sai không thành tìm toàn bộ',async t=>{
  let statement='';let bound:Record<string,unknown>={};
  const pool={request(){const params:Record<string,unknown>={};return{input(n:string,_t:unknown,v:unknown){params[n]=v;return this;},async query(text:string){statement=text;bound=params;return{recordset:[]};}};},async close(){}};
  t.mock.method(sql,'connect',async()=>pool as never);await connectDB();t.mock.method(console,'warn',()=>{});
  try{await searchPlacesForChat({favoriteUserId:11,limit:501,strictKeywords:true});assert.equal(bound.favoriteUserId,11);assert.match(statement,/EXISTS \(SELECT 1 FROM dbo.favorites f WHERE f.place_id=p.place_id AND f.user_id=@favoriteUserId\)/);assert.match(statement,/p.status = 'ACTIVE'/);assert.equal(bound.limit,501);await assert.rejects(searchPlacesForChat({favoriteUserId:0}));}finally{await closeDB();}
});

test('Chat guest yêu cầu lập lịch không đi qua nhánh danh sách/AI thông thường',async()=>{
  const result=await processUserMessage({guestId:'favorite-plan-stage5',message:prompt});assert.equal(result.message.travelPlan,undefined);assert.match(result.message.content,/đăng nhập/);assert.ok(result.message.actionLink?.url.includes('dang-nhap'));
});

test('Tổng dự trù gồm tiền ăn/dự phòng, không đổi knownSubtotal thành tiền đã chi',async()=>{
  const reply=await favoritePlanReply(prompt,owner,undefined,false,async()=>rows);
  const costs=reply!.travelPlan!.costs;
  assert.equal(costs.projectedSubtotal,costs.knownSubtotal!+(costs.foodAllowance??0)+(costs.transportAllowance??0)+(costs.contingencyAllowance??0));
  assert.equal(costs.remaining,3000000-costs.projectedSubtotal!);
});

test('Điều kiện dị ứng đã lưu hoặc không tải được profile không bị bỏ qua',async()=>{
  const reply=await favoritePlanReply(prompt,owner,undefined,false,async()=>rows,{dietaryRestricted:true,notice:'Chưa tải được điều kiện ăn uống.'});
  assert.ok(reply!.travelPlan,reply!.content);
  const foodIds=rows.filter(r=>r.placeType==='RESTAURANT').map(r=>r.placeId);
  assert.ok(scheduled(reply!.travelPlan).every(id=>!foodIds.includes(id)));
  assert.ok(reply!.travelPlan!.notes.includes('Chưa tải được điều kiện ăn uống.'));
  const pending=await favoritePlanReply('Lập lịch từ yêu thích, tôi dị ứng hải sản và không đi Bà Nà',owner,undefined,false,async()=>rows);
  const completed=await favoritePlanReply('2 ngày 1 đêm, 2 người, tổng 3 triệu, ngày mai',owner,pending!.state,false,async()=>rows);
  assert.ok(completed!.travelPlan,completed!.content);
  assert.ok(scheduled(completed!.travelPlan).every(id=>!foodIds.includes(id)));
  assert.ok(completed!.state?.excludedNames?.some(name=>name === 'Bà Nà'));
});

test('Chat xác thực giữ brief qua lịch sử và trả DTO lịch thật, không lọt sang đọc danh sách',async t=>{
  const history:{sender:string;content:string}[]=[];let searches=0;
  const pool={request(){const params:Record<string,unknown>={};return{input(n:string,_t:unknown,v:unknown){params[n]=v;return this;},async query(text:string){
    if(text.includes('SELECT session_id FROM dbo.chat_sessions'))return{recordset:[{session_id:4}]};
    if(text.includes('SELECT sender, content FROM'))return{recordset:[...history]};
    if(text.includes('INSERT INTO dbo.chat_messages')){history.push({sender:params.sender as string,content:params.content as string});return{recordset:[{message_id:BigInt(history.length)}]};}
    if(text.includes('SELECT * FROM (')&&text.includes('dbo.places p')){
      searches++;assert.equal(params.favoriteUserId,11);
      return{recordset:rows.map(r=>({place_id:r.placeId,name:r.name,place_type:r.placeType,address:r.address,description:null,district_name:r.districtName,avg_rating:r.rating,review_count:r.reviewCount,image_url:null,price_min:r.priceMin,price_max:r.priceMax,latitude:r.latitude,longitude:r.longitude,room_capacity:r.roomCapacity,visit_duration_minutes:r.visitDurationMinutes}))};
    }
    return{recordset:[]};
  }};},async close(){}};
  t.mock.method(sql,'connect',async()=>pool as never);await connectDB();
  try{
    const input={...owner,sessionId:4};
    const first=await processUserMessage({...input,message:'Lập lịch từ yêu thích của tôi'});assert.equal(first.message.travelPlan,undefined);assert.equal(first.message.needsClarification,true);assert.equal(searches,0);
    const next=await processUserMessage({...input,message:'2 ngày 1 đêm, 2 người, tổng ngân sách 3 triệu, ngày mai'});
    assert.ok(next.message.travelPlan,next.message.content);assert.equal(next.message.intent,'ITINERARY');assert.equal(next.message.travelPlan!.source,'FAVORITES');assert.equal(next.message.travelPlan!.guestCount,2);assert.equal(searches,1);
  }finally{await closeDB();}
});
