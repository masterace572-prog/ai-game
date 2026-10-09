import React, { useState } from 'react';
import {
  DollarSign,
  Server,
  Plus,
  Minus,
} from 'lucide-react';
import { Button } from './Button';
import { GameRow } from './GameRow';
import { Segmented } from './Segmented';
import { Monogram } from './Monogram';
import { Modal } from './Modal';
import { formatCost, formatSellPrice } from './format';
import {
  DATA_CENTERS,
  DATA_CENTER_UPKEEP_PER_SEC,
  FUNDING_ROUNDS,
  STOCK_MAX_SHARES,
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

type InvestTab = 'funding' | 'buildings' | 'stocks';
type StockQty = '1' | '10' | 'max';

export const InvestScreen: React.FC<InvestScreenProps> = ({
  gameState,
  onBuyDataCenter,
  onTakeFunding,
  onBuyStock,
  onSellStock,
}) => {
  const [activeTab, setActiveTab] = useState<InvestTab>('funding');
  const [stockQty, setStockQty] = useState<StockQty>('1');

  // Sheet detail modals
  const [selectedFunding, setSelectedFunding] = useState<FundingRoundId | null>(null);
  const [buildingSheetOpen, setBuildingSheetOpen] = useState(false);

  const dataCentersOwned = gameState.dataCentersOwned ?? 0;
  const nextDataCenter = DATA_CENTERS[dataCentersOwned] ?? null;

  // Era 1 rivals (first 4)
  const era1Rivals = gameState.rivals.slice(0, 4);

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
      <h1 className="screen-title">Invest</h1>

      {/* Segmented Tab Bar */}
      <Segmented<InvestTab>
        options={[
          { id: 'funding', label: 'Funding' },
          { id: 'buildings', label: 'Buildings' },
          { id: 'stocks', label: 'Stocks' },
        ]}
        value={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab 1: Funding */}
      {activeTab === 'funding' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderTop: '1px solid var(--border)',
          }}
        >
          {(['seed', 'series-a', 'series-b'] as FundingRoundId[]).map((roundId) => {
            const def = FUNDING_ROUNDS[roundId];
            const isTaken = Boolean(gameState.fundingTaken?.[roundId]);
            const check = canTakeFunding(roundId, gameState);

            let btnText = 'Take';
            let btnDisabled = false;
            let btnVariant: 'primary' | 'secondary' = 'primary';

            if (isTaken) {
              btnText = 'Taken';
              btnDisabled = true;
              btnVariant = 'secondary';
            } else if (!check.canTake) {
              btnDisabled = true;
              btnVariant = 'secondary';
              btnText = def.requiredBestScore > 0 ? `Need ${def.requiredBestScore}` : 'Locked';
            }

            const equityOrCost = Math.round((def.salaryMultiplier - 1) * 100);
            const reqSubtitle =
              def.requiredBestScore > 0
                ? `Requires Score ${def.requiredBestScore} · +${equityOrCost}% salary`
                : `No requirement · +${equityOrCost}% salary`;

            return (
              <GameRow
                key={roundId}
                icon={DollarSign}
                iconColor="var(--money)"
                titleWrap
                title={`${def.name} (+${formatCost(def.cashAmount)})`}
                subtitle={reqSubtitle}
                onClick={() => setSelectedFunding(roundId)}
                button={
                  <div
                    style={{
                      width: '104px',
                      maxWidth: '112px',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      flexShrink: 0,
                    }}
                  >
                    <Button
                      variant={btnVariant}
                      disabled={btnDisabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!btnDisabled) onTakeFunding(roundId);
                      }}
                      style={{
                        width: '100%',
                        minHeight: '44px',
                        padding: '0 8px',
                        fontSize: '13px',
                      }}
                    >
                      <span>{btnText}</span>
                    </Button>
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      {/* Tab 2: Buildings */}
      {activeTab === 'buildings' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderTop: '1px solid var(--border)',
          }}
        >
          {nextDataCenter ? (
            <GameRow
              icon={Server}
              iconColor="var(--compute)"
              title={nextDataCenter.name}
              value={`${dataCentersOwned}/4`}
              onClick={() => setBuildingSheetOpen(true)}
              button={
                <Button
                  variant={gameState.cash >= nextDataCenter.cost ? 'primary' : 'secondary'}
                  disabled={gameState.cash < nextDataCenter.cost}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (gameState.cash >= nextDataCenter.cost) onBuyDataCenter();
                  }}
                  style={{ minHeight: '48px', padding: '0 16px', fontSize: '13px' }}
                >
                  <span>
                    {gameState.cash >= nextDataCenter.cost
                      ? `Buy ${formatCost(nextDataCenter.cost)}`
                      : `Need ${formatCost(nextDataCenter.cost - gameState.cash)}`}
                  </span>
                </Button>
              }
            />
          ) : (
            <GameRow
              icon={Server}
              iconColor="var(--compute)"
              title="All buildings owned"
              value="4/4"
              button={
                <Button variant="secondary" disabled style={{ minHeight: '48px', padding: '0 16px', fontSize: '13px' }}>
                  <span>Max</span>
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* Tab 3: Stocks */}
      {activeTab === 'stocks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quantity Selector */}
          <Segmented<StockQty>
            options={[
              { id: '1', label: '1' },
              { id: '10', label: '10' },
              { id: 'max', label: 'Max' },
            ]}
            value={stockQty}
            onChange={setStockQty}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderTop: '1px solid var(--border)',
            }}
          >
            {era1Rivals.map((rival) => {
              const sharesOwned = gameState.stocksOwned?.[rival.id] ?? 0;
              const currentPrice = rival.stockPrice;

              // Calculate buy amount based on quantity
              let buyCount = 1;
              if (stockQty === '10') {
                buyCount = Math.min(10, STOCK_MAX_SHARES - sharesOwned);
              } else if (stockQty === 'max') {
                const maxAfford = Math.floor(gameState.cash / currentPrice);
                buyCount = Math.max(0, Math.min(STOCK_MAX_SHARES - sharesOwned, maxAfford));
              }
              const buyTotalCost = buyCount * currentPrice;
              const canBuy = buyCount > 0 && gameState.cash >= buyTotalCost && sharesOwned < STOCK_MAX_SHARES;

              // Calculate sell amount based on quantity
              let sellCount = 1;
              if (stockQty === '10') {
                sellCount = Math.min(10, sharesOwned);
              } else if (stockQty === 'max') {
                sellCount = sharesOwned;
              }
              const canSell = sellCount > 0 && sharesOwned >= sellCount;
              const sellProceeds = getStockSellProceeds(currentPrice, Math.max(1, sellCount));

              return (
                <div
                  key={rival.id}
                  style={{
                    minHeight: '56px',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ flexShrink: 0 }}>
                    <Monogram code={rival.shortCode} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: 500,
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {rival.name}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        fontVariantNumeric: 'tabular-nums',
                        marginTop: '2px',
                      }}
                    >
                      {formatCost(currentPrice)}/sh · {sharesOwned} sh
                    </span>
                  </div>

                  {/* Minus (Sell) and Plus (Buy) buttons */}
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Button
                      variant="secondary"
                      disabled={!canSell}
                      onClick={() => onSellStock(rival.id, sellCount)}
                      aria-label={`Sell ${sellCount} shares of ${rival.name} for ${formatSellPrice(sellProceeds)}`}
                      style={{
                        width: '48px',
                        height: '48px',
                        padding: 0,
                        minHeight: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Minus size={20} strokeWidth={1.75} />
                    </Button>

                    <Button
                      variant={canBuy ? 'primary' : 'secondary'}
                      disabled={!canBuy}
                      onClick={() => onBuyStock(rival.id, buyCount)}
                      aria-label={`Buy ${buyCount} shares of ${rival.name} for ${formatCost(buyTotalCost)}`}
                      style={{
                        width: '48px',
                        height: '48px',
                        padding: 0,
                        minHeight: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus size={20} strokeWidth={1.75} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Funding Detail Sheet */}
      <Modal isOpen={selectedFunding !== null}>
        {selectedFunding && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
              {FUNDING_ROUNDS[selectedFunding].name}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {selectedFunding === 'seed' && 'No salary increase'}
              {selectedFunding === 'series-a' && 'Pay +10%'}
              {selectedFunding === 'series-b' && 'Pay +10%'}
            </div>
            <Button
              variant="secondary"
              onClick={() => setSelectedFunding(null)}
              style={{ width: '100%', minHeight: '48px' }}
            >
              <span>Close</span>
            </Button>
          </div>
        )}
      </Modal>

      {/* Building Detail Sheet */}
      <Modal isOpen={buildingSheetOpen}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
            {nextDataCenter ? nextDataCenter.name : 'Data Centers'}
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {nextDataCenter
              ? `+${nextDataCenter.powerCapAdded} power · +$${DATA_CENTER_UPKEEP_PER_SEC.toFixed(2)}/s upkeep`
              : 'Maximum data centers constructed'}
          </div>
          <Button
            variant="secondary"
            onClick={() => setBuildingSheetOpen(false)}
            style={{ width: '100%', minHeight: '48px' }}
          >
            <span>Close</span>
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default InvestScreen;
