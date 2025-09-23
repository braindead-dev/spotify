"use client";

import React from "react";
import { MdSkipNext, MdSkipPrevious } from "react-icons/md";

type PlaybackControlsProps = {
  onPrev: () => void | Promise<void>;
  onNext: () => void | Promise<void>;
  prevLoading?: boolean;
  nextLoading?: boolean;
  isLightBg: boolean;
};

export function PlaybackControls({
  onPrev,
  onNext,
  prevLoading,
  nextLoading,
  isLightBg,
}: PlaybackControlsProps) {
  const colorShadow = isLightBg
    ? "text-black"
    : "text-white drop-shadow-sm-dark";
  return (
    <>
      <button
        aria-label="Previous"
        onClick={onPrev}
        disabled={!!prevLoading}
        className={`absolute top-1/2 -left-12 -translate-y-1/2 cursor-pointer disabled:opacity-50 sm:-left-24 ${colorShadow}`}
      >
        <MdSkipPrevious size={24} />
      </button>
      <button
        aria-label="Next"
        onClick={onNext}
        disabled={!!nextLoading}
        className={`absolute top-1/2 -right-12 -translate-y-1/2 cursor-pointer disabled:opacity-50 sm:-right-24 ${colorShadow}`}
      >
        <MdSkipNext size={24} />
      </button>
    </>
  );
}
