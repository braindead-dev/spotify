import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function generateRandomString(length: number) {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export async function GET() {
  const isProd = process.env.NODE_ENV === "production";
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const redirectUri = process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/spotify/callback`
    : `http://localhost:3000/api/spotify/callback`;

  const scope = [
    "user-read-currently-playing",
    "user-read-playback-state",
  ].join(" ");

  const state = generateRandomString(16);

  // Store state in cookie to validate later
  (await cookies()).set("spotify_oauth_state", state, {
    httpOnly: true,
    secure: isProd,
    path: "/",
    maxAge: 300, // 5 minutes
    sameSite: "lax",
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope,
    redirect_uri: redirectUri,
    state,
  });

  const authorizeUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  return NextResponse.redirect(authorizeUrl);
}
