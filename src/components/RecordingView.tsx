import React from 'react';
import LiveECGChart from './LiveECGChart';

const RecordingView: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh', 
      padding: '2rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '2rem',
      backgroundColor: 'var(--bg-primary)'
    }}>
      {/* Top Header Navegación Simulado */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="glass-panel" style={{ 
            width: '40px', height: '40px', borderRadius: '50%', 
            border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-main)' 
         }}>
            &lt;
        </button>
        <h1 style={{ fontSize: '1.2rem', margin: 0 }}>ECG Recording</h1>
      </header>

      {/* Componente Gráfico Central */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <LiveECGChart />
      </main>

      {/* Control Inferior de Grabación (El círculo del diseño) */}
      <footer style={{ display: 'flex', justifyContent: 'center', paddingBottom: '4rem' }}>
        <div style={{
          width: '120px', 
          height: '120px', 
          borderRadius: '50%', 
          border: '4px solid var(--accent-orange)', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: 'var(--shadow-float)',
          backgroundColor: 'var(--bg-card)'
        }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>00:11</span>
          <div style={{ 
              width: '15px', height: '15px', backgroundColor: 'var(--text-main)', 
              marginTop: '5px', borderRadius: '2px' // Símbolo de "Stop"
          }}></div>
        </div>
      </footer>
    </div>
  );
};

export default RecordingView;
