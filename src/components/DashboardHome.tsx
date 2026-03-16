import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import heartImage from '../assets/heart_main.png';

/**
 * DashboardHome - Main hub screen with personalized greeting,
 * the realistic 3D heart image, and 3 interactive module cards.
 */
const DashboardHome: React.FC = () => {
    const navigate = useNavigate();
    const { userName, setUserName } = useUser();

    const modules = [
        {
            path: '/learning',
            emoji: '📚',
            title: 'Study Guide',
            subtitle: '27 cardiac rhythms with animated ECGs, findings & treatments',
            color: '#3B82F6',
            bg: 'rgba(59,130,246,0.1)'
        },
        {
            path: '/prediction',
            emoji: '🤖',
            title: 'AI Prediction',
            subtitle: 'Enter clinical parameters and get an AI-powered cardiac diagnosis',
            color: 'var(--accent-orange)',
            bg: 'rgba(255,107,0,0.1)'
        },
        {
            path: '/quiz',
            emoji: '🎮',
            title: 'Cardiac Quiz',
            subtitle: 'Test your knowledge with 100+ questions on rhythms and treatments',
            color: '#10B981',
            bg: 'rgba(16,185,129,0.1)'
        },
        {
            path: '/manual',
            emoji: '📖',
            title: 'App Manual',
            subtitle: 'How to use the study guide, AI features, and quiz game',
            color: '#F59E0B',
            bg: 'rgba(245,158,11,0.1)'
        }
    ];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', paddingBottom: '2rem' }}>

            {/* Top bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.5rem 0' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Good day,</p>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                        Hi, {userName}! 👋
                    </h1>
                </div>
                {/* Change name button */}
                <button
                    onClick={() => { localStorage.removeItem('ecg_username'); setUserName(''); }}
                    title="Change user"
                    style={{
                        width: '42px', height: '42px', borderRadius: '50%', border: 'none',
                        cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.4)',
                        backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow-soft)'
                    }} className="glass-panel">
                    👤
                </button>
            </div>

            {/* Heart image hero — white background so multiply-blend removes fringe cleanly */}
            <div style={{
                backgroundColor: '#FFFFFF',
                borderBottomLeftRadius: '32px',
                borderBottomRightRadius: '32px',
                borderBottom: '2px solid rgba(255,107,0,0.2)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                position: 'relative', padding: '1.5rem 0 0.8rem',
                boxShadow: '0 4px 24px rgba(255,107,0,0.08)'
            }}>
                {/* Soft orange center glow */}
                <div style={{
                    position: 'absolute',
                    width: '260px', height: '260px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,107,0,0.07) 0%, transparent 70%)',
                    zIndex: 0
                }} />
                <img
                    src={heartImage}
                    alt="3D Anatomical Heart"
                    style={{
                        width: '260px', height: 'auto', objectFit: 'contain',
                        position: 'relative', zIndex: 1,
                        animation: 'heartbeat 2s ease-in-out infinite',
                        /* Fade edges into background — center stays sharp & 3D */
                        WebkitMaskImage: 'radial-gradient(ellipse 75% 78% at 50% 48%, black 38%, transparent 72%)',
                        maskImage: 'radial-gradient(ellipse 75% 78% at 50% 48%, black 38%, transparent 72%)',
                        filter: 'drop-shadow(0 10px 22px rgba(140,0,0,0.22))',
                    }}
                />
                <style>{`
                    @keyframes heartbeat {
                        0%,100% { transform: scale(1); }
                        14% { transform: scale(1.04); }
                        28% { transform: scale(1); }
                        42% { transform: scale(1.03); }
                        56% { transform: scale(1); }
                    }
                `}</style>
            </div>

            {/* Subtitle */}
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '0 0 1.5rem 0', fontSize: '0.9rem', padding: '0 1.5rem' }}>
                Your intelligent cardiac learning platform
            </p>

            {/* Module cards */}
            <div style={{ padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {modules.map(mod => (
                    <div
                        key={mod.path}
                        onClick={() => navigate(mod.path)}
                        className="glass-panel"
                        style={{
                            padding: '1.3rem 1.5rem',
                            border: `1px solid ${mod.color}33`,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '1.2rem',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            backgroundColor: mod.bg
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${mod.color}33`; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        {/* Icon */}
                        <div style={{
                            width: '54px', height: '54px', borderRadius: '14px',
                            backgroundColor: mod.color + '22', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '1.7rem', flexShrink: 0,
                            border: `1px solid ${mod.color}44`
                        }}>
                            {mod.emoji}
                        </div>

                        {/* Text */}
                        <div style={{ flex: 1 }}>
                            <h2 style={{ margin: '0 0 0.3rem 0', fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                {mod.title}
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                                {mod.subtitle}
                            </p>
                        </div>

                        {/* Arrow */}
                        <span style={{ color: mod.color, fontSize: '1.3rem', fontWeight: 'bold' }}>›</span>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <p style={{ textAlign: 'center', padding: '2rem 1.5rem 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                ⚕️ For educational purposes only. Not a substitute for medical advice.
            </p>
        </div>
    );
};

export default DashboardHome;
