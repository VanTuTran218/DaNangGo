"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getManagedItineraries,
  deleteManagedItinerary,
  type ManagedItineraryListItem,
} from "@/lib/api/itineraries";

export function useItineraries() {
  const [itineraries, setItineraries] = useState<ManagedItineraryListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItineraries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getManagedItineraries();
      setItineraries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách lịch trình.");
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItinerary = useCallback(async (id: number | string) => {
    try {
      await deleteManagedItinerary(String(id));
      setItineraries((prev) => prev.filter((item) => String(item.id) !== String(id)));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa lịch trình.");
      return false;
    }
  }, []);

  useEffect(() => {
    void fetchItineraries();
  }, [fetchItineraries]);

  return {
    itineraries,
    loading,
    error,
    refresh: fetchItineraries,
    removeItinerary,
  };
}
