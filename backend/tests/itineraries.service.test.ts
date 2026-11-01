import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateItinerary,
  ItinerarySelectionError,
  searchItineraryCatalog,
} from '../src/modules/itineraries/itineraries.service';
import type {
  GenerateItineraryInput,
  ItineraryCatalogPlace,
} from '../src/modules/itineraries/itineraries.types';

const standardInput: GenerateItineraryInput = {
  budget: 4_500_000,
  days: 3,
  guestCount: 2,
  startDate: '2026-11-01',
  needs: ['accommodation', 'food', 'attractions'],
  accType: 'Khách sạn',
  stars: 4,
  prefs: ['Ẩm thực địa phương', 'Di sản & Văn hoá'],
};

const catalog: ItineraryCatalogPlace[] = [
  {
    id: 1, slug: 'hotel-han-river-4', kind: 'STAY', name: 'Khách sạn Hàn River',
    description: 'Lưu trú thử nghiệm.', address: 'Hải Châu', price: 550_000,
    accommodationType: 'Khách sạn', stars: 4, mealPeriod: null,
    imageUrl: 'https://example.com/hotel.jpg', preferences: [],
    openingTime: null, closingTime: null, visitDurationMinutes: null,
    roomType: null, roomCapacity: null, priceBasis: 'PER_PERSON',
  },
  {
    id: 2, slug: 'breakfast-place', kind: 'FOOD', name: 'Bữa sáng thử nghiệm',
    description: 'Món sáng thử nghiệm.', address: 'Hải Châu', price: 30_000,
    accommodationType: null, stars: null, mealPeriod: 'BREAKFAST',
    imageUrl: 'https://example.com/breakfast.jpg', preferences: ['Ẩm thực địa phương'],
    openingTime: null, closingTime: null, visitDurationMinutes: null,
    roomType: null, roomCapacity: null, priceBasis: 'PER_PERSON',
  },
  {
    id: 3, slug: 'lunch-place', kind: 'FOOD', name: 'Bữa trưa thử nghiệm',
    description: 'Món trưa thử nghiệm.', address: 'Hải Châu', price: 45_000,
    accommodationType: null, stars: null, mealPeriod: 'LUNCH',
    imageUrl: 'https://example.com/lunch.jpg', preferences: ['Ẩm thực địa phương'],
    openingTime: null, closingTime: null, visitDurationMinutes: null,
    roomType: null, roomCapacity: null, priceBasis: 'PER_PERSON',
  },
  {
    id: 4, slug: 'dinner-place', kind: 'FOOD', name: 'Bữa tối thử nghiệm',
    description: 'Món tối thử nghiệm.', address: 'Hải Châu', price: 65_000,
    accommodationType: null, stars: null, mealPeriod: 'DINNER',
    imageUrl: 'https://example.com/dinner.jpg', preferences: ['Ẩm thực địa phương'],
    openingTime: null, closingTime: null, visitDurationMinutes: null,
    roomType: null, roomCapacity: null, priceBasis: 'PER_PERSON',
  },
  {
    id: 5, slug: 'museum', kind: 'ATTRACTION', name: 'Bảo tàng thử nghiệm',
    description: 'Điểm tham quan thử nghiệm.', address: 'Hải Châu', price: 60_000,
    accommodationType: null, stars: null, mealPeriod: null,
    imageUrl: 'https://example.com/museum.jpg', preferences: ['Di sản & Văn hoá'],
    openingTime: '08:00:00', closingTime: '17:00:00', visitDurationMinutes: 120,
    roomType: null, roomCapacity: null, priceBasis: 'PER_PERSON',
  },
  {
    id: 6, slug: 'other-breakfast', kind: 'FOOD', name: 'Quán sáng khác',
    description: 'Món sáng khác.', address: 'Sơn Trà', price: 35_000,
    accommodationType: null, stars: null, mealPeriod: 'BREAKFAST',
    imageUrl: 'https://example.com/other-breakfast.jpg', preferences: ['Ẩm thực địa phương'],
    openingTime: null, closingTime: null, visitDurationMinutes: null,
    roomType: null, roomCapacity: null, priceBasis: 'PER_PERSON',
  },
  {
    id: 7, slug: 'other-attraction', kind: 'ATTRACTION', name: 'Điểm tham quan khác',
    description: 'Điểm tham quan chưa xếp vào lịch.', address: 'Sơn Trà', price: 0,
    accommodationType: null, stars: null, mealPeriod: null,
    imageUrl: 'https://example.com/other-attraction.jpg', preferences: ['Check-in sống ảo'],
    openingTime: null, closingTime: null, visitDurationMinutes: null,
    roomType: null, roomCapacity: null, priceBasis: 'PER_PERSON',
  },
  {
    id: 8, slug: 'expensive-attraction', kind: 'ATTRACTION', name: 'Điểm tham quan giá cao',
    description: 'Điểm tham quan cần ngân sách lớn.', address: 'Hòa Vang', price: 900_000,
    accommodationType: null, stars: null, mealPeriod: null,
    imageUrl: 'https://example.com/expensive.jpg', preferences: ['Phiêu lưu mạo hiểm'],
    openingTime: null, closingTime: null, visitDurationMinutes: null,
    roomType: null, roomCapacity: null, priceBasis: 'PER_PERSON',
  },
];

