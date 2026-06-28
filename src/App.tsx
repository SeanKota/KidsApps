import { useState } from 'react';
import Home from './pages/Home';
import { Layout } from './components/Layout';
import { contentsRegistry } from './contents/registry';

function App() {
  const [activeContentId, setActiveContentId] = useState<string | null>(null);

  // Find the selected game from registry
  const activeContent = contentsRegistry.find(item => item.id === activeContentId);
  const ActiveComponent = activeContent ? activeContent.component : null;

  return (
    <Layout 
      showBackButton={activeContentId !== null} 
      onBackToHome={() => setActiveContentId(null)}
      title={activeContent ? activeContent.title : undefined}
    >
      {activeContentId === null ? (
        <Home onSelectContent={(id) => setActiveContentId(id)} />
      ) : ActiveComponent ? (
        <ActiveComponent onBackToHome={() => setActiveContentId(null)} />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>あれれ？ ページがみつかりません</h2>
          <button 
            onClick={() => setActiveContentId(null)}
            style={{
              padding: '12px 32px',
              fontSize: '1.5rem',
              borderRadius: '9999px',
              border: '3px solid var(--text-color)',
              backgroundColor: 'var(--accent-bg)',
              fontFamily: 'var(--font-kids)',
              cursor: 'pointer'
            }}
          >
            ほーむへもどる
          </button>
        </div>
      )}
    </Layout>
  );
}

export default App;
