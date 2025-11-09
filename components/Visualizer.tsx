
import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isListening: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyser, isListening }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    let animationFrameId: number;

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      
      if (!context || !isListening) {
         if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
         }
         return;
      }
      
      analyser.getFloatTimeDomainData(dataArray);

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.lineWidth = 2;
      
      const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#a855f7');
      gradient.addColorStop(0.5, '#ec4899');
      gradient.addColorStop(1, '#a855f7');
      context.strokeStyle = gradient;

      context.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] * canvas.height / 2;
        const y = canvas.height / 2 + v;

        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }

        x += sliceWidth;
      }

      context.lineTo(canvas.width, canvas.height / 2);
      context.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, isListening]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};
