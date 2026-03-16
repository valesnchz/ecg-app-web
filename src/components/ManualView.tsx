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
            title: '📚 Study Guide (Learning Catalog)',
            content: 'Explore 27 different cardiac rhythms. Each rhythm includes a real-time animated ECG, key clinical findings, and treatment recommendations. Ideal for reviewing visual patterns before exams.'
        },
        {
            title: '🤖 AI Prediction (Prediction View)',
            content: 'Use our AI engine for diagnostic guidance. Enter at least 5 clinical parameters (such as heart rate, PR interval, QRS axis) and the application will generate a prediction based on logical ECG patterns.'
        },
        {
            title: '🎮 Cardiac Quiz (Quiz Game)',
            content: 'Test your knowledge with over 100 questions. You have 3 lives per session. The game covers everything from basic wave identification to advanced arrhythmia management.'
        },
        {
            title: '👤 User Profile',
            content: 'You can change your username at any time by clicking the profile icon on the Dashboard. This will reset your personalized session.'
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
                <h1 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 'bold' }}>User Manual</h1>
            </div>

            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                Welcome to your intelligent cardiac learning platform. Follow this guide to make the most of all available tools.
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
                    📄 Prefer the full version?
                </h2>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                    We have prepared a detailed User Manual in PDF for you to consult at any time.
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
                    📥 Download PDF Manual
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
                    Reminder: This tool is for educational purposes only. In case of emergency, consult a medical professional.
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
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default ManualView;
