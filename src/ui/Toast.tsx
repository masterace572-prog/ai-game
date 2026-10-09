import React, { useEffect } from 'react';
import { Award, X } from 'lucide-react';
import { Icon } from './Icon';

export interface ToastProps {
  message: string;
  onDismiss?: () => void;
  onClose?: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  onDismiss,
  onClose,
  durationMs = 4000,
}) => {
  const dismiss = onDismiss ?? onClose;

  useEffect(() => {
    if (!dismiss) return;
    const timer = setTimeout(() => {
      dismiss();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [dismiss, durationMs]);

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
        border: '1px solid var(--accent)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <Icon icon={Award} size={20} color="var(--accent)" aria-hidden="true" />
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', flex: 1 }}>
        {message}
      </span>
      {dismiss && (
        <button
          type="button"
          onClick={dismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Toast;
