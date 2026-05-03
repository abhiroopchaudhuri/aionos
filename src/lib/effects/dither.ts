export interface DitherParams {
  algorithm: string;
  ditherIntensity: number;
  matrixSize: string;
  modulation: number;
  colorMode: string;
  foreground: string;
  background: string;
  chromaticEnabled: boolean;
  maxDisplace: number;
  redChannel: number;
  greenChannel: number;
  blueChannel: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [255, 255, 255];
}

const BAYER_2X2 = [
  0, 2,
  3, 1
].map(v => v / 4);

const BAYER_4X4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5
].map(v => v / 16);

const BAYER_8X8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21
].map(v => v / 64);

export function applyDither(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  params: DitherParams
): void {
  const { algorithm, ditherIntensity, matrixSize, modulation, colorMode, foreground, background, chromaticEnabled, maxDisplace, redChannel, greenChannel, blueChannel } = params;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  const offscreen = new OffscreenCanvas(width, height);
  const offCtx = offscreen.getContext('2d')!;
  offCtx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  const imageData = offCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const fgColor = hexToRgb(foreground);
  const bgColor = hexToRgb(background);

  const bayerMap = matrixSize === '2' ? BAYER_2X2 : matrixSize === '8' ? BAYER_8X8 : BAYER_4X4;
  const bayerDim = matrixSize === '2' ? 2 : matrixSize === '8' ? 8 : 4;

  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    
    if (modulation > 0) {
      gray[i] += (Math.sin(i / 100) * 255 * modulation);
      gray[i] = Math.max(0, Math.min(255, gray[i]));
    }
  }

  if (algorithm === 'bayer') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const bayerVal = bayerMap[(y % bayerDim) * bayerDim + (x % bayerDim)];
        const threshold = bayerVal * 255;
        const v = gray[i] + (128 - threshold) * ditherIntensity;
        gray[i] = v >= 128 ? 255 : 0;
      }
    }
  } else {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const oldVal = gray[i];
        const newVal = oldVal >= 128 ? 255 : 0;
        const quantError = (oldVal - newVal) * ditherIntensity;
        gray[i] = newVal;
        if (x + 1 < width) gray[i + 1] += quantError * (7 / 16);
        if (x - 1 >= 0 && y + 1 < height) gray[i + width - 1] += quantError * (3 / 16);
        if (y + 1 < height) gray[i + width] += quantError * (5 / 16);
        if (x + 1 < width && y + 1 < height) gray[i + width + 1] += quantError * (1 / 16);
      }
    }
  }

  const output = ctx.createImageData(width, height);
  const outData = output.data;

  for (let i = 0; i < width * height; i++) {
    const val = Math.max(0, Math.min(255, gray[i]));
    const idx = i * 4;
    const t = val / 255;

    if (colorMode === 'mono') {
      outData[idx] = Math.round(bgColor[0] + t * (fgColor[0] - bgColor[0]));
      outData[idx + 1] = Math.round(bgColor[1] + t * (fgColor[1] - bgColor[1]));
      outData[idx + 2] = Math.round(bgColor[2] + t * (fgColor[2] - bgColor[2]));
    } else {
      outData[idx] = Math.round(t * data[idx]);
      outData[idx + 1] = Math.round(t * data[idx + 1]);
      outData[idx + 2] = Math.round(t * data[idx + 2]);
    }
    outData[idx + 3] = 255;
  }

  if (chromaticEnabled && maxDisplace > 0) {
    const chromaData = new Uint8ClampedArray(outData);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        const rDisp = Math.round((redChannel / 100) * maxDisplace - maxDisplace/2);
        const gDisp = Math.round((greenChannel / 100) * maxDisplace - maxDisplace/2);
        const bDisp = Math.round((blueChannel / 100) * maxDisplace - maxDisplace/2);
        
        const rX = Math.max(0, Math.min(width - 1, x + rDisp));
        const gX = Math.max(0, Math.min(width - 1, x + gDisp));
        const bX = Math.max(0, Math.min(width - 1, x + bDisp));
        
        outData[idx] = chromaData[(y * width + rX) * 4];
        outData[idx+1] = chromaData[(y * width + gX) * 4 + 1];
        outData[idx+2] = chromaData[(y * width + bX) * 4 + 2];
      }
    }
  }

  ctx.putImageData(output, 0, 0);
}