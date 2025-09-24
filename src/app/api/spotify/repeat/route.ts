import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/spotifyServer";

// Accepts state: "off" | "context" | "track"
export async function PUT(req: Request) {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { ok: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    let state: "off" | "context" | "track" | null = null;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as { state?: string };
      if (
        body.state === "off" ||
        body.state === "context" ||
        body.state === "track"
      ) {
        state = body.state;
      }
    }
    if (state === null) {
      const url = new URL(req.url);
      const q = url.searchParams.get("state");
      if (q === "off" || q === "context" || q === "track") state = q;
    }

    if (state === null) {
      return NextResponse.json(
        {
          ok: false,
          message: "Missing or invalid 'state' (off|context|track)",
        },
        { status: 400 },
      );
    }

    const apiUrl = `https://api.spotify.com/v1/me/player/repeat?state=${state}`;
    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, message: "Failed to set repeat" },
        { status: res.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 },
    );
  }
}
