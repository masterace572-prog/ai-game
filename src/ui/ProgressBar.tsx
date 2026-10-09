import React from 'react';

export interface ProgressBarProps {
  progress?: number;
  value?: number;
  max?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  value,
  max = 1,
  color = 'var(--brand-claude)',
  className = '',
  style,
}) => {
  const fraction =
    typeof progress === 'number'
      ? progress
      : typeof value === 'number' && max > 0
      ? value / max
      : 0;

  const clamped = Math.max(0, Math.min(1, fraction));

  return (
    <div
      className={`progress-track ${className}`.trim()}
      style={{
        height: '6px',
        backgroundColor: 'var(--surface-2)',
        borderRadius: '3px',
        overflow: 'hidden',
        width: '100%',
        ...style,
      }}
    >
      <div
        className="progress-fill"
        style={{
          height: '100%',
          width: `${clamped * 100}%`,
          backgroundColor: color,
          borderRadius: '3px',
          transition: 'width var(--duration) linear',
        }}
      />
    </div>
  );
};

export default ProgressBar;
