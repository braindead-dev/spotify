"use client";

import Image from "next/image";
import type { NowPlaying } from "@/types/spotify";

type Props = {
  data: NowPlaying | null;
  loading: boolean;
};

export function NowPlayingCard({ data, loading }: Props) {
  if (loading && !data) {
    return <p>...</p>;
  }

  if (!data || !data.isPlaying || !data.track) {
    return <p>Not playing anything right now.</p>;
  }

  const track = data.track;

  return (
    <div className="text-center">
      {track.albumImageUrl ? (
        <Image
          src={track.albumImageUrl}
          alt={track.album}
          width={200}
          height={200}
          className="block mx-auto mb-3"
          unoptimized
        />
      ) : null}

      <p className="text-lg font-semibold">
        {track.url ? (
          <a
            href={track.url}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            {track.name}
          </a>
        ) : (
          track.name
        )}
      </p>

      <p>
        {track.artistUrl ? (
          <a
            href={track.artistUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            {track.artists}
          </a>
        ) : (
          track.artists
        )}
      </p>

      <p className="text-gray-500">
        {track.albumUrl ? (
          <a
            href={track.albumUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            {track.album}
          </a>
        ) : (
          track.album
        )}
      </p>
    </div>
  );
}
