import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  style,
  disabled,
  ...props
}) => {
  const effectiveVariant = disabled && variant !== 'ghost' ? 'secondary' : variant;

  const height = size === 'sm' ? '36px' : size === 'lg' ? '54px' : '48px';
  const padding = size === 'sm' ? '0 12px' : '0 16px';
  const fontSize = size === 'sm' ? '13px' : '15px';

  const baseStyle: React.CSSProperties = {
    height,
    borderRadius: '12px',
    padding,
    fontFamily: 'var(--font)',
    fontSize,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    boxShadow: 'none',
    textShadow: 'none',
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    transition:
      'background-color var(--duration) var(--ease), border-color var(--duration) var(--ease), transform 120ms ease',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    ...(effectiveVariant === 'primary'
      ? {
          backgroundColor: 'var(--brand-claude)',
          color: '#ffffff',
          border: 'none',
        }
      : effectiveVariant === 'ghost'
      ? {
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
        }
      : {
          backgroundColor: 'var(--surface-2)',
          color: 'var(--text)',
          border: '1px solid var(--border-strong)',
        }),
    ...style,
  };

  return (
    <button
      className={`btn btn-${effectiveVariant} ${className}`.trim()}
      style={baseStyle}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
