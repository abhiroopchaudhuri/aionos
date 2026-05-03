import { forwardRef, type ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, style, children, disabled, ...props }, ref) => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      borderRadius: 'var(--radius-pill)',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      transition: 'transform 120ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      outline: 'none',
    };

    const sizeStyles: React.CSSProperties =
      size === 'sm'
        ? { fontSize: '14px', padding: '6px 16px' }
        : size === 'lg'
        ? { fontSize: '18px', padding: '14px 32px' }
        : { fontSize: '16px', padding: '10px 24px' };

    const variantStyles: React.CSSProperties =
      variant === 'primary'
        ? {
            background: disabled ? 'rgba(159, 232, 112, 0.4)' : '#9fe870',
            color: disabled ? 'rgba(22, 51, 0, 0.4)' : '#163300',
          }
        : variant === 'secondary'
        ? {
            background: 'rgba(14, 15, 12, 0.08)',
            color: '#0e0f0c',
          }
        : {
            background: 'transparent',
            color: '#454745',
          };

    return (
      <button
        ref={ref}
        disabled={disabled}
        style={{
          ...baseStyle,
          ...sizeStyles,
          ...variantStyles,
          ...style,
        }}
        className={className}
        onMouseEnter={(e) => {
          if (!disabled) {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => {
          if (!disabled) {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
          }
          props.onMouseDown?.(e);
        }}
        onMouseUp={(e) => {
          if (!disabled) {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
          }
          props.onMouseUp?.(e);
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLButtonElement).style.outline = '2px solid #9fe870';
          (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLButtonElement).style.outline = 'none';
          props.onBlur?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
