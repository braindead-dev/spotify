import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!tokenRes.ok) {
    throw new Error("Failed to refresh token");
  }

  return tokenRes.json() as Promise<{
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
  }>;
}

export async function GET() {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  let accessToken = cookieStore.get("spotify_access_token")?.value;
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value;
  const expiresAtStr = cookieStore.get("spotify_token_expires_at")?.value;
  const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;

  if (!refreshToken) {
    return NextResponse.json({
      authenticated: false,
      message: "Not connected to Spotify",
    });
  }

  const now = Date.now();
  if (!accessToken || now >= expiresAt) {
    try {
      const refreshed = await refreshAccessToken(refreshToken);
      accessToken = refreshed.access_token;

      const newExpiresAt = Date.now() + refreshed.expires_in * 1000 - 60 * 1000;
      cookieStore.set("spotify_access_token", accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: refreshed.expires_in,
      });
      cookieStore.set("spotify_token_expires_at", String(newExpiresAt), {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      if (refreshed.refresh_token) {
        cookieStore.set("spotify_refresh_token", refreshed.refresh_token, {
          httpOnly: true,
          secure: isProd,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
      }
    } catch (err) {
      console.error("Failed to refresh Spotify token", err);
      // Clear invalid tokens so user can re-authenticate
      cookieStore.delete("spotify_access_token");
      cookieStore.delete("spotify_refresh_token");
      cookieStore.delete("spotify_token_expires_at");
      return NextResponse.json(
        { authenticated: false, message: "Failed to refresh token" },
        { status: 401 },
      );
    }
  }

  const res = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      // next: { revalidate: 0 },
    },
  );

  if (res.status === 204) {
    return NextResponse.json({ authenticated: true, isPlaying: false });
  }

  if (!res.ok) {
    // Log the error for debugging
    const errorText = await res.text().catch(() => "Unable to read error");
    console.error(
      `Spotify API error: ${res.status} ${res.statusText}`,
      errorText,
    );

    // 403 typically means the user doesn't have Spotify Premium
    if (res.status === 403) {
      return NextResponse.json(
        {
          authenticated: true,
          isPlaying: false,
          error: "PREMIUM_REQUIRED",
          message:
            "Spotify Premium is required to use the Web Playback API. Free accounts cannot access currently playing information.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { authenticated: true, isPlaying: false },
      { status: res.status },
    );
  }

  const data = await res.json();

  // Fetch overall player state to obtain shuffle and repeat modes
  let shuffleState: boolean | undefined = undefined;
  let repeatState: "off" | "context" | "track" | undefined = undefined;
  try {
    const stateRes = await fetch("https://api.spotify.com/v1/me/player", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (stateRes.ok) {
      const stateJson = (await stateRes.json()) as {
        shuffle_state?: boolean;
        repeat_state?: "off" | "context" | "track";
      };
      if (typeof stateJson.shuffle_state === "boolean") {
        shuffleState = stateJson.shuffle_state;
      }
      if (
        stateJson.repeat_state === "off" ||
        stateJson.repeat_state === "context" ||
        stateJson.repeat_state === "track"
      ) {
        repeatState = stateJson.repeat_state;
      }
    }
  } catch {}
  const item = data.item;
  const progressMs = (data.progress_ms as number | undefined) ?? undefined;
  const durationMs = (item?.duration_ms as number | undefined) ?? undefined;

  const nowPlaying = item
    ? {
        id: item.id as string | undefined,
        name: item.name as string,
        artists: (item.artists || [])
          .map((a: { name: string }) => a.name)
          .join(", "),
        album: item.album?.name as string,
        albumImageUrl: item.album?.images?.[0]?.url as string | undefined,
        url: item.external_urls?.spotify as string | undefined,
        artistUrl: (item.artists?.[0]?.external_urls?.spotify ?? undefined) as
          | string
          | undefined,
        albumUrl: (item.album?.external_urls?.spotify ?? undefined) as
          | string
          | undefined,
      }
    : null;

  return NextResponse.json({
    authenticated: true,
    isPlaying: Boolean(data.is_playing),
    track: nowPlaying,
    progressMs,
    durationMs,
    shuffleState,
    repeatState,
  });
}
