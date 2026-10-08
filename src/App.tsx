import React from 'react';
import { APP_VERSION, DEFAULT_LAB_NAME } from './game/balance';
import './styles.css';

export const App: React.FC = () => {
  return (
    <main className="container">
      <section className="card">
        <div className="icon" aria-hidden="true">🏭</div>
        <h1 className="title">Model Foundry</h1>
        <p className="tagline">Your AI lab. Offline.</p>
        <div className="lab-badge">
          <span>🔬</span>
          <span>{DEFAULT_LAB_NAME}</span>
        </div>
        <span className="version">{APP_VERSION}</span>
      </section>
    </main>
  );
};

export default App;
