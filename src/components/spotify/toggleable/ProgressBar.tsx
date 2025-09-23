"use client";

import React, { useEffect, useRef, useState } from "react";

type ProgressBarProps = {
  progressMs: number | null | undefined;
  durationMs: number | null | undefined;
  isLightBg: boolean;
  className?: string;
  isPlaying?: boolean;
};

export function ProgressBar({
  progressMs,
  durationMs,
  isLightBg,
  className,
  isPlaying = false,
}: ProgressBarProps) {
  const disabled = progressMs == null || durationMs == null;

  // Local progress that advances smoothly between polls
  const progressRef = useRef<number>(progressMs ?? 0);
  const durationRef = useRef<number>(durationMs ?? 0);
  const rafIdRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const [renderPct, setRenderPct] = useState<number>(
    Math.max(
      0,
      Math.min(100, ((progressMs ?? 0) / Math.max(1, durationMs ?? 0)) * 100),
    ),
  );

  // Sync refs on prop changes
  useEffect(() => {
    durationRef.current = durationMs ?? 0;
  }, [durationMs]);

  useEffect(() => {
    // On each poll, reset local progress to source of truth
    progressRef.current = progressMs ?? 0;
    const pct = Math.max(
      0,
      Math.min(
        100,
        (progressRef.current / Math.max(1, durationRef.current)) * 100,
      ),
    );
    setRenderPct(pct);
    // Reset timing baseline so we don't double-count since last frame
    lastTsRef.current = null;
  }, [progressMs]);

  // Drive local smooth progress while playing
  useEffect(() => {
    if (!isPlaying || disabled) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      lastTsRef.current = null;
      return;
    }

    const tick = (ts: number) => {
      const last = lastTsRef.current;
      lastTsRef.current = ts;
      if (last != null) {
        const deltaMs = ts - last; // rAF timestamp is in ms
        progressRef.current = Math.min(
          durationRef.current,
          Math.max(0, progressRef.current + deltaMs),
        );
        const pct = Math.max(
          0,
          Math.min(
            100,
            (progressRef.current / Math.max(1, durationRef.current)) * 100,
          ),
        );
        setRenderPct(pct);
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      lastTsRef.current = null;
    };
  }, [isPlaying, disabled]);

  if (disabled) return null;

  return (
    <div className={"mx-auto my-2 w-56 sm:w-64 " + (className ?? "")}>
      <div
        className={
          "h-[3px] w-full rounded-full " +
          (isLightBg ? "bg-black/20" : "bg-white/30")
        }
      >
        <div
          className={`h-full rounded-full ${isLightBg ? "bg-black/70" : "bg-white/80"}`}
          style={{ width: `${renderPct}%` }}
        />
      </div>
    </div>
  );
}
