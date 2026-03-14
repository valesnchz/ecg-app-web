import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedECG from './AnimatedECG';
import arrhythmiasData from '../data/arrhythmias_db.json';

// ----------------------------------------------------------------
// Simple 9-factor risk form
// ----------------------------------------------------------------
interface SimpleForm {
    age: string;
    sex: 'male' | 'female';
    temperatureC: string;       // Body temperature in °C
    systolic: string;           // Systolic blood pressure mmHg
    diastolic: string;          // Diastolic blood pressure mmHg
    heartRate: string;          // Heart rate in bpm
    spO2: string;               // Oxygen saturation in %
    smoker: boolean;
    alcohol: boolean;
    diabetic: boolean;
    familyHistory: boolean;
    chestPain: boolean;
}

interface RiskItem {
    condition: string;
    level: 'Low' | 'Moderate' | 'High' | 'Critical';
    reason: string;
    diagnosis?: string;
    treatment?: string;
}

const RISK_COLOR: Record<string, string> = {
    Low: '#10B981', Moderate: '#F59E0B', High: '#FF6B00', Critical: '#EF4444'
};
const RISK_BG: Record<string, string> = {
    Low: '#D1FAE5', Moderate: '#FEF3C7', High: '#FFF0E6', Critical: '#FEE2E2'
};
const RISK_ICON: Record<string, string> = {
    Low: '🟢', Moderate: '🟡', High: '🟠', Critical: '🔴'
};

/**
 * Maps a predicted condition name to an arrhythmia DB id for ECG display.
 * Returns null if no suitable match exists.
 */
const CONDITION_TO_RHYTHM: Record<string, string> = {
    'Hypertensive Heart Disease': 'sinus_tachycardia',
    'Coronary Artery Disease (CAD)': 'nsr_pvc',
    'Atrial Fibrillation': 'atrial_fibrillation',
    'Diabetic Cardiomyopathy': 'sinus_tachycardia',
    'Myocarditis (Fever-related)': 'sinus_tachycardia',
    'Hypothermia-related Arrhythmia': 'sinus_bradycardia',
    'Alcoholic Cardiomyopathy': 'sinus_bradycardia',
    'Sinus Tachycardia / Arrhythmia': 'sinus_arrhythmia',
    'Thromboembolic / Stroke Risk': 'atrial_fibrillation',
    'No Significant Cardiac Risk Detected': 'sinus_rhythm',
    'Bradycardia': 'sinus_bradycardia',
    'Sinus Tachycardia': 'sinus_tachycardia',
    'Supraventricular Tachycardia (SVT)': 'svt',
    'Hypoxemia (Low Blood Oxygen)': 'sinus_tachycardia',
    'Severe Hypoxemia / Pulmonary Embolism Risk': 'vtach',
};

/**
 * Rule-based engine using simple daily-life parameters.
 * Temperature classified: <36.5 hypothermia, 36.5-37.4 normal, 37.5-38.4 low fever, ≥38.5 high fever
 * BP classified: systolic <120 normal, 120-129 elevated, 130-139 high, ≥140 very high
 */
