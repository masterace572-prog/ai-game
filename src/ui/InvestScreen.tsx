import React from 'react';
import {
  Server,
  DollarSign,
  Lock,
  Check,
} from 'lucide-react';
import { Icon } from './Icon';
import { Button } from './Button';
import { Surface } from './Surface';
import { Monogram } from './Monogram';
import {
  DATA_CENTERS,
  DATA_CENTER_UPKEEP_PER_SEC,
  FUNDING_ROUNDS,
  STOCK_MAX_SHARES,
  STOCK_SELL_FEE,
} from '../game/balance';
import {
  getStockSellProceeds,
  canTakeFunding,
} from '../game/logic';
import type { GameState, FundingRoundId } from '../game/types';

export interface InvestScreenProps {
  gameState: GameState;
  onBuyDataCenter: () => void;
  onTakeFunding: (roundId: FundingRoundId) => void;
  onBuyStock: (rivalId: string, sharesCount: number) => void;
  onSellStock: (rivalId: string, sharesCount: number) => void;
}

export const InvestScreen: React.FC<InvestScreenProps> = ({
  gameState,
  onBuyDataCenter,
  onTakeFunding,
  onBuyStock,
  onSellStock,
}) => {
  const dataCentersOwned = gameState.dataCentersOwned ?? 0;
  const bestScore = gameState.bestLaunchedModel?.score ?? 0;

  // Filter era-1 rivals (first 4)
  const era1Rivals = gameState.rivals.slice(0, 4);

  // Total stock portfolio value
  const totalPortfolioValue = era1Rivals.reduce((sum, rival) => {
    const shares = gameState.stocksOwned?.[rival.id] ?? 0;
    return sum + shares * rival.stockPrice;
  }, 0);

  return (
    <div className="tab-pane" style={{ gap: 'var(--space-4)' }}>
      {/* Header */}
      <div>
        <h1 className="screen-title" style={{ marginBottom: 'var(--space-1)' }}>
          Capital & Expansion
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Acquire data centers, trade rival tech equity, and secure institutional venture rounds.
        </p>
      </div>

      {/* Venture Capital / Funding Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
            Venture Financing
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Best Model Score: {bestScore}
          </span>
        </div>

        {(['seed', 'series-a', 'series-b'] as FundingRoundId[]).map((roundId) => {
          const def = FUNDING_ROUNDS[roundId];
          const isTaken = Boolean(gameState.fundingTaken?.[roundId]);
          const check = canTakeFunding(roundId, gameState);

          return (
            <Surface
              key={roundId}
              style={{
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isTaken ? 'var(--surface)' : 'var(--surface-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: isTaken ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <Icon
                    icon={isTaken ? Check : def.requiredBestScore > 0 && !check.canTake ? Lock : DollarSign}
                    size={20}
                    color={isTaken ? 'var(--success)' : 'var(--primary)'}
                    aria-hidden="true"
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                      {def.name}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: isTaken ? 'var(--text-tertiary)' : 'var(--success)' }}>
                      +${def.cashAmount.toLocaleString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {roundId === 'seed' && 'Early-stage angel funding to bootstrap compute hardware.'}
                    {roundId === 'series-a' && 'Institutional round. Unlocks Huge model size architectures.'}
                    {roundId === 'series-b' && 'Growth round. Unlocks Frontier model size foundation.'}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    Salary growth: +{Math.round((def.salaryMultiplier - 1.0) * 100)}%
                    {def.requiredBestScore > 0 && ` · Requires score ≥ ${def.requiredBestScore}`}
                  </div>
                </div>
              </div>

              <Button
                variant={isTaken ? 'secondary' : 'primary'}
                onClick={() => onTakeFunding(roundId)}
                disabled={isTaken || !check.canTake}
                style={{ minHeight: '48px', width: '100%' }}
              >
                <span>
                  {isTaken
                    ? 'Round Closed (Funded)'
                    : !check.canTake
                    ? (check.reason ?? 'Locked')
                    : `Close ${def.name} — +$${def.cashAmount.toLocaleString()}`}
                </span>
              </Button>
            </Surface>
          );
        })}
      </section>

      {/* Data Centers Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
            Data Centers
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {dataCentersOwned} of 4 facilities owned
          </span>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Each facility adds +$0.20/s upkeep and grants +2% training score bonus permanently.
        </div>

        {DATA_CENTERS.map((dc, index) => {
          const isOwned = index < dataCentersOwned;
          const isNext = index === dataCentersOwned;
          const isLocked = index > dataCentersOwned;
          const canAfford = gameState.cash >= dc.cost;

          return (
            <Surface
              key={dc.name}
              style={{
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                opacity: isLocked ? 0.6 : 1.0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isOwned ? 'var(--surface)' : 'var(--surface-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: isOwned ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <Icon
                    icon={isOwned ? Check : isLocked ? Lock : Server}
                    size={20}
                    color={isOwned ? 'var(--success)' : 'var(--primary)'}
                    aria-hidden="true"
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                      Tier {index + 1}: {dc.name}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: isOwned ? 'var(--text-tertiary)' : 'var(--text)' }}>
                      {isOwned ? 'Acquired' : `$${dc.cost.toLocaleString()}`}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    +{dc.powerCapAdded} Power Headroom · +2% Model Score Boost
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    Upkeep: +${DATA_CENTER_UPKEEP_PER_SEC.toFixed(2)}/s continuous
                  </div>
                </div>
              </div>

              {isNext && (
                <Button
                  variant="primary"
                  onClick={onBuyDataCenter}
                  disabled={!canAfford}
                  style={{ minHeight: '48px', width: '100%' }}
                >
                  <span>
                    Acquire {dc.name} — ${dc.cost.toLocaleString()}
                  </span>
                </Button>
              )}

              {isOwned && (
                <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Icon icon={Check} size={14} aria-hidden="true" />
                  <span>Online and operational</span>
                </div>
              )}

              {isLocked && (
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  Requires Tier {index} ({DATA_CENTERS[index - 1]?.name})
                </div>
              )}
            </Surface>
          );
        })}
      </section>

      {/* Rival Stocks Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
            Tech Equity Portfolio
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Portfolio Value: ${Math.round(totalPortfolioValue).toLocaleString()}
          </span>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Trade equity in competing AI labs. Stock prices update every 30s based on rival performance. {STOCK_SELL_FEE * 100}% broker fee on sales. Max {STOCK_MAX_SHARES} shares per lab.
        </div>

        {era1Rivals.map((rival) => {
          const sharesOwned = gameState.stocksOwned?.[rival.id] ?? 0;
          const currentPrice = rival.stockPrice;
          const sellProceeds1 = getStockSellProceeds(currentPrice, 1);
          const sellProceedsAll = getStockSellProceeds(currentPrice, sharesOwned);

          const canBuy1 = sharesOwned < STOCK_MAX_SHARES && gameState.cash >= currentPrice;
          const buy10Count = Math.min(10, STOCK_MAX_SHARES - sharesOwned);
          const buy10Cost = currentPrice * buy10Count;
          const canBuy10 = buy10Count > 0 && gameState.cash >= buy10Cost;

          const canSell1 = sharesOwned >= 1;
          const canSellAll = sharesOwned > 0;

          return (
            <Surface
              key={rival.id}
              style={{
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Monogram code={rival.shortCode} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                      {rival.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Owned: {sharesOwned} / {STOCK_MAX_SHARES} shares
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)' }}>
                    ${currentPrice}/sh
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    Sell net: ${sellProceeds1}
                  </div>
                </div>
              </div>

              {/* Action Buttons: 48px touch targets */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
                <Button
                  variant="primary"
                  onClick={() => onBuyStock(rival.id, 1)}
                  disabled={!canBuy1}
                  style={{ minHeight: '48px', fontSize: '13px' }}
                >
                  <span>Buy 1 (${currentPrice})</span>
                </Button>

                <Button
                  variant="primary"
                  onClick={() => onBuyStock(rival.id, buy10Count)}
                  disabled={!canBuy10}
                  style={{ minHeight: '48px', fontSize: '13px' }}
                >
                  <span>Buy {buy10Count} (${buy10Cost})</span>
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => onSellStock(rival.id, 1)}
                  disabled={!canSell1}
                  style={{ minHeight: '48px', fontSize: '13px' }}
                >
                  <span>Sell 1 (+${sellProceeds1})</span>
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => onSellStock(rival.id, sharesOwned)}
                  disabled={!canSellAll}
                  style={{ minHeight: '48px', fontSize: '13px' }}
                >
                  <span>Sell All (+${sellProceedsAll})</span>
                </Button>
              </div>
            </Surface>
          );
        })}
      </section>
    </div>
  );
};
export default InvestScreen;
