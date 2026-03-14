import React, { useEffect, useRef } from 'react';

interface AnimatedECGProps {
    /** ECG waveform type that controls the path shape */
    rhythmId: string;
    /** Heart rate in BPM (controls speed) */
    bpm?: number;
    /** Canvas height in px */
    height?: number;
    /** Line color */
    color?: string;
}

// ------------------------------------------------------------------
// Waveform point generators for different rhythms
// Returns array of [x, y] normalized points for one beat cycle (0..1 x-range, 0..1 y-range)
// ------------------------------------------------------------------
const generateWavePoints = (rhythmId: string): [number, number][] => {
    // Base PQRST complex
    const baseline: [number, number][] = [
        [0.00, 0.5], [0.08, 0.5],
        // P wave (small bump)
        [0.10, 0.42], [0.14, 0.38], [0.18, 0.42],
        [0.22, 0.5],
        // PR segment
        [0.28, 0.5],
        // QRS complex
        [0.30, 0.55], [0.32, 0.20], [0.34, 0.90], [0.36, 0.5],
        // ST segment
        [0.44, 0.5],
        // T wave
        [0.50, 0.38], [0.56, 0.5],
        [1.0, 0.5]
    ];

    const bradycardia: [number, number][] = [
        [0.00, 0.5], [0.12, 0.5],
        [0.14, 0.43], [0.18, 0.38], [0.22, 0.43],
        [0.28, 0.5], [0.36, 0.5],
        [0.38, 0.56], [0.40, 0.15], [0.42, 0.92], [0.44, 0.5],
        [0.56, 0.5], [0.62, 0.36], [0.68, 0.5],
        [1.0, 0.5]
    ];

    const tachycardia: [number, number][] = [
        [0.00, 0.5],
        [0.04, 0.44], [0.07, 0.40], [0.10, 0.44],
        [0.14, 0.5],
        [0.16, 0.55], [0.18, 0.18], [0.20, 0.93], [0.22, 0.5],
        [0.28, 0.5], [0.32, 0.39], [0.36, 0.5],
        [1.0, 0.5]
    ];

    const afib: [number, number][] = [
        [0.00, 0.5],
        [0.05, 0.48], [0.10, 0.52], [0.15, 0.47],
        [0.18, 0.53], [0.22, 0.49],
        // No P wave - irregular baseline
        [0.28, 0.5],
        [0.30, 0.56], [0.32, 0.18], [0.34, 0.92], [0.36, 0.5],
        [0.48, 0.47], [0.55, 0.53], [0.62, 0.49], [0.70, 0.51],
        [1.0, 0.5]
    ];

    const aflutter: [number, number][] = [
        // Sawtooth flutter waves
        [0.00, 0.5], [0.05, 0.38], [0.10, 0.5],
        [0.15, 0.38], [0.20, 0.5],
        [0.25, 0.38], [0.28, 0.5],
        // QRS
        [0.30, 0.55], [0.32, 0.18], [0.34, 0.92], [0.36, 0.5],
        [0.38, 0.38], [0.46, 0.5], [0.50, 0.38], [0.56, 0.5],
        [1.0, 0.5]
    ];

    const vtach: [number, number][] = [
        // Wide bizarre QRS complexes, no discernible P
        [0.00, 0.5],
        [0.05, 0.55], [0.12, 0.15], [0.18, 0.92], [0.25, 0.55], [0.30, 0.5],
        [0.35, 0.55], [0.42, 0.15], [0.48, 0.92], [0.55, 0.55], [0.60, 0.5],
        [0.65, 0.55], [0.72, 0.15], [0.78, 0.92], [0.85, 0.55],
        [1.0, 0.5]
    ];

    const vfib: [number, number][] = Array.from({ length: 40 }, (_, i) => {
        const x = i / 39;
        const y = 0.5 + (Math.sin(x * 30) * 0.3 + Math.sin(x * 47) * 0.15) * Math.random();
        return [x, y];
    });

    const avblock3: [number, number][] = [
        [0.00, 0.5],
        // P waves independent (3 P for 1 QRS shown)
        [0.05, 0.44], [0.08, 0.40], [0.11, 0.44], [0.15, 0.5],
        [0.25, 0.44], [0.28, 0.40], [0.31, 0.44], [0.35, 0.5],
        // Ventricular escape beat
        [0.45, 0.56], [0.52, 0.12], [0.58, 0.95], [0.63, 0.5],
        [0.70, 0.44], [0.73, 0.40], [0.76, 0.44],
        [1.0, 0.5]
    ];

    const paced: [number, number][] = [
        [0.00, 0.5],
        // Pacemaker spike
        [0.20, 0.5], [0.205, 0.1], [0.21, 0.5],
        // Broad QRS after spike
        [0.22, 0.54], [0.26, 0.18], [0.30, 0.88], [0.35, 0.5],
        // T wave
        [0.44, 0.40], [0.50, 0.5],
        [1.0, 0.5]
    ];

    const avblock1: [number, number][] = [
        [0.00, 0.5], [0.06, 0.5],
        // Long PR - P wave early
        [0.07, 0.43], [0.10, 0.39], [0.14, 0.43],
        // Very long PR segment
        [0.36, 0.5],
        [0.38, 0.55], [0.40, 0.18], [0.42, 0.91], [0.44, 0.5],
        [0.56, 0.5], [0.62, 0.38], [0.68, 0.5],
        [1.0, 0.5]
    ];

    const map: Record<string, [number, number][]> = {
        sinus_rhythm: baseline,
        sinus_bradycardia: bradycardia,
        sinus_tachycardia: tachycardia,
        sinus_arrhythmia: baseline,
        sinus_exit_block: baseline,
        sinus_arrest: [
            [0.00, 0.5], [0.06, 0.44], [0.10, 0.40], [0.14, 0.44], [0.22, 0.5],
            [0.26, 0.55], [0.28, 0.18], [0.30, 0.93], [0.32, 0.5],
            // Long pause (no beat)
            [1.0, 0.5]
        ],
        nsr_pac: [
            ...baseline.slice(0, -1), 
            [0.70, 0.5], [0.72, 0.40], [0.76, 0.36], [0.80, 0.40], [0.84, 0.5],
            [0.86, 0.56], [0.88, 0.20], [0.90, 0.91], [0.92, 0.5],
            [1.0, 0.5]
        ],
        svt: tachycardia,
        atrial_fibrillation: afib,
        atrial_flutter: aflutter,
        paced_atrial: paced,
        nsr_1st_avb: avblock1,
        '2nd_avb_type1': [
            [0.00, 0.5], [0.06, 0.44], [0.10, 0.40], [0.14, 0.44], [0.22, 0.5],
            [0.24, 0.56], [0.26, 0.18], [0.28, 0.93], [0.30, 0.5],
            // 2nd beat longer PR
            [0.38, 0.44], [0.42, 0.40], [0.46, 0.44],
            [0.58, 0.5], [0.60, 0.56], [0.62, 0.18], [0.64, 0.93], [0.66, 0.5],
            // P without QRS (block)
            [0.80, 0.44], [0.84, 0.40], [0.88, 0.44],
            [1.0, 0.5]
        ],
        '2nd_avb_type2': [
            [0.00, 0.5],
            [0.05, 0.44], [0.09, 0.40], [0.13, 0.44], [0.22, 0.5],
            [0.24, 0.56], [0.26, 0.18], [0.28, 0.93], [0.30, 0.5],
            [0.40, 0.44], [0.44, 0.40], [0.48, 0.44],
            // P not conducted
            [0.60, 0.44], [0.64, 0.40], [0.68, 0.44], [0.80, 0.5],
            [0.82, 0.56], [0.84, 0.18], [0.86, 0.93], [0.88, 0.5],
            [1.0, 0.5]
        ],
        '2nd_avb_2_1': [
            [0.00, 0.5],
            [0.05, 0.44], [0.08, 0.40], [0.11, 0.44], [0.22, 0.5],
            [0.24, 0.56], [0.26, 0.18], [0.28, 0.93], [0.30, 0.5],
            // P not conducted
            [0.50, 0.44], [0.53, 0.40], [0.56, 0.44],
            [0.70, 0.5],
            [0.75, 0.44], [0.78, 0.40], [0.81, 0.44], [0.92, 0.5],
            [0.94, 0.56], [0.96, 0.18], [0.98, 0.93],
            [1.0, 0.5]
        ],
        '3rd_av_block': avblock3,
        nsr_pjc: baseline,
        junctional_rhythm: [
            [0.00, 0.5], [0.14, 0.5],
            // No P wave, narrow QRS
            [0.16, 0.56], [0.18, 0.22], [0.20, 0.90], [0.22, 0.5],
            [0.36, 0.5], [0.42, 0.38], [0.48, 0.5],
            [1.0, 0.5]
        ],
        accel_junctional: baseline,
        junctional_tachy: tachycardia,
        wandering_pacemaker: [
            [0.00, 0.5], [0.06, 0.43], [0.10, 0.39], [0.14, 0.43], [0.22, 0.5],
            [0.24, 0.56], [0.26, 0.18], [0.28, 0.93], [0.30, 0.5],
            [0.40, 0.46], [0.44, 0.36], [0.48, 0.46], [0.56, 0.5],
            [0.58, 0.56], [0.60, 0.20], [0.62, 0.91], [0.64, 0.5],
            [1.0, 0.5]
        ],
        nsr_pvc: [
            ...baseline.slice(0, 10),
            // PVC - wide bizarre beat
            [0.55, 0.56], [0.62, 0.10], [0.68, 0.95], [0.72, 0.5],
            // Compensatory pause
            [1.0, 0.5]
        ],
        idioventricular: [
            [0.00, 0.5], [0.18, 0.5],
            [0.20, 0.56], [0.28, 0.12], [0.36, 0.94], [0.44, 0.5],
            [0.76, 0.5],
            [0.78, 0.56], [0.86, 0.12], [0.94, 0.94],
            [1.0, 0.5]
        ],
        accelerated_ivr: [
            [0.00, 0.5], [0.08, 0.5],
            [0.10, 0.56], [0.18, 0.12], [0.24, 0.94], [0.30, 0.5],
            [0.54, 0.5], [0.56, 0.56], [0.60, 0.12], [0.66, 0.94], [0.72, 0.5],
            [1.0, 0.5]
        ],
        vtach: vtach,
        vfib: vfib,
        paced_ventricular: paced,
    };

    return map[rhythmId] ?? baseline;
};

