import test from 'node:test';
import assert from 'node:assert/strict';
import {favoriteConsultReply,favoriteDistanceKm,isFavoriteConsultRequest} from '../src/modules/chat/chat.favorite-consult';
import type {PlaceSearchRow} from '../src/modules/chat/chat.repository';
import {connectDB,closeDB,sql} from '../src/config/db';
import {processUserMessage} from '../src/modules/chat/chat.service';
const owner={userId:11,userRole:'USER' as const};
const make=(id:number,name:string,type:PlaceSearchRow['placeType'],price:number|null,lat:number|null=16):PlaceSearchRow=>({placeId:id,name,placeType:type,address:'Địa chỉ kiểm thử',rating:4.5,reviewCount:5,detailUrl:`/places/${id}`,priceMin:price,priceMax:price,priceText:price===null?null:`${price}đ`,description:null,latitude:lat,longitude:108});
const a=make(1,'Khách sạn A','ACCOMMODATION',500000);
const b=make(2,'Khách sạn B','ACCOMMODATION',300000,16.01);
const food=make(3,'Quán C','RESTAURANT',30000,16.02);
const far=make(4,'Điểm D','ATTRACTION',0,16.08);
const missing=make(5,'Điểm E','ATTRACTION',null,null);
const rows=[a,b,food,far,missing];
const search=async()=>rows;

test('Nhận tư vấn yêu thích và ngữ cảnh; không chiếm planner hoặc tìm kiếm chung',()=>{
  assert.ok(isFavoriteConsultRequest('So sánh A và B trong yêu thích'));
  assert.ok(isFavoriteConsultRequest('Tìm quán ăn gần Khách sạn A',true));
  assert.equal(isFavoriteConsultRequest('Tìm quán ăn gần biển'),false);
  assert.equal(isFavoriteConsultRequest('Lập lịch từ yêu thích gần biển'),false);
  assert.equal(isFavoriteConsultRequest('Đổi ngân sách gần 3 triệu',true),false);
});

test('Khách/admin/người khác không đọc SQL riêng',async()=>{
  const forbidden=async()=>{throw new Error('must not read');};
  assert.match((await favoriteConsultReply('So sánh A và B trong yêu thích',{},undefined,false,forbidden))!.content,/đăng nhập/);
  assert.match((await favoriteConsultReply('So sánh A và B trong yêu thích',{userId:33,userRole:'ADMIN'},undefined,false,forbidden))!.content,/người dùng và đối tác/);
  assert.match((await favoriteConsultReply('So sánh A và B trong yêu thích của Lan',owner,undefined,false,forbidden))!.content,/không đọc danh sách người khác/);
});

test('So sánh đúng hai nơi còn yêu thích, giữ cặp bằng ID và đọc lại khi hỏi rẻ hơn',async()=>{
  const calls:unknown[]=[];const read=async(input:unknown)=>{calls.push(input);return rows;};
  const first=await favoriteConsultReply('So sánh Khách sạn A và Khách sạn B trong danh sách yêu thích của tôi',owner,undefined,false,read);
  assert.deepEqual(first!.comparison!.places.map(p=>p.placeId),[1,2]);
  const next=await favoriteConsultReply('Nơi nào rẻ hơn?',owner,first!.state,false,read);
  assert.match(next!.content,/Khách sạn B có mức giá thấp nhất/);assert.match(next!.content,/không phải so cùng/);
  assert.deepEqual(calls,[{favoriteUserId:11,limit:501,strictKeywords:true},{favoriteUserId:11,limit:501,strictKeywords:true}]);
  const near=await favoriteConsultReply('Nơi nào gần hơn?',{...owner,location:{latitude:16,longitude:108,radiusKm:5}},first!.state,false,search);
  assert.match(near!.content,/Khách sạn A gần hơn/);assert.match(near!.content,/đường chim bay/);
});

