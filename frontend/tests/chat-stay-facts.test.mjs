import test from 'node:test';
import assert from 'node:assert/strict';
import { freshStayFacts } from '../lib/chat-stay-facts.ts';
const facts={hours:{checkIn:'14:00',checkOut:'11:00',checkedOn:'2026-11-05',sourceUrl:'https://furamavietnam.com/'},rooms:[],publicRates:[{roomName:'Garden Superior',nightlyVnd:8186000,includedGuests:2,validFrom:'2026-01-01',validTo:'2026-12-31',conditions:'Giá niêm yết, cần xác nhận',checkedOn:'2026-11-05',sourceUrl:'https://furamavietnam.com/rack-rate-public-rate/'}],notices:[]};
test('Lịch sử chat không hiện giá cũ đã hết hạn như giá hiện tại',()=>{
  const current=freshStayFacts(facts,'2026-11-05');assert.equal(current.publicRates[0].nightlyVnd,8186000);
  const old=freshStayFacts(facts,'2027-01-01');assert.equal(old.publicRates.length,0);assert.match(old.notices.join(' '),/hết hiệu lực/);
  assert.equal(facts.publicRates.length,1);
});
test('Ẩn giờ quá 180 ngày và giá quá 30 ngày ngay cả khi còn trong năm niêm yết',()=>{
  assert.equal(freshStayFacts(facts,'2026-12-06').publicRates.length,0);
  assert.equal(freshStayFacts(facts,'2027-06-01').hours,undefined);
  assert.equal(freshStayFacts(undefined,'2026-11-05'),undefined);
});
