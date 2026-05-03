export interface EdgeParams {
  algorithm: string;
  threshold: number;
  lineWidth: number;
  edgeInvert: boolean;
  colorMode: string;
  edgeColor: string;
  background: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [255, 255, 255];
}

export function applyEdge(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  params: EdgeParams
): void {
  const { algorithm, threshold, lineWidth, edgeInvert, colorMode, edgeColor, background } = params;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  const offscreen = new OffscreenCanvas(width, height);
  const offCtx = offscreen.getContext('2d')!;
  offCtx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  const imageData = offCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  const output = ctx.createImageData(width, height);
  const outData = output.data;

  const tVal = threshold * 255;
  const fg = hexToRgb(edgeColor);
  const bg = hexToRgb(background);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      let mag = 0;

      if (algorithm === 'canny' || algorithm === 'sobel') {
        const gx = 
          -1 * gray[idx - width - 1] + 1 * gray[idx - width + 1] +
          -2 * gray[idx - 1]         + 2 * gray[idx + 1] +
          -1 * gray[idx + width - 1] + 1 * gray[idx + width + 1];

        const gy = 
          -1 * gray[idx - width - 1] - 2 * gray[idx - width] - 1 * gray[idx - width + 1] +
           1 * gray[idx + width - 1] + 2 * gray[idx + width] + 1 * gray[idx + width + 1];

        mag = Math.sqrt(gx * gx + gy * gy);
        
        if (lineWidth > 1) {
          mag = mag * (lineWidth * 0.5);
        }
      }

      let isEdge = mag > tVal;
      if (edgeInvert) isEdge = !isEdge;

      const outIdx = idx * 4;
      if (isEdge) {
        if (colorMode === 'original') {
          outData[outIdx] = data[outIdx];
          outData[outIdx+1] = data[outIdx+1];
          outData[outIdx+2] = data[outIdx+2];
        } else {
          outData[outIdx] = fg[0];
          outData[outIdx+1] = fg[1];
          outData[outIdx+2] = fg[2];
        }
      } else {
        outData[outIdx] = bg[0];
        outData[outIdx+1] = bg[1];
        outData[outIdx+2] = bg[2];
      }
      outData[outIdx + 3] = 255;
    }
  }

  ctx.putImageData(output, 0, 0);
}