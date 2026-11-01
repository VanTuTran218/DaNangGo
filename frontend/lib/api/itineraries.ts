import type {
  GeneratedItinerary,
  ItineraryFoodSelection,
  ItineraryRequest,
  ItineraryCatalogOption,
  ManagedItinerary,
  ManagedItineraryUpdate,
} from '@/types/itinerary';

function getItineraryApiUrl(endpoint: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
  const prefix = base.endsWith('/api') ? base : `${base}/api`;
  return `${prefix}${endpoint}`;
}

interface GenerateResponse {
  success: boolean;
  data?: GeneratedItinerary;
  trainingExampleId?: number;
  message?: string;
}

export interface ManagedItineraryListItem extends Omit<ManagedItinerary, 'items'> {
  itemCount: number;
  imageUrl: string | null;
}

function getAuthHeaders(): HeadersInit {
  const accessToken = typeof window === 'undefined' ? null : window.localStorage.getItem('accessToken');
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

async function readManagementResponse<T>(response: Response): Promise<T> {
  const result = await response.json() as {
    success: boolean;
    data?: T;
    message?: string;
  };
  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(result.message ?? 'Không thể thực hiện thao tác với lịch trình.');
  }
  return result.data;
}

export async function previewItinerary(input: ItineraryRequest): Promise<GeneratedItinerary> {
  const accessToken = typeof window === 'undefined' ? null : window.localStorage.getItem('accessToken');
  const response = await fetch(getItineraryApiUrl('/itineraries/preview'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(input),
  });

  const result = await response.json() as GenerateResponse;

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message ?? 'Không thể kết nối máy chủ để tạo gợi ý lịch trình.');
  }

  return result.data;
}

export async function saveItinerary(
  input: ItineraryRequest,
  foodSelections: ItineraryFoodSelection[],
): Promise<GeneratedItinerary> {
  const accessToken = typeof window === 'undefined' ? null : window.localStorage.getItem('accessToken');
  const response = await fetch(getItineraryApiUrl('/itineraries'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ ...input, foodSelections }),
  });

  const result = await response.json() as GenerateResponse;

  if (!response.ok || !result.success || !result.data || result.trainingExampleId === undefined) {
    throw new Error(result.message ?? 'Không thể lưu lịch trình đã chọn.');
  }

  return { ...result.data, trainingExampleId: result.trainingExampleId };
}

export async function getSavedItineraryPreferences(): Promise<string[]> {
  const accessToken = typeof window === 'undefined' ? null : window.localStorage.getItem('accessToken');
  try {
    const response = await fetch(getItineraryApiUrl('/itineraries/preferences'), {
      credentials: 'include',
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

    if (response.status === 401) {
      return [];
    }

    const result = await response.json() as {
      success: boolean;
      data?: { preferences?: string[] };
      message?: string;
    };

    if (!response.ok || !result.success || !Array.isArray(result.data?.preferences)) {
      return [];
    }

    return result.data.preferences;
  } catch (error) {
    console.error('Không thể tải sở thích đã lưu:', error);
    return [];
  }
}

export async function getManagedItineraries(): Promise<ManagedItineraryListItem[]> {
  const response = await fetch(getItineraryApiUrl('/itineraries'), {
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  const data = await readManagementResponse<{ itineraries: ManagedItineraryListItem[] }>(response);
  return data.itineraries;
}

export async function getManagedItinerary(itineraryId: string): Promise<ManagedItinerary> {
  const response = await fetch(getItineraryApiUrl(`/itineraries/${encodeURIComponent(itineraryId)}`), {
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  const data = await readManagementResponse<{ itinerary: ManagedItinerary }>(response);
  return data.itinerary;
}

export async function getItineraryActivityOptions(): Promise<ItineraryCatalogOption[]> {
  const response = await fetch(getItineraryApiUrl('/itineraries/options'), {
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  const data = await readManagementResponse<{ options: ItineraryCatalogOption[] }>(response);
  return data.options;
}

export async function updateManagedItinerary(
  itineraryId: string,
  update: ManagedItineraryUpdate,
): Promise<ManagedItinerary> {
  const response = await fetch(getItineraryApiUrl(`/itineraries/${encodeURIComponent(itineraryId)}`), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(update),
  });
  const data = await readManagementResponse<{ itinerary: ManagedItinerary }>(response);
  return data.itinerary;
}

export async function deleteManagedItinerary(itineraryId: string): Promise<void> {
  const response = await fetch(getItineraryApiUrl(`/itineraries/${encodeURIComponent(itineraryId)}`), {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  const result = await response.json() as { success: boolean; message?: string };
  if (!response.ok || !result.success) {
    throw new Error(result.message ?? 'Không thể xóa lịch trình.');
  }
}
