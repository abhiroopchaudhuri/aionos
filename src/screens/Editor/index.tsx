import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { TopBar } from '../../components/layout/TopBar';
import { EffectCanvas } from '../../components/EffectCanvas';
import { EffectsPanel } from '../../components/EffectsPanel';
import { ExportDialog } from '../../components/ExportDialog';
import { getAllDefaultParams } from '../../fixtures/effects';
import type { EffectId } from '../../fixtures/effects';
import { pendingMedia, setPendingMedia } from '../Home';

export default function Editor() {
  const [mediaSource, setMediaSource] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [sourceElement, setSourceElement] = useState<HTMLImageElement | HTMLVideoElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [effectId, setEffectId] = useState<EffectId>('ascii');
  const [allParams, setAllParams] = useState<Record<EffectId, Record<string, number | boolean | string>>>(
    getAllDefaultParams() as Record<EffectId, Record<string, number | boolean | string>>
  );
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load pending media from Home page navigation
  useEffect(() => {
    if (pendingMedia) {
      setMediaSource(pendingMedia.src);
      setMediaType(pendingMedia.mediaType);
      setFilename(pendingMedia.filename);
      if (pendingMedia.mediaType === 'video') {
        extractVideoDuration(pendingMedia.src);
      } else {
        setVideoDuration(0);
      }
      setPendingMedia(null);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (mediaSource) setIsExportOpen(true);
      }
      // Number keys 1-7 to switch effects
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const effects: EffectId[] = ['ascii', 'dither', 'halftone', 'vhs', 'wave', 'matrix', 'edge'];
        const num = parseInt(e.key);
        if (num >= 1 && num <= 7) {
          setEffectId(effects[num - 1]);
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mediaSource]);

  const showError = useCallback((message: string) => {
    setFileError(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setFileError(null), 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  function extractVideoDuration(src: string) {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      setVideoDuration(video.duration || 0);
      URL.revokeObjectURL(video.src);
    };
    video.onerror = () => {
      setVideoDuration(0);
      URL.revokeObjectURL(video.src);
    };
    video.src = src;
  }

  function handleNewFile(file: File, objectUrl: string, newMediaType: 'image' | 'video') {
    // Revoke previous URL
    if (mediaSource) {
      URL.revokeObjectURL(mediaSource);
    }
    setMediaSource(objectUrl);
    setMediaType(newMediaType);
    setFilename(file.name);
    if (newMediaType === 'video') {
      extractVideoDuration(objectUrl);
    } else {
      setVideoDuration(0);
    }
  }

  function handleParamChange(key: string, value: number | boolean | string) {
    setAllParams((prev) => ({
      ...prev,
      [effectId]: {
        ...prev[effectId],
        [key]: value,
      },
    }));
  }

  function handleEffectChange(id: EffectId) {
    setEffectId(id);
  }

  const currentParams = allParams[effectId] ?? {};

  return (
    <>
      <AppLayout
        topBar={
          <TopBar
            hasMedia={!!mediaSource}
            onNewFile={handleNewFile}
            onExport={() => setIsExportOpen(true)}
          />
        }
        canvasArea={
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              position: 'relative',
            }}
          >
            <EffectCanvas
              src={mediaSource}
              mediaType={mediaType}
              effectId={effectId}
              params={currentParams}
              onFile={handleNewFile}
              onError={showError}
              filename={filename}
              isRecording={isRecording}
              onSourceElement={setSourceElement}
            />

            {/* File error bar */}
            {fileError && (
              <div
                role="alert"
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#0e0f0c',
                  color: '#e2f6d5',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  maxWidth: '480px',
                  width: 'calc(100% - 32px)',
                  boxShadow: 'rgba(14, 15, 12, 0.12) 0px 0px 0px 1px',
                  zIndex: 10,
                }}
              >
                <span style={{ flex: 1 }}>{fileError}</span>
                <button
                  onClick={() => setFileError(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9fe870',
                    cursor: 'pointer',
                    display: 'flex',
                    flexShrink: 0,
                  }}
                  aria-label="Dismiss error"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        }
        sidePanel={
          <EffectsPanel
            effectId={effectId}
            params={currentParams}
            onEffectChange={handleEffectChange}
            onParamChange={handleParamChange}
          />
        }
      />

      <CanvasRefBridge canvasRef={canvasRef} />

      <ExportDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        canvasRef={canvasRef}
        effectId={effectId}
        mediaType={mediaType}
        videoDuration={videoDuration}
        sourceElement={sourceElement}
        params={currentParams}
        onRecordingChange={setIsRecording}
      />
    </>
  );
}

// Bridge component to find the canvas in the DOM and sync the ref
function CanvasRefBridge({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  useEffect(() => {
    const canvas = document.querySelector('canvas[role="img"]') as HTMLCanvasElement | null;
    if (canvas && canvasRef.current !== canvas) {
      // @ts-expect-error — mutating ref directly
      canvasRef.current = canvas;
    }
  });
  return null;
}
