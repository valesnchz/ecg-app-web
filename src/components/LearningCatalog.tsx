import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import arrhythmiasData from '../data/arrhythmias_db.json';
import AnimatedECG from './AnimatedECG';

type Arrhythmia = typeof arrhythmiasData[0];

const CATEGORIES = ['All', 'Sinus Node', 'Atrial', 'AV Block', 'Junctional', 'Ventricular', 'Paced'];

const getSeverityColor = (severity: string) => {
    const map: Record<string, string> = {
        'Normal': '#10B981', 'Low': '#3B82F6', 'Medium': '#F59E0B', 'High': '#FF6B00', 'Critical': '#EF4444'
    };
    return map[severity] ?? '#888';
};

// ----------------------------------------------------------------
// ECG Sound Modal — self-contained modal component with audio
// ----------------------------------------------------------------
const DetailModal: React.FC<{ item: Arrhythmia; onClose: () => void }> = ({ item, onClose }) => {
    const [soundOn, setSoundOn] = useState(false);
    const ctxRef = useRef<AudioContext | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /** Play a short 880 Hz blip (clinical monitor beep) */
    const playBlip = useCallback((ctx: AudioContext) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
    }, []);

    const stopAudio = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        ctxRef.current?.close();
        ctxRef.current = null;
    }, []);

    const toggleSound = useCallback(() => {
        if (soundOn) {
            stopAudio();
            setSoundOn(false);
        } else {
            const ctx = new AudioContext();
            ctxRef.current = ctx;
            const ms = Math.round(60000 / item.bpm);
            playBlip(ctx);
            timerRef.current = setInterval(() => playBlip(ctx), ms);
            setSoundOn(true);
        }
    }, [soundOn, item.bpm, playBlip, stopAudio]);

    // Cleanup on unmount / close
    useEffect(() => () => stopAudio(), [stopAudio]);

    const p = (item as any).ecg_params as Record<string, string | number> | undefined;

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 9999 }}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--bg-card)', borderRadius: '18px', padding: '1.5rem', maxWidth: '520px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.45)', maxHeight: '92vh', overflowY: 'auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.3rem' }}>{item.name}</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {/* Sound toggle */}
                        <button onClick={toggleSound} title={soundOn ? 'Mute ECG sound' : 'Play ECG sound'}
                            style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', border: `2px solid ${soundOn ? 'var(--accent-orange)' : 'var(--glass-border)'}`, backgroundColor: soundOn ? 'rgba(255,107,0,0.12)' : 'transparent', cursor: 'pointer', fontSize: '1rem', color: soundOn ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
                            {soundOn ? '🔊' : '🔇'}
                        </button>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                    </div>
                </div>

                {/* Category + severity badge */}
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--accent-orange)', fontWeight: 'bold' }}>
                    {item.category} · {item.bpm} BPM ·{' '}
                    <span style={{ marginLeft: '0.3rem', backgroundColor: getSeverityColor(item.severity), color: 'white', padding: '0.15rem 0.5rem', borderRadius: '1rem' }}>{item.severity}</span>
                </p>

                {/* Animated ECG */}
                <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '1.2rem' }}>
                    <AnimatedECG rhythmId={item.id} bpm={item.bpm} height={120} />
                </div>

                {/* ECG Parameters Table */}
                {p && (
                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(255,107,0,0.06)', borderRadius: '10px', border: '1px solid rgba(255,107,0,0.2)' }}>
                        <p style={{ margin: '0 0 0.6rem 0', fontWeight: 'bold', fontSize: '0.82rem', color: 'var(--accent-orange)' }}>📊 ECG Parameters</p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                            <tbody>
                                {[
                                    ['Heart Rate', `${item.bpm} BPM`],
                                    ['PR Interval', `${p.pr_ms} ms`],
                                    ['QRS Duration', `${p.qrs_ms} ms`],
                                    ['QT Interval', `${p.qt_ms} ms`],
                                    ['R-R Interval', `${p.rr_ms} ms`],
                                    ['P Wave', p.p_wave],
                                    ['ST Segment', p.st_segment],
                                ].map(([label, value]) => (
                                    <tr key={label as string} style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                                        <td style={{ padding: '0.35rem 0.5rem', fontWeight: 'bold', color: 'var(--text-muted)', width: '42%' }}>{label}</td>
                                        <td style={{ padding: '0.35rem 0.5rem', color: 'var(--text-main)' }}>{String(value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Section title="Description" content={item.description} />
                <Section title="ECG Findings" content={item.findings} />
                <Section title="💊 Diagnosis & Treatment" content={item.treatment} color="#10B981" />

                <button onClick={onClose} style={{ marginTop: '1.2rem', width: '100%', padding: '0.9rem', backgroundColor: 'var(--accent-orange)', color: 'white', border: 'none', borderRadius: '30px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                    Close
                </button>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------
// Main LearningCatalog component
// ----------------------------------------------------------------
const LearningCatalog: React.FC = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [selected, setSelected] = useState<Arrhythmia | null>(null);

    const filtered = arrhythmiasData.filter(a =>
        (category === 'All' || a.category === category) &&
        a.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '2rem 1.5rem', paddingBottom: '7rem' }}>

            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={() => navigate('/')} className="glass-panel"
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', cursor: 'pointer', color: 'var(--text-main)', fontSize: '1.2rem' }}>‹</button>
                <div>
                    <h1 style={{ fontSize: '1.3rem', margin: 0, color: 'var(--text-main)', fontWeight: 'bold' }}>Study Guide</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>27 Cardiac Rhythms & Arrhythmias · Tap card for full details + 🔊</p>
                </div>
            </header>

            {/* Search */}
            <input type="text" placeholder="Search rhythm..." value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '30px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.5)', color: 'var(--text-main)', fontSize: '0.95rem', boxSizing: 'border-box', marginBottom: '1rem', outline: 'none' }}
            />

            {/* Category filter */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)}
                        style={{ padding: '0.4rem 0.9rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', border: '1px solid var(--accent-orange)', backgroundColor: category === cat ? 'var(--accent-orange)' : 'transparent', color: category === cat ? 'white' : 'var(--accent-orange)', transition: 'all 0.2s' }}>
                        {cat}
                    </button>
                ))}
            </div>

            {/* Cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {filtered.map(item => (
                    <div key={item.id} className="glass-panel" onClick={() => setSelected(item)}
                        style={{ padding: '1rem', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,107,0,0.15)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{item.name}</h3>
                            <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', backgroundColor: getSeverityColor(item.severity), color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{item.severity}</span>
                        </div>
                        <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.75rem', color: 'var(--accent-orange)', fontWeight: 'bold' }}>
                            {item.category} · {item.bpm} BPM
                        </p>
                        <div style={{ borderRadius: '6px', overflow: 'hidden', marginBottom: '0.8rem' }}>
                            <AnimatedECG rhythmId={item.id} bpm={item.bpm} height={80} />
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                            {item.description.slice(0, 100)}…
                        </p>
                        <p style={{ margin: '0.6rem 0 0 0', fontSize: '0.75rem', color: 'var(--accent-orange)', fontStyle: 'italic', textAlign: 'right' }}>
                            Tap for params + treatment + 🔊 →
                        </p>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>No rhythms found.</p>
            )}

            {selected && <DetailModal item={selected} onClose={() => setSelected(null)} />}
        </div>
    );
};

const Section: React.FC<{ title: string; content: string; color?: string }> = ({ title, content, color }) => (
    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '8px', borderLeft: `4px solid ${color ?? 'var(--accent-orange)'}` }}>
        <p style={{ margin: '0 0 0.3rem 0', fontWeight: 'bold', fontSize: '0.85rem', color: color ?? 'var(--accent-orange)' }}>{title}</p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>{content}</p>
    </div>
);

export default LearningCatalog;
