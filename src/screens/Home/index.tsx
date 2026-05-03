import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Wand2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EffectGallery } from '../../components/EffectGallery';
import { UploadZone } from '../../components/UploadZone';

// Store media in module-level ref so Editor can access it
export let pendingMedia: {
  src: string;
  mediaType: 'image' | 'video';
  filename: string;
} | null = null;

export function setPendingMedia(data: typeof pendingMedia) {
  pendingMedia = data;
}

function BackgroundGraphic() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <svg 
        width="100%" 
        height="100%" 
        style={{ minWidth: '1400px' }}
        xmlns="http://www.w3.org/2000/svg" 
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="bgLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9fe870" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#9fe870" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#9fe870" stopOpacity="0" />
          </linearGradient>
          <mask id="fadeMask">
            <rect width="100%" height="100%" fill="url(#maskGrad)" />
            <linearGradient id="maskGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="80%" stopColor="#fff" />
              <stop offset="100%" stopColor="#000" />
            </linearGradient>
          </mask>
        </defs>
        <g stroke="url(#bgLineGrad)" fill="none" strokeWidth="1.5" mask="url(#fadeMask)">
          {Array.from({ length: 40 }).map((_, i) => {
            const yOffset = i * 25 - 200;
            return (
              <path
                key={i}
                d={`M -200 ${yOffset + 200} C 300 ${yOffset - 100}, 600 ${yOffset + 400}, 1000 ${yOffset + 100} S 1600 ${yOffset + 600}, 2000 ${yOffset}`}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Global drag-over for the entire page
  useEffect(() => {
    function handleDragOver(e: DragEvent) {
      e.preventDefault();
      setIsDragOver(true);
    }
    function handleDragLeave(e: DragEvent) {
      if (e.relatedTarget === null) {
        setIsDragOver(false);
      }
    }
    function handleDrop(e: DragEvent) {
      e.preventDefault();
      setIsDragOver(false);
    }
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Keyboard shortcut: Ctrl+O
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleFile(file: File, objectUrl: string, mediaType: 'image' | 'video') {
    setPendingMedia({ src: objectUrl, mediaType, filename: file.name });
    navigate('/editor');
  }

  function handleError(message: string) {
    showError(message);
  }

  return (
    <div
      style={{
        minHeight: '100svh',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Minimal nav */}
      <nav
        style={{
          padding: '20px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '20px',
            color: '#0e0f0c',
            letterSpacing: '-0.02em',
          }}
        >
          AIONOS
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#9fe870',
              marginLeft: '6px',
              verticalAlign: 'middle',
            }}
          />
        </span>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/editor')}
        >
          <Wand2 size={14} strokeWidth={2} />
          Editor
        </Button>
      </nav>

      {/* Hero */}
      <section
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 40px',
        }}
      >
        {/* Background graphic */}
        <BackgroundGraphic />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '64px',
            maxWidth: '1200px',
            width: '100%',
            flexWrap: 'wrap',
            zIndex: 10,
          }}
        >
          <div style={{ flex: '1 1 400px', textAlign: 'left' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 'clamp(40px, 6vw, 84px)',
                lineHeight: 0.9,
                color: '#0e0f0c',
                letterSpacing: '-0.03em',
                marginBottom: '24px',
              }}
            >
              Transform anything
              <br />
              into retro art.
            </h1>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 'clamp(16px, 2vw, 22px)',
                color: '#454745',
                lineHeight: 1.4,
              }}
            >
              Real-time effects. No account. No waiting.
            </p>
          </div>

          <div
            style={{
              flex: '1 1 400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            <UploadZone onFile={handleFile} onError={handleError} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '520px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '12px',
                  color: '#868685',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Or select manually
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const isImage = file.type.startsWith('image/');
                  const isVideo = file.type === 'video/mp4' || file.type === 'video/webm';
                  if (!isImage && !isVideo) {
                    handleError("That format isn't supported. Try JPG, PNG, MP4, or WebM.");
                    e.target.value = '';
                    return;
                  }
                  const objectUrl = URL.createObjectURL(file);
                  handleFile(file, objectUrl, isImage ? 'image' : 'video');
                  e.target.value = '';
                }}
                aria-hidden="true"
              />
              <Button
                variant="primary"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Open an image or video file"
                style={{ width: '100%' }}
              >
                <Upload size={18} strokeWidth={2} />
                Open an image or video
              </Button>
            </div>

            {/* File error */}
            {fileError && (
              <div
                role="alert"
                style={{
                  background: '#0e0f0c',
                  color: '#e2f6d5',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  maxWidth: '520px',
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
        </div>
      </section>

      {/* Effects gallery */}
      <section
        style={{
          padding: '48px 40px',
          background: '#f7f9f5',
          borderTop: 'rgba(14, 15, 12, 0.08) 0px 0px 0px 1px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <EffectGallery />
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '24px 40px',
          borderTop: 'rgba(14, 15, 12, 0.08) 0px 0px 0px 1px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '14px',
            color: '#0e0f0c',
            letterSpacing: '-0.02em',
          }}
        >
          AIONOS
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: '#868685',
          }}
        >
          Runs entirely in your browser. Nothing is uploaded.
        </span>
      </footer>

      {/* Global drag overlay */}
      {isDragOver && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(226, 246, 213, 0.9)',
            border: '3px solid #9fe870',
            borderRadius: '0',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Upload size={48} color="#163300" strokeWidth={1.5} />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '32px',
                color: '#163300',
                letterSpacing: '-0.02em',
              }}
            >
              Release to apply effect
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