function analyzeRisk(f: SimpleForm): RiskItem[] {
    const age = parseInt(f.age) || 0;
    const tempC = parseFloat(f.temperatureC) || 36.8;
    const sys = parseInt(f.systolic) || 115;
    const dia = parseInt(f.diastolic) || 75;
    const hr = parseInt(f.heartRate) || 72;
    const spo2 = parseFloat(f.spO2) || 98;

    // Classify temperature
    const isHighFever = tempC >= 38.5;
    const isLowFever = tempC >= 37.5 && tempC < 38.5;
    const isHypothermia = tempC < 35.5;

    // Classify blood pressure
    const bpCategory =
        sys >= 180 || dia >= 120 ? 'very_high' :
        sys >= 140 || dia >= 90  ? 'high' :
        sys >= 130               ? 'elevated' : 'normal';

    // Classify heart rate
    const isTachy = hr > 100;
    const isBrady = hr < 60;
    const isExtremeTachy = hr > 150;

    // Classify SpO2
    const isLowO2 = spo2 < 95 && spo2 >= 90;
    const isCriticalO2 = spo2 < 90;

    const risks: RiskItem[] = [];
    const riskScore =
        (f.smoker ? 2 : 0) +
        (f.diabetic ? 2 : 0) +
        (f.familyHistory ? 2 : 0) +
        (f.chestPain ? 3 : 0) +
        (f.alcohol ? 1 : 0) +
        (bpCategory === 'very_high' ? 4 : bpCategory === 'high' ? 2 : bpCategory === 'elevated' ? 1 : 0) +
        (age > 65 ? 3 : age > 50 ? 2 : age > 40 ? 1 : 0) +
        (isHighFever ? 2 : isLowFever ? 1 : 0) +
        (isExtremeTachy ? 3 : isTachy ? 1 : isBrady ? 1 : 0) +
        (isCriticalO2 ? 3 : isLowO2 ? 1 : 0);

    // --- Hypertensive Heart Disease ---
    if (bpCategory === 'very_high' || (bpCategory === 'high' && (f.smoker || f.diabetic))) {
        risks.push({
            condition: 'Hypertensive Heart Disease',
            level: bpCategory === 'very_high' ? 'High' : 'Moderate',
            reason: `Blood pressure ${sys}/${dia} mmHg${f.smoker ? ', smoking' : ''}${f.diabetic ? ', diabetes' : ''} significantly increases cardiac strain.`,
            diagnosis: 'Left ventricular hypertrophy, stiffened heart muscle, and increased afterload.',
            treatment: 'Strict blood pressure control (ACE inhibitors, ARBs), sodium restriction, and cardiovascular monitoring.'
        });
    }

    // --- Coronary Artery Disease / ACS ---
    if (f.chestPain && (f.smoker || f.familyHistory || f.diabetic || age > 45)) {
        risks.push({
            condition: 'Coronary Artery Disease (CAD)',
            level: (f.chestPain && f.smoker && f.familyHistory) ? 'Critical' : 'High',
            reason: `Chest pain combined with ${[f.smoker && 'smoking', f.familyHistory && 'family history', f.diabetic && 'diabetes', age > 45 && 'age over 45'].filter(Boolean).join(', ')} strongly suggests CAD.`,
            diagnosis: 'Ischemic changes, possible ST-segment depression or T-wave inversion indicative of poor myocardial perfusion.',
            treatment: 'Immediate cardiology consult, ECG/Troponin test, Aspirin, Statins, and Beta-blockers.'
        });
    }

    // --- Atrial Fibrillation ---
    if (age > 55 && (f.alcohol || bpCategory !== 'normal' || f.chestPain)) {
        risks.push({
            condition: 'Atrial Fibrillation',
            level: age > 65 ? 'High' : 'Moderate',
            reason: `Age ${age}${f.alcohol ? ', alcohol use' : ''}${bpCategory !== 'normal' ? `, BP ${sys}/${dia} mmHg` : ''} are classic AFib risk factors.`,
            diagnosis: 'Irregularly irregular rhythm with absent P-waves. High risk of thrombus formation.',
            treatment: 'Rate control (Beta-blockers, Diltiazem) and Anticoagulation (DOACs/Warfarin) based on CHA2DS2-VASc score.'
        });
    }

    // --- Type 2 Diabetes-related Cardiomyopathy ---
    if (f.diabetic && (age > 40 || bpCategory !== 'normal')) {
        risks.push({
            condition: 'Diabetic Cardiomyopathy',
            level: (f.diabetic && bpCategory === 'high') ? 'High' : 'Moderate',
            reason: `Diabetes combined with ${bpCategory !== 'normal' ? `BP ${sys}/${dia} mmHg` : `age ${age}`} progressively damages cardiac muscle.`,
            diagnosis: 'Microvascular dysfunction leading to heart failure with preserved or reduced ejection fraction.',
            treatment: 'Glycemic control (SGLT2 inhibitors), BP management, and continuous cardiac screening.'
        });
    }

    // --- Myocarditis (fever-related) ---
    if (isHighFever || (isLowFever && f.chestPain)) {
        risks.push({
            condition: 'Myocarditis (Fever-related)',
            level: isHighFever && f.chestPain ? 'High' : 'Moderate',
            reason: `Temperature ${tempC.toFixed(1)} °C${f.chestPain ? ' with chest pain' : ''} may indicate viral myocarditis — inflammation of the heart muscle.`,
            diagnosis: 'Diffuse ST changes, T-wave inversions, and potential arrhythmias secondary to myocardial inflammation.',
            treatment: 'Rest, NSAIDs or Colchicine, and treatment of underlying infection. Avoid strenuous exercise.'
        });
    }

    // --- Hypothermia-related arrhythmia ---
    if (isHypothermia) {
        risks.push({
            condition: 'Hypothermia-related Arrhythmia',
            level: 'High',
            reason: `Temperature ${tempC.toFixed(1)} °C is dangerously low. Hypothermia can trigger bradycardia, heart block, and ventricular arrhythmias.`,
            diagnosis: 'Sinus bradycardia, distinct Osborn (J) waves, and prolonged intervals due to delayed conduction.',
            treatment: 'Gradual active rewarming; avoid rough handling which may precipitate ventricular fibrillation.'
        });
    }

    // --- Tachycardia / Bradycardia ---
    if (isTachy || isBrady) {
        risks.push({
            condition: isBrady ? 'Bradycardia' : isExtremeTachy ? 'Supraventricular Tachycardia (SVT)' : 'Sinus Tachycardia',
            level: isExtremeTachy ? 'High' : 'Moderate',
            reason: `Heart rate ${hr} bpm is ${isBrady ? 'below 60 (bradycardia)' : `above ${isExtremeTachy ? '150 (extreme tachycardia)' : '100 (tachycardia)'}`}. This may indicate an arrhythmia${f.chestPain ? ' combined with chest pain' : ''}.`,
            diagnosis: isBrady ? 'Slow sinus node firing or conduction block.' : 'Abnormally fast heart rate, potentially originating above the ventricles (SVT) or simply sinus tachycardia secondary to systemic stress.',
            treatment: isBrady ? 'Atropine if symptomatic; pacemaker evaluation if chronic.' : isExtremeTachy ? 'Vagal maneuvers, Adenosine, or synchronized cardioversion.' : 'Treat underlying cause (hydration, fever reduction, anxiety management).'
        });
    }

    // --- Low Oxygen Saturation ---
    if (isLowO2 || isCriticalO2) {
        risks.push({
            condition: isCriticalO2 ? 'Severe Hypoxemia / Pulmonary Embolism Risk' : 'Hypoxemia (Low Blood Oxygen)',
            level: isCriticalO2 ? 'Critical' : 'High',
            reason: `SpO₂ of ${spo2}% is ${isCriticalO2 ? 'critically low (<90%)' : 'below normal (<95%)'}. This may indicate heart failure, pulmonary embolism, or severe respiratory/cardiac compromise.`,
            diagnosis: 'Insufficient oxygen delivery to cardiac tissue, potentially leading to ectopic beats or ischemia.',
            treatment: 'Supplemental oxygen therapy, treat underlying respiratory cause, and continuous monitoring.'
        });
    }

    // --- Alcoholic Cardiomyopathy ---
    if (f.alcohol && age > 35) {
        risks.push({
            condition: 'Alcoholic Cardiomyopathy',
            level: age > 50 ? 'Moderate' : 'Low',
            reason: `Long-term alcohol use can weaken heart muscle tissue, especially after age 35.`,
            diagnosis: 'Dilated heart chambers, poor contractility, and increased susceptibility to arrhythmias.',
            treatment: 'Immediate alcohol abstinence, Beta-blockers, and ACE inhibitors to manage heart failure symptoms.'
        });
    }

    // --- Sinus Tachycardia / Arrhythmia risk ---
    if (f.smoker && (isLowFever || isHighFever)) {
        risks.push({
            condition: 'Sinus Tachycardia / Arrhythmia',
            level: 'Low',
            reason: `Smoking with fever (${tempC.toFixed(1)} °C) elevates heart rate and can trigger benign arrhythmias.`,
            diagnosis: 'Elevated sympathetic tone leading to rapid pacemaker activity.',
            treatment: 'Smoking cessation, hydration, and antipyretics to lower body temperature.'
        });
    }

    // --- Stroke / Thromboembolic risk ---
    if (riskScore >= 7) {
        risks.push({
            condition: 'Thromboembolic / Stroke Risk',
            level: riskScore >= 10 ? 'Critical' : 'High',
            reason: `Your cumulative risk score (${riskScore}/14) is significantly elevated. Multiple combined risk factors increase clot and stroke risk.`,
            diagnosis: 'High risk of blood clot formation due to combined systemic factors (hypertension, diabetes, age).',
            treatment: 'Aggressive management of all risk factors; evaluation for prophylactic anticoagulation or antiplatelet therapy.'
        });
    }

    if (risks.length === 0) {
        risks.push({
            condition: 'No Significant Cardiac Risk Detected',
            level: 'Low',
            reason: 'Based on the information provided, your cardiac risk profile appears low. Continue maintaining a healthy lifestyle.'
        });
    }

    return risks;
}

