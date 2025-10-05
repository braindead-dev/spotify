"use client";

import type { NowPlaying } from "@/types/spotify";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ControlsSettingsDialog } from "@/components/spotify/ControlsSettingsDialog";
import { TextEffect } from "@/components/ui/text-effect";
import { useBackgroundLightness } from "@/hooks/useBackgroundLightness";
import {
  getAlbumClasses,
  getArtistLinkClasses,
  getTitleClasses,
} from "@/lib/textClasses";
import { usePlaybackControls } from "@/hooks/usePlaybackControls";
import { ProgressWithAdvancedControls } from "@/components/spotify/ProgressWithAdvancedControls";
import { AlbumArt } from "@/components/spotify/AlbumArt";

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
  controlsEnabled?: boolean;
  onChangeControlsEnabled?: (enabled: boolean) => void;
  advancedPlaybackEnabled?: boolean;
  onChangeAdvancedPlaybackEnabled?: (enabled: boolean) => void;
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
  controlsEnabled = false,
  onChangeControlsEnabled = () => {},
  advancedPlaybackEnabled = false,
  onChangeAdvancedPlaybackEnabled = () => {},
}: Props) {
  const [prevLoading, setPrevLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [displayedTrack, setDisplayedTrack] = useState(data?.track ?? null);
  const [fading, setFading] = useState(false);
  const fadeTimerRef = useRef<number | null>(null);
  // Playback controls & optimistic UI are managed by a dedicated hook
  const {
    isPlaying,
    shuffleOn,
    repeatOn,
    repeatOneOn,
    onTogglePlayPause,
    onToggleShuffle,
    onCycleRepeat,
  } = usePlaybackControls({
    data,
    controlsEnabled,
    advancedPlaybackEnabled,
    refresh,
  });
  const LIGHTNESS_THRESHOLD = 0.75; // 0..1 range; treat backgrounds brighter than this as "light"
  // Safe album image URL for effects; do not rely on early returns
  const albumImageUrl = data?.track?.albumImageUrl ?? null;

  // Hook above keeps local state in sync

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

  // Show premium required error if present
  if (data?.error === "PREMIUM_REQUIRED") {
    return (
      <div className="max-w-md space-y-4 text-center">
        <p className="text-xl font-semibold">🎵 Spotify Premium Required</p>
        <p className="text-sm opacity-80">
          {data.message ||
            "This visualizer requires Spotify Premium to access playback information."}
        </p>
        <p className="text-xs opacity-60">
          Free Spotify accounts don&apos;t have access to the Web Playback API.
          Upgrade to Premium to use this feature.
        </p>
      </div>
    );
  }

  if (!data || !displayedTrack) {
    return <p>Not playing anything right now.</p>;
  }

  const track = displayedTrack;

  const titleClasses = getTitleClasses(isLightBg);
  const artistLinkClasses = getArtistLinkClasses(isLightBg);
  const albumClasses = getAlbumClasses(isLightBg);
  // isPlaying and handlers come from hook

  return (
    <div className="relative text-center">
      <ControlsSettingsDialog
        controlsEnabled={controlsEnabled}
        onChange={onChangeControlsEnabled}
        gradientEnabled={gradientEnabled}
        onChangeGradient={onChangeGradient}
        progressBarEnabled={progressBarEnabled}
        onChangeProgressBar={onChangeProgressBar}
        transitionsEnabled={transitionsEnabled}
        onChangeTransitions={onChangeTransitions}
        advancedPlaybackEnabled={advancedPlaybackEnabled}
        onChangeAdvancedPlaybackEnabled={onChangeAdvancedPlaybackEnabled}
      />
      {track.albumImageUrl ? (
        <AlbumArt
          imageUrl={track.albumImageUrl}
          albumAlt={track.album}
          isLightBg={isLightBg}
          transitionsEnabled={transitionsEnabled}
          controlsEnabled={controlsEnabled}
          isPlaying={isPlaying}
          onTogglePlayPause={onTogglePlayPause}
          showTransportControls={controlsEnabled}
          onPrev={onPrev}
          onNext={onNext}
          prevLoading={prevLoading}
          nextLoading={nextLoading}
        />
      ) : null}

      {/* Thin progress bar under the album art */}
      {progressBarEnabled && (
        <ProgressWithAdvancedControls
          progressMs={data?.progressMs}
          durationMs={data?.durationMs}
          isLightBg={isLightBg}
          isPlaying={isPlaying}
          advancedPlaybackEnabled={advancedPlaybackEnabled}
          shuffleOn={!!shuffleOn}
          repeatOn={!!repeatOn}
          repeatOneOn={!!repeatOneOn}
          onToggleShuffle={onToggleShuffle}
          onCycleRepeat={onCycleRepeat}
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
