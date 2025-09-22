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
};

export function NowPlayingCard({ data, loading }: Props) {
  const [prevLoading, setPrevLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [controlsEnabled, setControlsEnabled] = useState<boolean>(false);
  const [gradientEnabled, setGradientEnabled] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("controlsEnabled");
      if (stored !== null) setControlsEnabled(stored === "true");
      const storedGrad = localStorage.getItem("gradientEnabled");
      if (storedGrad !== null) setGradientEnabled(storedGrad === "true");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("controlsEnabled", String(controlsEnabled));
    } catch {}
  }, [controlsEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem("gradientEnabled", String(gradientEnabled));
    } catch {}
  }, [gradientEnabled]);

  // Initialize gradient when enabled
  useEffect(() => {
    if (!gradientEnabled) return;
    // Expect the user to copy gradient engine here: '@/lib/gradient.js'
    // We try to access a global Gradient if present.
    const init = async () => {
      try {
        // Try dynamic import if the module exists
        const mod = (await import("@/lib/gradient.js").catch(() => null)) as {
          Gradient?: new () => {
            initGradient: (selector: string, colors: string[]) => unknown;
          };
        } | null;
        const fallback = (await import("@/lib/defaultGradient.js").catch(
          () => ({
            getRandomGradient: () => [
              "#c3e4ff",
              "#6ec3f4",
              "#eae2ff",
              "#b9beff",
            ],
          }),
        )) as { getRandomGradient: () => string[] };
        type GradientCtor = new () => {
          initGradient: (selector: string, colors: string[]) => unknown;
        };
        const globalGradient = (
          globalThis as unknown as { Gradient?: GradientCtor }
        ).Gradient;
        const Gradient =
          (mod?.Gradient as GradientCtor | undefined) ?? globalGradient;
        if (!Gradient) return;
        const g = new Gradient();
        g.initGradient("#gradient-canvas", fallback.getRandomGradient());
      } catch (e) {
        console.warn(
          "Gradient engine not found. Copy chroma-ai gradient files to enable.",
        );
      }
    };
    init();
    return () => {
      // no-op; the engine manages its own animation loop
    };
  }, [gradientEnabled]);

  const onPrev = async () => {
    try {
      setPrevLoading(true);
      await fetch("/api/spotify/previous", { method: "POST" });
    } catch (e) {
      console.error(e);
    } finally {
      setPrevLoading(false);
    }
  };

  const onNext = async () => {
    try {
      setNextLoading(true);
      await fetch("/api/spotify/next", { method: "POST" });
    } catch (e) {
      console.error(e);
    } finally {
      setNextLoading(false);
    }
  };
  if (loading && !data) {
    return <p>...</p>;
  }

  if (!data || !data.isPlaying || !data.track) {
    return <p>Not playing anything right now.</p>;
  }

  const track = data.track;

  return (
    <div className="relative text-center">
      <ControlsSettingsDialog
        controlsEnabled={controlsEnabled}
        onChange={setControlsEnabled}
        gradientEnabled={gradientEnabled}
        onChangeGradient={setGradientEnabled}
      />
      {gradientEnabled && (
        <canvas
          id="gradient-canvas"
          className={`pointer-events-none absolute inset-0 -z-10 h-full w-full rounded-xl`}
          data-transition-in
        />
      )}
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
            <button
              aria-label="Previous"
              onClick={onPrev}
              disabled={prevLoading}
              className="absolute top-1/2 -left-24 -translate-y-1/2 cursor-pointer disabled:opacity-50"
            >
              <MdSkipPrevious size={24} />
            </button>
          )}
          {controlsEnabled && (
            <button
              aria-label="Next"
              onClick={onNext}
              disabled={nextLoading}
              className="absolute top-1/2 -right-24 -translate-y-1/2 cursor-pointer disabled:opacity-50"
            >
              <MdSkipNext size={24} />
            </button>
          )}
        </div>
      ) : null}

      <p className="text-lg font-semibold">
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
            className="hover:underline"
          >
            {track.artists}
          </Link>
        ) : (
          track.artists
        )}
      </p>

      <p className="text-gray-500">
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