// ----------------------------------------------------------------
// Toggle button component
// ----------------------------------------------------------------
const Toggle: React.FC<{ label: string; icon: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, icon, value, onChange }) => (
    <button
        onClick={() => onChange(!value)}
        style={{
            padding: '0.85rem 1rem', borderRadius: '12px', border: `2px solid ${value ? 'var(--accent-orange)' : 'rgba(0,0,0,0.1)'}`,
            backgroundColor: value ? 'rgba(255,107,0,0.1)' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem',
            transition: 'all 0.2s', width: '100%'
        }}>
        <span style={{ fontSize: '1.3rem' }}>{icon}</span>
        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: value ? 'var(--accent-orange)' : 'var(--text-muted)' }}>{label}</span>
        <span style={{ marginLeft: 'auto', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: value ? 'var(--accent-orange)' : 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem' }}>
            {value ? '✓' : ''}
        </span>
    </button>
);

// ----------------------------------------------------------------
// Select row component
// ----------------------------------------------------------------
const SelectRow: React.FC<{ label: string; icon: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }> = ({ label, icon, value, options, onChange }) => (
    <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            <span>{icon}</span>{label}
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {options.map(opt => (
                <button key={opt.value} onClick={() => onChange(opt.value)}
                    style={{
                        flex: 1, minWidth: '80px', padding: '0.6rem 0.4rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold',
                        border: `2px solid ${value === opt.value ? 'var(--accent-orange)' : 'rgba(0,0,0,0.1)'}`,
                        backgroundColor: value === opt.value ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.5)',
                        color: value === opt.value ? 'var(--accent-orange)' : 'var(--text-muted)',
                        cursor: 'pointer', transition: 'all 0.15s'
                    }}>
                    {opt.label}
                </button>
            ))}
        </div>
    </div>
);

