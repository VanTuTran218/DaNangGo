import { getPool, sql } from '../../config/db';
import { isItineraryPreference } from './itineraries.service';
import type {
  GeneratedItinerary,
  GenerateItineraryInput,
  ItineraryCatalogPlace,
  ManagedItinerary,
  ManagedItineraryItem,
  ItineraryPreference,
} from './itineraries.types';

interface CatalogPlaceRow {
  id: number;
  slug: string;
  kind: ItineraryCatalogPlace['kind'];
  name: string;
  description: string;
  address: string;
  price: number;
  accommodation_type: ItineraryCatalogPlace['accommodationType'];
  stars: number | null;
  meal_period: ItineraryCatalogPlace['mealPeriod'];
  image_url: string;
  opening_time: string | null;
  closing_time: string | null;
  visit_duration_minutes: number | null;
  room_type: string | null;
  room_capacity: number | null;
  price_basis: ItineraryCatalogPlace['priceBasis'];
}

interface CatalogPreferenceRow {
  place_id: number;
  preference: ItineraryPreference;
}

interface ManagedItineraryRow {
  id: number;
  title: string;
  status: ManagedItinerary['status'];
  startDate: string;
  dayCount: number;
  guestCount: number;
  budget: number;
  estimatedTotal: number;
  budgetStatus: ManagedItinerary['budgetStatus'];
  itemCount: number;
  imageUrl: string | null;
}

interface ManagedItineraryDetailRow extends Omit<ManagedItineraryRow, 'itemCount' | 'imageUrl'> {
  generation_input_json: string;
}

interface ManagedItineraryItemRow {
  day_number: number;
  item_key: string;
  scheduled_time: string;
  item_type: ManagedItineraryItem['type'];
  title: string;
  description: string;
  location: string | null;
  image_url: string | null;
  estimated_cost: number;
  catalog_place_id: number | null;
  unit_price: number;
  quantity: number;
  duration_minutes: number | null;
}

export interface ManagedItineraryUpdate {
  title: string;
  startDate: string;
  dayCount: number;
  guestCount: number;
  budget: number;
  items: ManagedItineraryItem[];
}

export async function getItineraryCatalog(): Promise<ItineraryCatalogPlace[]> {
  const pool = getPool();
  const [placesResult, preferencesResult] = await Promise.all([
    pool.request().query<CatalogPlaceRow>(`
      SELECT id, slug, kind, name, description, address, price,
             accommodation_type, stars, meal_period, image_url,
             CONVERT(VARCHAR(8), opening_time, 108) AS opening_time,
             CONVERT(VARCHAR(8), closing_time, 108) AS closing_time,
             visit_duration_minutes, room_type, room_capacity, price_basis
      FROM itinerary_catalog_places
      WHERE is_active = 1
      ORDER BY id
    `),
    pool.request().query<CatalogPreferenceRow>(`
      SELECT preference.place_id, preference.preference
      FROM itinerary_catalog_preferences AS preference
      INNER JOIN itinerary_catalog_places AS place ON place.id = preference.place_id
      WHERE place.is_active = 1
    `),
  ]);

  const preferencesByPlace = new Map<number, ItineraryPreference[]>();
  for (const row of preferencesResult.recordset) {
    const preferences = preferencesByPlace.get(row.place_id) ?? [];
    preferences.push(row.preference);
    preferencesByPlace.set(row.place_id, preferences);
  }

  return placesResult.recordset.map((place) => ({
    id: place.id,
    slug: place.slug,
    kind: place.kind,
    name: place.name,
    description: place.description,
    address: place.address,
    price: Number(place.price),
    accommodationType: place.accommodation_type,
    stars: place.stars,
    mealPeriod: place.meal_period,
    imageUrl: place.image_url,
    preferences: preferencesByPlace.get(place.id) ?? [],
    openingTime: place.opening_time,
    closingTime: place.closing_time,
    visitDurationMinutes: place.visit_duration_minutes,
    roomType: place.room_type,
    roomCapacity: place.room_capacity,
    priceBasis: place.price_basis,
  }));
}

export async function getUserItineraryPreferences(userId: number): Promise<ItineraryPreference[]> {
  const result = await getPool()
    .request()
    .input('userId', sql.Int, userId)
    .query<{ preferences_json: string }>(`
      SELECT preferences_json
      FROM dbo.user_itinerary_preferences
      WHERE user_id = @userId
    `);
  const value = result.recordset[0]?.preferences_json;
  if (!value) return [];

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error(`Sở thích của người dùng ${userId} không có định dạng danh sách hợp lệ.`);
  }
  return parsed.filter(isItineraryPreference);
}

