"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NowPlaying } from "@/types/spotify";

export function useNowPlaying(pollMs: number = 2000) {
  const [data, setData] = useState<NowPlaying | null>(null);
  const [loading, setLoading] = useState(false);
  // Track if we've ever been authenticated to prevent flickering back to sign-in
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

  const fetchNowPlaying = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/spotify/now-playing", {
        cache: "no-store",
      });
      const json = (await res.json()) as NowPlaying;

      // Only update data if we got a valid response
      // If authenticated is false and we were previously authenticated,
      // only disconnect if it's a 401 (token refresh failed)
      if (json.authenticated) {
        setData(json);
        setWasAuthenticated(true);
      } else if (!wasAuthenticated || res.status === 401) {
        // Only set unauthenticated state if:
        // 1. We were never authenticated, OR
        // 2. We got a 401 (token refresh failed)
        setData(json);
        setWasAuthenticated(false);
      }
      // Otherwise, keep the previous data to avoid flickering
    } catch (e) {
      console.error(e);
      // On network errors, keep the previous state
    } finally {
      setLoading(false);
    }
  }, [wasAuthenticated]);

  useEffect(() => {
    fetchNowPlaying();
    const id = setInterval(fetchNowPlaying, pollMs);
    return () => clearInterval(id);
  }, [fetchNowPlaying, pollMs]);

  // Also refetch right when the current track is expected to end
  const endTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
    if (
      !data?.isPlaying ||
      data.progressMs == null ||
      data.durationMs == null
    ) {
      return;
    }
    const remaining = Math.max(0, data.durationMs - data.progressMs);
    // Add a small buffer to let Spotify update server-side state
    const buffer = 250;
    endTimerRef.current = window.setTimeout(
      () => {
        fetchNowPlaying();
      },
      Math.max(0, remaining + buffer),
    );
    return () => {
      if (endTimerRef.current) {
        clearTimeout(endTimerRef.current);
        endTimerRef.current = null;
      }
    };
  }, [data?.isPlaying, data?.progressMs, data?.durationMs, fetchNowPlaying]);

  const connected = !!data?.authenticated;

  return {
    data,
    loading,
    refresh: fetchNowPlaying,
    connected,
  } as const;
}