// ----------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------
const PredictionView: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
    const [results, setResults] = useState<RiskItem[]>([]);
    const [form, setForm] = useState<SimpleForm>({
        age: '', sex: 'male', temperatureC: '',
        systolic: '', diastolic: '',
        heartRate: '', spO2: '',
        smoker: false, alcohol: false, diabetic: false,
        familyHistory: false, chestPain: false
    });

    const set = <K extends keyof SimpleForm>(key: K, val: SimpleForm[K]) =>
        setForm(prev => ({ ...prev, [key]: val }));

    const handleAnalyze = () => {
        if (!form.age) return;
        setStep('loading');
        setTimeout(() => {
            setResults(analyzeRisk(form));
            setStep('result');
        }, 2000);
    };

    const isFormValid = !!form.age && !!form.systolic && !!form.diastolic && !!form.heartRate && !!form.spO2;

    const overallLevel = results.length
        ? (['Critical', 'High', 'Moderate', 'Low'] as const).find(l => results.some(r => r.level === l)) ?? 'Low'
        : 'Low';

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', paddingBottom: '3rem' }}>

            {/* ===== Soft orange-peach header band ===== */}
            <div style={{
                background: 'linear-gradient(135deg, #FF9A5C 0%, #FFB87A 60%, #FFCFA0 100%)',
                padding: '2rem 1.5rem 3.5rem',
                position: 'relative', overflow: 'hidden'
            }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <div style={{ position: 'absolute', bottom: '-20px', left: '60%', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <button onClick={() => step === 'result' ? setStep('form') : navigate('/')}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(255,255,255,0.25)', cursor: 'pointer', color: 'white', fontSize: '1.2rem' }}>
                        ‹
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold', color: 'white' }}>Cardiac Risk Estimator</h1>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>AI-powered health assessment</p>
                    </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', maxWidth: '380px' }}>
                    Answer 9 simple questions and we'll estimate your cardiac risk profile based on the most common risk factors.
                </p>
            </div>

            {/* ===== Card pulled up over the band ===== */}
            <div style={{ margin: '-2rem 1rem 0', position: 'relative', zIndex: 2 }}>

                {/* ===== FORM ===== */}
                {step === 'form' && (
                    <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(255,107,0,0.2)', boxShadow: '0 8px 32px rgba(255,107,0,0.10)' }}>

                        {/* Age & Sex */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>🎂 Age</label>
                                <input type="number" min={1} max={110} value={form.age}
                                    onChange={e => set('age', e.target.value)} placeholder="e.g. 45"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '2px solid rgba(255,107,0,0.25)', backgroundColor: 'rgba(255,255,255,0.7)', fontSize: '1rem', boxSizing: 'border-box', outline: 'none' }}
                                />
                            </div>
                            <SelectRow label="Sex" icon="⚧" value={form.sex}
                                options={[{ value: 'male', label: '♂ Male' }, { value: 'female', label: '♀ Female' }]}
                                onChange={v => set('sex', v as SimpleForm['sex'])} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.2rem' }}>
                            {/* Temperature in °C */}
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                    🌡️ Body Temperature
                                    <span style={{ fontWeight: 'normal', fontSize: '0.8rem' }}>(°C — normal: 36.5–37.4)</span>
                                </label>
                                <input type="number" step="0.1" min={30} max={45}
                                    value={form.temperatureC}
                                    onChange={e => set('temperatureC', e.target.value)}
                                    placeholder="e.g. 36.8"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '2px solid rgba(255,107,0,0.25)', backgroundColor: 'rgba(255,255,255,0.7)', fontSize: '1rem', boxSizing: 'border-box', outline: 'none' }}
                                />
                            </div>

                            {/* Blood pressure in mmHg */}
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                    💉 Blood Pressure
                                    <span style={{ fontWeight: 'normal', fontSize: '0.8rem' }}>(mmHg — normal: &lt;120/80)</span>
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="number" min={60} max={250}
                                        value={form.systolic}
                                        onChange={e => set('systolic', e.target.value)}
                                        placeholder="Systolic"
                                        style={{ padding: '0.8rem', borderRadius: '10px', border: '2px solid rgba(255,107,0,0.25)', backgroundColor: 'rgba(255,255,255,0.7)', fontSize: '1rem', outline: 'none' }}
                                    />
                                    <span style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', fontSize: '1.2rem' }}>/</span>
                                    <input type="number" min={40} max={150}
                                        value={form.diastolic}
                                        onChange={e => set('diastolic', e.target.value)}
                                        placeholder="Diastolic"
                                        style={{ padding: '0.8rem', borderRadius: '10px', border: '2px solid rgba(255,107,0,0.25)', backgroundColor: 'rgba(255,255,255,0.7)', fontSize: '1rem', outline: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Heart Rate & SpO2 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                    💓 Heart Rate <span style={{ fontWeight: 'normal' }}>(bpm)</span>
                                </label>
                                <input type="number" min={20} max={300}
                                    value={form.heartRate}
                                    onChange={e => set('heartRate', e.target.value)}
                                    placeholder="e.g. 72"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '2px solid rgba(255,107,0,0.25)', backgroundColor: 'rgba(255,255,255,0.7)', fontSize: '1rem', boxSizing: 'border-box', outline: 'none' }}
                                />
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.73rem', color: 'var(--text-muted)' }}>Normal: 60–100 bpm</p>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                    🩺 SpO₂ <span style={{ fontWeight: 'normal' }}>(%)</span>
                                </label>
                                <input type="number" min={50} max={100} step={0.1}
                                    value={form.spO2}
                                    onChange={e => set('spO2', e.target.value)}
                                    placeholder="e.g. 98"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '2px solid rgba(255,107,0,0.25)', backgroundColor: 'rgba(255,255,255,0.7)', fontSize: '1rem', boxSizing: 'border-box', outline: 'none' }}
                                />
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.73rem', color: 'var(--text-muted)' }}>Normal: ≥95%</p>
                            </div>
                        </div>

                        <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Select all that apply:</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '1.5rem' }}>
                            <Toggle label="Smoker" icon="🚬" value={form.smoker} onChange={v => set('smoker', v)} />
                            <Toggle label="Alcohol" icon="🍷" value={form.alcohol} onChange={v => set('alcohol', v)} />
                            <Toggle label="Diabetic" icon="🩸" value={form.diabetic} onChange={v => set('diabetic', v)} />
                            <Toggle label="Family History" icon="👨‍👩‍👧" value={form.familyHistory} onChange={v => set('familyHistory', v)} />
                            <Toggle label="Chest Pain" icon="💢" value={form.chestPain} onChange={v => set('chestPain', v)} />
                        </div>

                        {!isFormValid && (
                            <p style={{ color: '#EF4444', fontSize: '0.8rem', textAlign: 'center', marginBottom: '0.8rem' }}>
                                ⚠️ Please fill in all 5 required clinical parameters (Age, BP, HR, SpO₂) to estimate risk.
                            </p>
                        )}
                        <button onClick={handleAnalyze} disabled={!isFormValid}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '30px', border: 'none',
                                background: isFormValid ? 'linear-gradient(135deg, #FF9A5C, #FFB87A)' : '#ccc',
                                color: 'white', fontSize: '1.1rem', fontWeight: 'bold',
                                cursor: isFormValid ? 'pointer' : 'not-allowed',
                                boxShadow: isFormValid ? '0 4px 16px rgba(255,154,92,0.4)' : 'none',
                                transition: 'all 0.2s'
                            }}>
                            Estimate My Diagnosis & Risk →
                        </button>
                    </div>
                )}

                {/* ===== LOADING ===== */}
                {step === 'loading' && (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', border: '1px solid rgba(255,107,0,0.2)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1s infinite' }}>🫀</div>
                        <style>{`@keyframes pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.2);}}`}</style>
                        <h2 style={{ color: 'var(--accent-orange)', margin: '0 0 0.5rem 0' }}>Analyzing Risk Factors...</h2>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>AI is processing your health profile</p>
                    </div>
                )}

                {/* ===== RESULTS ===== */}
                {step === 'result' && (
                    <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(255,107,0,0.2)', boxShadow: '0 8px 32px rgba(255,107,0,0.10)' }}>

                        {/* Summary badge */}
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1.2rem', borderRadius: '14px', backgroundColor: RISK_BG[overallLevel], border: `2px solid ${RISK_COLOR[overallLevel]}44` }}>
                            <p style={{ margin: '0 0 0.3rem 0', fontSize: '2rem' }}>{RISK_ICON[overallLevel]}</p>
                            <h2 style={{ margin: '0 0 0.3rem 0', fontSize: '1.2rem', color: RISK_COLOR[overallLevel] }}>
                                Overall: <strong>{overallLevel} Risk</strong>
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: RISK_COLOR[overallLevel] }}>
                                {results.length} condition{results.length !== 1 ? 's' : ''} identified based on your profile
                            </p>
                        </div>

                        {/* Individual risks */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
                            {results.map((r, i) => {
                                const rhythmId = CONDITION_TO_RHYTHM[r.condition];
                                const rhythmData = rhythmId ? arrhythmiasData.find(a => a.id === rhythmId) : null;
                                return (
                                <div key={i} style={{ borderRadius: '12px', backgroundColor: RISK_BG[r.level], borderLeft: `4px solid ${RISK_COLOR[r.level]}`, overflow: 'hidden' }}>
                                    {/* Mini ECG waveform */}
                                    {rhythmId && (
                                        <div style={{ borderBottom: `1px solid ${RISK_COLOR[r.level]}22` }}>
                                            <AnimatedECG rhythmId={rhythmId} bpm={rhythmData?.bpm ?? 75} height={60} color={RISK_COLOR[r.level]} />
                                        </div>
                                    )}
                                    <div style={{ padding: '0.9rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                                            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-main)', flex: 1 }}>{r.condition}</p>
                                            <span style={{ backgroundColor: RISK_COLOR[r.level], color: 'white', fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 'bold', marginLeft: '0.5rem', flexShrink: 0 }}>
                                                {r.level}
                                            </span>
                                        </div>
                                        {rhythmData && (
                                            <div style={{ marginBottom: '0.6rem' }}>
                                                <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.82rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.35 }}>
                                                    {rhythmData.description}
                                                </p>
                                                <div style={{ padding: '0.8rem', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)', fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                    <div>
                                                        <strong style={{ display: 'block', color: 'var(--accent-orange)', marginBottom: '0.2rem' }}>🩺 Diagnostic Findings:</strong>
                                                        <span style={{ lineHeight: 1.4 }}>{r.diagnosis || rhythmData.findings}</span>
                                                    </div>
                                                    <div>
                                                        <strong style={{ display: 'block', color: '#10B981', marginBottom: '0.2rem' }}>💊 Standard Treatment:</strong>
                                                        <span style={{ lineHeight: 1.4 }}>{r.treatment || rhythmData.treatment}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}><strong>Clinical Reason:</strong> {r.reason}</p>
                                    </div>
                                </div>
                            );
                            })}
                        </div>

                        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1.2rem' }}>
                            ⚕️ Educational estimate only — always consult a licensed physician.
                        </p>

                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <button onClick={() => setStep('form')}
                                style={{ flex: 1, padding: '0.9rem', background: 'linear-gradient(135deg,#FF9A5C,#FFB87A)', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
                                New Assessment
                            </button>
                            <button onClick={() => navigate('/learning')}
                                style={{ flex: 1, padding: '0.9rem', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '30px', fontSize: '0.95rem', cursor: 'pointer' }}>
                                📚 Study
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PredictionView;
