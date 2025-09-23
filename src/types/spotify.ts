export type Track = {
  name: string;
  artists: string; // currently comma-separated string. TODO: array for per-artist linking
  album: string;
  albumImageUrl?: string;
  url?: string; // track url
  artistUrl?: string; // primary artist url
  albumUrl?: string;
};

export type NowPlaying = {
  authenticated: boolean;
  isPlaying: boolean;
  track?: Track | null;
  progressMs?: number;
  durationMs?: number;
};
