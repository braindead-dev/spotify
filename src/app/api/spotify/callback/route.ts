import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = (await cookies()).get("spotify_oauth_state")?.value;
  const isProd = process.env.NODE_ENV === "production";

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/spotify/callback`
    : `http://localhost:3000/api/spotify/callback`;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
    // next: { revalidate: 0 }, // no cache
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  const data = (await tokenRes.json()) as {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token: string;
  };

  const cookieStore = await cookies();
  const now = Date.now();
  const expiresAt = now + data.expires_in * 1000 - 60 * 1000; // minus 1 minute buffer

  cookieStore.set("spotify_access_token", data.access_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: data.expires_in,
  });
  cookieStore.set("spotify_refresh_token", data.refresh_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  cookieStore.set("spotify_token_expires_at", String(expiresAt), {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  // clear oauth state cookie
  cookieStore.set("spotify_oauth_state", "", { path: "/", maxAge: 0 });

  return NextResponse.redirect(new URL("/", url.origin));
}
