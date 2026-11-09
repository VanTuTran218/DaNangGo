import "../config/db";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildIntentPrompt, IntentSchema, safeParseJson } from "../Ai/promt";
import { runPrompt, aiMetrics } from "../Ai/runtime";

const cases = [
  {id:"LIVE-01",input:"Tôi muốn vừa ăn ngon vừa đi tham quan ở Đà Nẵng",needs:["food","sight"]},
  {id:"LIVE-02",input:"Tìm quán ăn gần khách sạn của tôi",needs:["food"]},
  {id:"LIVE-03",input:"Khách sạn gần biển Mỹ Khê",needs:["stay"]},
  {id:"LIVE-04",input:"Chiều rảnh muốn nếm món địa phương rồi chụp vài tấm hình",needs:["food","sight"]},
  {id:"LIVE-05",input:"goi y quan mi quang gia duoi 100k o hai chau",needs:["food"]},
  {id:"LIVE-06",input:"Cần một homstay để nghỉ và các nhà hàng gần đó",needs:["stay","food"]},
  {id:"LIVE-07",input:"2 triệu rưỡi cho cả nhóm, gợi ý đi ăn và tham quan",needs:["food","sight"],budget:2500000},
  {id:"LIVE-08",input:"5tr5 tổng cả chuyến cho hai người, tìm chỗ nghỉ",needs:["stay"],budget:5500000},
  {id:"LIVE-09",input:"Tìm quán chay ở Sơn Trà",needs:["food"]},
  {id:"LIVE-10",input:"Chỉ đường đến điểm tham quan gần khách sạn",needs:["sight"]},
  {id:"LIVE-11",input:"Gợi ý điểm tham quan miễn phí ở Hải Châu",needs:["sight"],budget:0},
  {id:"LIVE-12",input:"Viết code Python để giải bài toán",needs:[],offTopic:true},
];
async function main() {
  const results=[];
  for(const c of cases) {
    const start=Date.now(); let status="PROVIDER_UNAVAILABLE"; let actual: unknown=null; const findings:string[]=[];
    const raw=await runPrompt(buildIntentPrompt(c.input),Date.now()+12000,"qa-intent");
    if(raw) try {
      const parsed=safeParseJson(IntentSchema,raw); actual=parsed;
      const needs=parsed.categories ?? (parsed.category==="food"||parsed.category==="stay"||parsed.category==="sight"?[parsed.category]:[]);
      if(JSON.stringify([...needs].sort())!==JSON.stringify([...c.needs].sort())) findings.push("Nhóm nhu cầu không đúng mong đợi");
      if(c.budget!==undefined&&parsed.budget!==c.budget) findings.push("Số tiền không đúng mong đợi");
      if(c.offTopic&&parsed.category!=="off_topic") findings.push("Không nhận diện ngoài phạm vi");
      status=findings.length?"FAIL":"PASS";
    } catch {status="FAIL";findings.push("Provider trả JSON không khớp IntentSchema");}
    results.push({...c,status,actual,findings,elapsedMs:Date.now()-start});
    console.log(`${c.id} ${status}: ${c.input}`);
  }
  const summary={executedAt:new Date().toISOString(),scope:"12 direct intent-tool calls; not a full live audit of 423 conversations. No fallback result is counted as live PASS.",counts:results.reduce((a,r)=>{a[r.status]=(a[r.status]??0)+1;return a;},{} as Record<string,number>),results,metrics:aiMetrics()};
  writeFileSync(resolve(__dirname,"../../../docs/ai-knowledge/intent-live-results.json"),JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify(summary.counts));
  if(results.some(r=>r.status!=="PASS"))process.exitCode=1;
}
main().catch(()=>{console.error("Không thể hoàn tất kiểm thử provider; không ghi lỗi SDK chứa cấu hình vào báo cáo.");process.exitCode=1;});
