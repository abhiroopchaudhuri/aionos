export interface MatrixParams {
  charset: string;
  cellSize: number;
  density: number;
  spacing: number;
  speed: number;
  trailLength: number;
  direction: string;
  glow: number;
  bgOpacity: number;
  rainColor: string;
}

export interface MatrixState {
  columns: number[]; // legacy
  drops?: number[][];
  lastTime: number;
}

export function createMatrixState(_width?: number): MatrixState {
  return { columns: [], lastTime: 0 };
}

const CHARSETS: Record<string, string> = {
  standard: 'ｱｲウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789',
  binary: '01'
};

export function applyMatrix(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  params: MatrixParams,
  state: MatrixState,
  phase: number
): void {
  const { charset, cellSize, density, spacing, speed, trailLength, direction, glow, bgOpacity, rainColor } = params;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  const chars = CHARSETS[charset] || CHARSETS.standard;

  const offscreen = new OffscreenCanvas(width, height);
  const offCtx = offscreen.getContext('2d')!;
  offCtx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  const imageData = offCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Fade previous frames
  if (bgOpacity > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${bgOpacity})`;
    ctx.fillRect(0, 0, width, height);
  }

  const realCellSize = cellSize + spacing;
  const cols = Math.floor(width / realCellSize);
  const rows = Math.floor(height / realCellSize);

  if (!state.drops || state.drops.length !== cols) {
    state.drops = new Array(cols).fill(0).map(() => []);
  }

  const maxDropsPerCol = Math.max(1, (rows / (trailLength || 15)) * 1.5);
  const targetDrops = Math.max(0.1, density * maxDropsPerCol);

  const now = phase * 1000;
  const dt = state.lastTime ? now - state.lastTime : 25; // default 25ms for first frame
  state.lastTime = now;

  for (let c = 0; c < cols; c++) {
    let colDrops = state.drops[c];
    
    // Determine exact target for this column this frame to allow fractional drops smoothly
    const exactTarget = Math.floor(targetDrops) + (Math.random() < (targetDrops % 1) ? 1 : 0);
    
    while (colDrops.length < exactTarget) {
      colDrops.push(Math.random() * rows); // Seed new drops randomly along the column
    }
    while (colDrops.length > exactTarget) {
      colDrops.pop();
    }
    
    for (let i = 0; i < colDrops.length; i++) {
      if (direction === 'down') {
        colDrops[i] += speed * (dt / 50);
        if (colDrops[i] > rows + trailLength) {
          colDrops[i] = -trailLength * Math.random(); 
        }
      } else {
        colDrops[i] -= speed * (dt / 50);
        if (colDrops[i] < -trailLength) {
          colDrops[i] = rows + trailLength * Math.random();
        }
      }
    }
  }

  ctx.font = `${cellSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Extract rgb from rainColor
  let r = 0, g = 255, b = 0;
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(rainColor);
  if (match) {
    r = parseInt(match[1], 16);
    g = parseInt(match[2], 16);
    b = parseInt(match[3], 16);
  }

  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < cols; c++) {
      const px = c * realCellSize + realCellSize / 2;
      const py = row * realCellSize + realCellSize / 2;

      const imgX = Math.floor(px);
      const imgY = Math.floor(py);
      if (imgX < 0 || imgX >= width || imgY < 0 || imgY >= height) continue;

      const idx = (imgY * width + imgX) * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      
      const normLum = lum / 255;
      
      let maxRain = 0;
      let isHead = false;
      const colDrops = state.drops[c];
      
      for (let i = 0; i < colDrops.length; i++) {
        const headY = colDrops[i];
        const dist = direction === 'down' ? headY - row : row - headY;
        if (dist >= 0 && dist < trailLength) {
          const intensity = 1.0 - (dist / trailLength);
          if (intensity > maxRain) {
            maxRain = intensity;
          }
          if (dist < 1) {
            isHead = true;
          }
        }
      }

      // Baseline visibility of a character even without rain, driven by density
      const baseline = density * 0.4 * normLum; 
      const finalAlpha = Math.min(1, maxRain * normLum * 1.5 + baseline);
      
      // Optimization: don't draw invisible characters
      if (finalAlpha < 0.02) continue;

      // Characters flicker faster in bright areas
      const cellSeed = c * 137 + row * 73;
      const charSpeed = Math.max(50, 2000 - lum * 6);
      const charIndex = Math.floor(now / charSpeed + cellSeed) % chars.length;
      const char = chars[charIndex];

      if (isHead && normLum > 0.1) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, normLum * 2)})`;
        if (glow > 0) {
          ctx.shadowBlur = glow * 2;
          ctx.shadowColor = '#ffffff';
        }
      } else {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalAlpha})`;
        if (glow > 0) {
          ctx.shadowBlur = glow;
          ctx.shadowColor = rainColor;
        }
      }

      ctx.fillText(char, px, py);
      ctx.shadowBlur = 0;
    }
  }
}