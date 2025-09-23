import { useEffect, useMemo, useState } from "react";
import { computeImageLightness } from "@/lib/computeImageLightness";

export function useBackgroundLightness(
  albumImageUrl: string | null,
  gradientEnabled: boolean,
  options?: { threshold?: number; gradientColors?: string[] | null },
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

  // Compute average luminance of the selected gradient colors if available
  const colorsLightness = useMemo(() => {
    const colors = options?.gradientColors ?? null;
    if (!colors || colors.length === 0) return null;
    let sum = 0;
    let count = 0;
    for (const c of colors) {
      const lum = hexToLuminance(c);
      if (lum != null) {
        sum += lum;
        count++;
      }
    }
    return count > 0 ? sum / count : null;
  }, [options?.gradientColors]);

  // Consider gradient "active" only if enabled and colors exist
  const gradientActive = useMemo(() => {
    const hasColors = !!(
      options?.gradientColors && options.gradientColors.length > 0
    );
    return gradientEnabled && hasColors;
  }, [gradientEnabled, options?.gradientColors]);

  // Prefer gradient colors' lightness when gradient is active and colors exist
  const effectiveLightness = useMemo(() => {
    if (gradientActive && colorsLightness != null) return colorsLightness;
    return lightness;
  }, [gradientActive, colorsLightness, lightness]);

  const isLightBg = useMemo(() => {
    // If gradient is off OR enabled but not active (no colors), treat as light
    if (!gradientEnabled || !gradientActive) return true;
    if (effectiveLightness == null) return false; // unknown => assume dark to keep contrast
    return effectiveLightness >= threshold;
  }, [gradientEnabled, gradientActive, effectiveLightness, threshold]);

  // Debug logging for decisions
  useEffect(() => {
    // Slight logging to help diagnose mismatches between gradient vs album brightness
    try {
      const colors = options?.gradientColors ?? null;
      // Use collapsed group to avoid noise
      console.groupCollapsed(
        `[BG Lightness] gradient=${String(gradientEnabled)} active=${String(
          gradientActive,
        )} threshold=${threshold.toFixed(2)} => isLightBg=${String(isLightBg)}`,
      );
      console.debug("albumImageUrl", albumImageUrl);
      console.debug("albumLightness(avg)", lightness);
      if (colors && colors.length > 0) {
        console.debug("gradientColors", colors);
        console.debug("gradientLightness(avg)", colorsLightness);
      }
      console.debug("effectiveLightness", effectiveLightness);
      console.groupEnd();
    } catch {}
  }, [
    gradientEnabled,
    gradientActive,
    threshold,
    isLightBg,
    albumImageUrl,
    lightness,
    colorsLightness,
    effectiveLightness,
    options?.gradientColors,
  ]);

  return { isLightBg, lightness: effectiveLightness };
}

// Helpers
function hexToLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  // sRGB relative luminance approximation (0..1)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [r, g, b];
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [r, g, b];
  }
  return null;
}
