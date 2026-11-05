import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../../frontend/lib/api/surveys';
import { INITIAL_FULL_SURVEY_DATA,INITIAL_QUICK_SURVEY_DATA } from '../../frontend/constants/survey';
class Storage {data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null;}setItem(k:string,v:string){this.data.set(k,v);}removeItem(k:string){this.data.delete(k);}}
test('Frontend khảo sát không báo thành công khi 404/500/mất mạng/thiếu xác nhận; retry giữ mã, sửa nội dung đổi mã',async t=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'window'),previousStorage=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');const session=new Storage(),local=new Storage();Object.defineProperty(globalThis,'window',{configurable:true,value:{sessionStorage:session,localStorage:local}});Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:session});
 const bodies:any[]=[];let mode:'404'|'500'|'network'|'false-success'|'success'='500';
 t.mock.method(globalThis,'fetch',async(_url:any,options:any)=>{bodies.push(JSON.parse(options.body));if(mode==='network')throw new TypeError('offline');return new Response(JSON.stringify(mode==='success'?{success:true,data:{responseId:42}}:mode==='false-success'?{success:true}:{success:false,message:'Chưa lưu được khảo sát'}),{status:mode==='404'?404:mode==='500'?500:200,headers:{'Content-Type':'application/json'}});});
 const full={...INITIAL_FULL_SURVEY_DATA,tripPurpose:'leisure',stayDuration:'1-2',travelCompanion:'couple',originProvince:'DA_NANG',visitFrequency:'first_time',topExpenses:['food'],npsScore:0,overallSatisfaction:4,experienceRatings:{food:-1},consentAgreed:true};
 api.saveSurveyDraft(full);
 try {
  for(const state of ['404','500','network','false-success'] as const){mode=state;await assert.rejects(api.submitFullSurvey(full,'test-trip'));assert.deepEqual(api.getSurveyInviteMeta().completedItineraries,[]);assert.ok(api.loadSurveyDraft());}
  assert.ok(bodies.every(b=>b.metadata.request_id===bodies[0].metadata.request_id));
  assert.equal(bodies[0].answers.find((a:any)=>a.question_code==='NPS_SCORE').answer_number,0);
  assert.equal(bodies[0].answers.find((a:any)=>a.question_code==='EXP_FOOD').answer_text,'CHUA_SU_DUNG');
  assert.equal(bodies[0].itinerary_id,undefined);
  const changed={...full,feedbackText:'Thay đổi nội dung sau khi gặp lỗi'};await assert.rejects(api.submitFullSurvey(changed,'test-trip'));assert.notEqual(bodies.at(-1).metadata.request_id,bodies[0].metadata.request_id);
  mode='success';const r=await api.submitFullSurvey(changed,'test-trip');assert.equal(r.success,true);assert.ok(api.getSurveyInviteMeta().completedItineraries.includes('test-trip'));
  mode='500';await assert.rejects(api.submitQuickSurvey({...INITIAL_QUICK_SURVEY_DATA,overallSatisfaction:4,npsScore:0,consentAgreed:true},'other-trip'));assert.ok(!api.getSurveyInviteMeta().completedItineraries.includes('other-trip'));
 }finally{if(previous)Object.defineProperty(globalThis,'window',previous);else delete (globalThis as any).window;if(previousStorage)Object.defineProperty(globalThis,'sessionStorage',previousStorage);else delete (globalThis as any).sessionStorage;}
});
