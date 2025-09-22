"use client";

import { useEffect, useState } from "react";
import { Attribution } from "@/components/site/attribution";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import { ConnectButton } from "@/components/spotify/ConnectButton";
import { NowPlayingCard } from "@/components/spotify/NowPlayingCard";

export default function Home() {
  const { data, loading, connected } = useNowPlaying(5000);
  const [gradientEnabled, setGradientEnabled] = useState<boolean>(false);

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
        g.initGradient("#gradient-canvas", fallback.getRandomGradient());
      } catch {
        console.warn(
          "Gradient engine not found. Copy chroma-ai gradient files to enable.",
        );
      }
    };
    init();
  }, [gradientEnabled, connected]);

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
      <div className="fixed right-4 bottom-4 z-50 hidden md:block">
        <Attribution />
      </div>
    </main>
  );
}
