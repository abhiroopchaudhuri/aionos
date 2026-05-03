import type { EffectId } from '../fixtures/effects';
import { applyAscii } from './effects/ascii';
import { applyDither } from './effects/dither';
import { applyHalftone } from './effects/halftone';
import { applyVhs } from './effects/vhs';
import { applyWave } from './effects/wave';
import { applyMatrix } from './effects/matrix';
import { applyEdge } from './effects/edge';
import { applyPreProcessing, applyPostProcessing, CommonParams } from './effects/pipeline';

export type EffectFn = (
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  params: Record<string, number | boolean | string>,
  phase: number,
  matrixState?: import('./effects/matrix').MatrixState
) => void;

function getCommonParams(params: Record<string, number | boolean | string>): CommonParams {
  return {
    brightness: params['brightness'] as number,
    contrast: params['contrast'] as number,
    saturation: params['saturation'] as number,
    hueRotate: params['hueRotate'] as number,
    sharpness: params['sharpness'] as number,
    gamma: params['gamma'] as number,
    invert: params['invert'] as boolean,
    brightnessMap: params['brightnessMap'] as number,
    edgeEnhance: params['edgeEnhance'] as number,
    blur: params['blur'] as number,
    quantizeColors: params['quantizeColors'] as number,
    bloom: params['bloom'] as boolean,
    grain: params['grain'] as boolean,
    grainIntensity: params['grainIntensity'] as number,
    grainSize: params['grainSize'] as number,
    grainSpeed: params['grainSpeed'] as number,
    chromatic: params['chromatic'] as boolean,
    scanlines: params['scanlines'] as boolean,
    vignette: params['vignette'] as boolean,
    crtCurve: params['crtCurve'] as boolean,
    phosphor: params['phosphor'] as boolean,
  };
}

function wrapAscii(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  params: Record<string, number | boolean | string>,
  phase: number
): void {
  // ASCII handles its own preprocessing/postprocessing locally because it samples per-character
  applyAscii(ctx, source as any, {
    cellSize: params['cellSize'] as number,
    spacing: params['spacing'] as number,
    outputWidth: params['outputWidth'] as number,
    charset: params['charset'] as string,
    brightness: params['brightness'] as number,
    contrast: params['contrast'] as number,
    saturation: params['saturation'] as number,
    hueRotate: params['hueRotate'] as number,
    sharpness: params['sharpness'] as number,
    gamma: params['gamma'] as number,
    colorMode: params['colorMode'] as string,
    background: params['background'] as string,
    intensity: params['intensity'] as number,
    invert: params['invert'] as boolean,
    brightnessMap: params['brightnessMap'] as number,
    edgeEnhance: params['edgeEnhance'] as number,
    blur: params['blur'] as number,
    quantizeColors: params['quantizeColors'] as number,
    shapeMatching: params['shapeMatching'] as number,
    bloom: params['bloom'] as boolean,
    grain: params['grain'] as boolean,
    grainIntensity: params['grainIntensity'] as number,
    grainSize: params['grainSize'] as number,
    grainSpeed: params['grainSpeed'] as number,
    chromatic: params['chromatic'] as boolean,
    scanlines: params['scanlines'] as boolean,
    vignette: params['vignette'] as boolean,
    crtCurve: params['crtCurve'] as boolean,
    phosphor: params['phosphor'] as boolean,
  }, phase);
}

function wrapDither(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  params: Record<string, number | boolean | string>,
  phase: number
): void {
  const common = getCommonParams(params);
  const processed = applyPreProcessing(source, ctx.canvas.width, ctx.canvas.height, common);
  applyDither(ctx, processed, {
    algorithm: params['algorithm'] as string,
    ditherIntensity: params['ditherIntensity'] as number,
    matrixSize: params['matrixSize'] as string,
    modulation: params['modulation'] as number,
    colorMode: params['colorMode'] as string,
    foreground: params['foreground'] as string,
    background: params['background'] as string,
    chromaticEnabled: params['chromaticEnabled'] as boolean,
    maxDisplace: params['maxDisplace'] as number,
    redChannel: params['redChannel'] as number,
    greenChannel: params['greenChannel'] as number,
    blueChannel: params['blueChannel'] as number,
  });
  applyPostProcessing(ctx, ctx.canvas.width, ctx.canvas.height, common, phase);
}

