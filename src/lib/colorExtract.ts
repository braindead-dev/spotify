// Simple, dependency-free palette extractor using canvas + histogram quantization.
// Returns up to 4 distinct hex colors from an image URL, using decreasing distance thresholds.

export async function extractDistinctPaletteFromImage(
  imageUrl: string,
  options?: {
    sampleSize?: number; // max width/height to downscale to for sampling
    thresholds?: number[]; // distance thresholds to try, e.g. [0.1, 0.05, 0.02, 0.005, 0]
    desiredCount?: number; // how many colors to return
    minSaturation?: number; // skip very gray pixels
  },
): Promise<string[] | null> {
  const sampleSize = options?.sampleSize ?? 100;
  const thresholds = options?.thresholds ?? [0.1, 0.05, 0.02, 0.005, 0];
  const desiredCount = options?.desiredCount ?? 4;
  const minSaturation = options?.minSaturation ?? 0.05;

  try {
    // Direct image sampling; if CORS-tainted, we bail out with null
    const img = await loadImage(imageUrl);
    const { ctx, width, height } = createCanvas(
      img.naturalWidth,
      img.naturalHeight,
      sampleSize,
    );
    ctx.drawImage(img, 0, 0, width, height);
    let data: ImageData;
    try {
      data = ctx.getImageData(0, 0, width, height);
    } catch {
      return null; // CORS taint
    }

    // Histogram with coarse quantization to reduce bins
    // Use 5 bits per channel -> 32 buckets per channel => 32768 bins
    const buckets = new Map<number, number>();

    const { data: pixels } = data;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      if (a < 200) continue; // ignore transparent
      // Skip low saturation pixels if requested
      const s = rgbSaturation(r, g, b);
      if (s < minSaturation) continue;

      const key = quantKey(r, g, b);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    if (buckets.size === 0) {
      // Retry without saturation filter for grayscale covers
      try {
        console.debug("[Gradient Extract] retry without saturation filter");
      } catch {}
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        if (a < 200) continue;
        const key = quantKey(r, g, b);
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
      if (buckets.size === 0) return null;
    }

    // Convert buckets back to representative colors and sort by counts
    const entries: { rgb: [number, number, number]; count: number }[] = [];
    for (const [key, count] of buckets) {
      entries.push({ rgb: dequantKey(key), count });
    }
    entries.sort((a, b) => b.count - a.count);

    // Debug: summarize extraction buckets and options
    try {
      console.groupCollapsed(
        "[Gradient Extract] url=%s buckets=%d sample=%d sat>=%.02f desired=%d",
        imageUrl,
        buckets.size,
        sampleSize,
        minSaturation,
        desiredCount,
      );
      const preview = entries
        .slice(0, Math.min(6, entries.length))
        .map((e) => rgbToHex(e.rgb[0], e.rgb[1], e.rgb[2]));
      console.debug("topColors", preview);
      console.debug("thresholds", thresholds);
    } catch {}

    // Enforce distinctness via Euclidean distance in normalized RGB
    for (const t of thresholds) {
      const selected: [number, number, number][] = [];
      for (const { rgb } of entries) {
        if (selected.every((s) => colorDistance(rgb, s) >= t)) {
          selected.push(rgb);
          if (selected.length >= desiredCount) break;
        }
      }
      if (selected.length > 0) {
        const result = selected.map((c) => rgbToHex(c[0], c[1], c[2]));
        try {
          console.debug("selected@threshold", t, result);
          console.groupEnd();
        } catch {}
        return result;
      }
    }

    // Fallback to the top bucket colors if all thresholds fail
    const fallback = entries
      .slice(0, desiredCount)
      .map((e) => rgbToHex(e.rgb[0], e.rgb[1], e.rgb[2]));
    try {
      console.debug("fallbackSelected", fallback);
      console.groupEnd();
    } catch {}
    return fallback;
  } catch {
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function createCanvas(
  naturalWidth: number,
  naturalHeight: number,
  sampleSize: number,
) {
  const ratio = Math.max(naturalWidth, naturalHeight) / sampleSize;
  const width = Math.max(1, Math.round(naturalWidth / ratio));
  const height = Math.max(1, Math.round(naturalHeight / ratio));
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  return { ctx, width, height };
}

function quantKey(r: number, g: number, b: number): number {
  const rq = r >> 3; // 5 bits
  const gq = g >> 3;
  const bq = b >> 3;
  return (rq << 10) | (gq << 5) | bq; // 5+5+5 bits
}

function dequantKey(key: number): [number, number, number] {
  const rq = (key >> 10) & 31;
  const gq = (key >> 5) & 31;
  const bq = key & 31;
  // Map back to 0..255 by centering each bucket
  const r = (rq << 3) | 0b00100; // add midpoint bias
  const g = (gq << 3) | 0b00100;
  const b = (bq << 3) | 0b00100;
  return [r, g, b];
}

function colorDistance(
  a: [number, number, number],
  b: [number, number, number],
) {
  const ar = a[0] / 255,
    ag = a[1] / 255,
    ab = a[2] / 255;
  const br = b[0] / 255,
    bg = b[1] / 255,
    bb = b[2] / 255;
  const dr = ar - br;
  const dg = ag - bg;
  const db = ab - bb;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const h = x.toString(16).padStart(2, "0");
        return h.length > 2 ? h.slice(-2) : h;
      })
      .join("")
  );
}

function rgbSaturation(r: number, g: number, b: number): number {
  // compute saturation in HSL space
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return 0;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  return s;
}
