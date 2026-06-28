import React from 'react';
import { sound } from '../utils/sound';

interface LayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  onBackToHome?: () => void;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showBackButton = false,
  onBackToHome,
  title
}) => {
  return (
    <div className="app-layout">
      <header className="app-header">
        {showBackButton && onBackToHome && (
          <button 
            className="back-button" 
            onClick={() => {
              sound.playPop();
              onBackToHome();
            }}
            aria-label="ほーむにもどる"
          >
            <span className="back-button-icon">🏠</span>
            <span className="back-button-text">おわる</span>
          </button>
        )}
        {title && <h1 className="header-title">{title}</h1>}
      </header>

      <main className="app-main">
        {children}
      </main>

      <footer className="app-footer">
        <p className="footer-note">
          画面から少し離れて、目を大切にしながら遊びましょう 🌸
        </p>
      </footer>

      {/* Styled inline for layout-specific elements to keep components modular */}
      <style>{`
        .app-layout {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .app-header {
          height: var(--header-height);
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 0 40px;
          z-index: 10;
        }

        .header-title {
          font-size: 2rem;
          color: var(--text-color);
          font-weight: 500;
        }

        .back-button {
          position: absolute;
          left: 40px;
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: var(--card-bg);
          border: 3px solid var(--text-color);
          padding: 10px 24px;
          border-radius: 9999px;
          color: var(--text-color);
          font-family: var(--font-kids);
          font-size: 1.3rem;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 4px 0 var(--text-color);
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .back-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 var(--text-color);
        }

        .back-button:active {
          transform: translateY(4px);
          box-shadow: 0 0px 0 var(--text-color);
        }

        .back-button-icon {
          font-size: 1.5rem;
        }

        .app-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .app-footer {
          padding: 24px;
          text-align: center;
          width: 100%;
          font-size: 1.1rem;
          color: var(--text-muted);
        }

        /* Responsive styling for smaller devices or mobile preview */
        @media (max-width: 768px) {
          .app-header {
            padding: 0 20px;
            height: 70px;
          }

          .back-button {
            left: 20px;
            padding: 8px 16px;
            font-size: 1.1rem;
          }

          .back-button-icon {
            font-size: 1.2rem;
          }

          .header-title {
            font-size: 1.6rem;
          }

          .app-footer {
            font-size: 0.9rem;
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};
