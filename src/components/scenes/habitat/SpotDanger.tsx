'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sfxTap, sfxCorrect, sfxWrong } from '@/lib/audio';
import type { HabitatOption, DangerTarget, DangerCategory } from './types';
import HabitatArt from './HabitatArt';

/* ------------------------------------------------------------------ */
/*  Zone config — 3 tappable regions overlaid on the zoomed habitat    */
/* ------------------------------------------------------------------ */

const ZONE_STYLES: Record<DangerCategory, { top: string; left: string; width: string; height: string; label: string }> = {
  ground:      { top: '60%', left: '10%', width: '80%', height: '36%', label: 'Surface' },
  environment: { top: '10%', left: '10%', width: '80%', height: '45%', label: 'Water & Light' },
  creature:    { top: '15%', left: '5%',  width: '35%', height: '50%', label: 'Surroundings' },
};

const ALL_CATEGORIES: DangerCategory[] = ['ground', 'environment', 'creature'];

/* ------------------------------------------------------------------ */
/*  SpotDanger component                                               */
/* ------------------------------------------------------------------ */

interface SpotDangerProps {
  wrongOption: HabitatOption;
  danger: DangerTarget;
  onComplete: (firstTry: boolean) => void;
}

export default function SpotDanger({ wrongOption, danger, onComplete }: SpotDangerProps) {
  const [tappedZone, setTappedZone] = useState<DangerCategory | null>(null);
  const [found, setFound] = useState(false);
  const [hintText, setHintText] = useState('Tap what makes this spot dangerous');
  const [wrongTaps, setWrongTaps] = useState(0);
  const [autoRevealed, setAutoRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-reveal after 8 seconds
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (!found) {
        setAutoRevealed(true);
        setTappedZone(danger.category);
        setFound(true);
        setHintText(danger.label);
      }
    }, 8000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [danger, found]);

  // Auto-advance 1.8s after finding
  useEffect(() => {
    if (!found) return;
    const t = setTimeout(() => {
      onComplete(wrongTaps === 0 && !autoRevealed);
    }, 1800);
    return () => clearTimeout(t);
  }, [found, wrongTaps, autoRevealed, onComplete]);

  const handleZoneTap = useCallback((category: DangerCategory) => {
    if (found) return;
    sfxTap();
    setTappedZone(category);

    if (category === danger.category) {
      sfxCorrect();
      setFound(true);
      setHintText(danger.label);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      sfxWrong();
      setWrongTaps(prev => prev + 1);
      setHintText(danger.hint);
      // Reset shake after animation
      setTimeout(() => setTappedZone(null), 400);
    }
  }, [danger, found]);

  return (
    <div className="animate-fadeIn flex flex-col items-center gap-4 px-4 py-3">
      {/* Header */}
      <div className="text-center">
        <h3 className="font-pixel text-[10px] text-rarity-legendary mb-1"
          style={{ animation: 'gentlePulse 2s ease-in-out infinite' }}>
          SPOT THE DANGER
        </h3>
        <p className="text-text-secondary text-[11px]">
          What&apos;s wrong with <span className="text-text-primary">{wrongOption.name}</span>?
        </p>
      </div>

      {/* Zoomed habitat with tap zones */}
      <div className="relative w-full">
        <HabitatArt option={wrongOption} size="zoomed" />

        {/* Tap zone overlays */}
        {ALL_CATEGORIES.map(cat => {
          const zone = ZONE_STYLES[cat];
          const isCorrect = cat === danger.category;
          const isTapped = tappedZone === cat;
          const isFound = found && isCorrect;

          let borderColor = 'rgba(255,255,255,0.15)';
          let bgColor = 'transparent';
          if (isFound) {
            borderColor = '#ef5350';
            bgColor = 'rgba(239,83,80,0.15)';
          } else if (isTapped && !isCorrect) {
            borderColor = 'rgba(255,255,255,0.3)';
          }

          return (
            <button
              key={cat}
              onClick={() => handleZoneTap(cat)}
              disabled={found}
              className="absolute rounded-lg transition-all duration-200 touch-manipulation"
              style={{
                top: zone.top,
                left: zone.left,
                width: zone.width,
                height: zone.height,
                border: `2px dashed ${borderColor}`,
                background: bgColor,
                animation: isTapped && !isCorrect && !found ? 'shake 0.3s ease' : isFound ? 'gentlePulse 1.5s ease-in-out infinite' : undefined,
              }}
            >
              {/* Zone label (subtle) */}
              {!found && (
                <span className="absolute top-1 left-2 font-pixel text-[6px] text-white/30">
                  {zone.label}
                </span>
              )}

              {/* Danger label (shown on find) */}
              {isFound && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ animation: 'markerPop 0.4s ease-out' }}>
                  <div className="px-3 py-1.5 rounded-lg"
                    style={{
                      background: 'rgba(0,0,0,0.85)',
                      border: '1.5px solid rgba(239,83,80,0.5)',
                    }}>
                    <span className="font-pixel text-[7px] text-danger">
                      {danger.label}
                    </span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Hint text */}
      <p className="text-text-muted text-[11px] text-center italic min-h-[1.5em] transition-all">
        {hintText}
      </p>
    </div>
  );
}
