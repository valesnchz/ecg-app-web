import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import arrhythmiasData from '../data/arrhythmias_db.json';
import AnimatedECG from './AnimatedECG';

type Arrhythmia = typeof arrhythmiasData[0];
type QuestionType = 'identify_ecg' | 'definition' | 'treatment' | 'severity' | 'category';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Question {
    type: QuestionType;
    text: string;
    correct: string;
    options: string[];
    rhythmId?: string;
    bpm?: number;
    difficulty: Difficulty;
}

const QUESTIONS_PER_GAME = 10;
const MAX_LIVES = 3;
const POINTS: Record<Difficulty, number> = { easy: 75, medium: 125, hard: 200 };
const STREAK_BONUS = 50;

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

function buildQuestionBank(data: Arrhythmia[]): Question[] {
    const questions: Question[] = [];

    data.forEach(item => {
        const others = data.filter(d => d.id !== item.id);
        const pick = (n: number) => shuffle(others).slice(0, n).map(d => d.name);

        // EASY: identify ECG waveform (visual, options from same category first)
        questions.push({
            type: 'identify_ecg', difficulty: 'easy',
            text: `What cardiac rhythm is shown below? (${item.bpm} BPM)`,
            correct: item.name,
            options: shuffle([...pick(3), item.name]),
            rhythmId: item.id, bpm: item.bpm
        });

        // EASY: definition match
        questions.push({
            type: 'definition', difficulty: 'easy',
            text: `"${item.description.slice(0, 100)}..." — Which rhythm is described?`,
            correct: item.name,
            options: shuffle([...pick(3), item.name])
        });

        // MEDIUM: severity
        if (item.severity !== 'Normal') {
            const otherSev = ['Low', 'Medium', 'High', 'Critical', 'Normal'].filter(s => s !== item.severity);
            questions.push({
                type: 'severity', difficulty: 'medium',
                text: `What is the clinical severity level of "${item.name}"?`,
                correct: item.severity,
                options: shuffle([...shuffle(otherSev).slice(0, 3), item.severity])
            });
        }

        // MEDIUM: category
        const otherCat = ['Sinus Node', 'Atrial', 'AV Block', 'Junctional', 'Ventricular', 'Paced'].filter(c => c !== item.category);
        questions.push({
            type: 'category', difficulty: 'medium',
            text: `"${item.name}" belongs to which arrhythmia category?`,
            correct: item.category,
            options: shuffle([...shuffle(otherCat).slice(0, 3), item.category])
        });

        // HARD: first-line treatment
        if (item.treatment.length > 30) {
            const wrongTx = shuffle(others.filter(o => o.treatment.length > 30))
                .slice(0, 3).map(o => o.treatment.split('.')[0]);
            questions.push({
                type: 'treatment', difficulty: 'hard',
                text: `Which is the correct first-line treatment for "${item.name}"?`,
                correct: item.treatment.split('.')[0],
                options: shuffle([...wrongTx, item.treatment.split('.')[0]])
            });
        }
    });

    return questions;
}

function filterByDifficulty(bank: Question[], diff: Difficulty): Question[] {
    const allowed: QuestionType[] =
        diff === 'easy' ? ['identify_ecg', 'definition'] :
        diff === 'medium' ? ['identify_ecg', 'definition', 'severity', 'category'] :
        ['identify_ecg', 'definition', 'severity', 'category', 'treatment'];
    return shuffle(bank.filter(q => allowed.includes(q.type)));
}

