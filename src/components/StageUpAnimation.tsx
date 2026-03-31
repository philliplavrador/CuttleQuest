'use client';

import React, { useEffect, useState } from 'react';
import { sfxStageUp } from '@/lib/audio';

interface StageUpAnimationProps {
  fromStage: string;
  toStage: string;
  onComplete: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  egg: 'Egg',
  hatchling: 'Hatchling',
  juvenile: 'Juvenile',
  adult: 'Adult',
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  'egg-hatchling': 'Your shell cracks... You emerge into the vast ocean.',
  'hatchling-juvenile': 'Your body grows stronger. Chromatophores bloom across your skin.',
  'juvenile-adult': 'Full iridescence awakens. You are ready to continue the cycle.',
};

export default function StageUpAnimation({ fromStage, toStage, onComplete }: StageUpAnimationProps) {
  const [phase, setPhase] = useState<'intro' | 'transform' | 'reveal'>('intro');

  useEffect(() => {
    sfxStageUp();
    const t1 = setTimeout(() => setPhase('transform'), 2000);
    const t2 = setTimeout(() => setPhase('reveal'), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const key = `${fromStage}-${toStage}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-bg-dark flex flex-col items-center justify-center px-6 cursor-pointer"
      onClick={() => phase === 'reveal' && onComplete()}
    >
      {phase === 'intro' && (
        <div style={{ animation: 'fadeIn 1s ease-out' }}>
          <p className="font-pixel text-[10px] text-text-muted text-center mb-4">Stage Complete</p>
          <h2 className="font-pixel text-lg text-text-primary text-center">{STAGE_LABELS[fromStage]}</h2>
        </div>
      )}

      {phase === 'transform' && (
        <div className="relative" style={{ animation: 'pulse 0.5s ease-in-out infinite' }}>
          {/* Transformation animation */}
          <div
            className="w-40 h-40 rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle, ${
                toStage === 'hatchling' ? '#534AB780' :
                toStage === 'juvenile' ? '#378ADD80' :
                '#EF9F2780'
              } 0%, transparent 70%)`,
              animation: 'pulse 1s ease-in-out infinite',
            }}
          >
            <span className="text-6xl" style={{ animation: 'shake 0.3s infinite' }}>
              {fromStage === 'egg' ? '🥚' : fromStage === 'hatchling' ? '🦑' : '🐙'}
            </span>
          </div>
          {/* Particle burst */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: toStage === 'hatchling' ? '#534AB7' :
                  toStage === 'juvenile' ? '#378ADD' : '#EF9F27',
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 30}deg) translateY(-60px)`,
                animation: `fadeIn 0.5s ease-out ${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {phase === 'reveal' && (
        <div className="text-center" style={{ animation: 'fadeIn 1s ease-out' }}>
          <h1
            className="font-pixel text-xl mb-4"
            style={{
              color: toStage === 'hatchling' ? '#534AB7' :
                toStage === 'juvenile' ? '#378ADD' : '#EF9F27',
            }}
          >
            {STAGE_LABELS[toStage]}
          </h1>
          <p className="text-text-secondary text-sm mb-8 max-w-xs mx-auto">
            {STAGE_DESCRIPTIONS[key] || 'A new chapter begins.'}
          </p>
          <p className="font-pixel text-[8px] text-text-muted">Tap to continue</p>
        </div>
      )}
    </div>
  );
}