/**
 * AnimatedECG - Renders a real-time scrolling ECG waveform on a Canvas element.
 * Uses requestAnimationFrame to draw on a dark oscilloscope-style grid background.
 */
const AnimatedECG: React.FC<AnimatedECGProps> = ({
    rhythmId,
    bpm = 75,
    height = 120,
    color = '#FF6B00'
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const hoveredRef = useRef<boolean>(false);  // true while mouse is over canvas
    const clickPausedRef = useRef<boolean>(false); // true while click-paused

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;

        const W = canvas.width;
        const H = canvas.height;
        const TRAIL_LENGTH = W; // pixels to keep in scroll buffer
        const pixelBuffer = new Float32Array(TRAIL_LENGTH).fill(H / 2);

        const wavePoints = generateWavePoints(rhythmId);

        /**
         * Interpolate Y value from the wave definition at a given phase (0..1)
         */
        const getY = (phase: number): number => {
            const pts = wavePoints;
            // Find surrounding points
            let p0 = pts[0], p1 = pts[pts.length - 1];
            for (let i = 0; i < pts.length - 1; i++) {
                if (phase >= pts[i][0] && phase <= pts[i + 1][0]) {
                    p0 = pts[i]; p1 = pts[i + 1]; break;
                }
            }
            const t = p1[0] === p0[0] ? 0 : (phase - p0[0]) / (p1[0] - p0[0]);
            const y = p0[1] + t * (p1[1] - p0[1]);
            return y * H;
        };

        // Speed: pixels per second the waveform scrolls
        const beatDuration = 60 / bpm; // seconds per beat
        const pxPerBeat = W * 0.35; // one beat = 35% of canvas width (slower, more readable)
        const baseScrollSpeed = pxPerBeat / beatDuration; // px/s at normal speed

        let lastTime: number | null = null;
        let phaseAccum = 0; // accumulated phase in beats

        const drawGrid = () => {
            // White background for better orange contrast
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, W, H);

            // Soft orange grid lines
            ctx.strokeStyle = 'rgba(255, 107, 0, 0.12)';
            ctx.lineWidth = 1;
            const cellW = W / 10, cellH = H / 5;
            for (let x = 0; x <= W; x += cellW) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
            }
            for (let y = 0; y <= H; y += cellH) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
            }
        };

        const animate = (ts: number) => {
            // Apply speed modifier: hover = 15% speed, click-paused = 0%
            const speedMul = clickPausedRef.current ? 0 : (hoveredRef.current ? 0.15 : 1);
            const scrollSpeed = baseScrollSpeed * speedMul;

            const dt = lastTime === null ? 0 : (ts - lastTime) / 1000;
            lastTime = ts;

            const pxAdvance = scrollSpeed * dt;
            phaseAccum += (pxAdvance / pxPerBeat); // advance in beats

            // Scroll buffer left
            pixelBuffer.copyWithin(0, Math.ceil(pxAdvance));
            // Fill new pixels at right
            const newPixels = Math.ceil(pxAdvance);
            for (let i = W - newPixels; i < W; i++) {
                const fraction = (i - (W - newPixels)) / newPixels;
                const phase = (phaseAccum + fraction * pxAdvance / pxPerBeat) % 1;
                pixelBuffer[i] = getY(phase);
            }

            drawGrid();

            // Draw waveform from buffer
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = color;
            ctx.moveTo(0, pixelBuffer[0]);
            for (let x = 1; x < W; x++) {
                ctx.lineTo(x, pixelBuffer[x]);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Glowing dot at wave head
            const headY = pixelBuffer[W - 1];
            ctx.beginPath();
            ctx.arc(W - 1, headY, 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.shadowBlur = 14;
            ctx.shadowColor = color;
            ctx.fill();
            ctx.shadowBlur = 0;

            // BPM text overlay — top-left corner (dark text on white bg)
            ctx.font = 'bold 13px monospace';
            ctx.fillStyle = 'rgba(30, 30, 30, 0.85)';
            ctx.fillText(`${bpm} BPM`, 8, 18);
            // Small heartbeat icon next to BPM
            ctx.fillStyle = color;
            ctx.font = '11px sans-serif';
            ctx.fillText('♥', W - 20, 16);

            // Hover/pause overlay text
            if (hoveredRef.current || clickPausedRef.current) {
                ctx.fillStyle = 'rgba(255,107,0,0.18)';
                ctx.fillRect(0, 0, W, H);
                ctx.font = 'bold 11px monospace';
                ctx.fillStyle = 'rgba(180,60,0,0.9)';
                const label = clickPausedRef.current ? '⏸ PAUSED — click to resume' : '🔍 SLOW MODE';
                const tw = ctx.measureText(label).width;
                ctx.fillText(label, W / 2 - tw / 2, H / 2 + 4);
            }

            animRef.current = requestAnimationFrame(animate);
        };

        animRef.current = requestAnimationFrame(animate);

        // Hover and click handlers
        const onEnter = () => { hoveredRef.current = true; };
        const onLeave = () => { hoveredRef.current = false; };
        const onClick = () => { clickPausedRef.current = !clickPausedRef.current; hoveredRef.current = false; };
        canvas.addEventListener('mouseenter', onEnter);
        canvas.addEventListener('mouseleave', onLeave);
        canvas.addEventListener('click', onClick);

        return () => {
            cancelAnimationFrame(animRef.current);
            canvas.removeEventListener('mouseenter', onEnter);
            canvas.removeEventListener('mouseleave', onLeave);
            canvas.removeEventListener('click', onClick);
        };
    }, [rhythmId, bpm, color]);

    return (
        <canvas
            ref={canvasRef}
            width={600}
            height={height}
            style={{ width: '100%', height: `${height}px`, borderRadius: '6px', display: 'block' }}
        />
    );
};

export default AnimatedECG;
