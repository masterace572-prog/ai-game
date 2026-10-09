import React from 'react';
import {
  Users,
  FlaskConical,
  Bell,
  Award,
  Settings,
  History,
  Cpu,
  Database,
  Star,
  Globe,
} from 'lucide-react';
import { GameRow } from './GameRow';
import { getUsableGpus } from '../game/logic';
import type { GameState } from '../game/types';

export interface MoreScreenProps {
  gameState: GameState;
  onNavigateToTeam: () => void;
  onNavigateToResearch: () => void;
  onNavigateToEvents: () => void;
  onNavigateToAchievements: () => void;
  onNavigateToSettings: () => void;
  onNavigateToNewEra: () => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({
  gameState,
  onNavigateToTeam,
  onNavigateToResearch,
  onNavigateToEvents,
  onNavigateToAchievements,
  onNavigateToSettings,
  onNavigateToNewEra,
}) => {
  const usableGpus = getUsableGpus(gameState.gpus, gameState.powerCap);

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
      <h1 className="screen-title">More</h1>

      {/* Navigation Menu */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid var(--border)',
        }}
      >
        <GameRow
          icon={FlaskConical}
          iconColor="var(--research)"
          title="Research"
          showChevron
          onClick={onNavigateToResearch}
        />
        <GameRow
          icon={Users}
          iconColor="var(--people)"
          title="Team"
          showChevron
          onClick={onNavigateToTeam}
        />
        <GameRow
          icon={Bell}
          iconColor="var(--hype)"
          title="Events"
          showChevron
          onClick={onNavigateToEvents}
        />
        <GameRow
          icon={Award}
          iconColor="var(--gold)"
          title="Achievements"
          showChevron
          onClick={onNavigateToAchievements}
        />
        <GameRow
          icon={History}
          iconColor="var(--gold)"
          title="New Era"
          showChevron
          onClick={onNavigateToNewEra}
        />
        <GameRow
          icon={Settings}
          iconColor="var(--compute)"
          title="Settings"
          showChevron
          onClick={onNavigateToSettings}
        />
      </div>

      {/* Plain Stats List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid var(--border)',
        }}
      >
        <GameRow
          icon={Cpu}
          iconColor="var(--compute)"
          title="GPUs"
          value={`${usableGpus}/${gameState.gpus}`}
        />
        <GameRow
          icon={Users}
          iconColor="var(--people)"
          title="People"
          value={gameState.researchers}
        />
        <GameRow
          icon={Database}
          iconColor="var(--research)"
          title="Data"
          value={gameState.dataQuality}
        />
        <GameRow
          icon={Star}
          iconColor="var(--gold)"
          title="Score"
          value={gameState.bestLaunchedModel?.score ?? '—'}
        />
        <GameRow
          icon={Globe}
          iconColor="var(--gold)"
          title="Era"
          value={gameState.era}
        />
      </div>
    </div>
  );
};

export default MoreScreen;
