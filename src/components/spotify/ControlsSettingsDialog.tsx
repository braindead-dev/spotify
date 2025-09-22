"use client";

import { IoIosSettings } from "react-icons/io";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  controlsEnabled: boolean;
  onChange: (enabled: boolean) => void;
  gradientEnabled: boolean;
  onChangeGradient: (enabled: boolean) => void;
};

export function ControlsSettingsDialog({
  controlsEnabled,
  onChange,
  gradientEnabled,
  onChangeGradient,
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
            Enable playback controls
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={gradientEnabled}
              onChange={(e) => onChangeGradient(e.target.checked)}
            />
            Enable animated gradient background
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
