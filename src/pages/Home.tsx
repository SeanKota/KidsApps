import React from 'react';
import { contentsRegistry } from '../contents/registry';
import { sound } from '../utils/sound';
import './Home.css';

interface HomeProps {
  onSelectContent: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ onSelectContent }) => {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="home-title">あそんでみよう！</h1>
        <p className="home-subtitle">すきな あそびを えらんでね</p>
      </header>

      <div className="cards-grid">
        {contentsRegistry.map((content) => (
          <button
            key={content.id}
            className="content-card"
            onClick={() => {
              sound.playPop();
              onSelectContent(content.id);
            }}
            aria-label={`${content.title}をはじめる`}
          >
            <span className="card-icon" role="img" aria-hidden="true">
              {content.icon}
            </span>
            <h2 className="card-title">{content.title}</h2>
            <p className="card-desc">{content.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;