// ---- Difficulty card colours ----
const DIFF_CONFIG = {
    easy: { label: '🟢 Easy', color: '#10B981', bg: 'rgba(16,185,129,0.1)', desc: 'Identify rhythms by ECG & description' },
    medium: { label: '🟡 Medium', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', desc: 'Adds severity & category questions' },
    hard: { label: '🔴 Hard', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', desc: 'Includes complex treatment questions' },
};

const getBtnStyle = (option: string, selected: string | null, correct: string): React.CSSProperties => {
    const base: React.CSSProperties = { padding: '0.85rem 1rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s', width: '100%' };
    if (!selected) return { ...base, border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.5)', color: 'var(--text-main)' };
    if (option === correct) return { ...base, border: '2px solid #10B981', backgroundColor: '#D1FAE5', color: '#065F46', cursor: 'default' };
    if (option === selected) return { ...base, border: '2px solid #EF4444', backgroundColor: '#FEE2E2', color: '#991B1B', cursor: 'default' };
    return { ...base, border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.3)', color: 'var(--text-muted)', cursor: 'default' };
};

const TYPE_LABEL: Record<QuestionType, string> = {
    identify_ecg: '🫀 Identify Rhythm',
    definition: '📖 Definition',
    severity: '⚠️ Severity',
    category: '📋 Category',
    treatment: '💊 Treatment',
};

const QuizGame: React.FC = () => {
    const navigate = useNavigate();
    const [allQuestions] = useState<Question[]>(() => buildQuestionBank(arrhythmiasData));

    // Game state machine: 'select' → 'playing' → 'result'
    const [phase, setPhase] = useState<'select' | 'playing' | 'result'>('select');
    const [difficulty, setDifficulty] = useState<Difficulty>('easy');
    const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
    const [qIndex, setQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(MAX_LIVES);
    const [streak, setStreak] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

    const current = gameQuestions[qIndex];
    const isLastQuestion = qIndex >= QUESTIONS_PER_GAME - 1;

    const startGame = (diff: Difficulty) => {
        const pool = filterByDifficulty(allQuestions, diff).slice(0, QUESTIONS_PER_GAME);
        setDifficulty(diff);
        setGameQuestions(pool);
        setQIndex(0);
        setScore(0);
        setLives(MAX_LIVES);
        setStreak(0);
        setSelected(null);
        setFeedback(null);
        setPhase('playing');
    };

    const handleAnswer = useCallback((option: string) => {
        if (selected !== null || !current) return;
        setSelected(option);
        const pts = POINTS[difficulty];

        if (option === current.correct) {
            const bonus = streak >= 2 ? STREAK_BONUS : 0;
            setScore(s => s + pts + bonus);
            setStreak(s => s + 1);
            setFeedback('correct');
        } else {
            setLives(l => l - 1);
            setStreak(0);
            setFeedback('wrong');
        }
    }, [selected, current, streak, difficulty]);

    const nextQuestion = () => {
        if (lives <= 0) { setPhase('result'); return; }
        if (isLastQuestion) { setPhase('result'); return; }
        setSelected(null);
        setFeedback(null);
        setQIndex(i => i + 1);
    };

    // Check if lives just hit 0 after wrong answer
    const effectiveLives = lives;
    const shouldShowNext = feedback !== null && effectiveLives > 0 && !isLastQuestion;
    const shouldShowFinish = feedback !== null && (effectiveLives <= 0 || isLastQuestion);

    // ---- SCREEN: Difficulty Select ----
    if (phase === 'select') return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '2rem 1.5rem', paddingBottom: '4rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/')} className="glass-panel"
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', cursor: 'pointer', color: 'var(--text-main)', fontSize: '1.3rem' }}>‹</button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)', fontWeight: 'bold' }}>Cardiac Quiz</h1>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Choose your difficulty — {QUESTIONS_PER_GAME} questions per round</p>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {(Object.entries(DIFF_CONFIG) as [Difficulty, typeof DIFF_CONFIG.easy][]).map(([key, cfg]) => (
                    <button key={key} onClick={() => startGame(key)}
                        style={{
                            padding: '1.5rem', borderRadius: '14px', border: `2px solid ${cfg.color}44`,
                            backgroundColor: cfg.bg, cursor: 'pointer', textAlign: 'left',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                            boxShadow: 'none', display: 'flex', alignItems: 'center', gap: '1.2rem'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.color}33`; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: cfg.color + '22', border: `2px solid ${cfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                            {key === 'easy' ? '🏥' : key === 'medium' ? '🩺' : '🧬'}
                        </div>
                        <div>
                            <p style={{ margin: '0 0 0.3rem 0', fontSize: '1.1rem', fontWeight: 'bold', color: cfg.color }}>{cfg.label}</p>
                            <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', color: 'var(--text-main)' }}>{cfg.desc}</p>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{POINTS[key]} pts per correct answer{key !== 'easy' ? ` · +${STREAK_BONUS} streak bonus` : ''}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    // ---- SCREEN: Result ----
    if (phase === 'result') {
        const maxScore = QUESTIONS_PER_GAME * POINTS[difficulty];
        const pct = Math.round((score / maxScore) * 100);
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', border: '1px solid var(--glass-border)', maxWidth: '420px', width: '100%' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '📚'}</div>
                    <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good job!' : 'Keep Studying!'}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>{DIFF_CONFIG[difficulty].label} · {qIndex + 1} questions answered</p>
                    <p style={{ color: 'var(--text-main)', fontSize: '3rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{score}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/{maxScore} pts</span></p>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,107,0,0.15)', borderRadius: '4px', margin: '1rem 0 1.5rem' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--accent-orange)', borderRadius: '4px', transition: 'width 1s' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <button onClick={() => setPhase('select')} style={{ flex: 1, padding: '0.9rem', backgroundColor: 'var(--accent-orange)', color: 'white', border: 'none', borderRadius: '30px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', minWidth: '120px' }}>Play Again</button>
                        <button onClick={() => navigate('/learning')} style={{ flex: 1, padding: '0.9rem', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '30px', fontSize: '0.95rem', cursor: 'pointer', minWidth: '120px' }}>📚 Study</button>
                    </div>
                </div>
            </div>
        );
    }

    // ---- SCREEN: Playing ----
    if (!current) return null;
    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '2rem 1.5rem', paddingBottom: '4rem' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button onClick={() => setPhase('select')} className="glass-panel"
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', cursor: 'pointer', color: 'var(--text-main)', fontSize: '1.3rem' }}>‹</button>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: DIFF_CONFIG[difficulty].color, fontWeight: 'bold' }}>{DIFF_CONFIG[difficulty].label}</p>
                    {streak >= 2 && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--accent-orange)' }}>🔥 {streak}x Streak!</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{score} pts</p>
                    <p style={{ margin: 0, fontSize: '1rem' }}>{'❤️'.repeat(Math.max(0, effectiveLives))}{'🤍'.repeat(Math.max(0, MAX_LIVES - effectiveLives))}</p>
                </div>
            </header>

            {/* Progress bar */}
            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,107,0,0.15)', borderRadius: '4px', marginBottom: '1.5rem' }}>
                <div style={{ width: `${((qIndex + 1) / QUESTIONS_PER_GAME) * 100}%`, height: '100%', backgroundColor: 'var(--accent-orange)', borderRadius: '4px', transition: 'width 0.4s' }} />
            </div>
            <p style={{ textAlign: 'center', margin: '-1rem 0 1rem 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Question {qIndex + 1} of {QUESTIONS_PER_GAME}</p>

            <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--glass-border)' }}>
                {/* Type badge */}
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-orange)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {TYPE_LABEL[current.type]}
                </span>

                <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 'bold', lineHeight: 1.45, margin: '0.7rem 0 1rem' }}>
                    {current.text}
                </p>

                {current.type === 'identify_ecg' && current.rhythmId && (
                    <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '1.2rem', cursor: 'pointer' }} title="Hover to slow down · Click to pause">
                        <AnimatedECG rhythmId={current.rhythmId} bpm={current.bpm} height={100} />
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {current.options.map((opt, i) => (
                        <button key={i} onClick={() => handleAnswer(opt)} style={getBtnStyle(opt, selected, current.correct)}>
                            <span style={{ marginRight: '0.5rem', opacity: 0.45 }}>{['A', 'B', 'C', 'D'][i]}.</span>{opt}
                        </button>
                    ))}
                </div>

                {feedback && (
                    <div style={{ marginTop: '1.2rem', padding: '0.9rem', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.95rem', animation: 'fadeIn 0.2s ease-in', backgroundColor: feedback === 'correct' ? '#D1FAE5' : '#FEE2E2', color: feedback === 'correct' ? '#065F46' : '#991B1B' }}>
                        {feedback === 'correct'
                            ? `✅ Correct! +${POINTS[difficulty]}${streak >= 2 ? ` (+${STREAK_BONUS} streak bonus)` : ''} pts`
                            : `❌ Incorrect — Answer: ${current.correct}`}
                    </div>
                )}

                {/* Navigation button */}
                {shouldShowNext && (
                    <button onClick={nextQuestion}
                        style={{ width: '100%', marginTop: '1rem', padding: '0.9rem', backgroundColor: 'var(--accent-orange)', color: 'white', border: 'none', borderRadius: '30px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                        Next Question →
                    </button>
                )}
                {shouldShowFinish && (
                    <button onClick={() => setPhase('result')}
                        style={{ width: '100%', marginTop: '1rem', padding: '0.9rem', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '30px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                        See Results 🏆
                    </button>
                )}
            </div>
            <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }`}</style>
        </div>
    );
};

export default QuizGame;
