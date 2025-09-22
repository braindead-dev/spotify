import { useEffect, useMemo, useState } from "react";
import { computeImageLightness } from "@/lib/computeImageLightness";

export function useBackgroundLightness(
  albumImageUrl: string | null,
  gradientEnabled: boolean,
  options?: { threshold?: number },
) {
  const threshold = options?.threshold ?? 0.75;
  const [lightness, setLightness] = useState<number | null>(null);

  useEffect(() => {
    let canceled = false;
    async function run() {
      if (!albumImageUrl) {
        setLightness(null);
        return;
      }
      const lum = await computeImageLightness(albumImageUrl);
      if (!canceled) setLightness(lum);
    }
    run();
    return () => {
      canceled = true;
    };
  }, [albumImageUrl]);

  const isLightBg = useMemo(() => {
    if (!gradientEnabled) return true; // gradient off => treat as light (use black text)
    if (lightness == null) return false; // unknown => assume dark to keep contrast
    return lightness >= threshold;
  }, [gradientEnabled, lightness, threshold]);

  return { isLightBg, lightness };
}
