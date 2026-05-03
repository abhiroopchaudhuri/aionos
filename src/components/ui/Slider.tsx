import * as RadixSlider from '@radix-ui/react-slider';

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export function Slider({ label, value, min, max, step, onChange, formatValue }: SliderProps) {
  const displayValue = formatValue ? formatValue(value) : String(value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            fontSize: '13px',
            color: '#868685',
            fontVariantNumeric: 'tabular-nums',
            minWidth: '32px',
            textAlign: 'right',
          }}
        >
          {displayValue}
        </span>
      </div>

      <RadixSlider.Root
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          userSelect: 'none',
          touchAction: 'none',
          width: '100%',
          height: '20px',
        }}
      >
        <RadixSlider.Track
          style={{
            background: '#e8ebe6',
            position: 'relative',
            flexGrow: 1,
            borderRadius: '9999px',
            height: '4px',
          }}
        >
          <RadixSlider.Range
            style={{
              position: 'absolute',
              background: '#9fe870',
              borderRadius: '9999px',
              height: '100%',
            }}
          />
        </RadixSlider.Track>

        <RadixSlider.Thumb
          style={{
            display: 'block',
            width: '18px',
            height: '18px',
            background: '#0e0f0c',
            borderRadius: '50%',
            boxShadow: 'rgba(14, 15, 12, 0.12) 0px 0px 0px 1px',
            cursor: 'grab',
            outline: 'none',
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLSpanElement).style.outline = '2px solid #9fe870';
            (e.currentTarget as HTMLSpanElement).style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLSpanElement).style.outline = 'none';
          }}
          aria-label={`${label}: ${displayValue}`}
        />
      </RadixSlider.Root>
    </div>
  );
}
