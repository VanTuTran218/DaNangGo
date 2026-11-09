"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export function useAiAction<T>() {
  const [data, setData] = useState<T | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const current = useRef<AbortController | null>(null);
  const clear = useCallback(() => {
    current.current?.abort();
    setData(null);
    setError("");
    setLoading(false);
  }, []);
  useEffect(() => () => current.current?.abort(), []);
  const run = useCallback(async (work: (signal: AbortSignal) => Promise<T>) => {
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const value = await work(controller.signal);
      if (!controller.signal.aborted) {
        setData(value);
        return value;
      }
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(
          failure instanceof Error && failure.name === "ApiError"
            ? failure.message
            : "Chưa thể xử lý lúc này. Bạn vui lòng thử lại.",
        );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
    return null;
  }, []);
  return { data, loading, error, run, clear };
}
