"use client";

import React from "react";
import { MdSkipNext, MdSkipPrevious } from "react-icons/md";

type PlaybackControlsProps = {
  onPrev: () => void | Promise<void>;
  onNext: () => void | Promise<void>;
  prevLoading?: boolean;
  nextLoading?: boolean;
};

export function PlaybackControls({
  onPrev,
  onNext,
  prevLoading,
  nextLoading,
}: PlaybackControlsProps) {
  return (
    <>
      <button
        aria-label="Previous"
        onClick={onPrev}
        disabled={!!prevLoading}
        className="drop-shadow-xs-dark absolute top-1/2 -left-12 -translate-y-1/2 cursor-pointer text-white disabled:opacity-50 sm:-left-24"
      >
        <MdSkipPrevious size={24} />
      </button>
      <button
        aria-label="Next"
        onClick={onNext}
        disabled={!!nextLoading}
        className="drop-shadow-xs-dark absolute top-1/2 -right-12 -translate-y-1/2 cursor-pointer text-white disabled:opacity-50 sm:-right-24"
      >
        <MdSkipNext size={24} />
      </button>
    </>
  );
}
