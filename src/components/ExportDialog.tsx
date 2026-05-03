import { useEffect, useRef, useState, useCallback } from 'react';
import * as Mp4Muxer from 'mp4-muxer';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Film } from 'lucide-react';
import { Button } from './ui/Button';
import { Slider } from './ui/Slider';
import { Tabs } from './ui/Tabs';
import { exportFrame } from '../lib/exportCanvas';
import { effectRegistry } from '../lib/effectRegistry';
import type { EffectId } from '../fixtures/effects';
import { createMatrixState } from '../lib/effects/matrix';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  effectId: EffectId;
  mediaType?: 'image' | 'video' | null;
  videoDuration?: number;
  sourceElement: HTMLImageElement | HTMLVideoElement | null;
  params: Record<string, number | boolean | string>;
  onRecordingChange?: (recording: boolean) => void;
}

const FORMAT_TABS = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'mp4', label: 'MP4' },
];

const FPS_OPTIONS = [
  { value: 24, label: '24 fps' },
  { value: 30, label: '30 fps' },
  { value: 60, label: '60 fps' },
];

export function ExportDialog({
  open,
  onOpenChange,
  canvasRef,
  effectId,
  mediaType,
  videoDuration = 0,
  sourceElement,
  params,
  onRecordingChange,
}: ExportDialogProps) {
  const [format, setFormat] = useState<'png' | 'jpg' | 'mp4'>('png');
  const [quality, setQuality] = useState(92);
  const [duration, setDuration] = useState(5);
  const [fps, setFps] = useState(30);
  const [useFullLength, setUseFullLength] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewRafRef = useRef<number>(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const hasVideo = mediaType === 'video' && videoDuration > 0;
  const fullDurationSec = Math.round(videoDuration);

  // Real-time preview updater
  const updatePreview = useCallback(() => {
    const sourceCanvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (sourceCanvas && previewCanvas) {
      const ctx = previewCanvas.getContext('2d');
      if (ctx) {
        if (previewCanvas.width !== sourceCanvas.width || previewCanvas.height !== sourceCanvas.height) {
          previewCanvas.width = sourceCanvas.width;
          previewCanvas.height = sourceCanvas.height;
        }
        ctx.drawImage(sourceCanvas, 0, 0);
      }
    }
    previewRafRef.current = requestAnimationFrame(updatePreview);
  }, [canvasRef]);

  useEffect(() => {
    if (open) {
      previewRafRef.current = requestAnimationFrame(updatePreview);
    }
    return () => {
      cancelAnimationFrame(previewRafRef.current);
    };
  }, [open, updatePreview]);

  // Reset full-length toggle when switching away from mp4
  useEffect(() => {
    if (format !== 'mp4') {
      setUseFullLength(false);
    }
  }, [format]);

  async function renderFrameToCanvas(
    targetCanvas: HTMLCanvasElement,
    src: HTMLImageElement | HTMLVideoElement,
    phase: number,
    matrixState?: any
  ) {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;
    const effectFn = effectRegistry[effectId];
    try {
      effectFn(ctx, src, params, phase, matrixState);
    } catch {
      // skip bad frames
    }
  }

  async function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
    return new Promise((resolve) => {
      if (Math.abs(video.currentTime - time) < 0.001) {
        resolve();
        return;
      }
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        // Wait for the video frame to actually reach the texture before resolving
        if ('requestVideoFrameCallback' in video) {
          (video as any).requestVideoFrameCallback(() => resolve());
        } else {
          requestAnimationFrame(() => resolve());
        }
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = time;
    });
  }

  async function handleDownload() {
    const sourceCanvas = canvasRef.current;
    if (!sourceCanvas) {
      setExportError("Couldn't create the export. Try a PNG instead.");
      return;
    }
    setExportError(null);

    if (format === 'mp4') {
      if (isRecording) return;
      if (!sourceElement) {
        setExportError('No source loaded. Please upload a file first.');
        return;
      }

      // Check for WebCodecs support
      const hasVideoEncoder = typeof VideoEncoder !== 'undefined';
      const hasVideoFrame = typeof VideoFrame !== 'undefined';

      if (!hasVideoEncoder || !hasVideoFrame) {
        setExportError('Exact frame-rate video export requires a modern Chromium-based browser with WebCodecs support.');
        return;
      }

      setIsRecording(true);
      onRecordingChange?.(true);
      setRecordProgress(0);
      cancelRef.current = false;

      const recordDurationSec = (useFullLength && hasVideo) ? fullDurationSec : duration;
      const computedTotalFrames = Math.ceil(recordDurationSec * fps);
      setTotalFrames(computedTotalFrames);
      const frameIntervalMicros = 1_000_000 / fps;

      // Hidden canvas — in DOM but invisible so browser composites it
      const hiddenCanvas = document.createElement('canvas');
      // Ensure width/height are even numbers for the encoder
      hiddenCanvas.width = sourceCanvas.width % 2 === 0 ? sourceCanvas.width : sourceCanvas.width - 1;
      hiddenCanvas.height = sourceCanvas.height % 2 === 0 ? sourceCanvas.height : sourceCanvas.height - 1;
      hiddenCanvas.style.position = 'fixed';
      hiddenCanvas.style.left = '0';
      hiddenCanvas.style.top = '0';
      hiddenCanvas.style.opacity = '0';
      hiddenCanvas.style.pointerEvents = 'none';
      hiddenCanvas.style.zIndex = '-1';
      document.body.appendChild(hiddenCanvas);

      // Pause video source so we can seek frame-by-frame
      const videoEl = sourceElement instanceof HTMLVideoElement ? sourceElement : null;
      const wasPlaying = videoEl ? !videoEl.paused : false;
      if (videoEl) {
        videoEl.pause();
        videoEl.currentTime = 0;
      }

      try {
        const muxer = new Mp4Muxer.Muxer({
          target: new Mp4Muxer.ArrayBufferTarget(),
          video: {
            codec: 'avc',
            width: hiddenCanvas.width,
            height: hiddenCanvas.height,
          },
          fastStart: 'in-memory',
        });

        const videoEncoder = new VideoEncoder({
          output: (chunk, meta) => muxer.addVideoChunk(chunk, meta as any),
          error: (e) => {
            console.error(e);
            setExportError('Video encoding failed.');
            setIsRecording(false);
            onRecordingChange?.(false);
            cleanup();
          },
        });

        videoEncoder.configure({
          codec: 'avc1.4d002a', // Main Profile
          width: hiddenCanvas.width,
          height: hiddenCanvas.height,
          bitrate: 25_000_000,
          framerate: fps,
        });

        let localMatrixState: any = undefined;
        if (effectId === 'matrix') {
          localMatrixState = createMatrixState(hiddenCanvas.width);
        }

        for (let i = 0; i < computedTotalFrames; i++) {
          if (cancelRef.current) {
            break;
          }

          const targetTime = i / fps;
          if (videoEl) {
            await seekVideo(videoEl, Math.min(targetTime, videoEl.duration || Infinity));
          }

          const phase = i * 0.025;
          await renderFrameToCanvas(hiddenCanvas, sourceElement, phase, localMatrixState);

          const timestamp = Math.round(i * frameIntervalMicros);
          const duration = Math.round(frameIntervalMicros);
          const frame = new VideoFrame(hiddenCanvas, { timestamp, duration });
          
          videoEncoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
          frame.close();

          // Wait a bit if encoder queue gets too large to prevent out of memory
          if (videoEncoder.encodeQueueSize > 30) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }

          setRecordProgress((i + 1) / computedTotalFrames);
        }

        await videoEncoder.flush();
        videoEncoder.close();
        muxer.finalize();

        const buffer = muxer.target.buffer;
        if (!buffer || buffer.byteLength === 0) {
          setExportError('No video data was recorded. Try a shorter duration or lower resolution.');
          setIsRecording(false);
          onRecordingChange?.(false);
          cleanup();
          return;
        }

        const blob = new Blob([buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const timestamp = Date.now();
        const filename = `aionos-${effectId}-${timestamp}.mp4`;

        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        setIsRecording(false);
        onRecordingChange?.(false);
        setRecordProgress(1);

        cleanup();

        function cleanup() {
          try {
            if (document.body.contains(hiddenCanvas)) {
              document.body.removeChild(hiddenCanvas);
            }
          } catch {}
          if (videoEl && wasPlaying) {
            videoEl.play().catch(() => {});
          }
        }
      } catch (err: any) {
        document.body.removeChild(hiddenCanvas);
        if (videoEl && wasPlaying) videoEl.play().catch(() => {});
        setExportError(err?.message || 'Recording failed. Please try again.');
        setIsRecording(false);
        onRecordingChange?.(false);
      }

      return;
    }

    try {
      exportFrame(sourceCanvas, format as 'png' | 'jpg', quality, effectId);
    } catch {
      setExportError("Couldn't create the export. Try a PNG instead.");
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v && isRecording) return; onOpenChange(v); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(14, 15, 12, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '480px',
            maxWidth: 'calc(100vw - 32px)',
            borderRadius: '30px',
            background: '#ffffff',
            boxShadow: 'rgba(14, 15, 12, 0.12) 0px 0px 0px 1px',
            padding: '32px',
            zIndex: 101,
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            outline: 'none',
          }}
          aria-describedby="export-dialog-description"
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <Dialog.Title
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '32px',
                  color: '#0e0f0c',
                  lineHeight: '0.9',
                  letterSpacing: '-0.02em',
                  marginBottom: '8px',
                }}
              >
                {format === 'mp4' ? 'Export video' : 'Export image'}
              </Dialog.Title>
              <p
                id="export-dialog-description"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: '#868685',
                  lineHeight: '1.5',
                }}
              >
                {format === 'mp4'
                  ? 'Each frame is rendered individually with exact playback timing.'
                  : 'Download the current canvas as an image file.'}
              </p>
            </div>
            {!isRecording && (
              <Dialog.Close
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(14, 15, 12, 0.06)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  outline: 'none',
                  color: '#454745',
                }}
                aria-label="Close export dialog"
                onFocus={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.outline = '2px solid #9fe870';
                  (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.outline = 'none';
                }}
              >
                <X size={16} strokeWidth={2} />
              </Dialog.Close>
            )}
          </div>

          {/* Preview canvas */}
          <div
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: 'rgba(14, 15, 12, 0.12) 0px 0px 0px 1px',
              background: '#0e0f0c',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <canvas
              ref={previewCanvasRef}
              style={{
                maxWidth: '100%',
                maxHeight: '140px',
                display: 'block',
              }}
              aria-label="Export preview"
            />
          </div>

          {/* Format selector */}
          {!isRecording && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#0e0f0c',
                }}
              >
                Format
              </span>
              <Tabs
                value={format}
                onValueChange={(v) => {
                  setFormat(v as 'png' | 'jpg' | 'mp4');
                  setExportError(null);
                }}
                tabs={FORMAT_TABS}
              />
            </div>
          )}

          {/* Quality slider (JPG only) */}
          {format === 'jpg' && !isRecording && (
            <div>
              <Slider
                label="Quality"
                value={quality}
                min={60}
                max={100}
                step={1}
                onChange={setQuality}
                formatValue={(v) => `${v}%`}
              />
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  color: '#868685',
                  marginTop: '6px',
                }}
              >
                Higher quality = larger file
              </p>
            </div>
          )}

          {/* MP4 controls */}
          {format === 'mp4' && !isRecording && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Framerate */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#0e0f0c',
                  }}
                >
                  Framerate
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {FPS_OPTIONS.map((opt) => {
                    const active = fps === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setFps(opt.value)}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          borderRadius: '12px',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-body)',
                          fontWeight: 600,
                          fontSize: '13px',
                          background: active ? '#0e0f0c' : 'rgba(14, 15, 12, 0.06)',
                          color: active ? '#9fe870' : '#454745',
                          transition: 'background 100ms ease, color 100ms ease',
                          outline: 'none',
                        }}
                        onFocus={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.outline = '2px solid #9fe870';
                          (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px';
                        }}
                        onBlur={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.outline = 'none';
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full video length toggle */}
              {hasVideo && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                        fontSize: '14px',
                        color: '#0e0f0c',
                      }}
                    >
                      Full video length
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px',
                        color: '#868685',
                      }}
                    >
                      Record the entire {fullDurationSec}s video
                    </span>
                  </div>
                  <button
                    role="switch"
                    aria-checked={useFullLength}
                    onClick={() => setUseFullLength(!useFullLength)}
                    style={{
                      width: '40px',
                      height: '22px',
                      borderRadius: '9999px',
                      background: useFullLength ? '#9fe870' : '#e8ebe6',
                      border: 'none',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 150ms ease',
                      flexShrink: 0,
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.outline = '2px solid #9fe870';
                      (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px';
                    }}
                    onBlur={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.outline = 'none';
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: useFullLength ? '21px' : '3px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: 'rgba(14, 15, 12, 0.12) 0px 0px 0px 1px',
                        transition: 'left 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    />
                  </button>
                </label>
              )}

              {/* Duration slider */}
              {!useFullLength && (
                <Slider
                  label="Duration"
                  value={duration}
                  min={1}
                  max={30}
                  step={1}
                  onChange={setDuration}
                  formatValue={(v) => `${v}s`}
                />
              )}

              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  color: '#868685',
                  marginTop: '2px',
                }}
              >
                Lower framerate = faster export. 24fps is cinematic, 60fps is smoothest.
              </p>
            </div>
          )}

          {/* Recording progress */}
          {isRecording && (
            <div
              style={{
                padding: '16px',
                background: '#0e0f0c',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Film size={18} color="#9fe870" />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: '6px',
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round(recordProgress * 100)}%`,
                      background: '#9fe870',
                      borderRadius: '9999px',
                      transition: 'width 100ms linear',
                    }}
                  />
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    color: '#e2f6d5',
                    marginTop: '8px',
                    fontWeight: 600,
                  }}
                >
                  {recordProgress >= 1
                    ? 'Finalizing…'
                    : `Recording frame ${Math.round(recordProgress * totalFrames)} / ${totalFrames}`}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: '#868685',
                    marginTop: '2px',
                  }}
                >
                  Please keep this tab active
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {exportError && (
            <div
              style={{
                background: '#0e0f0c',
                color: '#e2f6d5',
                borderRadius: '12px',
                padding: '12px 16px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span>{exportError}</span>
              <button
                onClick={() => setExportError(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9fe870',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                }}
                aria-label="Dismiss error"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {isRecording ? (
              <Button
                variant="secondary"
                size="lg"
                disabled
                style={{ width: '100%', opacity: 0.6 }}
              >
                {recordProgress >= 1 ? 'Finalizing…' : 'Recording in progress…'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={handleDownload}
                style={{ width: '100%' }}
                aria-label={
                  format === 'mp4'
                    ? 'Record video'
                    : `Download as ${format.toUpperCase()}${format === 'jpg' ? ` at ${quality}% quality` : ''}`
                }
              >
                {format === 'mp4' ? 'Record video' : 'Download image'}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
