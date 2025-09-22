"use client";

import { Button } from "@/components/ui/button";
import { FaSpotify } from "react-icons/fa";
import { Attribution } from "@/components/site/attribution";

export function ConnectButton() {
  return (
    <>
      <Button
        onClick={() => {
          window.location.href = "/api/spotify/login";
        }}
        variant="fancy"
        className="px-2 py-1"
      >
        Connect to Spotify
        <FaSpotify className="-ml-0.5 text-green-500" />
      </Button>
      <div className="absolute right-4 bottom-4">
        <Attribution />
      </div>
    </>
  );
}
