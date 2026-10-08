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
  ...props
}) => {
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
    cursor: 'pointer',
    boxShadow: 'none',
    textShadow: 'none',
    outline: 'none',
    transition: 'background-color var(--duration) var(--ease), border-color var(--duration) var(--ease)',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    ...(variant === 'primary'
      ? {
          backgroundColor: 'var(--accent)',
          color: 'var(--on-accent)',
          border: 'none',
        }
      : {
          backgroundColor: 'transparent',
          color: 'var(--text)',
          border: '1px solid var(--border-strong)',
        }),
    ...style,
  };

  return (
    <button
      className={`btn btn-${variant} ${className}`.trim()}
      style={baseStyle}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
