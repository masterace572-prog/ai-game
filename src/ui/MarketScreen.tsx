import React from 'react';
import { Monogram } from './Monogram';
import {
  calculateMarket,
  getPlayerAppeal,
  getRivalAppeal,
} from '../game/logic';
import { getRivalModelName } from '../game/balance';
import { formatRate } from './format';
import type { GameState } from '../game/types';

export interface MarketScreenProps {
  gameState: GameState;
}

interface LeaderboardEntry {
  id: string;
  isPlayer: boolean;
  name: string;
  shortCode: string;
  bestScore: number;
  appeal: number;
  sharePercent: number;
  statusLine?: string;
}

export function getLabMonogram(name: string): string {
  if (name.toLowerCase() === 'claude') return 'CL';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return 'CL';
}

export const MarketScreen: React.FC<MarketScreenProps> = ({ gameState }) => {
  const market = calculateMarket(gameState);
  const playerAppeal = getPlayerAppeal(gameState);

  const entries: LeaderboardEntry[] = [];

  // Player entry
  const playerShare = market.totalAppeal > 0 ? (playerAppeal / market.totalAppeal) * 100 : 0;
  const playerModel = gameState.bestLaunchedModel?.name ?? 'No models launched';
  const playerStatus = gameState.currentTraining
    ? `${playerModel} · Training...`
    : playerModel;

  entries.push({
    id: 'player',
    isPlayer: true,
    name: gameState.labName,
    shortCode: getLabMonogram(gameState.labName),
    bestScore: gameState.bestLaunchedModel?.score ?? 0,
    appeal: playerAppeal,
    sharePercent: playerShare,
    statusLine: playerStatus,
  });

  // Rivals
  for (const rival of gameState.rivals ?? []) {
    const appeal = getRivalAppeal(rival);
    const share = market.totalAppeal > 0 ? (appeal / market.totalAppeal) * 100 : 0;
    const rivalModel = getRivalModelName(rival.id, rival.bestScore);
    const rivalStatus = rival.trainingJob
      ? `${rivalModel} · Training...`
      : rivalModel;

    entries.push({
      id: rival.id,
      isPlayer: false,
      name: rival.name,
      shortCode: rival.shortCode,
      bestScore: rival.bestScore,
      appeal,
      sharePercent: share,
      statusLine: rivalStatus,
    });
  }

  // Sort descending by appeal, then by bestScore
  entries.sort((a, b) => {
    if (b.appeal !== a.appeal) return b.appeal - a.appeal;
    return b.bestScore - a.bestScore;
  });

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
      <h1 className="screen-title">Market</h1>

      {/* One Summary Block */}
      <div
        style={{
          padding: '16px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Market Share</span>
            <span
              style={{
                fontSize: '28px',
                lineHeight: '34px',
                fontWeight: 600,
                color: 'var(--text)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {(market.playerShare * 100).toFixed(1)}%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Revenue</span>
            <span
              style={{
                fontSize: '20px',
                lineHeight: '28px',
                fontWeight: 600,
                color: market.revenuePerSec > 0 ? 'var(--positive)' : 'var(--text)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatRate(market.revenuePerSec)}
            </span>
          </div>
        </div>

        {/* Share Bar */}
        <div
          style={{
            height: '4px',
            borderRadius: '2px',
            background: 'var(--surface-2)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, market.playerShare * 100))}%`,
              background: 'var(--accent)',
              borderRadius: '2px',
              transition: 'width var(--duration) var(--ease)',
            }}
          />
        </div>

        {/* Single Meta Line */}
        <div style={{ fontSize: '12px', lineHeight: '16px', color: 'var(--text-secondary)' }}>
          65% subs · 35% API
        </div>
      </div>

      {/* Leaderboard Rows */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid var(--border)',
        }}
      >
        {entries.map((entry, index) => {
          const rank = index + 1;
          return (
            <div
              key={entry.id}
              style={{
                minHeight: '56px',
                padding: '12px 0',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span
                style={{
                  width: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  fontVariantNumeric: 'tabular-nums',
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                {rank}
              </span>

              <div style={{ flexShrink: 0 }}>
                <Monogram code={entry.shortCode} />
              </div>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.name}
                  </span>
                  {entry.isPlayer && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-control)',
                        background: 'var(--surface-2)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      You
                    </span>
                  )}
                </div>
                {entry.statusLine && (
                  <span
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: '2px',
                    }}
                  >
                    {entry.statusLine}
                  </span>
                )}
              </div>

              <div
                style={{
                  flexShrink: 0,
                  textAlign: 'right',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                }}
              >
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--text)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  Score {entry.bestScore}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontVariantNumeric: 'tabular-nums',
                    marginTop: '2px',
                  }}
                >
                  {entry.sharePercent.toFixed(1)}% share
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketScreen;
