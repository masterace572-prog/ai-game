import React, { useEffect } from 'react';
import { Award } from 'lucide-react';
import { Icon } from './Icon';

export interface ToastProps {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  onDismiss,
  durationMs = 4000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [onDismiss, durationMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'calc(max(var(--space-8), env(safe-area-inset-top)) + 56px)',
        left: 'var(--space-4)',
        right: 'var(--space-4)',
        zIndex: 1000,
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--primary)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}
    >
      <Icon icon={Award} size={20} color="var(--primary)" aria-hidden="true" />
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', flex: 1 }}>
        {message}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-tertiary)',
          fontSize: '12px',
          cursor: 'pointer',
          padding: 'var(--space-1) var(--space-2)',
          minHeight: '48px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        Dismiss
      </button>
    </div>
  );
};
export default Toast;
