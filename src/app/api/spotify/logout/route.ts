import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const cookieStore = await cookies();

  // Clear auth-related cookies
  const opts = { path: "/", maxAge: 0 } as const;
  cookieStore.set("spotify_access_token", "", opts);
  cookieStore.set("spotify_refresh_token", "", opts);
  cookieStore.set("spotify_token_expires_at", "", opts);
  cookieStore.set("spotify_oauth_state", "", opts);

  // Optionally, also clear client-side preferences by hinting the client
  // (kept simple with a redirect here)
  return NextResponse.redirect(new URL("/", url.origin));
}
