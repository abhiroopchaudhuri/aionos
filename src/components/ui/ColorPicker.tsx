export interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const isLight = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  };

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
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: 'rgba(14, 15, 12, 0.12) 0px 0px 0px 1px',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '40px',
            background: value,
            flexShrink: 0,
            borderRight: '1px solid rgba(14, 15, 12, 0.12)',
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            let v = e.target.value;
            if (!v.startsWith('#')) v = '#' + v;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
              onChange(v.toLowerCase());
            }
          }}
          onBlur={(e) => {
            let v = e.target.value;
            if (!v.startsWith('#')) v = '#' + v;
            v = v.toLowerCase();
            if (!/^#[0-9a-f]{6}$/.test(v)) {
              v = '#050300';
            }
            onChange(v);
          }}
          style={{
            flex: 1,
            height: '40px',
            padding: '0 14px',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '14px',
            color: isLight(value) ? '#0e0f0c' : '#ffffff',
            background: value,
            border: 'none',
            outline: 'none',
            textTransform: 'uppercase',
          }}
        />
      </div>
    </div>
  );
}
