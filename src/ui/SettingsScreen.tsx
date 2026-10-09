import React, { useState } from 'react';
import {
  ChevronLeft,
  Volume2,
  VolumeX,
  Zap,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import { Icon } from './Icon';
import { Button } from './Button';
import { GameRow } from './GameRow';
import { Modal } from './Modal';
import { APP_VERSION } from '../game/balance';
import type { GameState } from '../game/types';

export interface SettingsScreenProps {
  gameState: GameState;
  onBackToMore: () => void;
  onToggleSound: () => void;
  onToggleReduceMotion: () => void;
  onImportSave: (jsonText: string) => boolean;
  onWipeSave: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  gameState,
  onBackToMore,
  onToggleSound,
  onToggleReduceMotion,
  onImportSave,
  onWipeSave,
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeConfirm, setWipeConfirm] = useState('');

  const soundOn = gameState.soundEnabled ?? true;
  const reduceMotion = gameState.reduceMotion ?? false;

  const handleCopyExport = () => {
    const json = JSON.stringify(gameState, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDoImport = () => {
    setImportError(null);
    if (!importText.trim()) {
      setImportError('Paste save JSON first');
      return;
    }
    const success = onImportSave(importText.trim());
    if (success) {
      setImportOpen(false);
      setImportText('');
    } else {
      setImportError('Invalid save JSON');
    }
  };

  const handleDoWipe = () => {
    if (wipeConfirm.trim() === 'RESET') {
      onWipeSave();
      setWipeOpen(false);
      setWipeConfirm('');
    }
  };

  return (
    <div
      className="tab-pane"
      style={{
        padding: '16px',
        maxWidth: '480px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <button
        type="button"
        onClick={onBackToMore}
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          padding: '8px 0',
          minHeight: '48px',
        }}
      >
        <Icon icon={ChevronLeft} size={20} aria-hidden="true" />
        <span>Back to More</span>
      </button>

      <h1 className="screen-title">Settings</h1>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid var(--border)',
        }}
      >
        {/* Sound */}
        <GameRow
          icon={soundOn ? Volume2 : VolumeX}
          iconColor="var(--compute)"
          title="Sound"
          value={soundOn ? 'On' : 'Off'}
          button={
            <Button
              variant="secondary"
              onClick={onToggleSound}
              style={{ minHeight: '48px', padding: '0 16px', fontSize: '13px' }}
            >
              <span>Toggle</span>
            </Button>
          }
        />

        {/* Motion */}
        <GameRow
          icon={Zap}
          iconColor="var(--gold)"
          title="Motion"
          value={reduceMotion ? 'Reduced' : 'Full'}
          button={
            <Button
              variant="secondary"
              onClick={onToggleReduceMotion}
              style={{ minHeight: '48px', padding: '0 16px', fontSize: '13px' }}
            >
              <span>Toggle</span>
            </Button>
          }
        />

        {/* Export */}
        <GameRow
          icon={Download}
          iconColor="var(--text-secondary)"
          title="Export"
          button={
            <Button
              variant="secondary"
              onClick={() => {
                setCopied(false);
                setExportOpen(true);
              }}
              style={{ minHeight: '48px', padding: '0 16px', fontSize: '13px' }}
            >
              <span>Export</span>
            </Button>
          }
        />

        {/* Import */}
        <GameRow
          icon={Upload}
          iconColor="var(--text-secondary)"
          title="Import"
          button={
            <Button
              variant="secondary"
              onClick={() => {
                setImportError(null);
                setImportText('');
                setImportOpen(true);
              }}
              style={{ minHeight: '48px', padding: '0 16px', fontSize: '13px' }}
            >
              <span>Import</span>
            </Button>
          }
        />

        {/* Wipe */}
        <GameRow
          icon={Trash2}
          iconColor="var(--danger)"
          title="Wipe"
          button={
            <Button
              variant="secondary"
              onClick={() => {
                setWipeConfirm('');
                setWipeOpen(true);
              }}
              style={{ minHeight: '48px', padding: '0 16px', fontSize: '13px' }}
            >
              <span>Wipe</span>
            </Button>
          }
        />
      </div>

      {/* Export Sheet */}
      <Modal isOpen={exportOpen}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
            Export Save Data
          </h2>
          <textarea
            readOnly
            value={JSON.stringify(gameState, null, 2)}
            rows={8}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              color: 'var(--text)',
              fontSize: '11px',
              fontFamily: 'monospace',
              padding: '8px',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="primary"
              onClick={handleCopyExport}
              style={{ flex: 1, minHeight: '48px' }}
            >
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => setExportOpen(false)}
              style={{ flex: 1, minHeight: '48px' }}
            >
              <span>Close</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Sheet */}
      <Modal isOpen={importOpen}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
            Import Save Data
          </h2>
          <textarea
            placeholder="Paste save JSON here"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={8}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              color: 'var(--text)',
              fontSize: '11px',
              fontFamily: 'monospace',
              padding: '8px',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />
          {importError && (
            <div style={{ fontSize: '13px', color: 'var(--negative)' }}>
              {importError}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="primary"
              onClick={handleDoImport}
              style={{ flex: 1, minHeight: '48px' }}
            >
              <span>Import</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => setImportOpen(false)}
              style={{ flex: 1, minHeight: '48px' }}
            >
              <span>Close</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Wipe Sheet */}
      <Modal isOpen={wipeOpen}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
            Wipe Save
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Type <strong style={{ color: 'var(--text)' }}>RESET</strong> to delete all local progress.
          </p>
          <input
            type="text"
            placeholder="Type RESET"
            value={wipeConfirm}
            onChange={(e) => setWipeConfirm(e.target.value)}
            style={{
              height: '48px',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              color: 'var(--text)',
              fontSize: '14px',
              padding: '0 12px',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="primary"
              disabled={wipeConfirm.trim() !== 'RESET'}
              onClick={handleDoWipe}
              style={{ flex: 1, minHeight: '48px' }}
            >
              <span>Confirm Wipe</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => setWipeOpen(false)}
              style={{ flex: 1, minHeight: '48px' }}
            >
              <span>Cancel</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <div
        style={{
          textAlign: 'center',
          padding: '24px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Model Foundry v{APP_VERSION}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          Offline game. Not a real company.
        </span>
      </div>
    </div>
  );
};

export default SettingsScreen;
