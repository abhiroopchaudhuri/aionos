import { useEffect, useRef, useCallback } from 'react';
import type { EffectId } from '../fixtures/effects';
import { effectRegistry } from '../lib/effectRegistry';
import { createMatrixState } from '../lib/effects/matrix';
import type { MatrixState } from '../lib/effects/matrix';

export interface UseEffectRendererOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  source: HTMLImageElement | HTMLVideoElement | null;
  effectId: EffectId;
  params: Record<string, number | boolean | string>;
  paused?: boolean;
}

export function useEffectRenderer({
  canvasRef,
  source,
  effectId,
  params,
  paused = false,
}: UseEffectRendererOptions) {
  const animFrameRef = useRef<number>(0);
  const phaseRef = useRef<number>(0);
  const effectIdRef = useRef<EffectId>(effectId);
  const paramsRef = useRef<Record<string, number | boolean | string>>(params);
  const sourceRef = useRef<HTMLImageElement | HTMLVideoElement | null>(source);
  const matrixStateRef = useRef<MatrixState | null>(null);
  const lastEffectRef = useRef<EffectId | null>(null);
  const pausedRef = useRef<boolean>(paused);

  // Keep refs in sync with React state
  effectIdRef.current = effectId;
  paramsRef.current = params;
  sourceRef.current = source;
  pausedRef.current = paused;

  const renderFrame = useCallback(() => {
    if (pausedRef.current) {
      animFrameRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    const canvas = canvasRef.current;
    const src = sourceRef.current;

    if (!canvas || !src) {
      animFrameRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    const currentEffectId = effectIdRef.current;
    const currentParams = paramsRef.current;

    // Reset matrix state if effect changed
    if (lastEffectRef.current !== currentEffectId) {
      if (currentEffectId === 'matrix') {
        matrixStateRef.current = createMatrixState(canvas.width);
      } else {
        matrixStateRef.current = null;
      }
      lastEffectRef.current = currentEffectId;
    }

    // Ensure matrix state exists for matrix effect
    if (currentEffectId === 'matrix' && !matrixStateRef.current) {
      matrixStateRef.current = createMatrixState(canvas.width);
    }

    try {
      const effectFn = effectRegistry[currentEffectId];
      effectFn(ctx, src, currentParams, phaseRef.current, matrixStateRef.current ?? undefined);
    } catch {
      // If effect throws (e.g., during video seek), skip this frame
    }

    phaseRef.current += 0.025;

    animFrameRef.current = requestAnimationFrame(renderFrame);
  }, [canvasRef]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderFrame]);

  // Resize matrix state when canvas size changes
  useEffect(() => {
    if (effectId === 'matrix') {
      const canvas = canvasRef.current;
      if (canvas) {
        matrixStateRef.current = createMatrixState(canvas.width);
      }
    }
  }, [effectId, canvasRef]);
}