export async function getManagedItineraries(userId: number): Promise<ManagedItineraryRow[]> {
  const result = await getPool()
    .request()
    .input('userId', sql.Int, userId)
    .query<ManagedItineraryRow>(`
      SELECT itinerary.id, itinerary.title, itinerary.status,
             CONVERT(VARCHAR(10), itinerary.start_date, 23) AS startDate,
             itinerary.day_count AS dayCount, itinerary.guest_count AS guestCount,
             budget.budget_amount AS budget, budget.estimated_total AS estimatedTotal,
             budget.budget_status AS budgetStatus,
             (SELECT COUNT(*)
              FROM dbo.itinerary_items AS item
              WHERE item.itinerary_id = itinerary.id) AS itemCount,
             (SELECT TOP (1) candidate.image_url
              FROM dbo.itinerary_items AS candidate
              WHERE candidate.itinerary_id = itinerary.id
                AND candidate.image_url IS NOT NULL
              ORDER BY candidate.day_number, candidate.sequence_number) AS imageUrl
      FROM dbo.itineraries AS itinerary
      INNER JOIN dbo.itinerary_budgets AS budget ON budget.itinerary_id = itinerary.id
      WHERE itinerary.user_id = @userId
      ORDER BY itinerary.created_at DESC, itinerary.id DESC
    `);
  return result.recordset;
}

export async function getManagedItinerary(
  itineraryId: number,
  userId: number,
): Promise<ManagedItinerary | null> {
  const pool = getPool();
  const [itineraryResult, itemsResult] = await Promise.all([
    pool.request()
      .input('itineraryId', sql.BigInt, itineraryId)
      .input('userId', sql.Int, userId)
      .query<ManagedItineraryDetailRow>(`
        SELECT itinerary.id, itinerary.title, itinerary.status,
               CONVERT(VARCHAR(10), itinerary.start_date, 23) AS startDate,
               itinerary.day_count AS dayCount, itinerary.guest_count AS guestCount,
               budget.budget_amount AS budget, budget.estimated_total AS estimatedTotal,
               budget.budget_status AS budgetStatus,
               itinerary.generation_input_json
        FROM dbo.itineraries AS itinerary
        INNER JOIN dbo.itinerary_budgets AS budget ON budget.itinerary_id = itinerary.id
        WHERE itinerary.id = @itineraryId AND itinerary.user_id = @userId
      `),
    pool.request()
      .input('itineraryId', sql.BigInt, itineraryId)
      .input('userId', sql.Int, userId)
      .query<ManagedItineraryItemRow>(`
        SELECT item.day_number, item.item_key, CONVERT(VARCHAR(5), item.scheduled_time, 108) AS scheduled_time,
               item.item_type, item.title, item.description, item.location, item.image_url,
               item.estimated_cost, item.catalog_place_id, item.unit_price, item.quantity,
               item.duration_minutes
        FROM dbo.itinerary_items AS item
        INNER JOIN dbo.itineraries AS itinerary ON itinerary.id = item.itinerary_id
        WHERE item.itinerary_id = @itineraryId AND itinerary.user_id = @userId
        ORDER BY item.day_number, item.sequence_number
      `),
  ]);
  const itinerary = itineraryResult.recordset[0];
  if (!itinerary) return null;

  return {
    id: itinerary.id,
    title: itinerary.title,
    status: itinerary.status,
    startDate: itinerary.startDate,
    dayCount: itinerary.dayCount,
    guestCount: itinerary.guestCount,
    budget: Number(itinerary.budget),
    estimatedTotal: Number(itinerary.estimatedTotal),
    budgetStatus: itinerary.budgetStatus,
    items: itemsResult.recordset.map((item) => ({
      id: item.item_key,
      day: item.day_number,
      time: item.scheduled_time,
      title: item.title,
      description: item.description,
      type: item.item_type,
      ...(item.location === null ? {} : { location: item.location }),
      ...(item.image_url === null ? {} : { imageUrl: item.image_url }),
      estimatedCost: Number(item.estimated_cost),
      ...(item.catalog_place_id === null ? {} : { catalogPlaceId: item.catalog_place_id }),
      unitPrice: Number(item.unit_price),
      quantity: item.quantity,
      ...(item.duration_minutes === null ? {} : { durationMinutes: item.duration_minutes }),
    })),
  };
}

