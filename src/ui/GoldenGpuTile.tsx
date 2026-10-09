import React from 'react';
import { Cpu } from 'lucide-react';

export interface GoldenGpuTileProps {
  xPercent: number; // 10 to 80
  yPercent: number; // 20 to 75
  onTap: () => void;
}

export const GoldenGpuTile: React.FC<GoldenGpuTileProps> = ({
  xPercent,
  yPercent,
  onTap,
}) => {
  return (
    <div
      onClick={onTap}
      style={{
        position: 'absolute',
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        width: '56px',
        height: '56px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--surface-2)',
        border: '2px solid var(--gold)',
        color: 'var(--gold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-md)',
        zIndex: 50,
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
      title="Golden GPU! Tap for bonus!"
    >
      <Cpu size={28} />
    </div>
  );
};

export default GoldenGpuTile;
