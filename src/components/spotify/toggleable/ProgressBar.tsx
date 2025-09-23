"use client";

import React from "react";

type ProgressBarProps = {
  progressMs: number | null | undefined;
  durationMs: number | null | undefined;
  isLightBg: boolean;
  className?: string;
};

export function ProgressBar({
  progressMs,
  durationMs,
  isLightBg,
  className,
}: ProgressBarProps) {
  if (progressMs == null || durationMs == null) return null;
  const pct = Math.max(
    0,
    Math.min(100, (progressMs / Math.max(1, durationMs)) * 100),
  );
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
          style={{ width: `${pct}%`, transition: "width 200ms linear" }}
        />
      </div>
    </div>
  );
}
