import React from 'react';
import { Gift, Check } from 'lucide-react';
import { Button } from './Button';
import { formatMoney } from './format';
import { DAILY_REWARD_SECONDS } from '../game/dailyReward';

export interface DailyRewardModalProps {
  streakDay: number; // 1 to 7
  rewardCash: number;
  isDay7: boolean;
  onClaim: () => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  streakDay,
  rewardCash,
  isDay7,
  onClaim,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--scrim)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--surface)',
          borderTopLeftRadius: 'var(--radius-card)',
          borderTopRightRadius: 'var(--radius-card)',
          borderTop: '1px solid var(--border)',
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 'var(--space-4)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--gold)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Daily Reward
          </span>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
            Day {streakDay} Streak
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Log in every day to claim bonus rewards
          </span>
        </div>

        {/* 7 Day Tiles */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '6px',
            width: '100%',
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const isToday = day === streakDay;
            const isClaimedPast = day < streakDay;
            const seconds = DAILY_REWARD_SECONDS[day - 1];

            return (
              <div
                key={day}
                style={{
                  backgroundColor: isToday ? 'var(--gold-tint)' : 'var(--surface-2)',
                  border: isToday ? '2px solid var(--gold)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 2px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: !isToday && !isClaimedPast ? 0.6 : 1,
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: isToday ? 'var(--gold)' : 'var(--text-tertiary)',
                  }}
                >
                  D{day}
                </span>

                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isClaimedPast ? 'var(--money-tint)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isClaimedPast ? 'var(--money)' : 'var(--gold)',
                  }}
                >
                  {isClaimedPast ? <Check size={14} /> : <Gift size={16} />}
                </div>

                <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                  {seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Big Reward Display */}
        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Today's Bounty
          </span>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--gold)' }}>
            +{formatMoney(rewardCash)}
          </div>
          {isDay7 && (
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold)' }}>
              ★ Includes +x2 Revenue for 10 minutes!
            </span>
          )}
        </div>

        <Button variant="primary" fullWidth size="lg" onClick={onClaim}>
          Claim Day {streakDay}
        </Button>
      </div>
    </div>
  );
};

export default DailyRewardModal;
