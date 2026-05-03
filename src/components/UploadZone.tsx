import { useRef, useState, useCallback } from 'react';
import { ImageIcon } from 'lucide-react';

interface UploadZoneProps {
  onFile: (file: File, objectUrl: string, mediaType: 'image' | 'video') => void;
  onError?: (message: string) => void;
  dark?: boolean;
  compact?: boolean;
}

function getMediaType(file: File): 'image' | 'video' | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'video/mp4' || file.type === 'video/webm') return 'video';
  return null;
}

export function UploadZone({ onFile, onError, dark = false, compact = false }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      const mediaType = getMediaType(file);
      if (!mediaType) {
        onError?.("That format isn't supported. Try JPG, PNG, MP4, or WebM.");
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      onFile(file, objectUrl, mediaType);
    },
    [onFile, onError]
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
      e.target.value = '';
    }
  }

  const borderColor = '#9fe870';
  const bgColor = isDragOver ? '#e2f6d5' : 'transparent';
  const textColor = dark ? '#ffffff' : '#0e0f0c';
  const hintColor = dark ? 'rgba(255,255,255,0.5)' : '#868685';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload or drop an image or video file"
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px ${isDragOver ? 'solid' : 'dashed'} ${borderColor}`,
        borderRadius: '16px',
        padding: compact ? '32px 24px' : '56px 40px',
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'background 150ms ease, border-style 150ms ease',
        userSelect: 'none',
        outline: 'none',
        maxWidth: compact ? '400px' : '520px',
        width: '100%',
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLDivElement).style.outline = '2px solid #9fe870';
        (e.currentTarget as HTMLDivElement).style.outlineOffset = '4px';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLDivElement).style.outline = 'none';
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
        style={{ display: 'none' }}
        onChange={handleInputChange}
        aria-hidden="true"
      />

      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'rgba(159, 232, 112, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <ImageIcon size={24} color={borderColor} strokeWidth={1.5} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: compact ? '16px' : '18px',
            color: textColor,
          }}
        >
          {isDragOver ? 'Release to load' : 'Drop an image or video here'}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            fontSize: '14px',
            color: hintColor,
          }}
        >
          Supports JPG, PNG, MP4, WebM
        </span>
      </div>
    </div>
  );
}
