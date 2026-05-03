export interface WaveParams {
  lineCount: number;
  amplitude: number;
  frequency: number;
  lineThickness: number;
  direction: string;
  animate: boolean;
  colorMode: string;
}

export function applyWave(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  params: WaveParams,
  phase: number
): void {
  const { lineCount, amplitude, frequency, lineThickness, direction, animate, colorMode } = params;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  const offscreen = new OffscreenCanvas(width, height);
  const offCtx = offscreen.getContext('2d')!;
  offCtx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  const imageData = offCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = lineThickness;

  const lines = Math.max(1, lineCount);
  const stepY = height / lines;
  const stepX = width / lines;

  const currentPhase = animate ? phase : 0;

  if (direction === 'horizontal') {
    for (let y = 0; y < height; y += stepY) {
      ctx.beginPath();
      let first = true;
      for (let x = 0; x <= width; x += 5) {
        const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
        let lum = 0;
        if (idx >= 0 && idx < data.length) {
          lum = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
        }
        
        const disp = Math.sin(x * frequency * 0.01 + currentPhase) * amplitude * (lum / 255);
        if (first) {
          ctx.moveTo(x, y + disp);
          first = false;
        } else {
          ctx.lineTo(x, y + disp);
        }
      }
      
      if (colorMode === 'original') {
        const centerIdx = (Math.floor(y) * width + Math.floor(width/2)) * 4;
        if (centerIdx >= 0 && centerIdx < data.length) {
          ctx.strokeStyle = `rgb(${data[centerIdx]}, ${data[centerIdx+1]}, ${data[centerIdx+2]})`;
        } else {
          ctx.strokeStyle = '#ffffff';
        }
      } else {
        ctx.strokeStyle = '#ffffff';
      }
      ctx.stroke();
    }
  } else {
    for (let x = 0; x < width; x += stepX) {
      ctx.beginPath();
      let first = true;
      for (let y = 0; y <= height; y += 5) {
        const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
        let lum = 0;
        if (idx >= 0 && idx < data.length) {
          lum = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
        }
        
        const disp = Math.sin(y * frequency * 0.01 + currentPhase) * amplitude * (lum / 255);
        if (first) {
          ctx.moveTo(x + disp, y);
          first = false;
        } else {
          ctx.lineTo(x + disp, y);
        }
      }
      
      if (colorMode === 'original') {
        const centerIdx = (Math.floor(height/2) * width + Math.floor(x)) * 4;
        if (centerIdx >= 0 && centerIdx < data.length) {
          ctx.strokeStyle = `rgb(${data[centerIdx]}, ${data[centerIdx+1]}, ${data[centerIdx+2]})`;
        } else {
          ctx.strokeStyle = '#ffffff';
        }
      } else {
        ctx.strokeStyle = '#ffffff';
      }
      ctx.stroke();
    }
  }
}