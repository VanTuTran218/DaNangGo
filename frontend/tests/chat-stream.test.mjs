import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readChatStream } from '../lib/chat-stream.ts';
import { chatStorageKeys } from '../lib/chat-storage.ts';

test('SSE giữ thông tin giờ đến/về, nhóm trẻ em và buổi không xếp hoạt động',async()=>{
  const travelPlan={title:'Lịch theo giờ đến',dayCount:3,preferences:{arrivalTime:'18:30',departureTime:'09:00',transport:'taxi',adults:2,children:1,childAges:[6],hasChildren:true},questions:[],days:[{day:1,periods:[{label:'Sáng',time:'Không xếp hoạt động',items:[]},{label:'Tối',time:'18:30–21:00',items:[{kind:'arrival',title:'18:30 · Đến Đà Nẵng',detail:'Thủ tục và nghỉ'}]}]}]};
  const response={sessionId:7,message:{id:'arrival',sender:'AI',content:'Lịch theo giờ đến/về',travelPlan,createdAt:'2026-11-05'}};
  const bytes=new TextEncoder().encode(`data: ${JSON.stringify({type:'result',result:response})}\n\n`);
  const body=new ReadableStream({start(controller){controller.enqueue(bytes);controller.close();}});
  const received=await readChatStream(body);assert.deepEqual(received.message.travelPlan,travelPlan);
});

const result = { sessionId: 7, message: { id: 'answer', sender: 'AI', content: 'Gợi ý quán ăn Đà Nẵng', createdAt: '2026-11-03' } };
function stream(text, size = 1) {
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream({ start(controller) { for (let i = 0; i < bytes.length; i += size) controller.enqueue(bytes.slice(i, i + size)); controller.close(); } });
}

test('SSE giữ nguyên lịch trình theo buổi và liên kết địa điểm thật',async()=>{
  const plan={title:'Lịch 3 ngày',dayCount:3,guestCount:2,budget:5500000,days:[{day:1,periods:[{label:'Sáng',items:[{title:'Check-in',place:{placeId:102,placeType:'ATTRACTION',detailUrl:'/places/102'}}]}]}]};
  const response={...result,message:{...result.message,travelPlan:plan}};
  const data=await readChatStream(stream(`data: ${JSON.stringify({type:'result',result:response})}\n\n`,13));
  assert.deepEqual(data.message.travelPlan,plan);
});
test('SSE giữ tiếng Việt và ranh giới CRLF khi từng byte đến riêng lẻ', async () => {
  const events = [];
  const text = ': heartbeat\r\n\r\ndata: {"type":"status","text":"Đang tìm địa điểm…"}\r\n\r\ndata: '+JSON.stringify({ type: 'result', result })+'\r\n\r\n';
  assert.deepEqual(await readChatStream(stream(text), event => events.push(event)), result);
  assert.equal(events[0].text, 'Đang tìm địa điểm…');
});
test('SSE gửi thẻ database trước câu trả lời đã xác thực', async () => {
  const events = [];
  const places = [{ placeId: 10, name: 'Quán A', priceText: '30.000–50.000đ/món' }];
  const text = `data: ${JSON.stringify({ type: 'candidates', places })}\n\ndata: ${JSON.stringify({ type: 'result', result })}`;
  await readChatStream(stream(text, 20), event => events.push(event));
  assert.deepEqual(events, [{ type: 'candidates', places }]);
});
test('SSE bị ngắt hoặc báo lỗi không sinh địa điểm giả dự phòng', async () => {
  await assert.rejects(readChatStream(stream('data: {"type":"status","text":"Đang tìm"}\n\n')), /chưa hoàn tất/);
  await assert.rejects(readChatStream(stream('data: {"type":"error","text":"Máy chủ đang bận"}\n\n')), /Máy chủ đang bận/);
});

test('Lịch sử trình duyệt tách khách, người dùng A và B', () => {
  const keys = [chatStorageKeys(), chatStorageKeys('KH001'), chatStorageKeys('KH002')];
  assert.equal(new Set(keys.map(key => key.historyKey)).size, 3);
  assert.equal(new Set(keys.map(key => key.sessionKey)).size, 3);
});

test('SSE giữ mã lỗi phiên hết hạn để UI xóa mã phiên cũ', async () => {
  await assert.rejects(readChatStream(stream('data: {"type":"error","text":"Phiên đã hết hạn","code":"CHAT_SESSION_NOT_FOUND"}\n\n')), error => error.code === 'CHAT_SESSION_NOT_FOUND');
});
