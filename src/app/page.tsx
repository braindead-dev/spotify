"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FaSpotify } from "react-icons/fa";
import { Attribution } from "@/components/site/attribution";

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
          <Button
            onClick={() => {
              window.location.href = "/api/spotify/login";
            }}
            variant="fancy"
            className="px-2 py-1"
          >
            Connect to Spotify
            <FaSpotify className="text-green-500 -ml-0.5" />
          </Button>
        ) : (
          <div className="text-center">
            {loading && !data ? (
              <p>...</p>
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
                <p className="text-lg font-semibold">
                  {data.track.url ? (
                    <a
                      href={data.track.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {data.track.name}
                    </a>
                  ) : (
                    data.track.name
                  )}
                </p>
                <p>
                  {data.track.url ? (
                    <a
                      href={data.track.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {data.track.artists}
                    </a>
                  ) : (
                    data.track.artists
                  )}
                </p>
                <p className="text-gray-500">
                  {data.track.url ? (
                    <a
                      href={data.track.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {data.track.album}
                    </a>
                  ) : (
                    data.track.album
                  )}
                </p>
              </div>
            ) : (
              <p>Not playing anything right now.</p>
            )}
          </div>
        )}
      </div>
      <div className="fixed right-4 bottom-4 z-50 hidden md:block">
        <Attribution />
      </div>
    </main>
  );
}
