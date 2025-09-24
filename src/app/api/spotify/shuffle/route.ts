import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/spotifyServer";

export async function PUT(req: Request) {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { ok: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let state: boolean | null = null;
    if (contentType.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as { state?: boolean };
      if (typeof body.state === "boolean") state = body.state;
    }
    // Fallback: allow query param ?state=true|false
    if (state === null) {
      const url = new URL(req.url);
      const q = url.searchParams.get("state");
      if (q === "true") state = true;
      if (q === "false") state = false;
    }

    if (state === null) {
      return NextResponse.json(
        { ok: false, message: "Missing or invalid 'state' (boolean)" },
        { status: 400 },
      );
    }

    const apiUrl = `https://api.spotify.com/v1/me/player/shuffle?state=${state}`;
    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, message: "Failed to set shuffle" },
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
