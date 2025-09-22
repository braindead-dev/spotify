"use client";

import { useEffect, useState } from "react";

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
      const res = await fetch("/api/spotify/now-playing", { cache: "no-store" });
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
    <main style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        {!connected ? (
          <a href="/api/spotify/login" style={{ padding: "10px 16px", border: "1px solid #ccc", borderRadius: 6 }}>Connect to Spotify</a>
        ) : (
          <div style={{ textAlign: "center" }}>
            {loading && !data ? (
              <p>Loading...</p>
            ) : data && data.isPlaying && data.track ? (
              <div>
                {data.track.albumImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.track.albumImageUrl}
                    alt={data.track.album}
                    width={200}
                    height={200}
                    style={{ display: "block", margin: "0 auto 12px" }}
                  />
                ) : null}
                <p style={{ fontSize: 18, fontWeight: 600 }}>{data.track.name}</p>
                <p>{data.track.artists}</p>
                <p style={{ color: "#666" }}>{data.track.album}</p>
                {data.track.url ? (
                  <p style={{ marginTop: 8 }}>
                    <a href={data.track.url} target="_blank" rel="noreferrer">Open in Spotify</a>
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