test('Tên trùng, cùng một nơi, đã bỏ lưu/ẩn đều không tự so nơi khác',async()=>{
  const prompt='So sánh Khách sạn A và Khách sạn B trong yêu thích';
  for(const resultRows of [[a],[a,{...b,placeId:22,name:'Khách sạn B cơ sở 2'},{...b,placeId:23,name:'Khách sạn B cơ sở 3'}]]){
    const result=await favoriteConsultReply(prompt,owner,undefined,false,async()=>resultRows);assert.equal(result!.comparison,undefined);assert.match(result!.content,/chi nhánh/);
  }
  const same=await favoriteConsultReply('So sánh Khách sạn A và Khách sạn A trong yêu thích',owner,undefined,false,search);assert.equal(same!.comparison,undefined);
  const removed=await favoriteConsultReply('Nơi nào rẻ hơn?',owner,{mode:'compare',pair:[1,2]},false,async()=>[a]);assert.equal(removed!.comparison,undefined);
});

test('Giá khác loại hoặc thiếu giá không kết luận rẻ hơn; dữ liệu thẻ giữ nguyên',async()=>{
  const mixed=await favoriteConsultReply('Nơi nào rẻ hơn?',owner,{mode:'compare',pair:[1,3]},false,search);assert.match(mixed!.content,/khác loại/);
  const unknown=await favoriteConsultReply('Nơi nào rẻ hơn?',owner,{mode:'compare',pair:[1,2]},false,async()=>[a,{...b,priceMin:null,priceText:null}]);assert.match(unknown!.content,/thiếu giá/);
});

test('Haversine đúng đơn vị, trùng tọa độ bằng 0; tìm gần có thứ tự và loại thiếu tọa độ',async()=>{
  assert.equal(favoriteDistanceKm({latitude:0,longitude:0},{latitude:0,longitude:0}),0);
  assert.ok(Math.abs(favoriteDistanceKm({latitude:0,longitude:0},{latitude:1,longitude:0})-111.195)<0.01);
  const result=await favoriteConsultReply('Tìm địa điểm yêu thích gần Khách sạn A 2km',owner,undefined,false,search);
  assert.deepEqual(result!.places!.map(p=>p.placeId),[2]);assert.ok(result!.places![0]!.distanceKm!>1);assert.match(result!.content,/đường chim bay/);assert.match(result!.content,/1 nơi thiếu tọa độ/);
});

test('Bán kính, mốc không có tọa độ và tên trùng không đoán từ tâm quận',async()=>{
  const invalid=await favoriteConsultReply('Tìm địa điểm yêu thích gần Khách sạn A 3km',owner,undefined,false,search);assert.equal(invalid!.places,undefined);assert.match(invalid!.content,/2km, 5km hoặc 10km/);
  const noCoords=await favoriteConsultReply('Tìm địa điểm yêu thích gần Điểm E',owner,undefined,false,search);assert.equal(noCoords!.places,undefined);assert.match(noCoords!.content,/thiếu tọa độ/);
  const notSaved=await favoriteConsultReply('Tìm địa điểm yêu thích gần Nơi không lưu',owner,undefined,false,search);assert.equal(notSaved!.places,undefined);assert.match(notSaved!.content,/chi nhánh/);
});

test('GPS chỉ dùng khi input có tọa độ; không lưu tọa độ vào cursor',async()=>{
  const prompt='Tìm địa điểm yêu thích quanh vị trí tôi 2km';
  assert.match((await favoriteConsultReply(prompt,owner,undefined,false,search))!.content,/cho phép chia sẻ/);
  const withLocation={...owner,location:{latitude:16,longitude:108,radiusKm:2 as const}};
  const first=await favoriteConsultReply(prompt,withLocation,undefined,false,search);assert.ok(first!.places?.length);assert.equal(first!.state?.gps,true);assert.ok(!JSON.stringify(first!.state).includes('latitude'));
  const again=await favoriteConsultReply('Gần hơn?',withLocation,first!.state,false,search);assert.ok(again!.places?.length);
});

