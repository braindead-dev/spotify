"use client";

import { useEffect, useState } from "react";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import { ConnectButton } from "@/components/spotify/ConnectButton";
import { NowPlayingCard } from "@/components/spotify/NowPlayingCard";
import { extractDistinctPaletteFromImage } from "@/lib/colorExtract";

export default function Home() {
  const { data, loading, connected } = useNowPlaying(5000);
  const [gradientEnabled, setGradientEnabled] = useState<boolean>(false);
  const [gradientColors, setGradientColors] = useState<string[] | null>(null);

  // Read persisted gradient toggle on mount
  useEffect(() => {
    try {
      const storedGrad = localStorage.getItem("gradientEnabled");
      if (storedGrad !== null) setGradientEnabled(storedGrad === "true");
    } catch {}
  }, []);

  // Persist gradient toggle
  useEffect(() => {
    try {
      localStorage.setItem("gradientEnabled", String(gradientEnabled));
    } catch {}
  }, [gradientEnabled]);

  // Compute colors from the current album cover when enabled/changed
  useEffect(() => {
    const url = data?.track?.albumImageUrl;
    if (!gradientEnabled || !connected || !url) {
      setGradientColors(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const colors = await extractDistinctPaletteFromImage(url, {
        desiredCount: 4,
        thresholds: [0.1, 0.05, 0.02, 0.005, 0],
        sampleSize: 100,
        minSaturation: 0.05,
      });
      if (cancelled) return;
      if (colors && colors.length > 0) {
        // Ensure 4 colors by padding with the first one if necessary
        const padded = [...colors];
        while (padded.length < 4) padded.push(padded[0]);
        setGradientColors(padded.slice(0, 4));
      } else {
        setGradientColors(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gradientEnabled, connected, data?.track?.albumImageUrl]);

  // Initialize full-page gradient when enabled
  useEffect(() => {
    if (!gradientEnabled || !connected) return;
    const init = async () => {
      try {
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
        const colors = gradientColors ?? fallback.getRandomGradient();
        g.initGradient("#gradient-canvas", colors);
      } catch {
        console.warn(
          "Gradient engine not found. Copy chroma-ai gradient files to enable.",
        );
      }
    };
    init();
  }, [gradientEnabled, connected, gradientColors, data?.track?.albumImageUrl]);

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      {gradientEnabled && connected && (
        <canvas
          id="gradient-canvas"
          className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
          data-transition-in
        />
      )}
      <div className="flex flex-col items-center gap-4">
        {!connected ? (
          <ConnectButton />
        ) : (
          <NowPlayingCard
            data={data}
            loading={loading}
            gradientEnabled={gradientEnabled}
            onChangeGradient={setGradientEnabled}
          />
        )}
      </div>
    </main>
  );
}
