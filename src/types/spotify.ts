export type Track = {
  id?: string;
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
  shuffleState?: boolean; // true if shuffle is on
  repeatState?: "off" | "context" | "track"; // Spotify repeat modes
  error?: string; // Error code (e.g., "PREMIUM_REQUIRED")
  message?: string; // Human-readable error message
};
