'use client';

import React, { useState } from 'react';

export default function HuntTutorial({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: 'Your First Hunt',
      body: 'You need to catch 3 mysid shrimp to survive.\n\nYou have 8 energy — each strike attempt costs 1, so make them count!',
      visual: (
        <div className="flex items-center gap-3 justify-center my-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(240,160,176,0.15)', border: '1px solid rgba(240,160,176,0.3)' }}>
            <div style={{ width: 18, height: 8, backgroundColor: '#f0a0b0', borderRadius: 3 }} />
            <span className="font-pixel text-[8px] text-pink-300">Mysid Shrimp</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Know Your Prey',
      body: 'The water is full of tiny creatures, but only mysid shrimp are your food.\n\nStriking the wrong species wastes energy!',
      visual: (
        <div className="flex flex-col gap-2 my-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(240,160,176,0.15)', border: '1px solid rgba(240,160,176,0.3)' }}>
            <div style={{ width: 18, height: 8, backgroundColor: '#f0a0b0', borderRadius: 3 }} />
            <span className="font-pixel text-[8px] text-pink-300">Mysid — CATCH</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 8, height: 8, backgroundColor: '#90d0f0', borderRadius: '50%' }} />
            <span className="font-pixel text-[8px] text-text-muted">Copepod — AVOID (too small)</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 14, height: 10, backgroundColor: '#c0a060', borderRadius: '40%' }} />
            <span className="font-pixel text-[8px] text-text-muted">Amphipod — AVOID (too fast)</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Danger!',
      body: "Predators will hunt you down — and they won't leave until you hide!\n\nSwim to kelp forests or rock crevices to take cover. Once you're hidden, the predator retreats. If it catches you first, you lose energy and get stunned.",
      visual: (
        <div className="flex flex-col gap-2 my-3">
          <div className="flex items-center gap-3 justify-center">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(239,83,80,0.12)', border: '1px solid rgba(239,83,80,0.3)' }}>
              <div style={{ width: 20, height: 12, backgroundColor: '#ef5350', borderRadius: '40% 60% 60% 40%', opacity: 0.8 }} />
              <span className="font-pixel text-[8px] text-red-300">Wrasse</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(239,83,80,0.12)', border: '1px solid rgba(239,83,80,0.3)' }}>
              <div style={{ width: 14, height: 12, backgroundColor: '#ef5350', borderRadius: '30%', opacity: 0.8 }} />
              <span className="font-pixel text-[8px] text-red-300">Crab</span>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-center mt-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(102,187,106,0.12)', border: '1px solid rgba(102,187,106,0.3)' }}>
              <div style={{ width: 10, height: 16, backgroundColor: '#4caf50', borderRadius: '2px 2px 0 0', opacity: 0.8 }} />
              <span className="font-pixel text-[8px] text-green-300">Kelp</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(102,187,106,0.12)', border: '1px solid rgba(102,187,106,0.3)' }}>
              <div style={{ width: 16, height: 12, backgroundColor: '#78909c', borderRadius: '40%', opacity: 0.8 }} />
              <span className="font-pixel text-[8px] text-green-300">Rock</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Controls',
      body: 'Use the joystick on the LEFT to swim.\n\nTap the RIGHT side of the screen to strike at nearby prey.',
      visual: (
        <div className="flex items-center justify-center gap-6 my-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ border: '2px dashed rgba(171,124,255,0.4)', background: 'rgba(171,124,255,0.08)' }}>
              <span className="font-pixel text-[8px] text-purple-300">MOVE</span>
            </div>
            <span className="text-[9px] text-text-muted">Left side</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ border: '2px dashed rgba(239,83,80,0.4)', background: 'rgba(239,83,80,0.08)' }}>
              <span className="font-pixel text-[8px] text-red-300">TAP</span>
            </div>
            <span className="text-[9px] text-text-muted">Right side</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Timing is Key',
      body: "Prey alternates between moving and pausing.\n\nWait for a shrimp to PAUSE before you strike — attacking while it's moving will miss!\n\nTip: approach from below for a better angle, just like real cuttlefish.",
      visual: null,
    },
  ];

  const s = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(6,4,16,0.95)', backdropFilter: 'blur(8px)' }}>
      <div className="max-w-sm w-full">
        <div className="flex justify-center gap-1.5 mb-4">
          {steps.map((_, i) => (
            <div key={i} className="h-1 rounded-full" style={{
              width: 24,
              background: i <= step ? '#ab7cff' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <h2 className="font-pixel text-sm text-purple-300 mb-3 text-center">{s.title}</h2>
        <p className="text-xs text-text-secondary whitespace-pre-line leading-relaxed text-center mb-2">
          {s.body}
        </p>
        {s.visual}

        <button
          onClick={() => {
            if (step < steps.length - 1) setStep(step + 1);
            else onDone();
          }}
          className="w-full py-3.5 rounded-xl font-pixel text-[10px] text-white mt-4 active:scale-95 transition-all"
          style={{
            background: step === steps.length - 1
              ? 'linear-gradient(135deg, #66bb6a, #4caf50)'
              : 'linear-gradient(135deg, #7c5cbf, #ab7cff)',
            border: `2px solid ${step === steps.length - 1 ? 'rgba(102,187,106,0.5)' : 'rgba(171,124,255,0.5)'}`,
          }}>
          {step === steps.length - 1 ? 'Start Hunting!' : 'Next'}
        </button>
      </div>
    </div>
  );
}
