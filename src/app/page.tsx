"use client";

import { Attribution } from "@/components/site/attribution";
import { useNowPlaying } from "@/hooks/useNowPlaying";
import { ConnectButton } from "@/components/spotify/ConnectButton";
import { NowPlayingCard } from "@/components/spotify/NowPlayingCard";

export default function Home() {
  const { data, loading, connected } = useNowPlaying(5000);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        {!connected ? (
          <ConnectButton />
        ) : (
          <NowPlayingCard data={data} loading={loading} />
        )}
      </div>
      <div className="fixed right-4 bottom-4 z-50 hidden md:block">
        <Attribution />
      </div>
    </main>
  );
}