export async function updateManagedItinerary(
  itineraryId: number,
  userId: number,
  update: ManagedItineraryUpdate,
): Promise<boolean> {
  const transaction = new sql.Transaction(getPool());
  await transaction.begin();
  try {
    const currentResult = await new sql.Request(transaction)
      .input('itineraryId', sql.BigInt, itineraryId)
      .input('userId', sql.Int, userId)
      .query<{ generation_input_json: string }>(`
        SELECT generation_input_json
        FROM dbo.itineraries WITH (UPDLOCK, HOLDLOCK)
        WHERE id = @itineraryId AND user_id = @userId
      `);
    const current = currentResult.recordset[0];
    if (!current) {
      await transaction.rollback();
      return false;
    }

    const inputJson = JSON.parse(current.generation_input_json) as Record<string, unknown>;
    const nextInput = {
      ...inputJson,
      startDate: update.startDate,
      days: update.dayCount,
      guestCount: update.guestCount,
      budget: update.budget,
    };
    const itemCosts = {
      accommodation: 0,
      food: 0,
      transport: 0,
      attractions: 0,
      entertainment: 0,
    };
    for (const item of update.items) {
      itemCosts[item.type === 'hotel' ? 'accommodation' : item.type === 'attraction' ? 'attractions' : item.type] += item.unitPrice * item.quantity;
    }
    const contingency = Math.ceil(update.budget * 0.08);
    const estimatedTotal = Object.values(itemCosts).reduce((sum, cost) => sum + cost, contingency);
    const remainingBudget = update.budget - estimatedTotal;
    const budgetStatus = remainingBudget >= 0 ? 'within-budget' : 'over-budget';

    await new sql.Request(transaction)
      .input('itineraryId', sql.BigInt, itineraryId)
      .input('userId', sql.Int, userId)
      .input('title', sql.NVarChar(200), update.title)
      .input('inputJson', sql.NVarChar(sql.MAX), JSON.stringify(nextInput))
      .input('startDate', sql.Date, new Date(`${update.startDate}T00:00:00.000Z`))
      .input('dayCount', sql.TinyInt, update.dayCount)
      .input('guestCount', sql.Int, update.guestCount)
      .query(`
        UPDATE dbo.itineraries
        SET title = @title, generation_input_json = @inputJson, start_date = @startDate,
            day_count = @dayCount, guest_count = @guestCount, updated_at = SYSUTCDATETIME()
        WHERE id = @itineraryId AND user_id = @userId
      `);
    await new sql.Request(transaction)
      .input('itineraryId', sql.BigInt, itineraryId)
      .query('DELETE FROM dbo.itinerary_items WHERE itinerary_id = @itineraryId');

    for (const [index, item] of update.items.entries()) {
      await new sql.Request(transaction)
        .input('itineraryId', sql.BigInt, itineraryId)
        .input('dayNumber', sql.TinyInt, item.day)
        .input('sequenceNumber', sql.SmallInt, index + 1)
        .input('itemKey', sql.NVarChar(100), item.id)
        .input('scheduledTime', sql.VarChar(5), item.time)
        .input('itemType', sql.NVarChar(20), item.type)
        .input('title', sql.NVarChar(300), item.title)
        .input('description', sql.NVarChar(2000), item.description)
        .input('location', sql.NVarChar(500), item.location ?? null)
        .input('imageUrl', sql.NVarChar(1000), item.imageUrl ?? null)
        .input('estimatedCost', sql.Decimal(18, 2), item.unitPrice * item.quantity)
        .input('catalogPlaceId', sql.Int, item.catalogPlaceId ?? null)
        .input('unitPrice', sql.Decimal(18, 2), item.unitPrice)
        .input('quantity', sql.Int, item.quantity)
        .input('durationMinutes', sql.SmallInt, item.durationMinutes ?? null)
        .query(`
          INSERT INTO dbo.itinerary_items
            (itinerary_id, day_number, sequence_number, item_key, scheduled_time, item_type,
             title, description, location, image_url, estimated_cost, catalog_place_id,
             unit_price, quantity, duration_minutes)
          VALUES
            (@itineraryId, @dayNumber, @sequenceNumber, @itemKey, @scheduledTime, @itemType,
             @title, @description, @location, @imageUrl, @estimatedCost, @catalogPlaceId,
             @unitPrice, @quantity, @durationMinutes)
        `);
    }
    await new sql.Request(transaction)
      .input('itineraryId', sql.BigInt, itineraryId)
      .input('budget', sql.Decimal(18, 2), update.budget)
      .input('estimatedTotal', sql.Decimal(18, 2), estimatedTotal)
      .input('remainingBudget', sql.Decimal(18, 2), remainingBudget)
      .input('overBudgetAmount', sql.Decimal(18, 2), Math.max(-remainingBudget, 0))
      .input('budgetStatus', sql.NVarChar(20), budgetStatus)
      .input('accommodationCost', sql.Decimal(18, 2), itemCosts.accommodation)
      .input('foodCost', sql.Decimal(18, 2), itemCosts.food)
      .input('transportCost', sql.Decimal(18, 2), itemCosts.transport)
      .input('attractionsCost', sql.Decimal(18, 2), itemCosts.attractions)
      .input('entertainmentCost', sql.Decimal(18, 2), itemCosts.entertainment)
      .input('contingencyCost', sql.Decimal(18, 2), contingency)
      .query(`
        UPDATE dbo.itinerary_budgets
        SET budget_amount = @budget, estimated_total = @estimatedTotal,
            remaining_budget = @remainingBudget, over_budget_amount = @overBudgetAmount,
            budget_status = @budgetStatus, accommodation_cost = @accommodationCost,
            food_cost = @foodCost, transport_cost = @transportCost,
            attractions_cost = @attractionsCost, entertainment_cost = @entertainmentCost,
            contingency_cost = @contingencyCost
        WHERE itinerary_id = @itineraryId
      `);
    await transaction.commit();
    return true;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error('Không thể hoàn tác transaction cập nhật lịch trình:', rollbackError);
    }
    throw error;
  }
}

