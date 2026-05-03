export interface AsciiParams {
  cellSize: number;
  spacing: number;
  outputWidth: number;
  charset: string;
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  sharpness: number;
  gamma: number;
  colorMode: string;
  background: string;
  intensity: number;
  invert: boolean;
  brightnessMap: number;
  edgeEnhance: number;
  blur: number;
  quantizeColors: number;
  shapeMatching: number;
  bloom: boolean;
  grain: boolean;
  grainIntensity: number;
  grainSize: number;
  grainSpeed: number;
  chromatic: boolean;
  scanlines: boolean;
  vignette: boolean;
  crtCurve: boolean;
  phosphor: boolean;
}

const CHARSETS: Record<string, string> = {
  standard: ' ·:;+*?%$@#█',
  blocks: ' ░▒▓█',
  minimal: ' .oO@',
  detailed:
    ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$█',
  binary: '01',
};

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function applyGamma(v: number, gamma: number): number {
  return Math.pow(v / 255, gamma) * 255;
}

function quantizeColor(channel: number, levels: number): number {
  if (levels <= 1) return channel;
  const step = 255 / (levels - 1);
  return Math.round(Math.round(channel / step) * step);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function sampleCell(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  cellSize: number
): { r: number; g: number; b: number; lum: number; edge: number } {
  let sr = 0,
    sg = 0,
    sb = 0,
    count = 0;
  const startX = Math.max(0, cx);
  const startY = Math.max(0, cy);
  const endX = Math.min(width, cx + cellSize);
  const endY = Math.min(height, cy + cellSize);

  // Also compute simple edge density using center vs surrounding
  let edgeSum = 0;
  const centerIdx = ((Math.min(cy + Math.floor(cellSize / 2), height - 1)) * width + Math.min(cx + Math.floor(cellSize / 2), width - 1)) * 4;
  const centerLum = getLuminance(data[centerIdx], data[centerIdx + 1], data[centerIdx + 2]);

  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      const idx = (y * width + x) * 4;
      sr += data[idx];
      sg += data[idx + 1];
      sb += data[idx + 2];
      count++;

      const lum = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
      edgeSum += Math.abs(lum - centerLum);
    }
  }

  if (count === 0) count = 1;
  const r = sr / count;
  const g = sg / count;
  const b = sb / count;
  const lum = getLuminance(r, g, b);
  const edge = Math.min(1, edgeSum / (count * 255));

  return { r, g, b, lum, edge };
}

