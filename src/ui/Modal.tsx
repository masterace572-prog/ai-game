import React from 'react';

export interface ModalProps {
  isOpen: boolean;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, children }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--scrim)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderTopLeftRadius: 'var(--radius-sheet)',
          borderTopRightRadius: 'var(--radius-sheet)',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          padding: 'var(--space-24) var(--space-16)',
          paddingBottom: 'max(var(--space-24), env(safe-area-inset-bottom))',
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-16)',
          boxShadow: 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
