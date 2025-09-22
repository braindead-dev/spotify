"use client";

import Image from "next/image";
import type { NowPlaying } from "@/types/spotify";
import Link from "next/link";

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
        <Link href={track.albumUrl || "#"}>
          <Image
            src={track.albumImageUrl}
            alt={track.album}
            width={200}
            height={200}
            className="block mx-auto mb-3"
            unoptimized
          />
        </Link>
      ) : null}

      <p className="text-lg font-semibold">
        {track.url ? (
          <Link href={track.url} target="_blank" rel="noreferrer">
            {track.name}
          </Link>
        ) : (
          track.name
        )}
      </p>

      <p>
        {track.artistUrl ? (
          <Link href={track.artistUrl} target="_blank" rel="noreferrer">
            {track.artists}
          </Link>
        ) : (
          track.artists
        )}
      </p>

      <p className="text-gray-500">
        {track.albumUrl ? (
          <Link href={track.albumUrl} target="_blank" rel="noreferrer">
            {track.album}
          </Link>
        ) : (
          track.album
        )}
      </p>
    </div>
  );
}
