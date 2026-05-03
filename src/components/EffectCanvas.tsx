import { useRef, useEffect, useState } from 'react';
import type { EffectId } from '../fixtures/effects';
import { useEffectRenderer } from '../hooks/useEffectRenderer';
import { UploadZone } from './UploadZone';

interface EffectCanvasProps {
  src: string | null;
  mediaType: 'image' | 'video' | null;
  effectId: EffectId;
  params: Record<string, number | boolean | string>;
  onFile?: (file: File, objectUrl: string, mediaType: 'image' | 'video') => void;
  onError?: (message: string) => void;
  filename?: string;
  isRecording?: boolean;
  onSourceElement?: (el: HTMLImageElement | HTMLVideoElement | null) => void;
}

export function EffectCanvas({
  src,
  mediaType,
  effectId,
  params,
  onFile,
  onError,
  filename,
  isRecording = false,
  onSourceElement,
}: EffectCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [sourceElement, setSourceElement] = useState<HTMLImageElement | HTMLVideoElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Load media element
  useEffect(() => {
    if (!src) {
      setMediaLoaded(false);
      setSourceElement(null);
      imageRef.current = null;
      videoRef.current = null;
      onSourceElement?.(null);
      return;
    }

    setMediaLoaded(false);

    if (mediaType === 'image') {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setSourceElement(img);
        onSourceElement?.(img);

        // Set canvas size from container
        const container = containerRef.current;
        if (container) {
          const maxW = container.clientWidth - 32;
          const maxH = container.clientHeight - 32;
          const aspectRatio = img.naturalWidth / img.naturalHeight;

          let w = Math.min(img.naturalWidth, maxW);
          let h = w / aspectRatio;
          if (h > maxH) {
            h = maxH;
            w = h * aspectRatio;
          }

          setCanvasSize({ width: Math.round(w), height: Math.round(h) });
        }
        setMediaLoaded(true);
      };
      img.onerror = () => {
        onError?.('This image couldn\'t be loaded. Try a different format.');
      };
      img.src = src;
    } else if (mediaType === 'video') {
      const video = document.createElement('video');
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.oncanplay = () => {
        videoRef.current = video;
        setSourceElement(video);
        onSourceElement?.(video);

        const container = containerRef.current;
        if (container) {
          const maxW = container.clientWidth - 32;
          const maxH = container.clientHeight - 32;
          const aspectRatio = video.videoWidth / video.videoHeight;

          let w = Math.min(video.videoWidth || 800, maxW);
          let h = w / (aspectRatio || 4 / 3);
          if (h > maxH) {
            h = maxH;
            w = h * (aspectRatio || 4 / 3);
          }

          setCanvasSize({ width: Math.round(w), height: Math.round(h) });
        }
        video.play().catch(() => {});
        setMediaLoaded(true);
      };
      video.onerror = () => {
        onError?.('This video couldn\'t be loaded. Try a different format — MP4 works best.');
      };
      video.src = src;
    }

    return () => {
      // Cleanup
    };
  }, [src, mediaType, onError, onSourceElement]);

  // Update canvas dimensions when size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
    }
  }, [canvasSize]);

  useEffectRenderer({
    canvasRef,
    source: mediaLoaded ? sourceElement : null,
    effectId,
    params,
    paused: isRecording,
  });

  if (!src) {
    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
        }}
      >
        {onFile && (
          <UploadZone onFile={onFile} onError={onError} dark compact />
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {!mediaLoaded && (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '24px',
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '-0.02em',
            }}
          >
            Processing...
          </span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        role="img"
        aria-label={`Effect preview — ${effectId} applied${filename ? ` to ${filename}` : ''}`}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          display: mediaLoaded ? 'block' : 'none',
          borderRadius: '4px',
        }}
      />
    </div>
  );
}
