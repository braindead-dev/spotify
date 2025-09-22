"use client";

import { useCallback, useEffect, useState } from "react";
import type { NowPlaying } from "@/types/spotify";

export function useNowPlaying(pollMs: number = 5000) {
  const [data, setData] = useState<NowPlaying | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchNowPlaying = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/spotify/now-playing", {
        cache: "no-store",
      });
      const json = (await res.json()) as NowPlaying;
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNowPlaying();
    const id = setInterval(fetchNowPlaying, pollMs);
    return () => clearInterval(id);
  }, [fetchNowPlaying, pollMs]);

  const connected = !!data?.authenticated;

  return {
    data,
    loading,
    refresh: fetchNowPlaying,
    connected,
  } as const;
}
