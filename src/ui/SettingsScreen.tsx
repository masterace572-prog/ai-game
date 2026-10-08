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
import { Surface } from './Surface';
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
  const [importText, setImportText] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [wipeConfirm, setWipeConfirm] = useState('');
  const [wipeOpen, setWipeOpen] = useState(false);

  const soundOn = gameState.soundEnabled ?? true;
  const reduceMotion = gameState.reduceMotion ?? false;

  const handleCopyExport = () => {
    const json = JSON.stringify(gameState, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json).catch(() => {});
    }
  };

  const handleDoImport = () => {
    setImportError(null);
    if (!importText.trim()) {
      setImportError('Please paste save JSON first.');
      return;
    }
    const success = onImportSave(importText.trim());
    if (!success) {
      setImportError('Invalid save data or incompatible version.');
    }
  };

  const handleDoWipe = () => {
    if (wipeConfirm.trim() === 'RESET') {
      onWipeSave();
    }
  };

  return (
    <div className="tab-pane" style={{ gap: 'var(--space-4)' }}>
      {/* Back button */}
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
          padding: 'var(--space-2) 0',
          minHeight: '48px',
        }}
      >
        <Icon icon={ChevronLeft} size={20} aria-hidden="true" />
        <span>Back to More</span>
      </button>

      {/* Screen Title */}
      <div>
        <h1 className="screen-title" style={{ marginBottom: 'var(--space-1)' }}>
          Settings
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Audio controls, accessibility preferences, and local save storage.
        </p>
      </div>

      {/* Preferences Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
          Preferences
        </h2>

        {/* Sound Toggle */}
        <Surface
          style={{
            padding: 'var(--space-3) var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Icon icon={soundOn ? Volume2 : VolumeX} size={20} color="var(--primary)" aria-hidden="true" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                Sound Effects
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Web Audio procedural tones for taps, launches, and events
              </div>
            </div>
          </div>

          <Button
            variant={soundOn ? 'primary' : 'secondary'}
            onClick={onToggleSound}
            style={{ minHeight: '48px', padding: '0 var(--space-4)', fontSize: '13px' }}
          >
            <span>{soundOn ? 'On' : 'Muted'}</span>
          </Button>
        </Surface>

        {/* Reduce Motion Toggle */}
        <Surface
          style={{
            padding: 'var(--space-3) var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Icon icon={Zap} size={20} color="var(--primary)" aria-hidden="true" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                Reduce Motion
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Disable animations and transitions for accessible UI
              </div>
            </div>
          </div>

          <Button
            variant={reduceMotion ? 'primary' : 'secondary'}
            onClick={onToggleReduceMotion}
            style={{ minHeight: '48px', padding: '0 var(--space-4)', fontSize: '13px' }}
          >
            <span>{reduceMotion ? 'Reduced' : 'Normal'}</span>
          </Button>
        </Surface>
      </section>

      {/* Save Management Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
          Data & Save Storage
        </h2>

        {/* Export Save */}
        <Surface style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Icon icon={Download} size={20} color="var(--text-secondary)" aria-hidden="true" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                  Export Save
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Inspect or copy raw JSON game state
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => setExportOpen(!exportOpen)}
              style={{ minHeight: '48px', padding: '0 var(--space-3)', fontSize: '13px' }}
            >
              <span>{exportOpen ? 'Hide' : 'Export'}</span>
            </Button>
          </div>

          {exportOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <textarea
                readOnly
                value={JSON.stringify(gameState, null, 2)}
                style={{
                  width: '100%',
                  height: '140px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius-control)',
                  resize: 'none',
                }}
              />
              <Button
                variant="primary"
                onClick={handleCopyExport}
                style={{ minHeight: '48px', width: '100%', fontSize: '13px' }}
              >
                <span>Copy JSON to Clipboard</span>
              </Button>
            </div>
          )}
        </Surface>

        {/* Import Save */}
        <Surface style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Icon icon={Upload} size={20} color="var(--text-secondary)" aria-hidden="true" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                  Import Save
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Restore game state from pasted JSON
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => setImportOpen(!importOpen)}
              style={{ minHeight: '48px', padding: '0 var(--space-3)', fontSize: '13px' }}
            >
              <span>{importOpen ? 'Hide' : 'Import'}</span>
            </Button>
          </div>

          {importOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <textarea
                placeholder="Paste save JSON here..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                style={{
                  width: '100%',
                  height: '100px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius-control)',
                  resize: 'none',
                }}
              />
              {importError && (
                <span style={{ fontSize: '12px', color: 'var(--danger)' }}>{importError}</span>
              )}
              <Button
                variant="primary"
                onClick={handleDoImport}
                style={{ minHeight: '48px', width: '100%', fontSize: '13px' }}
              >
                <span>Confirm Import & Replace Save</span>
              </Button>
            </div>
          )}
        </Surface>

        {/* Wipe Save */}
        <Surface style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Icon icon={Trash2} size={20} color="var(--danger)" aria-hidden="true" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                  Wipe Game Data
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Reset laboratory to blank initial state
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => setWipeOpen(!wipeOpen)}
              style={{ minHeight: '48px', padding: '0 var(--space-3)', fontSize: '13px' }}
            >
              <span>{wipeOpen ? 'Cancel' : 'Wipe'}</span>
            </Button>
          </div>

          {wipeOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                Type <strong style={{ color: 'var(--text)' }}>RESET</strong> below to confirm wiping all laboratory progress.
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
                  color: 'var(--text)',
                  fontSize: '14px',
                  padding: '0 var(--space-3)',
                  borderRadius: 'var(--radius-control)',
                }}
              />
              <Button
                variant="primary"
                onClick={handleDoWipe}
                disabled={wipeConfirm.trim() !== 'RESET'}
                style={{ minHeight: '48px', width: '100%', fontSize: '13px' }}
              >
                <span>Confirm Wipe</span>
              </Button>
            </div>
          )}
        </Surface>
      </section>

      {/* App Version & Offline Notice */}
      <div
        style={{
          textAlign: 'center',
          padding: 'var(--space-6) var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Model Foundry v0.1.1
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          Offline game. Not a real company.
        </span>
      </div>
    </div>
  );
};
export default SettingsScreen;
