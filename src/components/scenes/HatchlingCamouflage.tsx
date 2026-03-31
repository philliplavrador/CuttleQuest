'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CreatureSprite } from '@/components/sprites';
import {
  ENVS, matchScore,
  GAME_DURATION, SHIFT_INTERVAL, SCAN_INTERVAL, SCAN_DURATION,
  DETECTION_THRESHOLD, MAX_DETECTIONS,
} from './hatchlingCamo/types';
import type { Props, ChromaColor, CamoState } from './hatchlingCamo/types';
import { CuttlefishBody } from './hatchlingCamo/CuttlefishBody';
import { ChromaSliders, PatternSlider, TextureSlider } from './hatchlingCamo/Controls';
import { CamoTutorial } from './hatchlingCamo/Tutorial';

export default function HatchlingCamouflage({ onComplete, onFail, attemptNumber }: Props) {
  const [showTutorial, setShowTutorial] = useState(attemptNumber === 1);

  if (showTutorial) {
    return <CamoTutorial onDone={() => setShowTutorial(false)} />;
  }

  return <CamoGame onComplete={onComplete} onFail={onFail} />;
}

/* ------------------------------------------------------------------ */
/*  Main game                                                          */
/* ------------------------------------------------------------------ */

function CamoGame({ onComplete, onFail }: {
  onComplete: Props['onComplete'];
  onFail: Props['onFail'];
}) {
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [envIndex, setEnvIndex] = useState(0);
  const [nextEnvIndex, setNextEnvIndex] = useState(-1);
  const [transitionPct, setTransitionPct] = useState(0);
  const [color, setColor] = useState<ChromaColor>({ red: 50, yellow: 50, brown: 50 });
  const [pattern, setPattern] = useState(50);
  const [texture, setTexture] = useState(50);
  const [detections, setDetections] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [predatorX, setPredatorX] = useState(-100);
  const [lastResult, setLastResult] = useState<'safe' | 'detected' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [matchSamples, setMatchSamples] = useState<number[]>([]);

  const detectionsRef = useRef(0);
  const gameOverRef = useRef(false);
  const envRef = useRef(envIndex);
  const stateRef = useRef<CamoState>({ color, pattern, texture });

  useEffect(() => { detectionsRef.current = detections; }, [detections]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { envRef.current = envIndex; }, [envIndex]);
  useEffect(() => { stateRef.current = { color, pattern, texture }; }, [color, pattern, texture]);

  const currentEnv = ENVS[envIndex];
  const score = matchScore({ color, pattern, texture }, currentEnv);

  // --- Countdown ---
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameOver]);

  // --- Win at 0 ---
  useEffect(() => {
    if (timeLeft === 0 && !gameOver) {
      setGameOver(true);
      const avg = matchSamples.length > 0
        ? matchSamples.reduce((a, b) => a + b, 0) / matchSamples.length : 0;
      const d = detectionsRef.current;
      let stars = 1;
      if (d <= 1 && avg >= 0.6) stars = 2;
      if (d === 0 && avg >= 0.7) stars = 3;
      if (d === 0 && avg >= 0.8) stars = 4;
      if (d === 0 && avg >= 0.9) stars = 5;
      onComplete(stars, [
        { label: 'Detections', value: `${d}` },
        { label: 'Avg match', value: `${Math.round(avg * 100)}%` },
        { label: 'Env changes', value: `${matchSamples.length}` },
      ]);
    }
  }, [timeLeft, gameOver, matchSamples, onComplete]);

  // --- Environment shift ---
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      if (gameOverRef.current) return;
      const current = envRef.current;
      let next: number;
      do { next = Math.floor(Math.random() * ENVS.length); } while (next === current);
      setNextEnvIndex(next);
      setTransitionPct(0);
      let start = 0;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1500, 1);
        setTransitionPct(p);
        if (p < 1) requestAnimationFrame(step);
        else {
          setEnvIndex(next);
          setNextEnvIndex(-1);
          setTransitionPct(0);
          const s = matchScore(stateRef.current, ENVS[next]);
          setMatchSamples(prev => [...prev, s]);
        }
      };
      requestAnimationFrame(step);
    }, SHIFT_INTERVAL);
    return () => clearInterval(t);
  }, [gameOver]);

  // --- Predator scans ---
  useEffect(() => {
    if (gameOver) return;
    const startScan = () => {
      if (gameOverRef.current) return;
      setScanning(true);
      setPredatorX(-100);
      setLastResult(null);
      let start = 0;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / SCAN_DURATION, 1);
        setPredatorX(-100 + p * 550);
        if (p < 1 && !gameOverRef.current) {
          requestAnimationFrame(step);
        } else {
          const s = matchScore(stateRef.current, ENVS[envRef.current]);
          const detected = s < DETECTION_THRESHOLD;
          setLastResult(detected ? 'detected' : 'safe');
          setMatchSamples(prev => [...prev, s]);
          if (detected) {
            const newD = detectionsRef.current + 1;
            setDetections(newD);
            if (newD >= MAX_DETECTIONS) {
              setGameOver(true);
              setTimeout(() => {
                onFail(
                  'Detected too many times!',
                  'Cuttlefish survive by matching color, pattern, AND texture to their surroundings — all 5 sliders matter!'
                );
              }, 1000);
            }
          }
          setTimeout(() => { setScanning(false); setLastResult(null); }, 1200);
        }
      };
      requestAnimationFrame(step);
    };
    const initialDelay = setTimeout(startScan, 3500);
    const interval = setInterval(startScan, SCAN_INTERVAL + SCAN_DURATION + 1200);
    return () => { clearTimeout(initialDelay); clearInterval(interval); };
  }, [gameOver, onFail]);

  if (gameOver) return null;

  const scoreColor = score >= 0.8 ? '#66bb6a' : score >= 0.5 ? '#ffa726' : '#ef5350';

  return (
    <div className="fixed inset-0 z-30 flex flex-col game-viewport overflow-hidden"
      style={{ background: '#0c0a1a' }}>

      {/* Top HUD */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0 relative z-20"
        style={{ paddingLeft: 56, background: 'rgba(12,10,26,0.9)', borderBottom: '1px solid rgba(171,124,255,0.15)' }}>
        <div className="font-pixel text-[10px]" style={{ color: timeLeft <= 10 ? '#ef5350' : '#d0c4f0' }}>
          {timeLeft}s
        </div>
        <div className="flex-1 flex items-center gap-1.5 justify-center">
          <span className="font-pixel text-[8px] text-text-muted">MATCH</span>
          <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${score * 100}%`, background: scoreColor }} />
          </div>
          <span className="font-pixel text-[9px]" style={{ color: scoreColor }}>{Math.round(score * 100)}%</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: MAX_DETECTIONS }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full" style={{
              background: i < detections ? '#ef5350' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${i < detections ? '#ef5350' : 'rgba(255,255,255,0.15)'}`,
            }} />
          ))}
        </div>
      </div>

      {/* Arena */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: currentEnv.bg,
          opacity: nextEnvIndex >= 0 ? 1 - transitionPct : 1,
        }}>
          {currentEnv.elements.map((el, i) => (
            <div key={i} className="absolute" style={{
              left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`,
              background: el.c, borderRadius: el.br, transform: `rotate(${el.r}deg)`, opacity: 0.8,
            }} />
          ))}
        </div>

        {nextEnvIndex >= 0 && (
          <div className="absolute inset-0" style={{ background: ENVS[nextEnvIndex].bg, opacity: transitionPct }}>
            {ENVS[nextEnvIndex].elements.map((el, i) => (
              <div key={i} className="absolute" style={{
                left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%`,
                background: el.c, borderRadius: el.br, transform: `rotate(${el.r}deg)`, opacity: 0.8,
              }} />
            ))}
          </div>
        )}

        {/* Env label */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <span className="font-pixel text-[9px] text-text-secondary">
            {nextEnvIndex >= 0 ? ENVS[nextEnvIndex].name : currentEnv.name}
          </span>
        </div>

        {/* Cuttlefish */}
        <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 z-10">
          <CuttlefishBody color={color} pattern={pattern} texture={texture} result={lastResult} />
        </div>

        {/* Predator */}
        {scanning && (
          <div className="absolute z-15" style={{ left: predatorX, top: '15%', width: 80 }}>
            <CreatureSprite creature="shark_blue" size={80} />
          </div>
        )}

        {/* Detection flash */}
        {lastResult === 'detected' && (
          <div className="absolute inset-0 z-20 pointer-events-none"
            style={{ background: 'rgba(239,83,80,0.25)', animation: 'fadeIn 0.15s' }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="font-pixel text-base" style={{ color: '#ef5350', animation: 'slam 0.4s ease-out' }}>
                SPOTTED!
              </span>
            </div>
          </div>
        )}
        {lastResult === 'safe' && (
          <div className="absolute inset-0 z-20 pointer-events-none"
            style={{ background: 'rgba(102,187,106,0.1)', animation: 'fadeIn 0.15s' }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="font-pixel text-xs" style={{ color: '#66bb6a' }}>HIDDEN</span>
            </div>
          </div>
        )}
      </div>

      {/* All 5 sliders */}
      <div className="shrink-0 relative z-20" style={{
        background: 'rgba(12,10,26,0.95)',
        borderTop: '1px solid rgba(171,124,255,0.15)',
        padding: '8px 12px 12px',
      }}>
        <ChromaSliders color={color} onChange={setColor} />
        <PatternSlider value={pattern} onChange={setPattern} />
        <TextureSlider value={texture} onChange={setTexture} />
      </div>
    </div>
  );
}
