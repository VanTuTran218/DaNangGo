import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { connectDB, closeDB, getPool } from "../config/db";
import { confirmedContextSchema } from "../modules/chat/chat.contract";
import { processUserMessage } from "../modules/chat/chat.service";
import type { ChatMessageDto, ChatPlaceCard } from "../modules/chat/chat.types";

interface Case { id: string; group: number; groupTitle: string; sourceLine: number; input: string; kind: string; setup: string | null; expected: string; expectedFoodTerms?: string[] }
const root = resolve(__dirname, "../../..");
const cases: Case[] = JSON.parse(readFileSync(resolve(root, "backend/tests/fixtures/go-acceptance-cases.json"), "utf8"));
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
const allCards = (m: ChatMessageDto): ChatPlaceCard[] => [...(m.places ?? []), ...(m.recommendationGroups?.flatMap(g => g.places) ?? []), ...(m.comparison?.places ?? []), ...(m.travelPlan?.groups.flatMap(g => g.places) ?? []), ...(m.travelPlan?.days.flatMap(d => d.periods.flatMap(p => p.items.flatMap(i => i.place ? [i.place] : []))) ?? [])];
const text = (v: unknown) => String(v ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
async function main() {
  // Default deterministic audit: no provider spending and no persisted guest chats.
  const live = process.argv.includes("--live");
  if (!live) process.env.GEMINI_API_KEY = "";
  const filter = process.argv.find(v => v.startsWith("--group="))?.split("=")[1];
  const selected = filter ? cases.filter(c => c.group === Number(filter)) : cases;
  const results: Record<string, any>[] = [];
  await connectDB();
  try {
    const catalog = await getPool().request().query<{place_id:number;name:string;place_type:string;status:string;description:string|null}>("SELECT place_id,name,place_type,status,description FROM dbo.places");
    const menus = await getPool().request().query<{menu_item_id:number;place_id:number;name:string;price:number;is_available:boolean}>("SELECT menu_item_id,place_id,name,price,is_available FROM dbo.menu_items");
    const known = new Map(catalog.recordset.map(p => [p.place_id,p]));
    for (const c of selected) {
      const guestId = randomUUID(); let before: ChatMessageDto | undefined; const start = Date.now();
      let message: ChatMessageDto | undefined; let status = "PASS"; const findings: string[] = [];
      try {
        let sessionId: number | undefined;
        if (c.setup) { const r = await processUserMessage({guestId,message:c.setup}); sessionId=r.sessionId; before=r.message; }
        const r = await processUserMessage({guestId,sessionId,message:c.input}); message = r.message;
        const content = normalize(message.content), cards = allCards(message);
        assert.ok(message.content.trim(), "Phản hồi rỗng");
        assert.ok(confirmedContextSchema.safeParse(message.confirmedContext).success, "confirmedContext sai schema");
        assert.ok((message.questions?.length ?? 0) <= 3, "Quá 3 câu hỏi");
        assert.ok(!/DANANGGO_ADVISOR|GEMINI_API_KEY|AIza[\w-]{20}/.test(JSON.stringify(message)), "Lộ state/key");
        for(const p of cards) {
          const row=known.get(p.placeId); assert.ok(row && row.status==='ACTIVE', `Địa điểm không ACTIVE/không tồn tại: ${p.placeId}`);
          assert.equal(p.name,row.name,"Tên khác DB"); assert.equal(p.placeType,row.place_type,"Loại khác DB");
          assert.ok(!/^\[(?:Mẫu|Test|Demo)\]/i.test(p.name), "Dùng địa điểm mẫu");
          assert.equal(p.detailUrl,`/places/${p.placeId}`,"URL chi tiết sai");
          for(const item of p.menuItems ?? []) assert.ok(menus.recordset.some(m=>m.menu_item_id===item.id&&m.place_id===p.placeId&&m.name===item.name&&m.is_available&&Number(m.price)===item.price),"Món/giá không khớp menu SQL");
        }
        // Independent food oracle: use canonical, accent-preserving whole terms.
        // This catches SQL accent-insensitive collisions such as “lẩu” matching “lâu đời”.
        if(c.expectedFoodTerms?.length && cards.length) {
          const matches = (value:string,term:string) => new RegExp(`(^|[^\\p{L}\\p{N}])${term}($|[^\\p{L}\\p{N}])`,"iu").test(value.normalize("NFC"));
          for(const place of cards.filter(p=>p.placeType==='RESTAURANT')) {
            const row=known.get(place.placeId)!;
            const source=[row.name,row.description??"",...menus.recordset.filter(m=>m.place_id===place.placeId&&m.is_available).map(m=>m.name)].join(" ");
            assert.ok(c.expectedFoodTerms.some(term=>matches(source,term)),`Sai món: ${place.name} không có căn cứ cho ${c.expectedFoodTerms.join('/')}`);
          }
        }
        if (c.kind==='allergy') {
          assert.ok(!cards.some(p=>p.placeType==='RESTAURANT'),"Đưa quán khi thành phần dị ứng chưa xác minh");
          assert.match(content,/thanh phan|lan nguyen lieu|di ung/,"Thiếu cảnh báo dị ứng");
        }
        if (c.kind==='reset') assert.equal(message.confirmedContext?.budget,null,"Chuyến mới giữ ngân sách cũ");
        const expectedType = ({food:'RESTAURANT',stay:'ACCOMMODATION',sight:'ATTRACTION'} as Record<string,string>)[c.kind];
        if (expectedType && !message.travelPlan && !message.recommendationGroups && !message.comparison) {
          if(cards.some(p=>p.placeType!==expectedType)) findings.push("Sai nhóm địa điểm so với nhu cầu của câu hỏi.");
          const routed = (message.secondaryIntents ?? []).includes(({food:'FOOD',stay:'STAY',sight:'SIGHT'} as Record<string,string>)[c.kind]!);
          if(!cards.length && !routed && /ban muon tim quan an, cho o hay diem tham quan|ban muon tim quan an, cho o hay/.test(content)) findings.push("Chưa nhận ra nhu cầu rõ ràng, trả lời chào chung.");
        }
        if(c.kind==='live' && !/chua|can.*xac nhan|khong.*xac nhan/.test(content)) findings.push("Chưa nêu giới hạn nguồn trực tiếp.");
        if(c.kind==='comparison' && !message.comparison && !/hai|so sanh|tieu chi|co so|chua|nao/.test(content)) findings.push("Chưa xử lý yêu cầu so sánh.");
        if(c.kind==='comparison' && before?.comparison && /^(?:Nơi nào|Tôi ưu tiên)/i.test(c.input)) {
          if(!message.comparison) findings.push("Mất bảng và cặp địa điểm của lượt so sánh trước.");
          else assert.deepEqual(message.comparison.places.map(p=>p.placeId),before.comparison.places.map(p=>p.placeId),"Tự đổi cặp nơi đang so sánh");
        }
        if(c.kind==='planning' && !message.travelPlan && message.intent!=='ITINERARY' && !/lich|may ngay|may nguoi|ngan sach|gio|tre|phuong tien/.test(content)) findings.push("Không có lịch hoặc câu hỏi làm rõ lập lịch.");
        if(c.kind==='profile' && /da luu|da ghi nho.*lan sau/.test(content)) findings.push("Khách được báo đã lưu lâu dài.");
        if(c.kind==='map' && !/ban do|gps|vi tri|diem xuat phat|diem den|di bo|di chuyen|khoang cach|toa do|khu vuc|quan|xac nhan/.test(content)) findings.push("Chưa xử lý yêu cầu bản đồ/đi lại.");
        if(c.kind==='trust' && !/danh gia|nguon|xac minh|xac nhan|thong tin|du lieu|phan hoi|bao loi|dia diem nao/.test(content)) findings.push("Chưa xử lý nguồn/đánh giá/báo sai.");
        if(c.kind==='edit' && before?.travelPlan && message.travelPlan && /giu nguyen ngay mot, chi sua ngay hai/i.test(c.input)) assert.deepEqual(message.travelPlan.days[0],before.travelPlan.days[0],"Sửa nhầm ngày 1 yêu cầu giữ nguyên");
        if(findings.length) status='GAP';
        else if (/chua.*(?:du lieu|xac minh|tich hop|co nguon|tim thay)|chua xac nhan/.test(content)) status='DATA_LIMIT';
      } catch(error) { status='FAIL'; findings.push(error instanceof Error?error.message:String(error)); }
      const entry={...c,status,findings,elapsedMs:Date.now()-start,actual:message}; results.push(entry);
      console.log(`${c.id} ${status} ${c.input}${findings.length?` → ${findings.join('; ')}`:''}`);
    }
    const counts = results.reduce((a,r)=>{a[r.status]=(a[r.status]??0)+1;return a;},{} as Record<string,number>);
    const suffix=live?'live':filter?`group-${filter}`:'rules';
    const report={executedAt:new Date().toISOString(),mode:live?'configured provider (fallback still possible)':'provider disabled, real SQL read-only, guest sessions',counts,total:results.length,results};
    writeFileSync(resolve(root,`docs/ai-knowledge/acceptance-${suffix}.json`),JSON.stringify(report,null,2)+'\n');
    writeFileSync(resolve(root,`docs/AI-ACCEPTANCE-${suffix.toUpperCase()}.md`),`# Kiểm thử từng câu Gô\n\n${report.mode}. Ngày chạy: ${report.executedAt}.\n\nTổng: ${results.length}. ${JSON.stringify(counts)}.\n\nPASS: kiểm tra tự động đạt; DATA_LIMIT: nêu giới hạn dữ liệu, không xác nhận đáp ứng đầy đủ; GAP: còn thiếu hành vi; FAIL: assertion/lỗi runtime. Chưa thay thế đánh giá chất lượng ngữ nghĩa thủ công hoặc kiểm thử provider live.\n\n| Mã | Nhóm | Câu hỏi | Tiền điều kiện | Mong đợi | Kết quả | Ghi nhận | Phản hồi thực tế |\n|---|---|---|---|---|---|---|---|\n`+results.map(r=>`| ${r.id} | ${r.group} | ${text(r.input)} | ${text(r.setup ?? "Hội thoại mới, chưa có GPS/chưa đăng nhập")} | ${text(r.expected)} | ${r.status} | ${text(r.findings.join('; '))} | ${text(r.actual?.content)} |`).join('\n')+'\n');
    console.log(JSON.stringify({total:results.length,counts}));
    if(counts.FAIL || counts.GAP) process.exitCode=1;
  } finally { await closeDB(); }
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Audit failed');process.exitCode=1;});
