import type { GeneratedItinerary, ItineraryRequest } from '@/types/itinerary';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

interface GenerateResponse {
  success: boolean;
  data?: Omit<GeneratedItinerary, 'trainingExampleId'>;
  trainingExampleId?: number;
  message?: string;
}

export async function generateItinerary(input: ItineraryRequest): Promise<GeneratedItinerary> {
  const accessToken = typeof window === 'undefined' ? null : window.localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/itineraries`, {
    method: 'POST',
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
  if (!accessToken) return [];

  const response = await fetch(`${API_URL}/itineraries/preferences`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const result = await response.json() as {
    success: boolean;
    data?: { preferences?: string[] };
    message?: string;
  };
  if (!response.ok || !result.success || !Array.isArray(result.data?.preferences)) {
    throw new Error(result.message ?? 'Không thể tải sở thích đã lưu.');
  }
  return result.data.preferences;
}
