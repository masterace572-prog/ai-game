import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  style,
  disabled,
  ...props
}) => {
  const effectiveVariant = disabled ? 'secondary' : variant;

  const baseStyle: React.CSSProperties = {
    height: '48px',
    borderRadius: '12px',
    padding: '0 16px',
    fontFamily: 'var(--font)',
    fontSize: '15px',
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
    transition: 'background-color var(--duration) var(--ease), border-color var(--duration) var(--ease), transform 120ms ease',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    ...(effectiveVariant === 'primary'
      ? {
          backgroundColor: 'var(--brand-claude)',
          color: '#ffffff',
          border: 'none',
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