test('Thay thế chỉ cùng loại, loại chính mốc, lọc giá có căn cứ và không sửa lịch',async()=>{
  const result=await favoriteConsultReply('Tìm nơi thay thế Khách sạn A rẻ hơn trong yêu thích',owner,undefined,false,search);
  assert.deepEqual(result!.places!.map(p=>p.placeId),[2]);assert.match(result!.content,/chưa sửa lịch trình/);assert.equal((result as any).travelPlan,undefined);
  const noMatch=await favoriteConsultReply('Tìm nơi thay thế Khách sạn B rẻ hơn trong yêu thích',owner,undefined,false,search);assert.equal(noMatch!.places,undefined);assert.match(noMatch!.content,/Chưa có/);
  const next=await favoriteConsultReply('Còn lựa chọn khác?',owner,result!.state,false,search);assert.equal(next!.places,undefined);
});

test('Lọc quán gần mốc và điều kiện ăn uống không bị bỏ qua',async()=>{
  const result=await favoriteConsultReply('Tìm quán ăn yêu thích gần Khách sạn A 5km',owner,undefined,false,search);assert.deepEqual(result!.places!.map(p=>p.placeId),[3]);
  const restricted=await favoriteConsultReply('Tìm quán ăn yêu thích gần Khách sạn A',owner,undefined,false,search,{dietaryRestricted:true});assert.equal(restricted!.places,undefined);assert.match(restricted!.content,/dị ứng/);
  const noFood=await favoriteConsultReply('Tìm địa điểm yêu thích gần Khách sạn A',owner,undefined,false,async()=>[a,food],{dietaryRestricted:true});assert.equal(noFood!.places,undefined);assert.match(noFood!.content,/kiêng ăn\/dị ứng/);
});

test('Rỗng/lỗi DB/hơn 500 nơi không giả kết quả; không mở rộng nguồn ngầm',async()=>{
  const prompt='Tìm nơi thay thế Khách sạn A trong yêu thích';
  assert.match((await favoriteConsultReply(prompt,owner,undefined,false,async()=>[]))!.content,/Chưa có/);
  assert.match((await favoriteConsultReply(prompt,owner,undefined,false,async()=>{throw new Error('secret SQL');}))!.content,/lỗi truy cập/);
  assert.match((await favoriteConsultReply(prompt,owner,undefined,false,async()=>Array(501).fill(a)))!.content,/hơn 500/);
  assert.match((await favoriteConsultReply('Tìm nơi thay thế Khách sạn A ngoài yêu thích',owner,undefined,false,async()=>{throw new Error('must not read');}))!.content,/chưa tự thêm/);
});

test('Luồng chat xác thực lưu cặp ID nội bộ, follow-up rẻ hơn vẫn scoped favorites',async t=>{
  const history:{sender:string;content:string}[]=[];let reads=0;
  const pool={request(){const params:Record<string,unknown>={};return{input(n:string,_t:unknown,v:unknown){params[n]=v;return this;},async query(text:string){
    if(text.includes('SELECT session_id FROM dbo.chat_sessions'))return{recordset:[{session_id:4}]};
    if(text.includes('SELECT sender, content FROM'))return{recordset:[...history]};
    if(text.includes('INSERT INTO dbo.chat_messages')){history.push({sender:params.sender as string,content:params.content as string});return{recordset:[{message_id:BigInt(history.length)}]};}
    if(text.includes('SELECT * FROM (')&&text.includes('dbo.places p')){reads++;assert.equal(params.favoriteUserId,11);return{recordset:[a,b].map(p=>({place_id:p.placeId,name:p.name,place_type:p.placeType,avg_rating:p.rating,review_count:p.reviewCount,address:p.address,price_min:p.priceMin,price_max:p.priceMax,latitude:p.latitude,longitude:p.longitude}))};}
    return{recordset:[]};
  }};},async close(){}};
  t.mock.method(sql,'connect',async()=>pool as never);await connectDB();
  try{const input={...owner,sessionId:4};const first=await processUserMessage({...input,message:'So sánh Khách sạn A và Khách sạn B trong yêu thích'});assert.equal(first.message.intent,'COMPARE');assert.ok(first.message.comparison);const second=await processUserMessage({...input,message:'Nơi nào rẻ hơn?'});assert.ok(second.message.comparison);assert.match(second.message.content,/Khách sạn B/);assert.equal(reads,2);}finally{await closeDB();}
});
