import React from 'react';
import { Factory } from 'lucide-react';
import { Icon } from './ui/Icon';
import { APP_VERSION, DEFAULT_LAB_NAME } from './game/balance';
import './styles.css';

export const App: React.FC = () => {
  return (
    <main className="title-screen">
      <div className="title-content">
        <div className="title-icon">
          <Icon icon={Factory} size={24} color="var(--text-secondary)" aria-hidden="true" />
        </div>
        <h1 className="title-heading">Model Foundry</h1>
        <p className="title-tagline">Your AI lab. Offline.</p>
        <p className="title-lab-name">{DEFAULT_LAB_NAME}</p>
        <span className="title-version">{APP_VERSION}</span>
      </div>
    </main>
  );
};

export default App;
