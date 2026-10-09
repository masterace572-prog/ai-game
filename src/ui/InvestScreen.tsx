import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { Segmented } from './Segmented';
import {
  FUNDING_ROUNDS,
  FUNDING_ORDER,
  RIVAL_DEFINITIONS,
  STOCK_MAX_SHARES,
  getRivalScore,
  getStockPrice,
} from '../game/balance';
import {
  canTakeFunding,
  calculateTotalIncomePerSec,
} from '../game/logic';
import type { GameState } from '../game/types';
import { formatCost } from './format';

export interface InvestScreenProps {
  gameState: GameState;
  onTakeFunding: (roundId: string) => void;
  onBuyStock: (rivalId: string, count: number) => void;
  onSellStock: (rivalId: string, count: number) => void;
}

export const InvestScreen: React.FC<InvestScreenProps> = ({
  gameState,
  onTakeFunding,
  onBuyStock,
  onSellStock,
}) => {
  const [activeTab, setActiveTab] = useState<'funding' | 'stocks'>('funding');
  const [stockBatch, setStockBatch] = useState<'1' | '10' | 'max'>('1');

  const incomePerSec = calculateTotalIncomePerSec(gameState);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
      {/* Sub-tab navigation */}
      <Segmented
        value={activeTab}
        onChange={(val) => setActiveTab(val as 'funding' | 'stocks')}
        options={[
          { id: 'funding', label: 'Funding' },
          { id: 'stocks', label: 'Stocks' },
        ]}
      />

      {/* FUNDING SUB-TAB */}
      {activeTab === 'funding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {FUNDING_ORDER.map((roundId) => {
            const def = FUNDING_ROUNDS[roundId];
            const isTaken = Boolean(gameState.fundingTaken[roundId]);
            const check = canTakeFunding(roundId, gameState);
            const payout = Math.max(def.minLumpSum, Math.round(incomePerSec * 120));

            return (
              <div
                key={roundId}
                style={{
                  backgroundColor: 'var(--surface)',
                  border: isTaken
                    ? '1px solid var(--border)'
                    : check.canTake
                    ? '1px solid var(--accent)'
                    : '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)' }}>
                        {def.name}
                      </span>
                      {isTaken && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--success-subtle)',
                            color: 'var(--success)',
                          }}
                        >
                          Secured
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Requires: {def.requirementText}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--success)' }}>
                      +{formatCost(payout)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      120s revenue
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Permanent bonus: <strong style={{ color: 'var(--text)' }}>+{Math.round((def.multiplier - 1) * 100)}% revenue</strong>
                </div>

                {isTaken ? (
                  <Button variant="ghost" fullWidth disabled>
                    <CheckCircle2 size={16} color="var(--success)" style={{ marginRight: '6px' }} />
                    Funding Taken
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={!check.canTake}
                    onClick={() => onTakeFunding(roundId)}
                  >
                    {check.canTake ? `Accept Funding (+${formatCost(payout)})` : check.reason ?? 'Locked'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* STOCKS SUB-TAB */}
      {activeTab === 'stocks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Controls: Batch size */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Trade Volume
            </span>
            <div style={{ width: '180px' }}>
              <Segmented
                value={stockBatch}
                onChange={(v) => setStockBatch(v as '1' | '10' | 'max')}
                options={[
                  { id: '1', label: '1' },
                  { id: '10', label: '10' },
                  { id: 'max', label: 'Max' },
                ]}
              />
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Cap: {STOCK_MAX_SHARES} shares per rival • 2% transaction fee
          </div>

          {/* Rivals Stock Cards */}
          {gameState.rivals.map((rival) => {
            const def = RIVAL_DEFINITIONS.find((r) => r.id === rival.id);
            if (!def) return null;
            const score = getRivalScore(rival.step, def.strength);
            const price = getStockPrice(score);
            const owned = gameState.stocks[rival.id] ?? 0;

            // Compute buy count
            let buyCount = 1;
            if (stockBatch === '10') buyCount = 10;
            if (stockBatch === 'max') {
              const maxAffordable = Math.floor(gameState.cash / (price * 1.02));
              const remainingCap = STOCK_MAX_SHARES - owned;
              buyCount = Math.max(1, Math.min(maxAffordable, remainingCap));
            }
            const buyTotalCost = Math.round(buyCount * price * 1.02);
            const canBuy =
              owned + buyCount <= STOCK_MAX_SHARES && gameState.cash >= buyTotalCost;

            // Compute sell count
            let sellCount = 1;
            if (stockBatch === '10') sellCount = Math.min(10, owned);
            if (stockBatch === 'max') sellCount = owned;
            const sellProceeds = Math.round(sellCount * price * 0.98);
            const canSell = owned >= sellCount && sellCount > 0;

            return (
              <div
                key={rival.id}
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)' }}>
                      {def.name} ({def.shortCode})
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Owned: <strong style={{ color: 'var(--text)' }}>{owned}</strong> / {STOCK_MAX_SHARES} shares
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)' }}>
                      {formatCost(price)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      per share
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!canBuy}
                    onClick={() => onBuyStock(rival.id, buyCount)}
                  >
                    Buy {buyCount} ({formatCost(buyTotalCost)})
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!canSell}
                    onClick={() => onSellStock(rival.id, sellCount)}
                  >
                    Sell {sellCount} (+{formatCost(sellProceeds)})
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
