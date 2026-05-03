import { useEffect, useRef } from 'react';
import { EFFECTS, type EffectId, type ParamConfig, type ParamSection } from '../fixtures/effects';
import { drawDemo } from './EffectGallery';
import { Slider } from './ui/Slider';
import { Select } from './ui/Select';
import { ColorPicker } from './ui/ColorPicker';

interface EffectsPanelProps {
  effectId: EffectId;
  params: Record<string, number | boolean | string>;
  onEffectChange: (id: EffectId) => void;
  onParamChange: (key: string, value: number | boolean | string) => void;
}

function EffectChip({ effectId, name, isSelected, onClick }: { effectId: EffectId, name: string, isSelected: boolean, onClick: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 60 * window.devicePixelRatio;
    canvas.height = 40 * window.devicePixelRatio;
    drawDemo(canvas, effectId);
  }, [effectId]);

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '6px',
        borderRadius: '12px',
        background: isSelected ? '#e2f6d5' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        boxShadow: isSelected ? 'inset 0 0 0 2px #9fe870' : 'none',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ width: '60px', height: '40px', borderRadius: '8px', overflow: 'hidden', boxShadow: 'rgba(14, 15, 12, 0.12) 0px 0px 0px 1px' }}>
        <canvas ref={canvasRef} style={{ width: '60px', height: '40px', display: 'block' }} />
      </div>
      <span style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-body)', color: isSelected ? '#163300' : '#868685' }}>{name}</span>
    </button>
  );
}

export function EffectsPanel({
  effectId,
  params,
  onEffectChange,
  onParamChange,
}: EffectsPanelProps) {
  const currentEffect = EFFECTS.find((e) => e.id === effectId);

  function renderParam(config: ParamConfig) {
    if ('options' in config) {
      const value = (params[config.key] as string) ?? config.default;
      return (
        <Select
          key={config.key}
          label={config.label}
          value={value}
          options={config.options}
          onChange={(v) => onParamChange(config.key, v)}
        />
      );
    }

    if ('default' in config && typeof config.default === 'string' && config.key === 'background') {
      const value = (params[config.key] as string) ?? config.default;
      return (
        <ColorPicker
          key={config.key}
          label={config.label}
          value={value}
          onChange={(v) => onParamChange(config.key, v)}
        />
      );
    }

    if ('min' in config) {
      const value = (params[config.key] as number) ?? config.default;
      return (
        <Slider
          key={config.key}
          label={config.label}
          value={value}
          min={config.min}
          max={config.max}
          step={config.step}
          onChange={(v) => onParamChange(config.key, v)}
          formatValue={
            config.step < 1
              ? (v) => v.toFixed(2)
              : config.label === 'Hue Rotation'
                ? (v) => `${Math.round(v)}°`
                : undefined
          }
        />
      );
    }

    if ('default' in config && typeof config.default === 'boolean') {
      const value = (params[config.key] as boolean) ?? config.default;
      return (
        <label
          key={config.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            gap: '12px',
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
            {config.label}
          </span>
          <button
            role="switch"
            aria-checked={value}
            onClick={() => onParamChange(config.key, !value)}
            style={{
              width: '40px',
              height: '22px',
              borderRadius: '9999px',
              background: value ? '#9fe870' : '#e8ebe6',
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
                left: value ? '21px' : '3px',
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
      );
    }

    return null;
  }

  function renderSection(section: ParamSection, index: number) {
    return (
      <div key={`${section.title}-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '14px',
            color: '#0e0f0c',
            letterSpacing: '-0.01em',
            marginTop: index > 0 ? '8px' : '0',
          }}
        >
          {section.title}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {section.params.map((param) => renderParam(param))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Section header */}
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
          Effects
        </span>
      </div>

      {/* Effect chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
        {EFFECTS.map((effect) => (
          <EffectChip
            key={effect.id}
            effectId={effect.id}
            name={effect.shortName}
            isSelected={effectId === effect.id}
            onClick={() => onEffectChange(effect.id)}
          />
        ))}
      </div>

      {/* Effect description */}
      {currentEffect && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            fontSize: '13px',
            color: '#868685',
            marginBottom: '24px',
            lineHeight: '1.5',
          }}
        >
          {currentEffect.description}
        </p>
      )}

      {/* Parameters */}
      {currentEffect && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sectioned params (ASCII) */}
          {currentEffect.sections ? (
            currentEffect.sections.map((section, i) => renderSection(section, i))
          ) : (
            <>
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
                Parameters
              </span>

              {/* Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {currentEffect.sliders.map((slider) => {
                  const value = (params[slider.key] as number) ?? slider.default;
                  return (
                    <Slider
                      key={slider.key}
                      label={slider.label}
                      value={value}
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      onChange={(v) => onParamChange(slider.key, v)}
                      formatValue={
                        slider.step < 1
                          ? (v) => v.toFixed(2)
                          : undefined
                      }
                    />
                  );
                })}
              </div>

              {/* Toggles */}
              {currentEffect.toggles && currentEffect.toggles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentEffect.toggles.map((toggle) => {
                    const value = (params[toggle.key] as boolean) ?? toggle.default;
                    return (
                      <label
                        key={toggle.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          gap: '12px',
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
                          {toggle.label}
                        </span>
                        <button
                          role="switch"
                          aria-checked={value}
                          onClick={() => onParamChange(toggle.key, !value)}
                          style={{
                            width: '40px',
                            height: '22px',
                            borderRadius: '9999px',
                            background: value ? '#9fe870' : '#e8ebe6',
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
                              left: value ? '21px' : '3px',
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
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
