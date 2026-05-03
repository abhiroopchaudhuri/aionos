import { useEffect, useRef } from 'react';
import { EFFECTS, type EffectId } from '../fixtures/effects';

// Draw a demo pattern for each effect using pure canvas ops
export function drawDemo(canvas: HTMLCanvasElement, effectId: EffectId): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  switch (effectId) {
    case 'ascii': {
      ctx.fillStyle = '#0e0f0c';
      ctx.fillRect(0, 0, w, h);
      const chars = ' ·:;+*?%$@#█';
      ctx.font = '8px monospace';
      ctx.fillStyle = '#9fe870';
      for (let y = 0; y < h; y += 9) {
        for (let x = 0; x < w; x += 6) {
          const dist = Math.sqrt((x - w / 2) ** 2 + (y - h / 2) ** 2);
          const t = Math.min(1, dist / (Math.min(w, h) * 0.5));
          const charIdx = Math.floor(t * (chars.length - 1));
          ctx.fillText(chars[charIdx], x, y + 8);
        }
      }
      break;
    }
    case 'dither': {
      // Simulate dithering: ordered dot pattern
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      const dotSize = 3;
      for (let y = 0; y < h; y += dotSize * 2) {
        for (let x = 0; x < w; x += dotSize * 2) {
          const lum = (x / w) * 0.7 + (y / h) * 0.3;
          if (Math.random() > lum) {
            ctx.fillStyle = '#0e0f0c';
            ctx.fillRect(x, y, dotSize, dotSize);
          }
        }
      }
      break;
    }
    case 'halftone': {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      const spacing = 10;
      ctx.fillStyle = '#0e0f0c';
      for (let y = spacing / 2; y < h; y += spacing) {
        for (let x = spacing / 2; x < w; x += spacing) {
          const t = (x / w + y / h) / 2;
          const radius = t * spacing * 0.55;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'vhs': {
      // Gradient base
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#6a2fa0');
      grad.addColorStop(0.5, '#1a3a7a');
      grad.addColorStop(1, '#0e0f0c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      // Scan lines
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }
      // Glitch slices
      for (let i = 0; i < 4; i++) {
        const sy = Math.floor(Math.random() * h);
        const sh = Math.floor(Math.random() * 4) + 1;
        ctx.fillStyle = `rgba(159, 232, 112, 0.3)`;
        ctx.fillRect(Math.floor(Math.random() * 20), sy, w * 0.8, sh);
      }
      break;
    }
    case 'wave': {
      const grad2 = ctx.createLinearGradient(0, 0, w, h);
      grad2.addColorStop(0, '#e2f6d5');
      grad2.addColorStop(1, '#9fe870');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#163300';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const y = (i / 8) * h + Math.sin(x / 20 + i) * 8;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    }
    case 'matrix': {
      ctx.fillStyle = '#0e0f0c';
      ctx.fillRect(0, 0, w, h);
      const matChars = 'アイウエオカキ01234';
      ctx.font = 'bold 9px monospace';
      for (let x = 0; x < w; x += 10) {
        const trailLen = Math.floor(Math.random() * 6) + 3;
        for (let t = 0; t < trailLen; t++) {
          const y = ((x * 7 + t * 12) % h);
          const alpha = 1 - t / trailLen;
          ctx.fillStyle = t === 0 ? '#d0ffb8' : `rgba(159, 232, 112, ${alpha * 0.7})`;
          ctx.fillText(matChars[Math.floor(Math.random() * matChars.length)], x, y);
        }
      }
      break;
    }
    case 'edge': {
      ctx.fillStyle = '#0e0f0c';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#9fe870';
      ctx.lineWidth = 1;
      // Geometric shapes as "edges"
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, h * 0.32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(w * 0.2, h * 0.2, w * 0.6, h * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h);
      ctx.moveTo(w, 0);
      ctx.lineTo(0, h);
      ctx.stroke();
      break;
    }
  }
}

interface GalleryCardProps {
  effectId: EffectId;
  name: string;
}

function GalleryCard({ effectId, name }: GalleryCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawDemo(canvas, effectId);
  }, [effectId]);

  return (
    <div
      style={{
        flexShrink: 0,
        borderRadius: '16px',
        boxShadow: 'rgba(14, 15, 12, 0.12) 0px 0px 0px 1px',
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
      <canvas
        ref={canvasRef}
        width={200}
        height={120}
        aria-label={`${name} effect preview`}
        style={{ display: 'block', width: '100%' }}
      />
      <div
        style={{
          padding: '10px 14px',
          borderTop: 'none',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '14px',
            color: '#0e0f0c',
          }}
        >
          {name}
        </span>
      </div>
    </div>
  );
}

export function EffectGallery() {
  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '11px',
            color: '#868685',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          What it does
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          paddingBottom: '8px',
        }}
      >
        {EFFECTS.map((effect) => (
          <GalleryCard key={effect.id} effectId={effect.id} name={effect.name} />
        ))}
      </div>
    </div>
  );
}
