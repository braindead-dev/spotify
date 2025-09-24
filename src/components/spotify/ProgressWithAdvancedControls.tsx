"use client";

import React from "react";
import { ProgressBar } from "@/components/spotify/toggleable/ProgressBar";
import { TbArrowsShuffle, TbRepeat, TbRepeatOnce } from "react-icons/tb";

export type ProgressWithAdvancedControlsProps = {
  progressMs?: number | null;
  durationMs?: number | null;
  isLightBg: boolean;
  isPlaying: boolean;
  advancedPlaybackEnabled: boolean;
  // State
  shuffleOn: boolean;
  repeatOn: boolean;
  repeatOneOn: boolean;
  // Actions
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
};

export function ProgressWithAdvancedControls({
  progressMs,
  durationMs,
  isLightBg,
  isPlaying,
  advancedPlaybackEnabled,
  shuffleOn,
  repeatOn,
  repeatOneOn,
  onToggleShuffle,
  onCycleRepeat,
}: ProgressWithAdvancedControlsProps) {
  return (
    <div className="relative mx-auto w-56 sm:w-64">
      {advancedPlaybackEnabled && (
        <button
          aria-label="Shuffle"
          className={`absolute top-1/2 -left-8 -translate-y-1/2 cursor-pointer ${
            isLightBg ? "text-black" : "drop-shadow-sm-dark text-white"
          }`}
          onClick={onToggleShuffle}
        >
          <span className="relative inline-flex translate-y-0.5 items-center">
            <TbArrowsShuffle size={16} />
            {shuffleOn && (
              <span
                className={`absolute top-full left-1/2 mt-0.5 size-1 -translate-x-1/2 rounded-full ${
                  isLightBg ? "bg-black/80" : "bg-white/90"
                }`}
              />
            )}
          </span>
        </button>
      )}
      <ProgressBar
        progressMs={progressMs ?? null}
        durationMs={durationMs ?? null}
        isLightBg={isLightBg}
        isPlaying={isPlaying}
      />
      {advancedPlaybackEnabled && (
        <button
          aria-label="Repeat"
          className={`absolute top-1/2 -right-8 -translate-y-1/2 cursor-pointer ${
            isLightBg ? "text-black" : "drop-shadow-sm-dark text-white"
          }`}
          onClick={onCycleRepeat}
        >
          <span className="relative inline-flex translate-y-0.5 items-center">
            {repeatOneOn ? <TbRepeatOnce size={16} /> : <TbRepeat size={16} />}
            {repeatOn && (
              <span
                className={`absolute top-full left-1/2 mt-0.5 size-1 -translate-x-1/2 rounded-full ${
                  isLightBg ? "bg-black/80" : "bg-white/90"
                }`}
              />
            )}
          </span>
        </button>
      )}
    </div>
  );
}
