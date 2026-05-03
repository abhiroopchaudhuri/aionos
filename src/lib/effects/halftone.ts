export interface HalftoneParams {
  shape: string;
  dotScale: number;
  spacing: number;
  angle: number;
  halftoneInvert: boolean;
  colorMode: string;
  foreground: string;
  background: string;
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
    : 'rgb(255, 255, 255)';
}

export function applyHalftone(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  params: HalftoneParams
): void {
  const { shape, dotScale, spacing, angle, halftoneInvert, colorMode, foreground, background } = params;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  const offscreen = new OffscreenCanvas(width, height);
  const offCtx = offscreen.getContext('2d')!;
  offCtx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  const imageData = offCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Background
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const angleRad = (angle * Math.PI) / 180;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);

  const fgStyle = colorMode === 'mono' ? hexToRgb(foreground) : null;

  for (let y = -height; y < height * 2; y += spacing) {
    for (let x = -width; x < width * 2; x += spacing) {
      const rotX = x * cosA - y * sinA;
      const rotY = x * sinA + y * cosA;

      if (rotX < 0 || rotX >= width || rotY < 0 || rotY >= height) continue;

      const px = Math.floor(rotX);
      const py = Math.floor(rotY);
      const idx = (py * width + px) * 4;

      let lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (halftoneInvert) lum = 255 - lum;

      const radius = (lum / 255) * spacing * 0.5 * dotScale;
      if (radius < 0.5) continue;

      if (colorMode === 'original') {
        ctx.fillStyle = `rgb(${data[idx]}, ${data[idx+1]}, ${data[idx+2]})`;
      } else {
        ctx.fillStyle = fgStyle!;
      }

      ctx.beginPath();
      if (shape === 'square') {
        ctx.rect(rotX - radius, rotY - radius, radius * 2, radius * 2);
      } else if (shape === 'line') {
        ctx.rect(rotX - radius, rotY - spacing / 2, radius * 2, spacing);
      } else {
        ctx.arc(rotX, rotY, radius, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }
}