export function applyAscii(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap,
  params: AsciiParams,
  phase: number
): void {
  const {
    cellSize: rawCellSize,
    spacing,
    outputWidth,
    charset: charsetKey,
    brightness,
    contrast,
    saturation,
    hueRotate,
    sharpness,
    gamma,
    colorMode,
    background,
    intensity,
    invert,
    brightnessMap,
    edgeEnhance,
    blur: blurAmount,
    quantizeColors,
    shapeMatching,
    bloom,
    grain,
    grainIntensity,
    grainSize,
    grainSpeed,
    chromatic,
    scanlines,
    vignette,
    crtCurve,
    phosphor,
  } = params;

  let cellSize = rawCellSize;

  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Apply output width scaling
  let renderWidth = width;
  let renderHeight = height;
  let scaleX = 1;
  if (outputWidth > 0) {
    scaleX = outputWidth / width;
    renderWidth = outputWidth;
    renderHeight = Math.round(height * scaleX);
    cellSize = Math.max(4, Math.round(cellSize * scaleX));
  }

  const charset = CHARSETS[charsetKey] || CHARSETS.standard;

  // Fill background
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  // Draw source to offscreen for sampling
  const offscreen = new OffscreenCanvas(width, height);
  const offCtx = offscreen.getContext('2d')!;
  offCtx.drawImage(source as CanvasImageSource, 0, 0, width, height);

  // Optional blur preprocessing
  let sourceCanvas: OffscreenCanvas = offscreen;
  if (blurAmount > 0) {
    const blurCanvas = new OffscreenCanvas(width, height);
    const blurCtx = blurCanvas.getContext('2d')!;
    blurCtx.filter = `blur(${blurAmount}px)`;
    blurCtx.drawImage(offscreen, 0, 0);
    blurCtx.filter = 'none';
    sourceCanvas = blurCanvas;
  }

  const imageData = sourceCanvas.getContext('2d')!.getImageData(0, 0, width, height);
  const data = imageData.data;

  const cols = Math.floor(renderWidth / cellSize);
  const rows = Math.floor(renderHeight / cellSize);
  const charW = cellSize * (1 + spacing * 0.5);
  const charH = cellSize * (1 + spacing * 0.3);

  const offsetX = (width - cols * charW) / 2;
  const offsetY = (height - rows * charH) / 2;

  ctx.font = `${cellSize * 0.95}px monospace`;
  ctx.textBaseline = 'top';

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = offsetX + col * charW;
      const py = offsetY + row * charH;
      const srcX = Math.floor((col / cols) * width);
      const srcY = Math.floor((row / rows) * height);

      const sample = sampleCell(data, width, height, srcX, srcY, Math.max(1, Math.floor(cellSize * (width / renderWidth))));

      let { r, g, b, lum, edge } = sample;

      // Apply brightness
      r *= brightness;
      g *= brightness;
      b *= brightness;

      // Apply contrast
      const contrastFactor = (contrast + 1);
      r = ((r / 255 - 0.5) * contrastFactor + 0.5) * 255;
      g = ((g / 255 - 0.5) * contrastFactor + 0.5) * 255;
      b = ((b / 255 - 0.5) * contrastFactor + 0.5) * 255;

      // Apply saturation + hue
      if (saturation !== 1 || hueRotate !== 0) {
        let [h, s, l] = rgbToHsl(r, g, b);
        s = Math.max(0, Math.min(1, s * saturation));
        h = (h + hueRotate) % 360;
        if (h < 0) h += 360;
        const [nr, ng, nb] = hslToRgb(h, s, l);
        r = nr;
        g = ng;
        b = nb;
      }

      // Apply gamma
      r = applyGamma(Math.max(0, Math.min(255, r)), gamma);
      g = applyGamma(Math.max(0, Math.min(255, g)), gamma);
      b = applyGamma(Math.max(0, Math.min(255, b)), gamma);

      // Apply sharpness (local contrast boost)
      if (sharpness > 0) {
        const gray = getLuminance(r, g, b);
        const boost = (gray - 128) * sharpness;
        r = Math.max(0, Math.min(255, r + boost));
        g = Math.max(0, Math.min(255, g + boost));
        b = Math.max(0, Math.min(255, b + boost));
      }

      // Apply edge enhance
      if (edgeEnhance > 0) {
        const edgeBoost = edge * 255 * edgeEnhance;
        r = Math.min(255, r + edgeBoost);
        g = Math.min(255, g + edgeBoost);
        b = Math.min(255, b + edgeBoost);
      }

      // Apply brightness map
      if (brightnessMap !== 1) {
        r = Math.min(255, r * brightnessMap);
        g = Math.min(255, g * brightnessMap);
        b = Math.min(255, b * brightnessMap);
      }

      // Quantize colors
      if (quantizeColors > 0) {
        const levels = Math.max(2, Math.min(32, quantizeColors));
        r = quantizeColor(r, levels);
        g = quantizeColor(g, levels);
        b = quantizeColor(b, levels);
      }

      // Recalculate luminance after all adjustments
      lum = getLuminance(r, g, b);

      if (invert) lum = 255 - lum;

      // Character selection
      let charIdx: number;
      if (shapeMatching > 0 && charset.length > 2) {
        const lumIdx = Math.floor((lum / 255) * (charset.length - 1));
        const edgeIdx = Math.floor(edge * (charset.length - 1));
        const blend = shapeMatching;
        charIdx = Math.round(lumIdx * (1 - blend) + edgeIdx * blend);
      } else {
        charIdx = Math.floor((lum / 255) * (charset.length - 1));
      }
      charIdx = Math.max(0, Math.min(charset.length - 1, charIdx));
      const char = charset[charIdx];

      if (char === ' ') continue;

      // Determine color
      let fillR = r;
      let fillG = g;
      let fillB = b;

      if (colorMode === 'solid') {
        fillR = 159;
        fillG = 232;
        fillB = 112;
      } else if (colorMode === 'monochrome') {
        const gray = getLuminance(r, g, b);
        fillR = fillG = fillB = gray;
      }

      // Apply intensity
      if (intensity < 1) {
        fillR = fillR * intensity + 128 * (1 - intensity);
        fillG = fillG * intensity + 128 * (1 - intensity);
        fillB = fillB * intensity + 128 * (1 - intensity);
      }

      if (invert) {
        fillR = 255 - fillR;
        fillG = 255 - fillG;
        fillB = 255 - fillB;
      }

      const colorStr = `rgb(${Math.round(Math.max(0, Math.min(255, fillR)))},${Math.round(Math.max(0, Math.min(255, fillG)))},${Math.round(Math.max(0, Math.min(255, fillB)))})`;
      ctx.fillStyle = colorStr;
      ctx.fillText(char, px, py);
    }
  }

  // Post-processing effects
  if (bloom || grain || chromatic || scanlines || vignette || crtCurve || phosphor) {
    const postCanvas = new OffscreenCanvas(width, height);
    const postCtx = postCanvas.getContext('2d')!;
    postCtx.drawImage(ctx.canvas, 0, 0);

    // Bloom
    if (bloom) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = 'blur(8px) brightness(1.5)';
      ctx.globalAlpha = 0.3;
      ctx.drawImage(postCanvas, 0, 0);
      ctx.restore();
    }

    // Grain
    if (grain) {
      const grainCanvas = new OffscreenCanvas(width, height);
      const grainCtx = grainCanvas.getContext('2d')!;
      const imgData = grainCtx.createImageData(width, height);
      const d = imgData.data;
      const speed = grainSpeed / 100;
      const size = grainSize;
      const intens = grainIntensity / 30;
      const seed = phase * speed * 100;

      for (let y = 0; y < height; y += size) {
        for (let x = 0; x < width; x += size) {
          const rx = Math.floor(x / size) * size;
          const ry = Math.floor(y / size) * size;
          const noise = (seededRandom(rx * 73 + ry * 137 + seed * 0.1) - 0.5) * 255 * intens;
          for (let dy = 0; dy < size && ry + dy < height; dy++) {
            for (let dx = 0; dx < size && rx + dx < width; dx++) {
              const idx = ((ry + dy) * width + (rx + dx)) * 4;
              d[idx] = 128 + noise;
              d[idx + 1] = 128 + noise;
              d[idx + 2] = 128 + noise;
              d[idx + 3] = Math.abs(noise) * 2;
            }
          }
        }
      }
      grainCtx.putImageData(imgData, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.drawImage(grainCanvas, 0, 0);
      ctx.restore();
    }

    // Chromatic aberration
    if (chromatic) {
      const shift = 3;
      const chromCanvas = new OffscreenCanvas(width, height);
      const chromCtx = chromCanvas.getContext('2d')!;

      // Red shifted left
      chromCtx.globalCompositeOperation = 'source-over';
      chromCtx.fillStyle = '#000000';
      chromCtx.fillRect(0, 0, width, height);
      chromCtx.globalCompositeOperation = 'screen';
      chromCtx.drawImage(postCanvas, -shift, 0);

      // Green centered
      chromCtx.globalCompositeOperation = 'screen';
      chromCtx.drawImage(postCanvas, 0, 0);

      // Blue shifted right
      chromCtx.drawImage(postCanvas, shift, 0);

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.85;
      ctx.drawImage(chromCanvas, 0, 0);
      ctx.restore();
    }

    // Scanlines
    if (scanlines) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 2);
      }
      ctx.restore();
    }

    // Vignette
    if (vignette) {
      const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.85);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.save();
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // CRT curve
    if (crtCurve) {
      // Subtle barrel distortion simulation via gradient overlays
      const gradH = ctx.createLinearGradient(0, 0, width, 0);
      gradH.addColorStop(0, 'rgba(0,0,0,0.12)');
      gradH.addColorStop(0.5, 'rgba(0,0,0,0)');
      gradH.addColorStop(1, 'rgba(0,0,0,0.12)');
      const gradV = ctx.createLinearGradient(0, 0, 0, height);
      gradV.addColorStop(0, 'rgba(0,0,0,0.08)');
      gradV.addColorStop(0.5, 'rgba(0,0,0,0)');
      gradV.addColorStop(1, 'rgba(0,0,0,0.08)');
      ctx.save();
      ctx.fillStyle = gradH;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = gradV;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // Phosphor
    if (phosphor) {
      ctx.save();
      for (let y = 0; y < height; y += 3) {
        ctx.fillStyle = 'rgba(255,0,0,0.03)';
        ctx.fillRect(0, y, width, 1);
        ctx.fillStyle = 'rgba(0,255,0,0.03)';
        ctx.fillRect(0, y + 1, width, 1);
        ctx.fillStyle = 'rgba(0,0,255,0.03)';
        ctx.fillRect(0, y + 2, width, 1);
      }
      ctx.restore();
    }
  }
}
