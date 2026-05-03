# Aionos

Transform images and videos into ASCII art, dithering, halftone, VHS/glitch, wave, matrix, and edge-detection visuals in real-time. No account required — everything runs in your browser.

![Aionos](./public/aionos_favicon.png)

## Features

- **Real-time Effects** — Apply and preview effects instantly as you adjust parameters
- **7 Visual Styles** — ASCII, Dither, Halftone, VHS/Glitch, Wave, Matrix, and Edge Detection
- **Image & Video Support** — Works with both still images and video files
- **Zero Uploads** — All processing happens client-side; nothing leaves your device
- **Export** — Save your creations as images or video recordings
- **Drag & Drop** — Quick upload by dropping files anywhere on the page

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS v4** — Utility-first styling
- **Canvas API** — Real-time effect rendering pipeline
- **mp4-muxer / webm-muxer** — Video export encoding
- **Radix UI** — Accessible primitives (slider, tabs, dialog, tooltip)
- **Lucide React** — Icon system

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
  screens/
    Home/          — Landing page with upload and effect gallery
    Editor/        — Main effect editor interface
  components/
    EffectCanvas.tsx    — Canvas rendering engine
    EffectGallery.tsx   — Homepage effect preview cards
    EffectsPanel.tsx    — Editor controls sidebar
    ExportDialog.tsx    — Export options modal
    UploadZone.tsx      — Drag-and-drop upload area
    ui/                 — Reusable UI primitives
  lib/effects/
    ascii.ts       — ASCII art renderer
    dither.ts      — Ordered dithering
    halftone.ts    — Halftone dot patterns
    vhs.ts         — VHS glitch & scanlines
    wave.ts        — Sine wave distortion
    matrix.ts      — Matrix rain characters
    edge.ts        — Edge detection lines
    pipeline.ts    — Effect composition pipeline
  fixtures/
    effects.ts     — Effect registry & metadata
```

## Design

Aionos uses a design system inspired by **Wise** — bold, confident, and minimal:

- **Primary accent**: Wise Green (`#9fe870`) on Near Black (`#0e0f0c`)
- **Typography**: Syne (display, weight 800) + Inter (body, weight 400–600)
- **Radius**: Pill buttons (`9999px`), rounded cards (`16px`)
- **Shadows**: Subtle 1px ring shadows only — no heavy elevation

See [`DESIGN.md`](../DESIGN.md) for the full design system specification.

## Browser Support

Aionos requires a modern browser with **WebGL/Canvas 2D** support. For the best experience, use the latest version of Chrome, Edge, Firefox, or Safari.

Video export features rely on browser APIs available in Chromium-based browsers.
