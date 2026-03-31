'use client';

import React, { useState } from 'react';
import { sfxTap } from '@/lib/audio';

const STEPS = [
  {
    title: 'Fan Your Eggs',
    desc: 'Drag the slider to control water flow. Keep oxygen in the green zone (40-70%).',
    icon: '💨',
    accent: '#42a5f5',
  },
  {
    title: 'Control Temperature',
    desc: 'Tap the sun/shade button to move your eggs. Keep temp between 20-25 C.',
    icon: '🌡️',
    accent: '#ffa726',
  },
  {
    title: 'Defend Against Predators',
    desc: 'Wrasse: tap once! Crab: tap 3 times! Starfish: find it, then tap!',
    icon: '🛡️',
    accent: '#ef5350',
  },
  {
    title: 'Remove Infections',
    desc: 'Tap glowing yellow eggs to remove them before the infection spreads.',
    icon: '🧹',
    accent: '#66bb6a',
  },
];

export function Tutorial({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    sfxTap();
    if (isLast) {
      onDone();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(6,8,18,0.92)', backdropFilter: 'blur(8px)' }}
    >
      <div className="max-w-sm w-full">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{
              background: `${current.accent}20`,
              border: `2px solid ${current.accent}50`,
              boxShadow: `0 0 30px ${current.accent}20`,
            }}
          >
            {current.icon}
          </div>
        </div>

        {/* Title */}
        <h2 className="font-pixel text-sm text-center mb-3" style={{ color: current.accent }}>
          {current.title}
        </h2>

        {/* Description */}
        <p className="text-text-secondary text-sm text-center leading-relaxed mb-8">
          {current.desc}
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? '24px' : '8px',
                height: '8px',
                background: i === step ? current.accent : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={next}
          className="w-full py-3.5 rounded-xl font-pixel text-[10px] text-white transition-all active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${current.accent}, ${current.accent}bb)`,
            border: `2px solid ${current.accent}`,
            boxShadow: `0 4px 20px ${current.accent}40`,
          }}
        >
          {isLast ? 'Start!' : 'Next'}
        </button>

        {/* Skip */}
        <button
          onClick={() => { sfxTap(); onDone(); }}
          className="w-full py-2 mt-2 text-text-muted text-xs hover:text-text-secondary transition-colors"
        >
          Skip tutorial
        </button>
      </div>
    </div>
  );
}
