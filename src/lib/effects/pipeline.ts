export interface CommonParams {
  // Adjustments
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  sharpness: number;
  gamma: number;

  // Processing
  invert: boolean;
  brightnessMap: number;
  edgeEnhance: number;
  blur: number;
  quantizeColors: number;

  // Post-Processing
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
  
  // Anything else
  [key: string]: any;
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  let r, g, b;
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
  return [r * 255, g * 255, b * 255];
}

function applyGamma(v: number, gamma: number): number {
  return Math.pow(v / 255, gamma) * 255;
}

function quantizeColor(channel: number, levels: number): number {
  if (levels <= 1) return channel;
  const step = 255 / (levels - 1);
  return Math.round(Math.round(channel / step) * step);
}

export function applyPreProcessing(
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  width: number,
  height: number,
  params: CommonParams
): OffscreenCanvas {
  const offscreen = new OffscreenCanvas(width, height);
  const offCtx = offscreen.getContext('2d')!;
  offCtx.drawImage(source as CanvasImageSource, 0, 0, width, height);

  let sourceCanvas: OffscreenCanvas = offscreen;
  if (params.blur > 0) {
    const blurCanvas = new OffscreenCanvas(width, height);
    const blurCtx = blurCanvas.getContext('2d')!;
    blurCtx.filter = `blur(${params.blur}px)`;
    blurCtx.drawImage(offscreen, 0, 0);
    blurCtx.filter = 'none';
    sourceCanvas = blurCanvas;
  }

  const imageData = sourceCanvas.getContext('2d')!.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Pre-calculate edge detection map if needed
  let edgeData: Uint8ClampedArray | null = null;
  if (params.edgeEnhance > 0) {
    edgeData = new Uint8ClampedArray(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const cLum = getLuminance(data[idx], data[idx+1], data[idx+2]);
        const rLum = getLuminance(data[idx+4], data[idx+5], data[idx+6]);
        const bLum = getLuminance(data[idx+width*4], data[idx+width*4+1], data[idx+width*4+2]);
        const edge = Math.abs(cLum - rLum) + Math.abs(cLum - bLum);
        edgeData[y * width + x] = Math.min(255, edge);
      }
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness
    if (params.brightness !== 1) {
      r *= params.brightness;
      g *= params.brightness;
      b *= params.brightness;
    }

    // Contrast
    if (params.contrast !== 0) {
      const cf = params.contrast + 1;
      r = ((r / 255 - 0.5) * cf + 0.5) * 255;
      g = ((g / 255 - 0.5) * cf + 0.5) * 255;
      b = ((b / 255 - 0.5) * cf + 0.5) * 255;
    }

    // Saturation and Hue
    if (params.saturation !== 1 || params.hueRotate !== 0) {
      let [h, s, l] = rgbToHsl(r, g, b);
      s = Math.max(0, Math.min(1, s * params.saturation));
      h = (h + params.hueRotate) % 360;
      if (h < 0) h += 360;
      const [nr, ng, nb] = hslToRgb(h, s, l);
      r = nr; g = ng; b = nb;
    }

    // Gamma
    if (params.gamma !== 1) {
      r = applyGamma(Math.max(0, Math.min(255, r)), params.gamma);
      g = applyGamma(Math.max(0, Math.min(255, g)), params.gamma);
      b = applyGamma(Math.max(0, Math.min(255, b)), params.gamma);
    }

    // Sharpness
    if (params.sharpness > 0) {
      const gray = getLuminance(r, g, b);
      const boost = (gray - 128) * params.sharpness;
      r = Math.max(0, Math.min(255, r + boost));
      g = Math.max(0, Math.min(255, g + boost));
      b = Math.max(0, Math.min(255, b + boost));
    }

    // Edge Enhance
    if (params.edgeEnhance > 0 && edgeData) {
      const edge = edgeData[i / 4];
      const edgeBoost = (edge / 255) * 255 * params.edgeEnhance;
      r = Math.min(255, r + edgeBoost);
      g = Math.min(255, g + edgeBoost);
      b = Math.min(255, b + edgeBoost);
    }

    // Brightness Map
    if (params.brightnessMap !== 1) {
      r = Math.min(255, r * params.brightnessMap);
      g = Math.min(255, g * params.brightnessMap);
      b = Math.min(255, b * params.brightnessMap);
    }

    // Quantize
    if (params.quantizeColors > 0) {
      const levels = Math.max(2, Math.min(32, params.quantizeColors));
      r = quantizeColor(r, levels);
      g = quantizeColor(g, levels);
      b = quantizeColor(b, levels);
    }

    // Invert
    if (params.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  const finalCanvas = new OffscreenCanvas(width, height);
  const finalCtx = finalCanvas.getContext('2d')!;
  finalCtx.putImageData(imageData, 0, 0);
  return finalCanvas;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function applyPostProcessing(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: CommonParams,
  phase: number
): void {
  const { bloom, grain, chromatic, scanlines, vignette, crtCurve, phosphor, grainIntensity, grainSize, grainSpeed } = params;
  if (!bloom && !grain && !chromatic && !scanlines && !vignette && !crtCurve && !phosphor) return;

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
    const speed = (grainSpeed || 50) / 100;
    const size = grainSize || 1;
    const intens = (grainIntensity || 14) / 30;
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
