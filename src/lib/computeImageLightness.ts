// Compute perceived luminance of an image URL on the client.
// Returns a value in the range 0..1 or null if it cannot be computed (e.g., CORS).
export async function computeImageLightness(
  url: string,
): Promise<number | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = document.createElement("img");
      i.crossOrigin = "anonymous";
      i.decoding = "async";
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });

    const sample = 32;
    const canvas = document.createElement("canvas");
    const ratio = Math.max(img.naturalWidth, img.naturalHeight) / sample;
    const w = Math.max(1, Math.round(img.naturalWidth / ratio));
    const h = Math.max(1, Math.round(img.naturalHeight / ratio));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);

    let imageData: ImageData;
    try {
      imageData = ctx.getImageData(0, 0, w, h);
    } catch {
      return null; // CORS taint; skip
    }
    const data = imageData.data;
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 200) continue;
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; // sRGB approx
      sum += lum;
      count++;
    }
    return count ? sum / count : null;
  } catch {
    return null;
  }
}
