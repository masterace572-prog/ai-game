import React from 'react';
import { Surface } from './Surface';
import { Monogram } from './Monogram';
import {
  calculateMarket,
  getPlayerAppeal,
  getRivalAppeal,
} from '../game/logic';
import { MODEL_SIZES } from '../game/balance';
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
  subtitle: string;
  trainingStatus?: string;
}

export function getLabMonogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return 'LB';
}

export const MarketScreen: React.FC<MarketScreenProps> = ({ gameState }) => {
  const market = calculateMarket(gameState);
  const playerAppeal = getPlayerAppeal(gameState);

  // Build leaderboard entries
  const entries: LeaderboardEntry[] = [];

  // 1. Player
  const playerShare = market.totalAppeal > 0 ? (playerAppeal / market.totalAppeal) * 100 : 0;
  entries.push({
    id: 'player',
    isPlayer: true,
    name: gameState.labName,
    shortCode: getLabMonogram(gameState.labName),
    bestScore: gameState.bestLaunchedModel?.score ?? 0,
    appeal: playerAppeal,
    sharePercent: playerShare,
    subtitle: gameState.bestLaunchedModel
      ? `${gameState.bestLaunchedModel.name} (${MODEL_SIZES[gameState.bestLaunchedModel.sizeId]?.name ?? 'Model'})`
      : 'No model launched',
    trainingStatus: gameState.currentTraining
      ? `Training ${MODEL_SIZES[gameState.currentTraining.sizeId]?.name ?? 'Model'}`
      : undefined,
  });

  // 2. Rivals
  for (const rival of gameState.rivals ?? []) {
    const appeal = getRivalAppeal(rival);
    const share = market.totalAppeal > 0 ? (appeal / market.totalAppeal) * 100 : 0;
    const trainingDesc = rival.trainingJob
      ? `Training ${MODEL_SIZES[rival.trainingJob.sizeId]?.name ?? 'Model'} (~${Math.max(
          0,
          rival.trainingJob.totalSeconds - rival.trainingJob.progressSeconds
        ).toFixed(0)}s)`
      : rival.style;

    entries.push({
      id: rival.id,
      isPlayer: false,
      name: rival.name,
      shortCode: rival.shortCode,
      bestScore: rival.bestScore,
      appeal,
      sharePercent: share,
      subtitle: trainingDesc,
      trainingStatus: rival.trainingJob ? 'Training' : 'Idle',
    });
  }

  // Sort descending by appeal, then by bestScore
  entries.sort((a, b) => {
    if (b.appeal !== a.appeal) return b.appeal - a.appeal;
    return b.bestScore - a.bestScore;
  });

  return (
    <div className="tab-pane">
      <h1 className="screen-title">Market</h1>

      {/* Market Share & Revenue Card */}
      <Surface className="market-summary-card">
        <div className="market-stat-header">
          <div>
            <span className="card-subtitle">Market Share</span>
            <div className="market-share-number">
              {(market.playerShare * 100).toFixed(1)}%
            </div>
          </div>
          <div className="market-revenue-header">
            <span className="card-subtitle">Revenue</span>
            <div className="market-revenue-number">
              +${market.revenuePerSec.toFixed(2)}/s
            </div>
          </div>
        </div>

        {/* Market Share Bar */}
        <div className="market-bar-track">
          <div
            className="market-bar-fill"
            style={{ width: `${Math.min(100, market.playerShare * 100)}%` }}
          />
        </div>

        {/* 65% Subscriptions / 35% API Split */}
        <div className="revenue-split-grid">
          <div className="split-item">
            <div className="split-label-group">
              <span className="split-label">Subscriptions</span>
              <span className="split-pct">65%</span>
            </div>
            <span className="split-amount">
              +${market.subscriptionRevenue.toFixed(2)}/s
            </span>
          </div>
          <div className="split-item">
            <div className="split-label-group">
              <span className="split-label">API</span>
              <span className="split-pct">35%</span>
            </div>
            <span className="split-amount">
              +${market.apiRevenue.toFixed(2)}/s
            </span>
          </div>
        </div>
      </Surface>

      {/* Leaderboard Section */}
      <section className="section-block">
        <h2 className="section-title">Leaderboard</h2>
        <div className="leaderboard-list">
          {entries.map((entry, index) => {
            const rank = index + 1;
            return (
              <Surface
                key={entry.id}
                className={`leaderboard-row ${entry.isPlayer ? 'player-row' : ''}`.trim()}
              >
                <div className="rank-number">{rank}</div>
                <Monogram code={entry.shortCode} />
                <div className="leaderboard-info">
                  <div className="leaderboard-name-row">
                    <span className="leaderboard-name">{entry.name}</span>
                    {entry.isPlayer && <span className="you-badge">You</span>}
                  </div>
                  <span className="card-subtitle">{entry.subtitle}</span>
                </div>
                <div className="leaderboard-metrics">
                  <div className="metric-col">
                    <span className="metric-label">Score</span>
                    <span className="metric-val">{entry.bestScore}</span>
                  </div>
                  <div className="metric-col">
                    <span className="metric-label">Share</span>
                    <span className="metric-val">{entry.sharePercent.toFixed(1)}%</span>
                  </div>
                </div>
              </Surface>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default MarketScreen;
