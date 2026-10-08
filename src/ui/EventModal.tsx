import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Icon } from './Icon';
import { Button } from './Button';
import { Modal } from './Modal';
import type { PendingEvent } from '../game/types';

export interface EventModalProps {
  pendingEvent: PendingEvent | null;
  onResolve: (choiceIndex: 0 | 1) => void;
}

export const EventModal: React.FC<EventModalProps> = ({ pendingEvent, onResolve }) => {
  if (!pendingEvent) return null;

  return (
    <Modal isOpen={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Icon icon={AlertCircle} size={20} color="var(--primary)" aria-hidden="true" />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
            {pendingEvent.title}
          </h2>
        </div>

        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
          {pendingEvent.description}
        </p>

        {pendingEvent.isChoice ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Button
              variant="primary"
              onClick={() => onResolve(0)}
              style={{ minHeight: '48px', width: '100%', fontSize: '14px' }}
            >
              <span>{pendingEvent.choice1Label || 'Option A'}</span>
            </Button>

            <Button
              variant="secondary"
              onClick={() => onResolve(1)}
              style={{ minHeight: '48px', width: '100%', fontSize: '14px' }}
            >
              <span>{pendingEvent.choice2Label || 'Option B'}</span>
            </Button>
          </div>
        ) : (
          <div style={{ marginTop: 'var(--space-2)' }}>
            <Button
              variant="primary"
              onClick={() => onResolve(0)}
              style={{ minHeight: '48px', width: '100%', fontSize: '14px' }}
            >
              <span>Acknowledge</span>
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
export default EventModal;
