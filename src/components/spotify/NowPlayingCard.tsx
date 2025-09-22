"use client";

import Image from "next/image";
import type { NowPlaying } from "@/types/spotify";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MdSkipNext, MdSkipPrevious } from "react-icons/md";
import { ControlsSettingsDialog } from "@/components/spotify/ControlsSettingsDialog";

type Props = {
  data: NowPlaying | null;
  loading: boolean;
  gradientEnabled?: boolean;
  onChangeGradient?: (enabled: boolean) => void;
};

export function NowPlayingCard({
  data,
  loading,
  gradientEnabled = false,
  onChangeGradient = () => {},
}: Props) {
  const [prevLoading, setPrevLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [controlsEnabled, setControlsEnabled] = useState<boolean>(false);
  const [bgLightness, setBgLightness] = useState<number | null>(null);
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
    } catch (error) {
      console.error(error);
    } finally {
      setNextLoading(false);
    }
  };
  // Compute an approximate background lightness from the album art when available
  useEffect(() => {
    let canceled = false;
    async function computeLightnessFromImage(url: string) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = document.createElement("img");
          i.crossOrigin = "anonymous";
          i.decoding = "async";
          i.onload = () => resolve(i);
          i.onerror = reject;
          i.src = url;
        });
        const sample = 32;
        const canvas = document.createElement("canvas");
        const ratio = Math.max(img.naturalWidth, img.naturalHeight) / sample;
        const w = Math.max(1, Math.round(img.naturalWidth / ratio));
        const h = Math.max(1, Math.round(img.naturalHeight / ratio));
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0, w, h);
        let imageData: ImageData;
        try {
          imageData = ctx.getImageData(0, 0, w, h);
        } catch {
          return null; // CORS taint; skip
        }
        const data = imageData.data;
        let sum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 200) continue;
          // Perceived luminance (sRGB approximation)
          const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          sum += lum;
          count++;
        }
        return count ? sum / count : null;
      } catch {
        return null;
      }
    }

    if (albumImageUrl) {
      computeLightnessFromImage(albumImageUrl).then((lum) => {
        if (!canceled) setBgLightness(lum);
      });
    } else {
      setBgLightness(null);
    }
    return () => {
      canceled = true;
    };
  }, [albumImageUrl]);

  if (loading && !data) {
    return <p>...</p>;
  }

  if (!data || !data.isPlaying || !data.track) {
    return <p>Not playing anything right now.</p>;
  }

  const track = data.track;

  const isLightBg = !gradientEnabled
    ? true
    : bgLightness !== null
      ? bgLightness >= LIGHTNESS_THRESHOLD
      : false; // if unknown, assume dark to preserve contrast over gradient

  const titleClasses = isLightBg
    ? "text-lg font-semibold text-black"
    : "text-lg font-semibold text-white drop-shadow-sm-dark";
  const artistLinkClasses = isLightBg
    ? "hover:underline text-black"
    : "hover:underline text-white drop-shadow-sm-dark";
  const albumClasses = isLightBg
    ? "text-neutral-500"
    : "text-neutral-200 drop-shadow-xs-dark";

  return (
    <div className="relative text-center">
      <ControlsSettingsDialog
        controlsEnabled={controlsEnabled}
        onChange={setControlsEnabled}
        gradientEnabled={gradientEnabled}
        onChangeGradient={onChangeGradient}
      />
      {track.albumImageUrl ? (
        <div className="relative mb-3 inline-block">
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
              className="mx-auto block"
              unoptimized
            />
          </Link>
          {controlsEnabled && (
            <>
              <button
                aria-label="Previous"
                onClick={onPrev}
                disabled={prevLoading}
                className="drop-shadow-xs-dark absolute top-1/2 -left-24 -translate-y-1/2 cursor-pointer text-white disabled:opacity-50"
              >
                <MdSkipPrevious size={24} />
              </button>
              <button
                aria-label="Next"
                onClick={onNext}
                disabled={nextLoading}
                className="drop-shadow-xs-dark absolute top-1/2 -right-24 -translate-y-1/2 cursor-pointer text-white disabled:opacity-50"
              >
                <MdSkipNext size={24} />
              </button>
            </>
          )}
        </div>
      ) : null}

      <p className={titleClasses}>
        {track.url ? (
          <Link
            href={track.url}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
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
