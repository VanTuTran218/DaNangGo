import type { GeneratedItinerary, ItineraryRequest } from '@/types/itinerary';

function getItineraryApiUrl(endpoint: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
  const prefix = base.endsWith('/api') ? base : `${base}/api`;
  return `${prefix}${endpoint}`;
}

interface GenerateResponse {
  success: boolean;
  data?: Omit<GeneratedItinerary, 'trainingExampleId'>;
  trainingExampleId?: number;
  message?: string;
}

export async function generateItinerary(input: ItineraryRequest): Promise<GeneratedItinerary> {
  const accessToken = typeof window === 'undefined' ? null : window.localStorage.getItem('accessToken');
  const response = await fetch(getItineraryApiUrl('/itineraries'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(input),
  });

  const result = await response.json() as GenerateResponse;

  if (!response.ok || !result.success || !result.data || result.trainingExampleId === undefined) {
    throw new Error(result.message ?? 'Không thể kết nối máy chủ để tạo lịch trình.');
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
