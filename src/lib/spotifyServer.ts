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

export async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  let accessToken = cookieStore.get("spotify_access_token")?.value;
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value;
  const expiresAtStr = cookieStore.get("spotify_token_expires_at")?.value;
  const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;

  if (!refreshToken) return null;

  const now = Date.now();
  if (!accessToken || now >= expiresAt) {
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
  }

  return accessToken ?? null;
}
