"use client";

import { useEffect, useState } from "react";
import type { NowPlaying } from "@/types/spotify";

export type UsePlaybackControlsOptions = {
  data: NowPlaying | null;
  controlsEnabled: boolean;
  advancedPlaybackEnabled: boolean;
  refresh?: () => void;
};

export function usePlaybackControls({
  data,
  controlsEnabled,
  advancedPlaybackEnabled,
  refresh,
}: UsePlaybackControlsOptions) {
  // Local optimistic states that sync back to polled data
  const [localIsPlaying, setLocalIsPlaying] = useState<boolean | null>(
    data?.isPlaying ?? null,
  );
  const [localShuffleState, setLocalShuffleState] = useState<boolean | null>(
    data?.shuffleState ?? null,
  );
  const [localRepeatState, setLocalRepeatState] = useState<
    "off" | "context" | "track" | null
  >(data?.repeatState ?? null);

  // Sync with polled data
  useEffect(() => {
    setLocalIsPlaying(data?.isPlaying ?? null);
  }, [data?.isPlaying]);

  useEffect(() => {
    setLocalShuffleState(data?.shuffleState ?? null);
  }, [data?.shuffleState]);

  useEffect(() => {
    setLocalRepeatState(data?.repeatState ?? null);
  }, [data?.repeatState]);

  const isPlaying = localIsPlaying != null ? localIsPlaying : !!data?.isPlaying;
  const shuffleOn =
    localShuffleState != null ? localShuffleState : !!data?.shuffleState;
  const repeatState = localRepeatState ?? data?.repeatState;
  const repeatOneOn = repeatState === "track";
  const repeatOn = repeatState === "context" || repeatOneOn;

  const onTogglePlayPause = async () => {
    if (!controlsEnabled) return;
    try {
      setLocalIsPlaying(!isPlaying);
      const route = isPlaying ? "/api/spotify/pause" : "/api/spotify/play";
      await fetch(route, { method: "PUT" });
      if (refresh) {
        refresh();
        setTimeout(() => refresh(), 300);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onPrev = async () => {
    try {
      await fetch("/api/spotify/previous", { method: "POST" });
      if (refresh) setTimeout(() => refresh(), 300);
    } catch (e) {
      console.error(e);
    }
  };

  const onNext = async () => {
    try {
      await fetch("/api/spotify/next", { method: "POST" });
      if (refresh) setTimeout(() => refresh(), 300);
    } catch (e) {
      console.error(e);
    }
  };

  const onToggleShuffle = async () => {
    if (!controlsEnabled || !advancedPlaybackEnabled) return;
    try {
      setLocalShuffleState(!shuffleOn);
      await fetch("/api/spotify/shuffle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: !shuffleOn }),
      });
      if (refresh) {
        refresh();
        setTimeout(() => refresh(), 300);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onCycleRepeat = async () => {
    if (!controlsEnabled || !advancedPlaybackEnabled) return;
    try {
      const current: "off" | "context" | "track" = repeatState ?? "off";
      const next: "off" | "context" | "track" =
        current === "off" ? "context" : current === "context" ? "track" : "off";
      setLocalRepeatState(next);
      await fetch("/api/spotify/repeat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: next }),
      });
      if (refresh) {
        refresh();
        setTimeout(() => refresh(), 300);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return {
    isPlaying,
    shuffleOn,
    repeatState,
    repeatOneOn,
    repeatOn,
    onTogglePlayPause,
    onPrev,
    onNext,
    onToggleShuffle,
    onCycleRepeat,
  } as const;
}
