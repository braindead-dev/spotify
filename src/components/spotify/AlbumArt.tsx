"use client";

import Image from "next/image";
import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { IoIosPause, IoIosPlay } from "react-icons/io";
import { PlaybackControls } from "@/components/spotify/toggleable/PlaybackControls";

export type AlbumArtProps = {
  imageUrl?: string | null;
  albumAlt?: string;
  isLightBg: boolean;
  transitionsEnabled: boolean;
  controlsEnabled: boolean;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  // Prev/next controls
  showTransportControls: boolean;
  onPrev: () => void | Promise<void>;
  onNext: () => void | Promise<void>;
  prevLoading?: boolean;
  nextLoading?: boolean;
};

export function AlbumArt({
  imageUrl,
  albumAlt,
  isLightBg,
  transitionsEnabled,
  controlsEnabled,
  isPlaying,
  onTogglePlayPause,
  showTransportControls,
  onPrev,
  onNext,
  prevLoading,
  nextLoading,
}: AlbumArtProps) {
  if (!imageUrl) return null;
  return (
    <div className="relative inline-block">
      <div className="group relative mx-auto h-[200px] w-[200px]">
        {transitionsEnabled ? (
          <AnimatePresence mode="sync">
            <motion.div
              key={imageUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: (t: number) => t }}
              className="absolute inset-0"
            >
              <Image
                src={imageUrl}
                alt={albumAlt ?? "album"}
                fill
                priority
                className={`rounded-lg ${isLightBg ? "" : "shadow-xl"}`}
                style={{ objectFit: "cover" }}
                unoptimized
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <>
            <Image
              src={imageUrl}
              alt={albumAlt ?? "album"}
              fill
              priority
              className={`rounded-lg ${isLightBg ? "" : "shadow-xl"}`}
              style={{ objectFit: "cover" }}
              unoptimized
            />
          </>
        )}
        {controlsEnabled && (
          <div
            className={`absolute inset-0 z-10 flex items-center justify-center rounded-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
              isLightBg
                ? "bg-neutral-50/40 text-black"
                : "drop-shadow-sm-dark bg-neutral-800/40 text-white"
            }`}
          >
            <button
              onClick={onTogglePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
              className={`cursor-pointer ${
                isLightBg ? "drop-shadow-xs drop-shadow-white" : ""
              }`}
            >
              {isPlaying ? <IoIosPause size={32} /> : <IoIosPlay size={32} />}
            </button>
          </div>
        )}
      </div>
      {controlsEnabled && showTransportControls && (
        <PlaybackControls
          onPrev={onPrev}
          onNext={onNext}
          prevLoading={prevLoading}
          nextLoading={nextLoading}
          isLightBg={isLightBg}
        />
      )}
    </div>
  );
}
