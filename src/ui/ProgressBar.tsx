import React from 'react';

export interface ProgressBarProps {
  progress: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = '', style }) => {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div
      className={`progress-track ${className}`.trim()}
      style={{
        height: '4px',
        backgroundColor: 'var(--surface-2)',
        borderRadius: '2px',
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
          backgroundColor: 'var(--accent)',
          borderRadius: '2px',
          transition: 'width var(--duration) linear',
        }}
      />
    </div>
  );
};

export default ProgressBar;
