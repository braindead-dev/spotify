"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type NowPlaying = {
  authenticated: boolean;
  isPlaying: boolean;
  track?: {
    name: string;
    artists: string;
    album: string;
    albumImageUrl?: string;
    url?: string;
  } | null;
};

export default function Home() {
  const [data, setData] = useState<NowPlaying | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchNowPlaying = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/spotify/now-playing", {
        cache: "no-store",
      });
      const json = (await res.json()) as NowPlaying;
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNowPlaying();
    const id = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(id);
  }, []);

  const connected = !!data?.authenticated;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        {!connected ? (
          <a
            href="/api/spotify/login"
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            Connect to Spotify
          </a>
        ) : (
          <div className="text-center">
            {loading && !data ? (
              <p>Loading...</p>
            ) : data && data.isPlaying && data.track ? (
              <div>
                {data.track.albumImageUrl ? (
                  <Image
                    src={data.track.albumImageUrl}
                    alt={data.track.album}
                    width={200}
                    height={200}
                    className="block mx-auto mb-3"
                    unoptimized
                  />
                ) : null}
                <p className="text-lg font-semibold">{data.track.name}</p>
                <p>{data.track.artists}</p>
                <p className="text-gray-500">{data.track.album}</p>
                {data.track.url ? (
                  <p className="mt-2">
                    <a href={data.track.url} target="_blank" rel="noreferrer">
                      Open in Spotify
                    </a>
                  </p>
                ) : null}
              </div>
            ) : (
              <p>Not playing anything right now.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