test('searches without Vietnamese diacritics and combines category and price filters', () => {
  const results = searchItineraryCatalog(catalog, {
    query: 'bao tang',
    kind: 'ATTRACTION',
    maxPrice: 60_000,
  });

  assert.deepEqual(results.places.map((place) => place.id), [5]);
  assert.deepEqual(results.suggestions, ['Bảo tàng thử nghiệm']);
});

test('returns matching names as autocomplete suggestions and applies price limits inclusively', () => {
  const results = searchItineraryCatalog(catalog, {
    query: 'bữa',
    kind: 'FOOD',
    minPrice: 30_000,
    maxPrice: 45_000,
  });

  assert.deepEqual(results.places.map((place) => place.id), [2, 3]);
  assert.deepEqual(results.suggestions, ['Bữa sáng thử nghiệm', 'Bữa trưa thử nghiệm']);
});

test('builds a dated itinerary and multiplies per-person prices by party size', () => {
  const itinerary = generateItinerary(standardInput, catalog);
  const items = itinerary.days.flatMap((day) => day.items);
  const itemCosts = items.reduce((total, item) => total + item.estimatedCost, 0);

  assert.equal(itinerary.days.length, standardInput.days);
  assert.equal(itinerary.days[0]?.date, '2026-11-01');
  assert.equal(itinerary.days[2]?.date, '2026-11-03');
  assert.ok(items.some((item) => item.title === 'Bữa sáng: Bữa sáng thử nghiệm'));
  assert.ok(items.some((item) => item.title === 'Khách sạn Hàn River (ước tính)'));
  assert.ok(items.some((item) => item.title === 'Bảo tàng thử nghiệm'));
  assert.equal(itinerary.summary.costs.accommodation, 2_200_000);
  assert.equal(itinerary.summary.costs.food, 850_000);
  assert.equal(itemCosts + itinerary.summary.costs.contingency, itinerary.summary.estimatedTotal);
  assert.equal(itinerary.summary.estimatedTotal + itinerary.summary.remainingBudget, standardInput.budget);
});

test('only includes the requested categories', () => {
  const itinerary = generateItinerary({
    ...standardInput,
    needs: ['attractions'],
  }, catalog);
  const items = itinerary.days.flatMap((day) => day.items);

  assert.equal(items.some((item) => item.type === 'food'), false);
  assert.equal(items.some((item) => item.type === 'hotel'), false);
  assert.ok(items.some((item) => item.type === 'attraction'));
  assert.equal(itinerary.summary.costs.accommodation, 0);
  assert.equal(itinerary.summary.costs.food, 0);
});

