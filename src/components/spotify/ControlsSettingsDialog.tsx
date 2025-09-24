"use client";

import { IoIosSettings } from "react-icons/io";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Button } from "../ui/button";

type Props = {
  controlsEnabled: boolean;
  onChange: (enabled: boolean) => void;
  gradientEnabled: boolean;
  onChangeGradient: (enabled: boolean) => void;
  progressBarEnabled: boolean;
  onChangeProgressBar: (enabled: boolean) => void;
  transitionsEnabled: boolean;
  onChangeTransitions: (enabled: boolean) => void;
  advancedPlaybackEnabled?: boolean;
  onChangeAdvancedPlaybackEnabled?: (enabled: boolean) => void;
};

export function ControlsSettingsDialog({
  controlsEnabled,
  onChange,
  gradientEnabled,
  onChangeGradient,
  progressBarEnabled,
  onChangeProgressBar,
  transitionsEnabled,
  onChangeTransitions,
  advancedPlaybackEnabled = false,
  onChangeAdvancedPlaybackEnabled = () => {},
}: Props) {
  return (
    <Dialog>
      <DialogTrigger className="fixed top-4 right-4 cursor-pointer rounded-full p-1 text-neutral-600 hover:text-neutral-900">
        <IoIosSettings size={18} aria-hidden />
        <span className="sr-only">Settings</span>
      </DialogTrigger>
      <DialogContent className="w-[320px] p-4">
        <div className="p-3">
          <DialogTitle className="mb-1">Settings</DialogTitle>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={controlsEnabled}
              onChange={(e) => onChange(e.target.checked)}
            />
            Enable playback controls (premium)
          </label>
          {progressBarEnabled ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={advancedPlaybackEnabled}
                onChange={(e) =>
                  onChangeAdvancedPlaybackEnabled(e.target.checked)
                }
              />
              Advanced playback controls
            </label>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={gradientEnabled}
              onChange={(e) => onChangeGradient(e.target.checked)}
            />
            Enable animated gradient background
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={progressBarEnabled}
              onChange={(e) => onChangeProgressBar(e.target.checked)}
            />
            Show progress bar
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={transitionsEnabled}
              onChange={(e) => onChangeTransitions(e.target.checked)}
            />
            Animated transitions
          </label>
        </div>
        <div className="mt-1 flex justify-center gap-1 text-xs">
          <Link href="/api/spotify/logout">
            <Button variant="fancy" className="mb-2 px-2 py-0.5 text-xs">
              Log out of Spotify
            </Button>
          </Link>
        </div>
        <div className="flex justify-center gap-1 text-xs">
          <span>made with ❤️ by </span>
          <Link
            href="https://henr.ee"
            target="_blank"
            rel="noreferrer"
            className="text-blue-900 hover:underline"
          >
            henr.ee
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
