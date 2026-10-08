import React from 'react';
import { Factory, Cpu, ChartLine, Landmark, Menu, type LucideIcon } from 'lucide-react';
import { Icon } from './Icon';

export type NavTabId = 'lab' | 'models' | 'market' | 'invest' | 'more';

interface NavItem {
  id: NavTabId;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'lab', label: 'Lab', icon: Factory },
  { id: 'models', label: 'Models', icon: Cpu },
  { id: 'market', label: 'Market', icon: ChartLine },
  { id: 'invest', label: 'Invest', icon: Landmark },
  { id: 'more', label: 'More', icon: Menu },
];

export interface BottomNavProps {
  activeTab: NavTabId | 'team' | 'research';
  onSelectTab: (tab: NavTabId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav
      style={{
        backgroundColor: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        display: 'flex',
        width: '100%',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
      aria-label="Bottom Navigation"
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          activeTab === item.id ||
          ((activeTab === 'team' || activeTab === 'research') && item.id === 'more');
        const color = isActive ? 'var(--text)' : 'var(--text-tertiary)';
        const fontWeight = isActive ? 600 : 400;

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            style={{
              flex: 1,
              minHeight: '48px',
              height: '56px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              background: 'none',
              border: 'none',
              color,
              padding: 'var(--space-4) 0',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: 'none',
              textShadow: 'none',
              WebkitTapHighlightColor: 'transparent',
              transition: 'color var(--duration) var(--ease)',
            }}
          >
            <Icon icon={item.icon} size={22} color="currentColor" aria-hidden="true" />
            <span
              style={{
                fontSize: '11px',
                lineHeight: '14px',
                fontFamily: 'var(--font)',
                fontWeight,
                color,
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
