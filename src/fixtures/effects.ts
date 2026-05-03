export type EffectId = 'ascii' | 'dither' | 'halftone' | 'vhs' | 'wave' | 'matrix' | 'edge';

export interface SliderConfig {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface ToggleConfig {
  key: string;
  label: string;
  default: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectConfig {
  key: string;
  label: string;
  options: SelectOption[];
  default: string;
}

export interface ColorConfig {
  key: string;
  label: string;
  default: string;
}

export type ParamConfig = SliderConfig | ToggleConfig | SelectConfig | ColorConfig;

export interface ParamSection {
  title: string;
  params: ParamConfig[];
}

export interface EffectMeta {
  id: EffectId;
  name: string;
  shortName: string;
  description: string;
  sliders: SliderConfig[];
  toggles?: ToggleConfig[];
  selects?: SelectConfig[];
  colors?: ColorConfig[];
  sections?: ParamSection[];
}

const COMMON_ADJUSTMENTS: ParamSection = {
  title: 'Adjustments',
  params: [
    { key: 'brightness', label: 'Brightness', min: 0, max: 2, step: 0.05, default: 1 },
    { key: 'contrast', label: 'Contrast', min: -1, max: 1, step: 0.05, default: 0 },
    { key: 'saturation', label: 'Saturation', min: 0, max: 4, step: 0.05, default: 1 },
    { key: 'hueRotate', label: 'Hue Rotation', min: -180, max: 180, step: 1, default: 0 },
    { key: 'sharpness', label: 'Sharpness', min: 0, max: 2, step: 0.05, default: 0 },
    { key: 'gamma', label: 'Gamma', min: 0.1, max: 3, step: 0.05, default: 1 },
  ],
};

const COMMON_PROCESSING: ParamSection = {
  title: 'Processing',
  params: [
    { key: 'invert', label: 'Invert', default: false },
    { key: 'brightnessMap', label: 'Brightness Map', min: 0, max: 2, step: 0.05, default: 1 },
    { key: 'edgeEnhance', label: 'Edge Enhance', min: 0, max: 2, step: 0.05, default: 0 },
    { key: 'blur', label: 'Blur', min: 0, max: 4, step: 0.1, default: 0 },
    { key: 'quantizeColors', label: 'Quantize Colors', min: 0, max: 32, step: 1, default: 0 },
    { key: 'shapeMatching', label: 'Shape Matching', min: 0, max: 1, step: 0.05, default: 0 },
  ],
};

const COMMON_POST_PROCESSING: ParamSection = {
  title: 'Post-Processing',
  params: [
    { key: 'bloom', label: 'Bloom', default: false },
    { key: 'grain', label: 'Grain', default: false },
    { key: 'grainIntensity', label: 'Intensity', min: 0, max: 30, step: 1, default: 14 },
    { key: 'grainSize', label: 'Size', min: 1, max: 4, step: 1, default: 1 },
    { key: 'grainSpeed', label: 'Speed', min: 1, max: 100, step: 1, default: 50 },
    { key: 'chromatic', label: 'Chromatic', default: false },
    { key: 'scanlines', label: 'Scanlines', default: false },
    { key: 'vignette', label: 'Vignette', default: false },
    { key: 'crtCurve', label: 'CRT Curve', default: false },
    { key: 'phosphor', label: 'Phosphor', default: false },
  ],
};

export const EFFECTS: EffectMeta[] = [
  {
    id: 'ascii',
    name: 'ASCII art',
    shortName: 'ASCII',
    description: 'Maps image luminance and color to text characters',
    sections: [
      {
        title: 'ASCII',
        params: [
          { key: 'cellSize', label: 'Scale', min: 4, max: 28, step: 1, default: 12 },
          { key: 'spacing', label: 'Spacing', min: 0, max: 2, step: 0.05, default: 0.5 },
          { key: 'outputWidth', label: 'Output Width', min: 0, max: 1920, step: 10, default: 0 },
          {
            key: 'charset',
            label: 'Character Set',
            options: [
              { value: 'standard', label: 'STANDARD' },
              { value: 'blocks', label: 'BLOCKS' },
              { value: 'minimal', label: 'MINIMAL' },
              { value: 'detailed', label: 'DETAILED' },
              { value: 'binary', label: 'BINARY' },
            ],
            default: 'standard',
          },
        ],
      },
      { ...COMMON_ADJUSTMENTS, params: COMMON_ADJUSTMENTS.params.map(p => (p.key === 'saturation' ? { ...p, default: 4 } : p)) as ParamConfig[] },
      {
        title: 'Color',
        params: [
          {
            key: 'colorMode',
            label: 'Mode',
            options: [
              { value: 'original', label: 'Original' },
              { value: 'solid', label: 'Solid' },
              { value: 'monochrome', label: 'Monochrome' },
            ],
            default: 'original',
          },
          { key: 'background', label: 'Background', default: '#050300' },
          { key: 'intensity', label: 'Intensity', min: 0, max: 1, step: 0.05, default: 1 },
        ],
      },
      COMMON_PROCESSING,
      { ...COMMON_POST_PROCESSING, params: COMMON_POST_PROCESSING.params.map(p => p.key === 'grain' ? { ...p, default: true } as ParamConfig : p) as ParamConfig[] },
    ],
    sliders: [],
  },
  {
    id: 'dither',
    name: 'Dithering',
    shortName: 'Dither',
    description: 'Floyd-Steinberg error diffusion',
    sections: [
      {
        title: 'Dithering',
        params: [
          { key: 'algorithm', label: 'Algorithm', options: [{ value: 'bayer', label: 'Bayer 8x8' }, { value: 'floyd', label: 'Floyd-Steinberg' }], default: 'floyd' },
          { key: 'ditherIntensity', label: 'Intensity', min: 0, max: 1, step: 0.05, default: 1 },
          { key: 'matrixSize', label: 'Matrix Size', options: [{ value: '2', label: '2x2' }, { value: '4', label: '4x4' }, { value: '8', label: '8x8' }], default: '4' },
          { key: 'modulation', label: 'Modulation', min: 0, max: 1, step: 0.05, default: 0 },
        ]
      },
      COMMON_ADJUSTMENTS,
      {
        title: 'Color',
        params: [
          { key: 'colorMode', label: 'Mode', options: [{ value: 'mono', label: 'Mono' }, { value: 'original', label: 'Original' }], default: 'mono' },
          { key: 'foreground', label: 'Foreground', default: '#FFFFFF' },
          { key: 'background', label: 'Background', default: '#000000' },
        ]
      },
      {
        title: 'Chromatic Effects',
        params: [
          { key: 'chromaticEnabled', label: 'Enabled', default: false },
          { key: 'maxDisplace', label: 'Max Displace', min: 0, max: 20, step: 1, default: 6 },
          { key: 'redChannel', label: 'Red Channel', min: 0, max: 100, step: 1, default: 23 },
          { key: 'greenChannel', label: 'Green Channel', min: 0, max: 100, step: 1, default: 50 },
          { key: 'blueChannel', label: 'Blue Channel', min: 0, max: 100, step: 1, default: 80 },
        ]
      },
      COMMON_PROCESSING,
      COMMON_POST_PROCESSING,
    ],
    sliders: [],
  },
  {
    id: 'halftone',
    name: 'Halftone',
    shortName: 'Halftone',
    description: 'Dot grid pattern from image luminance',
    sections: [
      {
        title: 'Halftone',
        params: [
          { key: 'shape', label: 'Shape', options: [{ value: 'circle', label: 'Circle' }, { value: 'square', label: 'Square' }, { value: 'line', label: 'Line' }], default: 'circle' },
          { key: 'dotScale', label: 'Dot Scale', min: 0.1, max: 2, step: 0.1, default: 1.0 },
          { key: 'spacing', label: 'Spacing', min: 4, max: 32, step: 1, default: 8 },
          { key: 'angle', label: 'Angle', min: 0, max: 90, step: 1, default: 45 },
          { key: 'halftoneInvert', label: 'Invert', default: false },
        ]
      },
      COMMON_ADJUSTMENTS,
      {
        title: 'Color',
        params: [
          { key: 'colorMode', label: 'Mode', options: [{ value: 'mono', label: 'Mono' }, { value: 'original', label: 'Original' }], default: 'mono' },
          { key: 'foreground', label: 'Foreground', default: '#FFFFFF' },
          { key: 'background', label: 'Background', default: '#000000' },
        ]
      },
      COMMON_PROCESSING,
      COMMON_POST_PROCESSING,
    ],
    sliders: [],
  },
  {
    id: 'vhs',
    name: 'VHS & glitch',
    shortName: 'VHS',
    description: 'Scan lines, slice shifts, chromatic aberration',
    sections: [
      {
        title: 'Distortion',
        params: [
          { key: 'distortion', label: 'Distortion', min: 0, max: 1, step: 0.05, default: 0.5 },
          { key: 'noise', label: 'Noise', min: 0, max: 1, step: 0.05, default: 0.3 },
          { key: 'colorBleed', label: 'Color Bleed', min: 0, max: 1, step: 0.05, default: 0.5 },
          { key: 'scanlinesIntensity', label: 'Scanlines', min: 0, max: 1, step: 0.05, default: 0.3 },
          { key: 'trackingError', label: 'Tracking Error', min: 0, max: 1, step: 0.05, default: 0.2 },
        ]
      },
      COMMON_ADJUSTMENTS,
      COMMON_PROCESSING,
      COMMON_POST_PROCESSING,
    ],
    sliders: [],
  },
  {
    id: 'wave',
    name: 'Wave',
    shortName: 'Wave',
    description: 'Animated sinusoidal row distortion',
    sections: [
      {
        title: 'Wave',
        params: [
          { key: 'lineCount', label: 'Line Count', min: 10, max: 200, step: 5, default: 50 },
          { key: 'amplitude', label: 'Amplitude', min: 0, max: 100, step: 1, default: 20 },
          { key: 'frequency', label: 'Frequency', min: 0.1, max: 10, step: 0.1, default: 1.0 },
          { key: 'lineThickness', label: 'Line Thickness', min: 0.1, max: 5, step: 0.1, default: 0.4 },
          { key: 'direction', label: 'Direction', options: [{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }], default: 'horizontal' },
          { key: 'animate', label: 'Animate', default: true },
        ]
      },
      COMMON_ADJUSTMENTS,
      {
        title: 'Color',
        params: [
          { key: 'colorMode', label: 'Mode', options: [{ value: 'original', label: 'Original' }, { value: 'mono', label: 'Mono' }], default: 'original' },
        ]
      },
      COMMON_PROCESSING,
      COMMON_POST_PROCESSING,
    ],
    sliders: [],
  },
  {
    id: 'matrix',
    name: 'Matrix',
    shortName: 'Matrix',
    description: 'Falling characters masked by image luminance',
    sections: [
      {
        title: 'Matrix',
        params: [
          { key: 'charset', label: 'Character Set', options: [{ value: 'standard', label: 'STANDARD' }, { value: 'binary', label: 'BINARY' }], default: 'standard' },
          { key: 'cellSize', label: 'Cell Size', min: 4, max: 32, step: 1, default: 12 },
          { key: 'density', label: 'Density', min: 0, max: 1, step: 0.05, default: 0.5 },
          { key: 'spacing', label: 'Spacing', min: 0, max: 5, step: 0.5, default: 0 },
          { key: 'speed', label: 'Speed', min: 0.1, max: 5, step: 0.1, default: 1.0 },
          { key: 'trailLength', label: 'Trail Length', min: 1, max: 50, step: 1, default: 15 },
          { key: 'direction', label: 'Direction', options: [{ value: 'down', label: 'Down' }, { value: 'up', label: 'Up' }], default: 'down' },
          { key: 'glow', label: 'Glow', min: 0, max: 5, step: 0.1, default: 1.0 },
          { key: 'bgOpacity', label: 'BG Opacity', min: 0, max: 1, step: 0.05, default: 0.3 },
        ]
      },
      COMMON_ADJUSTMENTS,
      {
        title: 'Color',
        params: [
          { key: 'rainColor', label: 'Rain Color', default: '#00FF00' },
        ]
      },
      COMMON_PROCESSING,
      COMMON_POST_PROCESSING,
    ],
    sliders: [],
  },
  {
    id: 'edge',
    name: 'Edge detection',
    shortName: 'Edge',
    description: 'Sobel gradient magnitude thresholding',
    sections: [
      {
        title: 'Edge Detection',
        params: [
          { key: 'algorithm', label: 'Algorithm', options: [{ value: 'sobel', label: 'Sobel' }, { value: 'canny', label: 'Canny' }], default: 'sobel' },
          { key: 'threshold', label: 'Threshold', min: 0, max: 1, step: 0.05, default: 0.3 },
          { key: 'lineWidth', label: 'Line Width', min: 0.5, max: 5, step: 0.1, default: 1.0 },
          { key: 'edgeInvert', label: 'Invert', default: false },
        ]
      },
      COMMON_ADJUSTMENTS,
      {
        title: 'Color',
        params: [
          { key: 'colorMode', label: 'Mode', options: [{ value: 'mono', label: 'Mono' }, { value: 'original', label: 'Original' }], default: 'mono' },
          { key: 'edgeColor', label: 'Edge Color', default: '#FFFFFF' },
          { key: 'background', label: 'Background', default: '#000000' },
        ]
      },
      COMMON_PROCESSING,
      COMMON_POST_PROCESSING,
    ],
    sliders: [],
  },
];

export const EFFECT_MAP = new Map<EffectId, EffectMeta>(
  EFFECTS.map((e) => [e.id, e])
);

export function getDefaultParams(effectId: EffectId): Record<string, number | boolean | string> {
  const meta = EFFECT_MAP.get(effectId);
  if (!meta) return {};
  const params: Record<string, number | boolean | string> = {};

  if (meta.sections) {
    for (const section of meta.sections) {
      for (const param of section.params) {
        if ('min' in param) {
          params[param.key] = (param as SliderConfig).default;
        } else if ('options' in param) {
          params[param.key] = (param as SelectConfig).default;
        } else if ('default' in param && typeof param.default === 'boolean') {
          params[param.key] = param.default;
        } else if ('default' in param && typeof param.default === 'string') {
          params[param.key] = param.default;
        }
      }
    }
  }

  for (const s of meta.sliders) {
    params[s.key] = s.default;
  }
  for (const t of meta.toggles ?? []) {
    params[t.key] = t.default;
  }
  for (const s of meta.selects ?? []) {
    params[s.key] = s.default;
  }
  for (const c of meta.colors ?? []) {
    params[c.key] = c.default;
  }

  return params;
}

export function getAllDefaultParams(): Record<EffectId, Record<string, number | boolean | string>> {
  const result = {} as Record<EffectId, Record<string, number | boolean | string>>;
  for (const effect of EFFECTS) {
    result[effect.id] = getDefaultParams(effect.id);
  }
  return result;
}
