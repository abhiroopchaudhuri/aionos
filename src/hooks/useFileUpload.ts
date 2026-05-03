import { useCallback, useRef } from 'react';

export interface UseFileUploadOptions {
  onFile: (file: File, objectUrl: string, mediaType: 'image' | 'video') => void;
  onError: (message: string) => void;
}

const ACCEPTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ACCEPTED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
]);

function getMediaType(file: File): 'image' | 'video' | null {
  if (ACCEPTED_IMAGE_TYPES.has(file.type)) return 'image';
  if (ACCEPTED_VIDEO_TYPES.has(file.type)) return 'video';
  return null;
}

export function useFileUpload({ onFile, onError }: UseFileUploadOptions) {
  const previousUrlRef = useRef<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      const mediaType = getMediaType(file);
      if (!mediaType) {
        onError("That format isn't supported. Try JPG, PNG, MP4, or WebM.");
        return;
      }

      // Revoke previous object URL to free memory
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }

      const objectUrl = URL.createObjectURL(file);
      previousUrlRef.current = objectUrl;
      onFile(file, objectUrl, mediaType);
    },
    [onFile, onError]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
        // Reset input so the same file can be re-selected
        e.target.value = '';
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  return { handleFileInput, handleDrop, processFile };
}
