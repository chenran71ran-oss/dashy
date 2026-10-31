// Pixel rules for making a website's light-background favicon transparent.
// Pure functions over RGBA arrays, shared by the Web Worker and the main-thread fallback.

const luminance = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const saturation = (r, g, b) => { const max = Math.max(r, g, b); return max ? (max - Math.min(r, g, b)) / max : 0; };
const distance = (data, i, bg) => Math.max(Math.abs(data[i] - bg[0]), Math.abs(data[i + 1] - bg[1]), Math.abs(data[i + 2] - bg[2]));

function borderIndexes(width, height) {
  const out = [];
  for (let x = 0; x < width; x += 1) out.push(x, (height - 1) * width + x);
  for (let y = 1; y < height - 1; y += 1) out.push(y * width, y * width + width - 1);
  return out;
}

/**
 * Removes a uniform light background connected to the image edge.
 * Returns null when the image should be shown unchanged: it already has
 * transparency, its edge is not one light colour (photos, avatars, app tiles),
 * or removal would leave almost nothing.
 * Otherwise returns { data, width, height, mono } cropped to the mark with a small margin;
 * `mono` marks a dark single-colour logo that should follow the theme text colour.
 */
export function removeLightBackground(source, width, height, { tolerance = 38, feather = 40 } = {}) {
  if (!width || !height || source.length !== width * height * 4) return null;
  const border = borderIndexes(width, height);
  if (border.filter(p => source[p * 4 + 3] < 200).length / border.length > 0.1) return null;
  const channel = c => { const values = border.map(p => source[p * 4 + c]).sort((a, b) => a - b); return values[values.length >> 1]; };
  const bg = [channel(0), channel(1), channel(2)];
  if (luminance(...bg) < 0.82) return null;
  if (border.filter(p => distance(source, p * 4, bg) <= tolerance).length / border.length < 0.9) return null;

  // Flood fill from the edge only, so white details inside the logo are kept.
  const total = width * height;
  const background = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0; let tail = 0;
  for (const p of border) if (!background[p] && distance(source, p * 4, bg) <= tolerance) { background[p] = 1; queue[tail++] = p; }
  while (head < tail) {
    const p = queue[head++]; const x = p % width;
    for (const n of [p - width, p + width, x ? p - 1 : -1, x < width - 1 ? p + 1 : -1]) {
      if (n >= 0 && n < total && !background[n] && distance(source, n * 4, bg) <= tolerance) { background[n] = 1; queue[tail++] = n; }
    }
  }
  const removed = tail / total;
  if (removed < 0.02 || removed > 0.95) return null;

  const data = new Uint8ClampedArray(source);
  let minX = width; let minY = height; let maxX = -1; let maxY = -1;
  let opaque = 0; let colourful = 0; let light = 0;
  for (let p = 0; p < total; p += 1) {
    const i = p * 4;
    if (background[p]) { data[i + 3] = 0; continue; }
    const x = p % width; const y = (p - x) / width;
    const edge = (x && background[p - 1]) || (x < width - 1 && background[p + 1]) || (y && background[p - width]) || (y < height - 1 && background[p + width]);
    if (edge) {
      // Anti-aliased rim: fade by distance from the background and remove its white tint.
      const alpha = Math.min(1, distance(source, i, bg) / (tolerance + feather));
      if (alpha > 0) for (let c = 0; c < 3; c += 1) data[i + c] = Math.max(0, Math.min(255, (source[i + c] - bg[c] * (1 - alpha)) / alpha));
      data[i + 3] = Math.round(source[i + 3] * alpha);
    }
    if (data[i + 3] > 128) {
      opaque += 1;
      if (saturation(data[i], data[i + 1], data[i + 2]) > 0.25 && Math.max(data[i], data[i + 1], data[i + 2]) > 50) colourful += 1;
      if (luminance(data[i], data[i + 1], data[i + 2]) > 0.6) light += 1;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  if (!opaque) return null;

  // Crop the removed margin, then keep a 6% square margin around the mark.
  const side = Math.max(maxX - minX + 1, maxY - minY + 1);
  const size = Math.min(Math.max(width, height), Math.ceil(side * 1.12));
  const offsetX = Math.floor((size - (maxX - minX + 1)) / 2) - minX;
  const offsetY = Math.floor((size - (maxY - minY + 1)) / 2) - minY;
  const cropped = new Uint8ClampedArray(size * size * 4);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const tx = x + offsetX; const ty = y + offsetY;
      if (tx < 0 || ty < 0 || tx >= size || ty >= size) continue;
      cropped.set(data.subarray((y * width + x) * 4, (y * width + x) * 4 + 4), (ty * size + tx) * 4);
    }
  }
  const mono = colourful / opaque < 0.05 && light / opaque < 0.2;
  return { data: cropped, width: size, height: size, mono };
}

const MAX_SIDE = 256;
const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer); let binary = '';
  for (let at = 0; at < bytes.length; at += 8192) binary += String.fromCharCode(...bytes.subarray(at, at + 8192));
  return btoa(binary);
};
async function canvasDataUrl(canvas) {
  if (canvas.convertToBlob) return `data:image/png;base64,${toBase64(await (await canvas.convertToBlob({ type: 'image/png' })).arrayBuffer())}`;
  return canvas.toDataURL('image/png');
}
/* Decodes an image blob, applies removeLightBackground, and returns { src, mono } or null */
export async function processIconBlob(blob, makeCanvas) {
  if (!blob || !/^image\/(?:png|jpe?g|webp|gif|x-icon|vnd\.microsoft\.icon|bmp|avif)$/.test(blob.type) || blob.size > 524288) return null;
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale)); const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = makeCanvas(width, height); const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, width, height);
    const result = removeLightBackground(context.getImageData(0, 0, width, height).data, width, height);
    if (!result) return null;
    const output = makeCanvas(result.width, result.height); const out = output.getContext('2d');
    out.putImageData(new ImageData(result.data, result.width, result.height), 0, 0);
    return { src: await canvasDataUrl(output), mono: result.mono };
  } finally { bitmap.close?.(); }
}
