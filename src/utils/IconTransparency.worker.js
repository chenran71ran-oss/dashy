// Off-main-thread icon background removal; the page keeps rendering while icons decode.
import { processIconBlob } from './IconPixels.js';

self.onmessage = async ({ data: { id, blob } }) => {
  let result;
  try { result = await processIconBlob(blob, (w, h) => new OffscreenCanvas(w, h)); } catch { result = null; }
  self.postMessage({ id, result });
};