test('calculates room-based accommodation by capacity and stores room quantity', () => {
  const roomCatalog = catalog.map((place) => place.id === 1
    ? { ...place, price: 1_000_000, roomType: 'Phòng đôi', roomCapacity: 2, priceBasis: 'PER_ROOM' as const }
    : place);
  const itinerary = generateItinerary({
    ...standardInput,
    guestCount: 3,
    needs: ['accommodation'],
  }, roomCatalog);
  const roomNights = itinerary.days.flatMap((day) => day.items).filter((item) => item.type === 'hotel');

  assert.equal(itinerary.summary.costs.accommodation, 4_000_000);
  assert.equal(roomNights[0]?.quantity, 2);
  assert.equal(roomNights[0]?.estimatedCost, 2_000_000);
});

test('still returns a draft-ready advisory plan when the budget is too low', () => {
  const itinerary = generateItinerary({ ...standardInput, budget: 100_000 }, catalog);

  assert.equal(itinerary.summary.budgetStatus, 'over-budget');
  assert.ok(itinerary.summary.overBudgetAmount > 0);
  assert.ok(itinerary.notices.some((notice) => notice.includes('vượt ngân sách')));
  assert.equal(itinerary.days.length, standardInput.days);
});

test('suggests two distinct attractions per day even when attractions exceed the remaining budget', () => {
  const additionalAttractions: ItineraryCatalogPlace[] = [
    {
      id: 10, slug: 'attraction-one', kind: 'ATTRACTION', name: 'Điểm tham quan thứ nhất',
      description: 'Điểm tham quan thử nghiệm.', address: 'Hải Châu', price: 10_000,
      accommodationType: null, stars: null, mealPeriod: null,
      imageUrl: 'https://example.com/attraction-one.jpg', preferences: [],
      openingTime: '08:00:00', closingTime: '17:00:00', visitDurationMinutes: 120,
      roomType: null, roomCapacity: null, priceBasis: 'PER_PERSON',
    },
    {
      id: 11, slug: 'attraction-two', kind: 'ATTRACTION', name: 'Điểm tham quan thứ hai',
      description: 'Điểm tham quan thử nghiệm.', address: 'Sơn Trà', price: 20_000,
      accommodationType: null, stars: null, mealPeriod: null,
      imageUrl: 'https://example.com/attraction-two.jpg', preferences: [],
      openingTime: '08:00:00', closingTime: '17:00:00', visitDurationMinutes: 120,
      roomType: null, roomCapacity: null, priceBasis: 'PER_PERSON',
    },
    {
      id: 12, slug: 'attraction-three', kind: 'ATTRACTION', name: 'Điểm tham quan thứ ba',
      description: 'Điểm tham quan thử nghiệm.', address: 'Ngũ Hành Sơn', price: 30_000,
      accommodationType: null, stars: null, mealPeriod: null,
      imageUrl: 'https://example.com/attraction-three.jpg', preferences: [],
      openingTime: '08:00:00', closingTime: '17:00:00', visitDurationMinutes: 120,
      roomType: null, roomCapacity: null, priceBasis: 'PER_PERSON',
    },
  ];
  const itinerary = generateItinerary({
    ...standardInput,
    budget: 100_000,
    needs: ['attractions'],
  }, [...catalog, ...additionalAttractions]);
  const attractionsByDay = itinerary.days.map((day) =>
    day.items.filter((item) => item.type === 'attraction'),
  );
  const attractionIds = attractionsByDay.flatMap((items) => items.map((item) => item.catalogPlaceId));

  assert.ok(attractionsByDay.every((items) => items.length === 2));
  assert.deepEqual(attractionsByDay.map((items) => items.map((item) => item.time)), [
    ['09:30', '13:30'],
    ['09:30', '13:30'],
    ['09:30', '13:30'],
  ]);
  assert.equal(new Set(attractionIds).size, itinerary.days.length * 2);
  assert.equal(itinerary.summary.costs.attractions, 2_040_000);
  assert.equal(itinerary.summary.budgetStatus, 'over-budget');
});

