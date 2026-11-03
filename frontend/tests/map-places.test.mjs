import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapApiPlace, loadMapPlaces, PLACE_PLACEHOLDER } from '../lib/map-places.ts';

const place = { place_id: 42, place_type: 'ATTRACTION', name: 'Cầu Rồng', status: 'ACTIVE', latitude: 16.061, longitude: 108.227, avg_rating: 4.7, review_count: 12, address: 'Đà Nẵng' };
test('Ánh xạ giữ ID/tọa độ thật, loại bỏ điểm thiếu tọa độ hoặc chưa công khai', () => {
  assert.deepEqual(mapApiPlace(place, 'http://localhost:8000'), { id: 42, name: 'Cầu Rồng', category: 'diemdulich', lat: 16.061, lng: 108.227, rating: 4.7, reviews: 12, address: 'Đà Nẵng', img: PLACE_PLACEHOLDER, distance: '' });
  for (const changes of [{ latitude: null }, { longitude: null }, { latitude: NaN }, { longitude: 181 }, { status: 'HIDDEN' }, { status: 'PENDING' }]) assert.equal(mapApiPlace({ ...place, ...changes }, 'http://localhost:8000'), null);
});
test('Phân loại lưu trú, nhà hàng và cà phê từ dữ liệu API', () => {
  for (const [fields, expected] of [[{ place_type: 'ACCOMMODATION' }, 'luutru'], [{ place_type: 'RESTAURANT' }, 'amthuc'], [{ place_type: 'RESTAURANT', category_name: 'Cà phê' }, 'cafe'], [{ place_type: 'RESTAURANT', name: 'Coffee House' }, 'cafe']]) assert.equal(mapApiPlace({ ...place, ...fields }, 'http://localhost:8000').category, expected);
});
test('Ảnh upload dùng host backend; URL nguy hiểm dùng ảnh dự phòng', () => {
  assert.equal(mapApiPlace({ ...place, cover_image: '/uploads/places/a.jpg' }, 'http://localhost:8000/').img, 'http://localhost:8000/uploads/places/a.jpg');
  assert.equal(mapApiPlace({ ...place, cover_image: '/places/real-stays/a.jpg' }, 'http://localhost:8000/').img, '/places/real-stays/a.jpg');
  assert.equal(mapApiPlace({ ...place, cover_image: 'javascript:alert(1)' }, 'http://localhost:8000').img, PLACE_PLACEHOLDER);
});
test('Tải đủ trang, truyền signal, giữ địa điểm trang sau và loại ID trùng', async () => {
  const signal = new AbortController().signal;
  const calls = [];
  const result = await loadMapPlaces(async (query, receivedSignal) => {
    calls.push(query.page);
    assert.equal(query.limit, 50);
    assert.equal(receivedSignal, signal);
    return { items: query.page === 1 ? [place] : [place, { ...place, place_id: 99 }], total_pages: 2 };
  }, signal);
  assert.deepEqual(calls, [1, 2]);
  assert.deepEqual(result.map(item => item.place_id), [42, 99]);
});
test('Lỗi trang sau không bị hiểu nhầm là tải đủ dữ liệu', async () => {
  await assert.rejects(loadMapPlaces(async ({ page }) => {
    if (page === 2) throw new Error('API unavailable');
    return { items: [place], total_pages: 2 };
  }, new AbortController().signal), /API unavailable/);
});
test('Hủy tải và phản hồi rỗng', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(loadMapPlaces(async () => { throw new Error('Không được gọi'); }, controller.signal), { name: 'AbortError' });
  assert.deepEqual(await loadMapPlaces(async () => ({ items: [], total_pages: 0 }), new AbortController().signal), []);
});
