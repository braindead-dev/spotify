import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/spotifyServer";

export async function PUT() {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const res = await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    let details: unknown = null;
    try {
      const text = await res.text();
      try {
        details = JSON.parse(text);
      } catch {
        details = text;
      }
    } catch {}
    return NextResponse.json(
      { error: "Failed to start/resume playback", details },
      { status: res.status },
    );
  }

  return NextResponse.json({ ok: true });
}
