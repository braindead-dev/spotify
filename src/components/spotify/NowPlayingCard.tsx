"use client";

import Image from "next/image";
import type { NowPlaying } from "@/types/spotify";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ControlsSettingsDialog } from "@/components/spotify/ControlsSettingsDialog";
import { PlaybackControls } from "@/components/spotify/toggleable/PlaybackControls";
import { ProgressBar } from "@/components/spotify/toggleable/ProgressBar";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatePresence, motion } from "motion/react";
import { useBackgroundLightness } from "@/hooks/useBackgroundLightness";
import {
  getAlbumClasses,
  getArtistLinkClasses,
  getTitleClasses,
} from "@/lib/textClasses";

type Props = {
  data: NowPlaying | null;
  loading: boolean;
  gradientEnabled?: boolean;
  gradientColors?: string[] | null;
  onChangeGradient?: (enabled: boolean) => void;
  refresh?: () => void;
  progressBarEnabled?: boolean;
  onChangeProgressBar?: (enabled: boolean) => void;
  transitionsEnabled?: boolean;
  onChangeTransitions?: (enabled: boolean) => void;
};

export function NowPlayingCard({
  data,
  loading,
  gradientEnabled = false,
  gradientColors = null,
  onChangeGradient = () => {},
  refresh,
  progressBarEnabled = true,
  onChangeProgressBar = () => {},
  transitionsEnabled = true,
  onChangeTransitions = () => {},
}: Props) {
  const [prevLoading, setPrevLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [controlsEnabled, setControlsEnabled] = useState<boolean>(false);
  const [displayedTrack, setDisplayedTrack] = useState(data?.track ?? null);
  const [fading, setFading] = useState(false);
  const fadeTimerRef = useRef<number | null>(null);
  const LIGHTNESS_THRESHOLD = 0.75; // 0..1 range; treat backgrounds brighter than this as "light"
  // Safe album image URL for effects; do not rely on early returns
  const albumImageUrl = data?.track?.albumImageUrl ?? null;
  useEffect(() => {
    try {
      const stored = localStorage.getItem("controlsEnabled");
      if (stored !== null) setControlsEnabled(stored === "true");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("controlsEnabled", String(controlsEnabled));
    } catch {}
  }, [controlsEnabled]);

  const onPrev = async () => {
    try {
      setPrevLoading(true);
      await fetch("/api/spotify/previous", { method: "POST" });
      // Give Spotify a moment to switch, then refresh now playing
      if (refresh) setTimeout(() => refresh(), 300);
    } catch (error) {
      console.error(error);
    } finally {
      setPrevLoading(false);
    }
  };

  const onNext = async () => {
    try {
      setNextLoading(true);
      await fetch("/api/spotify/next", { method: "POST" });
      // Give Spotify a moment to switch, then refresh now playing
      if (refresh) setTimeout(() => refresh(), 300);
    } catch (error) {
      console.error(error);
    } finally {
      setNextLoading(false);
    }
  };
  // Fade-out current text when track changes, then swap to next
  useEffect(() => {
    const newTrack = data?.track ?? null;
    const currentId = displayedTrack?.id ?? displayedTrack?.name ?? null;
    const incomingId = newTrack?.id ?? newTrack?.name ?? null;
    if (!incomingId && !currentId) return; // nothing to show
    if (incomingId === currentId) return; // same track

    try {
      console.groupCollapsed(
        "[NowPlaying] Track change -> current:%s incoming:%s",
        currentId,
        incomingId,
      );
      console.debug("prev", {
        id: displayedTrack?.id,
        name: displayedTrack?.name,
        album: displayedTrack?.album,
        albumImageUrl: displayedTrack?.albumImageUrl,
        artists: displayedTrack?.artists,
      });
      console.debug("next", {
        id: newTrack?.id,
        name: newTrack?.name,
        album: newTrack?.album,
        albumImageUrl: newTrack?.albumImageUrl,
        artists: newTrack?.artists,
      });
      console.groupEnd();
    } catch {}

    if (transitionsEnabled && displayedTrack) {
      setFading(true);
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      fadeTimerRef.current = window.setTimeout(() => {
        setDisplayedTrack(newTrack);
        setFading(false);
        fadeTimerRef.current = null;
      }, 200);
    } else {
      setDisplayedTrack(newTrack);
    }
    // cleanup on unmount
    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    };
  }, [data?.track, displayedTrack, transitionsEnabled]);

  const { isLightBg } = useBackgroundLightness(albumImageUrl, gradientEnabled, {
    threshold: LIGHTNESS_THRESHOLD,
    gradientColors,
  });

  if (loading && !data) {
    return <p>...</p>;
  }

  if (!data || !displayedTrack) {
    return <p>Not playing anything right now.</p>;
  }

  const track = displayedTrack;

  const titleClasses = getTitleClasses(isLightBg);
  const artistLinkClasses = getArtistLinkClasses(isLightBg);
  const albumClasses = getAlbumClasses(isLightBg);

  return (
    <div className="relative text-center">
      <ControlsSettingsDialog
        controlsEnabled={controlsEnabled}
        onChange={setControlsEnabled}
        gradientEnabled={gradientEnabled}
        onChangeGradient={onChangeGradient}
        progressBarEnabled={progressBarEnabled}
        onChangeProgressBar={onChangeProgressBar}
        transitionsEnabled={transitionsEnabled}
        onChangeTransitions={onChangeTransitions}
      />
      {track.albumImageUrl ? (
        <div className="relative inline-block">
          <Link
            href={track.albumUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            {transitionsEnabled ? (
              <div className="relative mx-auto h-[200px] w-[200px]">
                <AnimatePresence mode="sync">
                  <motion.div
                    key={track.albumImageUrl}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: (t: number) => t }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={track.albumImageUrl}
                      alt={track.album}
                      fill
                      priority
                      className={`rounded-lg ${isLightBg ? "" : "shadow-xl"}`}
                      style={{ objectFit: "cover" }}
                      unoptimized
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <Image
                src={track.albumImageUrl}
                alt={track.album}
                width={200}
                height={200}
                priority
                className={`mx-auto block rounded-lg ${isLightBg ? "" : "shadow-xl"}`}
                unoptimized
              />
            )}
          </Link>
          {controlsEnabled && (
            <PlaybackControls
              onPrev={onPrev}
              onNext={onNext}
              prevLoading={prevLoading}
              nextLoading={nextLoading}
              isLightBg={isLightBg}
            />
          )}
        </div>
      ) : null}

      {/* Thin progress bar under the album art */}
      {progressBarEnabled && (
        <ProgressBar
          progressMs={data?.progressMs}
          durationMs={data?.durationMs}
          isLightBg={isLightBg}
          isPlaying={!!data?.isPlaying}
        />
      )}

      <div
        className={`transition-opacity duration-200 ${fading ? "opacity-0" : "opacity-100"}`}
      >
        <p className={titleClasses}>
          {track.url ? (
            <Link
              href={track.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 hover:underline"
            >
              {transitionsEnabled ? (
                <TextEffect
                  key={`title-${track.id ?? track.name}`}
                  as="span"
                  per="char"
                  preset="fade"
                  trigger={transitionsEnabled}
                >
                  {track.name}
                </TextEffect>
              ) : (
                track.name
              )}
            </Link>
          ) : transitionsEnabled ? (
            <TextEffect
              key={`title-${track.id ?? track.name}`}
              as="span"
              per="char"
              preset="fade"
              trigger={transitionsEnabled}
            >
              {track.name}
            </TextEffect>
          ) : (
            track.name
          )}
        </p>

        <p>
          {track.artistUrl ? (
            <Link
              href={track.artistUrl}
              target="_blank"
              rel="noreferrer"
              className={artistLinkClasses}
            >
              {transitionsEnabled ? (
                <TextEffect
                  key={`artists-${track.id ?? track.name}`}
                  as="span"
                  per="char"
                  preset="fade"
                  trigger={transitionsEnabled}
                >
                  {track.artists}
                </TextEffect>
              ) : (
                track.artists
              )}
            </Link>
          ) : transitionsEnabled ? (
            <TextEffect
              key={`artists-${track.id ?? track.name}`}
              as="span"
              per="char"
              preset="fade"
              trigger={transitionsEnabled}
            >
              {track.artists}
            </TextEffect>
          ) : (
            track.artists
          )}
        </p>

        <p className={albumClasses}>
          {track.albumUrl ? (
            <Link
              href={track.albumUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {transitionsEnabled ? (
                <TextEffect
                  key={`album-${track.id ?? track.name}`}
                  as="span"
                  per="char"
                  preset="fade"
                  trigger={transitionsEnabled}
                >
                  {track.album}
                </TextEffect>
              ) : (
                track.album
              )}
            </Link>
          ) : transitionsEnabled ? (
            <TextEffect
              key={`album-${track.id ?? track.name}`}
              as="span"
              per="char"
              preset="fade"
              trigger={transitionsEnabled}
            >
              {track.album}
            </TextEffect>
          ) : (
            track.album
          )}
        </p>
      </div>
    </div>
  );
}
