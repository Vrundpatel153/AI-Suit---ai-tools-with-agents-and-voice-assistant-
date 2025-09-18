import React, { useEffect, useRef } from 'react';
import { isSpeaking } from '../utils/speechHelpers';

interface VoiceWaveProps {
  active: boolean; // speaking
  listening?: boolean; // listening state to show subdued animation
  height?: number;
  bars?: number;
}

// Simple animated voice visualization (CSS-driven) that pulses bars while TTS speaking
const VoiceWave: React.FC<VoiceWaveProps> = ({ active, listening = false, height = 40, bars = 14 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Could add future dynamic amplitude mapping if Web Audio API used
  }, [active]);

  return (
    <div ref={containerRef} className="voice-visualizer-wrapper">
      <div
        className={`flex items-end justify-center space-x-1 transition-all duration-300 ${
          active ? 'opacity-100 scale-100' : listening ? 'opacity-70' : 'opacity-25'
        }`}
        style={{ height }}
        aria-hidden={!active && !listening}
      >
      {Array.from({ length: bars }).map((_, i) => {
        const delay = (i * 0.08).toFixed(2);
        return (
          <span
            key={i}
            className={`inline-block voice-bar ${active || listening ? 'animate-voice-wave' : ''}`}
            style={{ animationDelay: `${delay}s`, animationDuration: '1.4s' }}
          />
        );
      })}
      </div>
    </div>
  );
};

export default VoiceWave;
