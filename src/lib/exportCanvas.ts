export function exportFrame(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpg',
  quality: number,
  effectId: string
): void {
  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpg' ? 'jpg' : 'png';
  const qualityValue = format === 'jpg' ? quality / 100 : undefined;
  const timestamp = Date.now();
  const filename = `aionos-${effectId}-${timestamp}.${ext}`;

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        console.error('Failed to create blob from canvas');
        return;
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    mimeType,
    qualityValue
  );
}