function wrapHalftone(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  params: Record<string, number | boolean | string>,
  phase: number
): void {
  const common = getCommonParams(params);
  const processed = applyPreProcessing(source, ctx.canvas.width, ctx.canvas.height, common);
  applyHalftone(ctx, processed, {
    shape: params['shape'] as string,
    dotScale: params['dotScale'] as number,
    spacing: params['spacing'] as number,
    angle: params['angle'] as number,
    halftoneInvert: params['halftoneInvert'] as boolean,
    colorMode: params['colorMode'] as string,
    foreground: params['foreground'] as string,
    background: params['background'] as string,
  });
  applyPostProcessing(ctx, ctx.canvas.width, ctx.canvas.height, common, phase);
}

function wrapVhs(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  params: Record<string, number | boolean | string>,
  phase: number
): void {
  const common = getCommonParams(params);
  const processed = applyPreProcessing(source, ctx.canvas.width, ctx.canvas.height, common);
  applyVhs(ctx, processed, {
    distortion: params['distortion'] as number,
    noise: params['noise'] as number,
    colorBleed: params['colorBleed'] as number,
    scanlinesIntensity: params['scanlinesIntensity'] as number,
    trackingError: params['trackingError'] as number,
  });
  applyPostProcessing(ctx, ctx.canvas.width, ctx.canvas.height, common, phase);
}

function wrapWave(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  params: Record<string, number | boolean | string>,
  phase: number
): void {
  const common = getCommonParams(params);
  const processed = applyPreProcessing(source, ctx.canvas.width, ctx.canvas.height, common);
  applyWave(ctx, processed, {
    lineCount: params['lineCount'] as number,
    amplitude: params['amplitude'] as number,
    frequency: params['frequency'] as number,
    lineThickness: params['lineThickness'] as number,
    direction: params['direction'] as string,
    animate: params['animate'] as boolean,
    colorMode: params['colorMode'] as string,
  }, phase);
  applyPostProcessing(ctx, ctx.canvas.width, ctx.canvas.height, common, phase);
}

function wrapMatrix(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  params: Record<string, number | boolean | string>,
  phase: number,
  matrixState?: import('./effects/matrix').MatrixState
): void {
  if (!matrixState) return;
  const common = getCommonParams(params);
  const processed = applyPreProcessing(source, ctx.canvas.width, ctx.canvas.height, common);
  applyMatrix(ctx, processed, {
    charset: params['charset'] as string,
    cellSize: params['cellSize'] as number,
    density: params['density'] as number,
    spacing: params['spacing'] as number,
    speed: params['speed'] as number,
    trailLength: params['trailLength'] as number,
    direction: params['direction'] as string,
    glow: params['glow'] as number,
    bgOpacity: params['bgOpacity'] as number,
    rainColor: params['rainColor'] as string,
  }, matrixState, phase);
  applyPostProcessing(ctx, ctx.canvas.width, ctx.canvas.height, common, phase);
}

function wrapEdge(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | HTMLCanvasElement,
  params: Record<string, number | boolean | string>,
  phase: number
): void {
  const common = getCommonParams(params);
  const processed = applyPreProcessing(source, ctx.canvas.width, ctx.canvas.height, common);
  applyEdge(ctx, processed, {
    algorithm: params['algorithm'] as string,
    threshold: params['threshold'] as number,
    lineWidth: params['lineWidth'] as number,
    edgeInvert: params['edgeInvert'] as boolean,
    colorMode: params['colorMode'] as string,
    edgeColor: params['edgeColor'] as string,
    background: params['background'] as string,
  });
  applyPostProcessing(ctx, ctx.canvas.width, ctx.canvas.height, common, phase);
}

export const effectRegistry: Record<EffectId, EffectFn> = {
  ascii: wrapAscii,
  dither: wrapDither,
  halftone: wrapHalftone,
  vhs: wrapVhs,
  wave: wrapWave,
  matrix: wrapMatrix,
  edge: wrapEdge,
};
