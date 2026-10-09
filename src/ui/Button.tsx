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
    borderRadius: 'var(--radius-control)',
    padding: '0 var(--space-16)',
    fontFamily: 'var(--font)',
    fontSize: '16px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-8)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    boxShadow: 'none',
    textShadow: 'none',
    outline: 'none',
    transition: 'background-color var(--duration) var(--ease), border-color var(--duration) var(--ease)',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    ...(effectiveVariant === 'primary'
      ? {
          backgroundColor: 'var(--accent)',
          color: 'var(--on-accent)',
          border: 'none',
        }
      : {
          backgroundColor: 'transparent',
          color: disabled ? 'var(--text-tertiary)' : 'var(--text)',
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
