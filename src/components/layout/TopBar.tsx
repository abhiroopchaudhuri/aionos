import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';

interface TopBarProps {
  hasMedia: boolean;
  onNewFile: (file: File, objectUrl: string, mediaType: 'image' | 'video') => void;
  onExport: () => void;
}

export function TopBar({ hasMedia, onNewFile, onExport }: TopBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type === 'video/mp4' || file.type === 'video/webm';
    if (!isImage && !isVideo) return;

    const objectUrl = URL.createObjectURL(file);
    const mediaType = isImage ? 'image' : 'video';
    onNewFile(file, objectUrl, mediaType);
    e.target.value = '';
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: '56px',
        background: '#ffffff',
        boxShadow: 'rgba(14, 15, 12, 0.12) 0px 1px 0px 0px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
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
        </span>
        <span
          aria-hidden="true"
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#9fe870',
            display: 'inline-block',
          }}
        />
      </Link>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
          aria-hidden="true"
        />

        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Open a new file"
        >
          <FolderOpen size={15} strokeWidth={2} />
          New file
        </Button>

        {hasMedia ? (
          <Button
            variant="primary"
            size="sm"
            onClick={onExport}
            aria-label="Export"
          >
            <Download size={15} strokeWidth={2} />
            Export
          </Button>
        ) : (
          <Tooltip content="Open an image or video first" side="bottom">
            <span>
              <Button
                variant="primary"
                size="sm"
                disabled
                aria-label="Export (open a file first)"
              >
                <Download size={15} strokeWidth={2} />
                Export
              </Button>
            </span>
          </Tooltip>
        )}
      </div>
    </header>
  );
}
