import React from 'react';

export interface MonogramProps {
  code: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Monogram: React.FC<MonogramProps> = ({ code, className = '', style }) => {
  return (
    <div
      className={`monogram ${className}`.trim()}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: 'var(--radius-control)',
        backgroundColor: 'var(--surface-2)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font)',
        fontSize: '12px',
        lineHeight: '16px',
        fontWeight: 600,
        color: 'var(--text)',
        textTransform: 'uppercase',
        flexShrink: 0,
        boxShadow: 'none',
        ...style,
      }}
      aria-hidden="true"
    >
      {code.slice(0, 2)}
    </div>
  );
};

export default Monogram;
