'use client';

import React, { useState } from 'react';
import { sfxTap, sfxCorrect } from '@/lib/audio';
import { ENVS, matchScore, patternLabel, textureLabel } from './types';
import type { ChromaColor } from './types';
import { CuttlefishBody } from './CuttlefishBody';
import { ChromaSliders, PatternSlider, TextureSlider } from './Controls';

/* ------------------------------------------------------------------ */
/*  Interactive tutorial — teaches chromatophores, pattern, texture     */
/*  one at a time before the real game starts                          */
/* ------------------------------------------------------------------ */

type TutorialStep = 'color' | 'pattern' | 'texture';

const TUTORIAL_ENV_COLOR = ENVS[0];   // Sandy Shallows
const TUTORIAL_ENV_PATTERN = ENVS[1]; // Rocky Reef — needs high pattern
const TUTORIAL_ENV_TEXTURE = ENVS[2]; // Coral Garden — needs high texture

export function CamoTutorial({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<TutorialStep>('color');
  const [color, setColor] = useState<ChromaColor>({ red: 50, yellow: 50, brown: 50 });
  const [pattern, setPattern] = useState(50);
  const [texture, setTexture] = useState(50);
  const [passed, setPassed] = useState(false);

  const env = step === 'color' ? TUTORIAL_ENV_COLOR
    : step === 'pattern' ? TUTORIAL_ENV_PATTERN
    : TUTORIAL_ENV_TEXTURE;

  // For the tutorial, use the ideal values for the components we're NOT teaching
  const state = {
    color: step === 'color' ? color : env.idealColor,
    pattern: step === 'pattern' ? pattern : env.idealPattern,
    texture: step === 'texture' ? texture : env.idealTexture,
  };

  const score = matchScore(state, env);
  const threshold = 0.7;

  const handleCheck = () => {
    if (score >= threshold) {
      sfxCorrect();
      setPassed(true);
    } else {
      sfxTap();
    }
  };

  const handleNext = () => {
    setPassed(false);
    if (step === 'color') {
      setColor(TUTORIAL_ENV_PATTERN.idealColor);
      setPattern(50);
      setTexture(50);
      setStep('pattern');
    } else if (step === 'pattern') {
      setColor(TUTORIAL_ENV_TEXTURE.idealColor);
      setPattern(TUTORIAL_ENV_TEXTURE.idealPattern);
      setTexture(50);
      setStep('texture');
    } else {
      onDone();
    }
  };

  const titles: Record<string, string> = {
    color: 'Step 1: Mix Your Chromatophores',
    pattern: 'Step 2: Body Pattern',
    texture: 'Step 3: Skin Texture',
  };

  const descriptions: Record<string, string> = {
    color: 'Your skin has 3 pigment layers — red, yellow, and brown.\n\nDrag each slider to expand or contract that pigment. Mix them together to match the environment color!',
    pattern: 'Control how your body pattern looks:\n\n  Low = Uniform (flat, even)\n  Mid = Mottled (speckled, dappled)\n  High = Disruptive (bold contrast patches)\n\nMatch the complexity of the surface!',
    texture: 'Control your skin texture:\n\n  Low = Smooth (flat skin)\n  High = Papillate (raised bumps)\n\nRough surfaces like rocks and coral need bumpy skin. Smooth sand and algae need flat skin.',
  };

  const scoreColor = score >= threshold ? '#66bb6a' : score >= 0.4 ? '#ffa726' : '#ef5350';

  return (
    <div className="fixed inset-0 z-30 flex flex-col game-viewport overflow-hidden"
      style={{ background: '#0c0a1a' }}>
      {/* Environment preview */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: env.bg }}>
          {env.elements.map((el, i) => (
            <div key={i} className="absolute" style={{
              left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`,
              background: el.c, borderRadius: el.br, transform: `rotate(${el.r}deg)`, opacity: 0.8,
            }} />
          ))}
        </div>

        {/* Env label */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <span className="font-pixel text-[9px] text-text-secondary">{env.name}</span>
        </div>

        {/* Cuttlefish */}
        <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 z-10">
          <CuttlefishBody
            color={state.color}
            pattern={state.pattern}
            texture={state.texture}
            result={passed ? 'safe' : null}
          />
        </div>

        {/* Match bar */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[8px] text-text-muted">MATCH</span>
            <div className="w-28 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{
                width: `${score * 100}%`, background: scoreColor,
              }} />
            </div>
            <span className="font-pixel text-[10px]" style={{ color: scoreColor }}>
              {Math.round(score * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Tutorial panel */}
      <div className="shrink-0 relative z-20" style={{
        background: 'rgba(12,10,26,0.97)',
        borderTop: '1px solid rgba(171,124,255,0.2)',
        padding: '10px 16px 16px',
        maxHeight: '55%',
        overflowY: 'auto',
      }}>
        <h3 className="font-pixel text-[11px] text-purple-300 mb-2">{titles[step]}</h3>
        <p className="text-xs text-text-secondary mb-3 whitespace-pre-line leading-relaxed">
          {descriptions[step]}
        </p>

        {/* Controls based on step */}
        {step === 'color' && (
          <ChromaSliders color={color} onChange={setColor} />
        )}
        {step === 'pattern' && (
          <PatternSlider value={pattern} onChange={setPattern} />
        )}
        {step === 'texture' && (
          <TextureSlider value={texture} onChange={setTexture} />
        )}

        {/* Hint */}
        <p className="text-[10px] text-text-muted mb-3 italic">
          {step === 'color' ? 'Hint: ' + env.patternHint
            : step === 'pattern' ? env.patternHint
            : env.textureHint}
        </p>

        {/* Check / Next */}
        {!passed ? (
          <button onClick={handleCheck}
            className="w-full py-3.5 rounded-xl font-pixel text-[10px] active:scale-95 transition-all"
            style={{
              background: score >= threshold
                ? 'linear-gradient(135deg, #66bb6a, #4caf50)'
                : 'linear-gradient(135deg, #7c5cbf, #ab7cff)',
              border: `2px solid ${score >= threshold ? 'rgba(102,187,106,0.5)' : 'rgba(171,124,255,0.5)'}`,
              color: 'white',
            }}>
            {score >= threshold ? 'Looks great! Tap to confirm' : 'Check Match'}
          </button>
        ) : (
          <div>
            <div className="text-center mb-2">
              <span className="font-pixel text-[11px] text-green-400">Perfect camouflage!</span>
            </div>
            <button onClick={handleNext}
              className="w-full py-3.5 rounded-xl font-pixel text-[10px] active:scale-95 transition-all"
              style={{
                background: 'linear-gradient(135deg, #66bb6a, #4caf50)',
                border: '2px solid rgba(102,187,106,0.5)',
                color: 'white',
              }}>
              {step === 'texture' ? 'Start the Real Challenge!' : 'Next Step'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
