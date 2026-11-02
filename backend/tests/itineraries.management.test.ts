import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCatalogPlaceDetails,
  parseManagedItineraryUpdate,
} from '../src/modules/itineraries/itineraries.routes';
import type { ItineraryCatalogPlace } from '../src/modules/itineraries/itineraries.types';

const validUpdate = {
  title: 'Lịch trình Đà Nẵng',
  startDate: '2026-11-01',
  dayCount: 2,
  guestCount: 2,
  budget: 4_000_000,
  items: [{
    day: 1,
    time: '09:30',
    title: 'Tham quan bảo tàng',
    description: 'Tham quan buổi sáng.',
    type: 'attraction',
    location: 'Hải Châu',
    unitPrice: 60_000,
    quantity: 2,
    durationMinutes: 120,
    catalogPlaceId: 5,
  }],
};

const attractionCatalog: ItineraryCatalogPlace[] = [{
  id: 5,
  slug: 'museum',
  kind: 'ATTRACTION',
  name: 'Bảo tàng Điêu khắc Chăm',
  description: 'Bảo tàng ở trung tâm thành phố.',
  address: '02 Đường 2 Tháng 9',
  price: 60_000,
  accommodationType: null,
  stars: null,
  mealPeriod: null,
  imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=80',
  preferences: [],
  openingTime: '08:00:00',
  closingTime: '17:00:00',
  visitDurationMinutes: 120,
  roomType: null,
  roomCapacity: null,
  priceBasis: 'PER_PERSON',
}, {
  id: 6,
  slug: 'lunch-spot',
  kind: 'FOOD',
  name: 'Quán cơm trưa',
  description: 'Món ăn địa phương.',
  address: 'Hải Châu',
  price: 45_000,
  accommodationType: null,
  stars: null,
  mealPeriod: 'LUNCH',
  imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  preferences: [],
  openingTime: null,
  closingTime: null,
  visitDurationMinutes: 60,
  roomType: null,
  roomCapacity: null,
  priceBasis: 'PER_PERSON',
}, {
  id: 7,
  slug: 'stay-room',
  kind: 'STAY',
  name: 'Khách sạn thử nghiệm',
  description: 'Khách sạn gần trung tâm.',
  address: 'Hải Châu',
  price: 500_000,
  accommodationType: 'Khách sạn',
  stars: 3,
  mealPeriod: null,
  imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
  preferences: [],
  openingTime: null,
  closingTime: null,
  visitDurationMinutes: null,
  roomType: 'Phòng đôi',
  roomCapacity: 2,
  priceBasis: 'PER_ROOM',
}, {
  id: 8,
  slug: 'entertainment-place',
  kind: 'ENTERTAINMENT',
  name: 'Khu vui chơi thử nghiệm',
  description: 'Khu vui chơi trong thành phố.',
  address: 'Hải Châu',
  price: 100_000,
  accommodationType: null,
  stars: null,
  mealPeriod: null,
  imageUrl: 'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=400&q=80',
  preferences: [],
  openingTime: null,
  closingTime: null,
  visitDurationMinutes: 90,
  roomType: null,
  roomCapacity: null,
  priceBasis: 'PER_PERSON',
}];

test('validates and normalizes an itinerary management update', () => {
  const update = parseManagedItineraryUpdate(validUpdate);

  assert.ok(update);
  assert.equal(update.title, validUpdate.title);
  assert.equal(update.items[0]?.estimatedCost, 120_000);
  assert.equal(update.items[0]?.id, 'day-1-item-1');
  assert.equal(update.items[0]?.catalogPlaceId, 5);
});

test('rejects management updates with invalid day, time, type, or price data', () => {
  assert.equal(parseManagedItineraryUpdate({ ...validUpdate, dayCount: 4 }), null);
  assert.equal(parseManagedItineraryUpdate({
    ...validUpdate,
    items: [{ ...validUpdate.items[0], day: 3 }],
  }), null);
  assert.equal(parseManagedItineraryUpdate({
    ...validUpdate,
    items: [{ ...validUpdate.items[0], time: '25:00' }],
  }), null);
  assert.equal(parseManagedItineraryUpdate({
    ...validUpdate,
    items: [{ ...validUpdate.items[0], type: 'unknown' }],
  }), null);
  assert.equal(parseManagedItineraryUpdate({
    ...validUpdate,
    items: [{ ...validUpdate.items[0], unitPrice: 1.5 }],
  }), null);
  assert.equal(parseManagedItineraryUpdate({
    ...validUpdate,
    items: [{ ...validUpdate.items[0], imageUrl: 'javascript:alert(1)' }],
  }), null);
});

test('replaces attraction details and price with the selected catalog place data', () => {
  const update = parseManagedItineraryUpdate({
    ...validUpdate,
    items: [{
      ...validUpdate.items[0],
      title: 'Tên tự nhập',
      description: 'Mô tả tự nhập',
      location: 'Địa chỉ tự nhập',
      unitPrice: 1_000,
      durationMinutes: 30,
    }],
  });
  assert.ok(update);

  const normalized = applyCatalogPlaceDetails(update, attractionCatalog);
  assert.ok(normalized);
  assert.deepEqual(normalized.items[0], {
    ...update.items[0],
    title: 'Bảo tàng Điêu khắc Chăm',
    description: 'Bảo tàng ở trung tâm thành phố.',
    location: '02 Đường 2 Tháng 9',
    imageUrl: attractionCatalog[0]?.imageUrl,
    unitPrice: 60_000,
    estimatedCost: 120_000,
    durationMinutes: 120,
  });
});

test('preserves a valid custom image URL for a selected catalog place', () => {
  const customImageUrl = 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80';
  const update = parseManagedItineraryUpdate({
    ...validUpdate,
    items: [{ ...validUpdate.items[0], imageUrl: customImageUrl }],
  });
  assert.ok(update);

  const normalized = applyCatalogPlaceDetails(update, attractionCatalog);
  assert.equal(normalized?.items[0]?.imageUrl, customImageUrl);
});

test('rejects attraction selections missing from the active catalog', () => {
  const update = parseManagedItineraryUpdate({
    ...validUpdate,
    items: [{ ...validUpdate.items[0], catalogPlaceId: 999 }],
  });
  assert.ok(update);
  assert.equal(applyCatalogPlaceDetails(update, attractionCatalog), null);
});

test('normalizes food, hotel, and entertainment activities from their matching catalog categories', () => {
  const update = parseManagedItineraryUpdate({
    ...validUpdate,
    guestCount: 3,
    items: [
      { ...validUpdate.items[0], type: 'food', catalogPlaceId: 6, unitPrice: 1, quantity: 3 },
      { ...validUpdate.items[0], type: 'hotel', catalogPlaceId: 7, unitPrice: 1, quantity: 2 },
      { ...validUpdate.items[0], type: 'entertainment', catalogPlaceId: 8, unitPrice: 1, quantity: 3 },
    ],
  });
  assert.ok(update);

  const normalized = applyCatalogPlaceDetails(update, attractionCatalog);
  assert.ok(normalized);
  assert.deepEqual(normalized.items.map(({ title, unitPrice, quantity, estimatedCost }) => ({
    title, unitPrice, quantity, estimatedCost,
  })), [
    { title: 'Quán cơm trưa', unitPrice: 45_000, quantity: 3, estimatedCost: 135_000 },
    { title: 'Khách sạn thử nghiệm', unitPrice: 500_000, quantity: 2, estimatedCost: 1_000_000 },
    { title: 'Khu vui chơi thử nghiệm', unitPrice: 100_000, quantity: 3, estimatedCost: 300_000 },
  ]);
});
