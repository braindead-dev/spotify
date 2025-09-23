"use client";

import Image from "next/image";
import type { NowPlaying } from "@/types/spotify";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ControlsSettingsDialog } from "@/components/spotify/ControlsSettingsDialog";
import { PlaybackControls } from "@/components/spotify/toggleable/PlaybackControls";
import { ProgressBar } from "@/components/spotify/toggleable/ProgressBar";
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
  onChangeGradient?: (enabled: boolean) => void;
  refresh?: () => void;
  progressBarEnabled?: boolean;
  onChangeProgressBar?: (enabled: boolean) => void;
};

export function NowPlayingCard({
  data,
  loading,
  gradientEnabled = false,
  onChangeGradient = () => {},
  refresh,
  progressBarEnabled = true,
  onChangeProgressBar = () => {},
}: Props) {
  const [prevLoading, setPrevLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [controlsEnabled, setControlsEnabled] = useState<boolean>(false);
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
  const { isLightBg } = useBackgroundLightness(albumImageUrl, gradientEnabled, {
    threshold: LIGHTNESS_THRESHOLD,
  });

  if (loading && !data) {
    return <p>...</p>;
  }

  if (!data || !data.isPlaying || !data.track) {
    return <p>Not playing anything right now.</p>;
  }

  const track = data.track;

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
      />
      {track.albumImageUrl ? (
        <div className="relative inline-block">
          <Link
            href={track.albumUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            <Image
              src={track.albumImageUrl}
              alt={track.album}
              width={200}
              height={200}
              className="mx-auto block rounded-lg"
              unoptimized
            />
          </Link>
          {controlsEnabled && (
            <PlaybackControls
              onPrev={onPrev}
              onNext={onNext}
              prevLoading={prevLoading}
              nextLoading={nextLoading}
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
        />
      )}

      <p className={titleClasses}>
        {track.url ? (
          <Link
            href={track.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 hover:underline"
          >
            {track.name}
          </Link>
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
            {track.artists}
          </Link>
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
            {track.album}
          </Link>
        ) : (
          track.album
        )}
      </p>
    </div>
  );
}
