import React from 'react';

export interface MonogramProps {
  code: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const BRAND_STYLES: Record<string, { bg: string; text: string }> = {
  CL: { bg: 'var(--brand-claude)', text: '#ffffff' },
  GP: { bg: 'var(--brand-openai)', text: '#ffffff' },
  GE: { bg: 'var(--brand-gemini)', text: '#ffffff' },
  GR: { bg: 'var(--brand-grok)', text: '#0d0d10' }, // light tile with dark text
  DS: { bg: 'var(--brand-deepseek)', text: '#ffffff' },
  LL: { bg: 'var(--brand-meta)', text: '#ffffff' },
  MI: { bg: 'var(--brand-mistral)', text: '#ffffff' },
  QW: { bg: 'var(--brand-qwen)', text: '#ffffff' },
};

export const Monogram: React.FC<MonogramProps> = ({
  code,
  size = 40,
  className = '',
  style,
}) => {
  const short = code.slice(0, 2).toUpperCase();
  const brand = BRAND_STYLES[short] ?? { bg: 'var(--surface-2)', text: 'var(--text)' };

  return (
    <div
      className={`monogram ${className}`.trim()}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '12px',
        backgroundColor: brand.bg,
        color: brand.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font)',
        fontSize: size >= 40 ? '14px' : '12px',
        fontWeight: 700,
        textTransform: 'uppercase',
        flexShrink: 0,
        boxShadow: 'none',
        userSelect: 'none',
        ...style,
      }}
      aria-hidden="true"
    >
      {short}
    </div>
  );
};

export default Monogram;
