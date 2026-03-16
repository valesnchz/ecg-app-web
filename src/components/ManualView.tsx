import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * ManualView - A comprehensive user guide for the ECG application.
 * Explains how to use the Study Guide, AI Prediction, and Cardiac Quiz modules.
 */
const ManualView: React.FC = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: '📚 Guía de Estudio (Learning Catalog)',
            content: 'Explora 27 ritmos cardíacos diferentes. Cada ritmo incluye un ECG animado en tiempo real, hallazgos clínicos clave y recomendaciones de tratamiento. Ideal para repasar patrones visuales antes de los exámenes.'
        },
        {
            title: '🤖 Predicción con IA (Prediction View)',
            content: 'Utiliza nuestro motor de IA para obtener una orientación diagnóstica. Introduce al menos 5 parámetros clínicos (como frecuencia cardíaca, intervalo PR, eje QRS) y la aplicación generará una predicción basada en patrones lógicos de ECG.'
        },
        {
            title: '🎮 Quiz Cardíaco (Quiz Game)',
            content: 'Pon a prueba tus conocimientos con más de 100 preguntas. Tienes 3 vidas por sesión. El juego cubre desde la identificación básica de ondas hasta el manejo avanzado de arritmias.'
        },
        {
            title: '👤 Perfil de Usuario',
            content: 'Puedes cambiar tu nombre de usuario en cualquier momento haciendo clic en el icono de perfil en el Dashboard. Esto reiniciará tu sesión personalizada.'
        }
    ];

    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: 'var(--bg-primary)', 
            padding: '1.5rem',
            color: 'var(--text-main)',
            maxWidth: '600px',
            margin: '0 auto'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button 
                    onClick={() => navigate('/')}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: 'var(--accent-orange)'
                    }}
                >
                    ←
                </button>
                <h1 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 'bold' }}>Manual de Usuario</h1>
            </div>

            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                Bienvenido a tu plataforma inteligente de aprendizaje cardíaco. Sigue esta guía para aprovechar al máximo todas las herramientas disponibles.
            </p>

            {/* PDF Download Section */}
            <div className="glass-panel" style={{ 
                padding: '1.5rem', 
                marginBottom: '2rem',
                border: '2px dashed var(--accent-orange)',
                borderRadius: '20px',
                textAlign: 'center',
                backgroundColor: 'rgba(255,107,0,0.1)'
            }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--accent-orange)', marginBottom: '1rem' }}>
                    📄 ¿Prefieres la versión completa?
                </h2>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                    Hemos preparado un manual detallado en PDF para que lo consultes cuando quieras.
                </p>
                <a 
                    href="/manual_usuario.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-block',
                        padding: '0.8rem 1.5rem',
                        backgroundColor: 'var(--accent-orange)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(255,107,0,0.3)'
                    }}
                >
                    📥 Descargar Manual PDF
                </a>
            </div>

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {sections.map((section, index) => (
                    <div 
                        key={index} 
                        className="glass-panel" 
                        style={{ 
                            padding: '1.5rem', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '20px',
                            backgroundColor: 'rgba(255,107,0,0.05)'
                        }}
                    >
                        <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.8rem 0', color: 'var(--accent-orange)' }}>
                            {section.title}
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-main)' }}>
                            {section.content}
                        </p>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div style={{ marginTop: '3rem', textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Recordatorio: Esta herramienta es exclusivamente educativa. En caso de emergencia, consulte a un profesional médico.
                </p>
                <button 
                    onClick={() => navigate('/')}
                    className="glass-panel"
                    style={{
                        marginTop: '1.5rem',
                        padding: '0.8rem 2rem',
                        border: 'none',
                        backgroundColor: 'var(--accent-orange)',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        borderRadius: '12px'
                    }}
                >
                    Volver al Inicio
                </button>
            </div>
        </div>
    );
};

export default ManualView;
