import React from 'react';
import { useNavigate } from 'react-router-dom';

const StatisticsView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      backgroundColor: 'var(--bg-primary)'
    }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
            onClick={() => navigate('/')}
            className="glass-panel" 
            style={{ 
              width: '40px', height: '40px', borderRadius: '50%', 
              border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-main)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            &lt;
        </button>
        <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'normal', color: 'var(--text-main)' }}>Heart Rate</h1>
      </header>

      {/* Saludo y Resumen (Hero) */}
      <section>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 'normal', margin: 0 }}>Hi, Emma!</h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>Here's your weekly summary</p>
        
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '1rem' }}>
          <span style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: 1 }}>95</span>
          <span style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 'bold' }}>bmp</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '-1.5rem', paddingRight: '1rem' }}>
          <span style={{color: 'var(--text-main)', fontWeight: 'bold'}}>240</span> Max &nbsp;&nbsp; <span style={{color: 'var(--text-main)', fontWeight: 'bold'}}>60</span> Min
        </p>
      </section>

      {/* Tarjeta del Gráfico HRV Simulado usando CSS Puro */}
      <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}>Heart Rate Variability</h3>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>82 <span style={{fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)'}}>ms</span></span>
        </div>

        {/* Gráfico Simulado de Puntos Flotantes (Variabilidad) CSS Flex */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '120px', padding: '1rem 0' }}>
            {[3, 5, 2, 7, 4, 6, 3, 2, 8, 4, 5, 2, 6, 3, 2, 8, 5, 4, 3, 2, 7, 4].map((h, i) => (
                <div key={i} style={{
                    width: '6px',
                    height: `${h * 10}px`,
                    backgroundColor: 'var(--accent-orange)',
                    borderRadius: '10px',
                    opacity: i % 3 === 0 ? 0.6 : 1, // Variabilidad de color
                    transform: `translateY(${Math.sin(i) * 10}px)` // Efecto orgánico
                }}></div>
            ))}
        </div>

        {/* Marcas de tiempo del eje X */}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>
            <span>12am</span>
            <span>4am</span>
            <span>8am</span>
            <span>12pm</span>
            <span>4pm</span>
            <span>8pm</span>
        </div>
      </section>

      {/* Métricas Inferiores */}
      <section style={{ display: 'flex', gap: '1rem' }}>
        <div className="glass-panel" style={{ flex: 1, padding: '1.2rem', backgroundColor: 'var(--bg-card)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Stress Level</p>
            <p style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: 0 }}>Low</p>
        </div>
        <div className="glass-panel" style={{ flex: 1, padding: '1.2rem', backgroundColor: 'var(--bg-card)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Ave. Variability</p>
            <p style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: 0 }}>92 <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>ms</span></p>
        </div>
      </section>

      {/* Alerta Médica (Banner Inferior) */}
      <section style={{
          backgroundColor: 'var(--accent-orange)',
          color: 'white',
          padding: '1.2rem',
          borderRadius: 'var(--border-radius-md)',
          display: 'flex',
          gap: '0.8rem',
          alignItems: 'flex-start',
          boxShadow: 'var(--shadow-float)'
      }}>
          <span style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
              width: '20px', height: '20px', border: '1px solid white', borderRadius: '50%', fontSize: '0.7rem' 
          }}>!</span>
          <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4, opacity: 0.95 }}>
            Your HRV is <strong>5% higher</strong> than average for your age group
          </p>
      </section>

    </div>
  );
};

export default StatisticsView;