export async function deleteManagedItinerary(itineraryId: number, userId: number): Promise<boolean> {
  const result = await getPool()
    .request()
    .input('itineraryId', sql.BigInt, itineraryId)
    .input('userId', sql.Int, userId)
    .query(`
      DELETE FROM dbo.itineraries
      WHERE id = @itineraryId AND user_id = @userId
    `);
  return result.rowsAffected[0] === 1;
}

export async function saveDraftItinerary(
  input: GenerateItineraryInput,
  output: GeneratedItinerary,
  userId: number,
): Promise<{ itineraryId: number; trainingExampleId: number }> {
  const transaction = new sql.Transaction(getPool());
  await transaction.begin();

  try {
    const itineraryResult = await new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .input('title', sql.NVarChar(200), `Lịch trình Đà Nẵng ${input.startDate}`)
      .input('inputJson', sql.NVarChar(sql.MAX), JSON.stringify(input))
      .input('noticesJson', sql.NVarChar(sql.MAX), JSON.stringify(output.notices))
      .input('recommendationsJson', sql.NVarChar(sql.MAX), JSON.stringify(output.recommendations))
      .input('algorithmVersion', sql.NVarChar(50), 'db-catalog-draft-v3')
      .input('generatedAt', sql.DateTime2, new Date(output.generatedAt))
      .input('startDate', sql.Date, new Date(`${input.startDate}T00:00:00.000Z`))
      .input('dayCount', sql.TinyInt, input.days)
      .input('guestCount', sql.Int, input.guestCount)
      .input('needsJson', sql.NVarChar(sql.MAX), JSON.stringify(input.needs))
      .query<{ id: number }>(`
        INSERT INTO dbo.itineraries
          (user_id, title, status, generation_input_json, notices_json, recommendations_json,
           algorithm_version, generated_at, start_date, day_count, guest_count, needs_json)
        OUTPUT INSERTED.id
        VALUES
          (@userId, @title, N'DRAFT', @inputJson, @noticesJson, @recommendationsJson,
           @algorithmVersion, @generatedAt, @startDate, @dayCount, @guestCount, @needsJson)
      `);
    const itineraryId = itineraryResult.recordset[0]?.id;
    if (itineraryId === undefined) throw new Error('Không nhận được mã lịch trình sau khi lưu.');

    for (const day of output.days) {
      for (const [index, item] of day.items.entries()) {
        const unitPrice = item.unitPrice ?? item.estimatedCost / input.guestCount;
        await new sql.Request(transaction)
          .input('itineraryId', sql.BigInt, itineraryId)
          .input('dayNumber', sql.TinyInt, day.day)
          .input('sequenceNumber', sql.SmallInt, index + 1)
          .input('itemKey', sql.NVarChar(100), item.id)
          .input('scheduledTime', sql.VarChar(5), item.time)
          .input('itemType', sql.NVarChar(20), item.type)
          .input('title', sql.NVarChar(300), item.title)
          .input('description', sql.NVarChar(2000), item.description)
          .input('location', sql.NVarChar(500), item.location ?? null)
          .input('imageUrl', sql.NVarChar(1000), item.imageUrl ?? null)
          .input('estimatedCost', sql.Decimal(18, 2), item.estimatedCost)
          .input('catalogPlaceId', sql.Int, item.catalogPlaceId ?? null)
          .input('unitPrice', sql.Decimal(18, 2), unitPrice)
          .input('quantity', sql.Int, item.quantity ?? input.guestCount)
          .input('durationMinutes', sql.SmallInt, item.durationMinutes ?? null)
          .query(`
            INSERT INTO dbo.itinerary_items
              (itinerary_id, day_number, sequence_number, item_key, scheduled_time, item_type,
               title, description, location, image_url, estimated_cost, catalog_place_id,
               unit_price, quantity, duration_minutes)
            VALUES
              (@itineraryId, @dayNumber, @sequenceNumber, @itemKey, @scheduledTime, @itemType,
               @title, @description, @location, @imageUrl, @estimatedCost, @catalogPlaceId,
               @unitPrice, @quantity, @durationMinutes)
          `);
      }
    }

    const costs = output.summary.costs;
    await new sql.Request(transaction)
      .input('itineraryId', sql.BigInt, itineraryId)
      .input('budget', sql.Decimal(18, 2), output.summary.budget)
      .input('estimatedTotal', sql.Decimal(18, 2), output.summary.estimatedTotal)
      .input('remainingBudget', sql.Decimal(18, 2), output.summary.remainingBudget)
      .input('overBudgetAmount', sql.Decimal(18, 2), output.summary.overBudgetAmount)
      .input('budgetStatus', sql.NVarChar(20), output.summary.budgetStatus)
      .input('accommodationCost', sql.Decimal(18, 2), costs.accommodation)
      .input('foodCost', sql.Decimal(18, 2), costs.food)
      .input('transportCost', sql.Decimal(18, 2), costs.transport)
      .input('attractionsCost', sql.Decimal(18, 2), costs.attractions)
      .input('entertainmentCost', sql.Decimal(18, 2), costs.entertainment)
      .input('contingencyCost', sql.Decimal(18, 2), costs.contingency)
      .query(`
        INSERT INTO dbo.itinerary_budgets
          (itinerary_id, budget_amount, estimated_total, remaining_budget, over_budget_amount,
           budget_status, accommodation_cost, food_cost, transport_cost, attractions_cost,
           entertainment_cost, contingency_cost)
        VALUES
          (@itineraryId, @budget, @estimatedTotal, @remainingBudget, @overBudgetAmount,
           @budgetStatus, @accommodationCost, @foodCost, @transportCost, @attractionsCost,
           @entertainmentCost, @contingencyCost)
      `);

    const trainingResult = await new sql.Request(transaction)
      .input('inputJson', sql.NVarChar(sql.MAX), JSON.stringify(input))
      .input('outputJson', sql.NVarChar(sql.MAX), JSON.stringify(output))
      .input('algorithmVersion', sql.NVarChar(50), 'db-catalog-draft-v3')
      .query<{ id: number }>(`
        INSERT INTO dbo.itinerary_training_data (input_json, output_json, algorithm_version)
        OUTPUT INSERTED.id
        VALUES (@inputJson, @outputJson, @algorithmVersion)
      `);
    const trainingExampleId = trainingResult.recordset[0]?.id;
    if (trainingExampleId === undefined) throw new Error('Không nhận được mã dữ liệu huấn luyện sau khi lưu.');

    await transaction.commit();
    return { itineraryId, trainingExampleId };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error('Không thể hoàn tác transaction tạo lịch trình:', rollbackError);
    }
    throw error;
  }
}
