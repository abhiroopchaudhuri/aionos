export interface VhsParams {
  distortion: number;
  noise: number;
  colorBleed: number;
  scanlinesIntensity: number;
  trackingError: number;
}

export function applyVhs(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  params: VhsParams
): void {
  const { distortion, noise, colorBleed, scanlinesIntensity, trackingError } = params;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Base image
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);

  const offscreen = new OffscreenCanvas(width, height);
  const offCtx = offscreen.getContext('2d')!;
  offCtx.drawImage(source as CanvasImageSource, 0, 0, width, height);

  // Tracking error (vertical shift + jitter)
  if (trackingError > 0) {
    const shiftY = Math.sin(Date.now() * 0.005) * 20 * trackingError;
    ctx.drawImage(offscreen, 0, shiftY);
    
    // Tracking band at bottom
    ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * trackingError})`;
    ctx.fillRect(0, height - 30 * trackingError, width, 30 * trackingError);
  }

  // Chromatic aberration (Color Bleed)
  if (colorBleed > 0) {
    const bleedX = colorBleed * 15;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255,0,0,0.5)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(offscreen, bleedX, 0);
    ctx.restore();
  }

  // Glitch / Distortion slices
  if (distortion > 0) {
    const numSlices = Math.floor(distortion * 10);
    for (let i = 0; i < numSlices; i++) {
      const sliceY = Math.random() * height;
      const sliceH = Math.random() * 20 * distortion;
      const sliceX = (Math.random() - 0.5) * 50 * distortion;
      ctx.drawImage(offscreen, 0, sliceY, width, sliceH, sliceX, sliceY, width, sliceH);
    }
  }

  // Noise
  if (noise > 0) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 100 * noise;
      data[i] = Math.min(255, Math.max(0, data[i] + n));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + n));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + n));
    }
    ctx.putImageData(imageData, 0, 0);
  }

  // Scanlines
  if (scanlinesIntensity > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${scanlinesIntensity * 0.5})`;
    for (let y = 0; y < height; y += 3) {
      ctx.fillRect(0, y, width, 1);
    }
  }
}