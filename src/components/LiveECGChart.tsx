import React, { useEffect, useRef, useState } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

// Variables globales para la optimización de uPlot (Evitar re-renderizados de React)
const MAX_DATA_POINTS = 1000; // Mostrar 4 segundos a 250Hz aprox
let dataX: number[] = [];
let dataY: number[] = [];

// Hook personalizado para mantener limpio el componente UI
const useECGStream = (plotRef: React.MutableRefObject<uPlot | null>) => {
  const [bpm, setBpm] = useState<number>(0);
  const [aiStatus, setAiStatus] = useState<{status: string, conf: number} | null>(null);

  useEffect(() => {
    // 1. Inicializar Arreglos Base
    dataX = Array.from({ length: MAX_DATA_POINTS }, (_, i) => i);
    dataY = Array(MAX_DATA_POINTS).fill(0);

    // 2. Conectar al Backend en Python (Simulador AI)
    const ws = new WebSocket('ws://localhost:8000/ws/ecg');

    ws.onopen = () => {
      console.log('🔗 Conectado al Cerebro ECG (Python)');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'ecg_stream') {
          // Extraer nueva data
          const newEcgData: number[] = message.data;
          
          // Efecto ventana deslizante (Shift array)
          dataY.splice(0, newEcgData.length);
          dataY.push(...newEcgData);

          // Actualizar uPlot directamente (Bypass React State p/ Performance)
          if (plotRef.current) {
            // uPlot requiere un formato de array de arrays: [ [x], [y] ]
            plotRef.current.setData([dataX, dataY]);
          }

          // Actualizar estadísticas de UI (Están debounceadas o baja frecuencia)
          setBpm(message.bpm);
          if (message.ai_prediction) {
            setAiStatus({
              status: message.ai_prediction.status,
              conf: message.ai_prediction.confidence
            });
          }
        }
      } catch (e) {
        console.error("Error parseando WS de ECG", e);
      }
    };

    return () => ws.close();
  }, [plotRef]);

  return { bpm, aiStatus };
};

const LiveECGChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);
  
  // Custom Hook Inicia WS
  const { bpm, aiStatus } = useECGStream(plotRef);

  useEffect(() => {
    if (!chartRef.current) return;

    // 3. Configuración visual rica estilo "Medical Oscilloscope" con base naranja
    const opts: uPlot.Options = {
        title: "Live ECG Feed",
        id: "ecg-chart",
        width: chartRef.current.clientWidth || 800,
        height: 300,
        axes: [
            { show: false }, // Ocultar Eje X (Solo es tiempo relativo)
            { 
               stroke: "#888888", 
               grid: { stroke: "rgba(255, 107, 0, 0.1)", width: 1 } // Rejilla suave naranja
            } 
        ],
        scales: {
            x: { time: false },
            y: { min: -1.0, max: 2.0 } // Rango empírico promedio del PQRST
        },
        series: [
            {}, // X
            {
                label: "Voltage (mV)",
                stroke: "#FF6B00", // "Accent Orange" del diseño
                width: 2,
                paths: uPlot.paths.spline ? uPlot.paths.spline() : undefined // Suaviza la onda escalonada, bypass TS error
            }
        ],
        cursor: { show: false }, // Desactiva el cursor para evitar repintados al mover el mouse
    };

    // Inyectar Chart inicial (vacío) solo una vez
    plotRef.current = new uPlot(opts, [dataX, dataY], chartRef.current);

    return () => {
        if (plotRef.current) plotRef.current.destroy();
    };
  }, []);

  // Clases CSS de UI
  const alertColor = aiStatus?.status === "Stable" ? "#10B981" : "var(--error)";

  return (
    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
            <h2 style={{ fontSize: '1rem', color: 'var(--text-muted)'}}>ECG Recording</h2>
            <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: 1 }}>
                {bpm === 0 ? '--' : bpm} <span style={{ fontSize: '1.5rem', fontWeight: 'normal' }}>bmp</span>
            </div>
         </div>
         {aiStatus && (
             <div style={{ 
                background: alertColor, 
                color: 'white', 
                padding: '0.5rem 1rem', 
                borderRadius: 'var(--border-radius-round)',
                fontWeight: 'bold',
                boxShadow: 'var(--shadow-soft)'
             }}>
                IA: {aiStatus.status} ({(aiStatus.conf * 100).toFixed(0)}%)
             </div>
         )}
      </div>

      {/* Contenedor Físico del uPlot */}
      <div ref={chartRef} style={{ width: '100%', minHeight: '300px' }}></div>
    </div>
  );
};

export default LiveECGChart;
