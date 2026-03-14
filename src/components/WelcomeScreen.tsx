import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

/**
 * Onboarding screen shown the first time the user opens the app.
 * Asks for the user's name and saves it to persistent context.
 */
const WelcomeScreen: React.FC = () => {
    const { setUserName } = useUser();
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    const handleStart = () => {
        const trimmed = inputValue.trim();
        if (!trimmed || trimmed.length < 2) {
            setError('Please enter at least 2 characters.');
            return;
        }
        setUserName(trimmed);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-primary)',
            padding: '2rem',
            textAlign: 'center'
        }}>
            {/* Heartbeat Logo */}
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem', animation: 'pulse 1.5s ease-in-out infinite' }}>
                🫀
            </div>
            <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }`}</style>

            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
                ECG <span style={{ color: 'var(--accent-orange)' }}>Monitor</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1rem' }}>
                Your intelligent cardiac analysis platform
            </p>

            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', border: '1px solid var(--glass-border)' }}>
                <h2 style={{ color: 'var(--text-main)', marginTop: 0, marginBottom: '0.5rem' }}>
                    Welcome! 👋
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Please enter your name to personalize your experience.
                </p>

                <input
                    type="text"
                    placeholder="Your first name"
                    value={inputValue}
                    onChange={(e) => { setInputValue(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                    maxLength={30}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        borderRadius: 'var(--border-radius-md)',
                        border: error ? '1px solid #EF4444' : '1px solid var(--glass-border)',
                        backgroundColor: 'rgba(255,255,255,0.5)',
                        color: 'var(--text-main)',
                        fontSize: '1.1rem',
                        boxSizing: 'border-box',
                        marginBottom: '0.5rem',
                        outline: 'none'
                    }}
                />
                {error && <p style={{ color: '#EF4444', fontSize: '0.8rem', marginBottom: '0.5rem', textAlign: 'left' }}>{error}</p>}

                <button
                    onClick={handleStart}
                    style={{
                        width: '100%',
                        marginTop: '1rem',
                        padding: '1rem',
                        backgroundColor: 'var(--accent-orange)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '30px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                    onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                >
                    Get Started →
                </button>
            </div>
        </div>
    );
};

export default WelcomeScreen;
