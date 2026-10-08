import React from 'react';

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Surface: React.FC<SurfaceProps> = ({
  children,
  className = '',
  style,
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-card)',
    padding: 'var(--space-16)',
    boxShadow: 'none',
    ...style,
  };

  return (
    <div className={`surface ${className}`.trim()} style={baseStyle} {...props}>
      {children}
    </div>
  );
};

export default Surface;