test('warns when the catalog cannot provide two distinct attractions per day', () => {
  const itinerary = generateItinerary({
    ...standardInput,
    needs: ['attractions'],
  }, catalog);

  assert.ok(itinerary.notices.some((notice) => notice.includes('còn thiếu 3 gợi ý')));
  assert.equal(
    new Set(itinerary.days.flatMap((day) =>
      day.items.filter((item) => item.type === 'attraction').map((item) => item.catalogPlaceId),
    )).size,
    3,
  );
});

test('missing categories in the catalog produce an incomplete plan and explicit warnings', () => {
  const itinerary = generateItinerary(standardInput, []);

  assert.equal(itinerary.days.length, standardInput.days);
  assert.ok(itinerary.notices.some((notice) => notice.includes('lưu trú')));
  assert.ok(itinerary.notices.some((notice) => notice.includes('bữa')));
  assert.ok(itinerary.days.every((day) => day.items.every((item) => item.type === 'transport')));
});

test('allows an itinerary without optional preferences', () => {
  const itinerary = generateItinerary({ ...standardInput, prefs: [] }, catalog);

  assert.equal(itinerary.days.length, standardInput.days);
  assert.ok(itinerary.notices.some((notice) => notice.includes('chưa chọn sở thích')));
});

test('offers food choices for all four periods and includes only the selected places in the itinerary', () => {
  const snack: ItineraryCatalogPlace = {
    id: 9, slug: 'afternoon-snack', kind: 'FOOD', name: 'Ăn vặt buổi chiều',
    description: 'Món ăn nhẹ.', address: 'Hải Châu', price: 25_000,
    accommodationType: null, stars: null, mealPeriod: 'SNACK',
    imageUrl: 'https://example.com/snack.jpg', preferences: ['Ẩm thực địa phương'],
    openingTime: null, closingTime: null, visitDurationMinutes: null,
    roomType: null, roomCapacity: null, priceBasis: 'PER_PERSON',
  };
  const input: GenerateItineraryInput = { ...standardInput, days: 1, needs: ['food'] };
  const preview = generateItinerary(input, [...catalog, snack]);

  assert.equal(preview.suggestions[0]?.breakfast.length, 2);
  assert.equal(preview.suggestions[0]?.lunch.length, 1);
  assert.equal(preview.suggestions[0]?.snack[0]?.catalogPlaceId, snack.id);
  assert.equal(preview.suggestions[0]?.dinner.length, 1);

  const selected = generateItinerary(input, [...catalog, snack], [
    { day: 1, mealPeriod: 'BREAKFAST', catalogPlaceId: 6 },
    { day: 1, mealPeriod: 'LUNCH', catalogPlaceId: 3 },
    { day: 1, mealPeriod: 'SNACK', catalogPlaceId: 9 },
    { day: 1, mealPeriod: 'DINNER', catalogPlaceId: 4 },
  ]);
  const selectedFood = selected.days[0]?.items.filter((item) => item.type === 'food') ?? [];

  assert.deepEqual(selectedFood.map((item) => item.catalogPlaceId), [6, 3, 9, 4]);
  assert.equal(selected.summary.costs.food, 340_000);

  const withoutMeals = generateItinerary(input, [...catalog, snack], []);
  assert.equal(withoutMeals.days[0]?.items.some((item) => item.type === 'food'), false);
  assert.equal(withoutMeals.summary.costs.food, 0);
});

test('rejects food selections from a different meal period', () => {
  assert.throws(
    () => generateItinerary({ ...standardInput, days: 1 }, catalog, [
      { day: 1, mealPeriod: 'BREAKFAST', catalogPlaceId: 3 },
    ]),
    ItinerarySelectionError,
  );
});
