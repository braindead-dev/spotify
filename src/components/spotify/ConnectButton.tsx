"use client";

import { Button } from "@/components/ui/button";
import { FaSpotify } from "react-icons/fa";

export function ConnectButton() {
  return (
    <Button
      onClick={() => {
        window.location.href = "/api/spotify/login";
      }}
      variant="fancy"
      className="px-2 py-1"
    >
      Connect to Spotify
      <FaSpotify className="text-green-500 -ml-0.5" />
    </Button>
  );
}
