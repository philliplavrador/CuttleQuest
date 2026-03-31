'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sfxTap, sfxCorrect, sfxWrong, sfxPredatorAlert, sfxInkRelease, sfxTentacleStrike } from '@/lib/audio';
import {
  TOTAL_EGGS, TOTAL_DAYS, TICK_MS, TICKS_PER_DAY, GRID_COLS, GRID_ROWS,
  OXY_SUFFOCATE, OXY_DETACH, OXY_SWEET_LOW, OXY_SWEET_HIGH,
  PREDATOR_SCHEDULE, clamp, randomInt,
} from './eggTend/types';
import type { SceneProps, Predator, PredatorType, InfectedEgg, EggZone } from './eggTend/types';
import { Tutorial } from './eggTend/Tutorial';
import { TopBar, BottomControls } from './eggTend/Controls';
import { CreatureSprite, PredatorSprite, UnderwaterBg, AmbientFish, KENNEY_FISH } from '@/components/sprites';
import type { PredatorType as PT } from './eggTend/types';

/* ------------------------------------------------------------------ */
/*  Predator overlay — real sprites from deep-sea creatures pack       */
/* ------------------------------------------------------------------ */

const PREDATOR_SPRITE: Record<PT, string> = {
  wrasse: 'butterfly_fish',  // colorful reef fish — reads as a wrasse
  crab: 'crab',
  starfish: 'spider_crab',  // placeholder — will be replaced by PredatorSprite
};

const PREDATOR_COLOR: Record<PT, { border: string; bg: string }> = {
  wrasse: { border: '#42a5f5', bg: 'rgba(66,165,245,0.2)' },
  crab: { border: '#ef5350', bg: 'rgba(239,83,80,0.2)' },
  starfish: { border: '#ffa726', bg: 'rgba(255,183,77,0.2)' },
};

function PredatorOverlay({ predator: p, onTap }: { predator: Predator; onTap: () => void }) {
  const color = PREDATOR_COLOR[p.type];
  const opacity = p.type === 'starfish' && !p.revealed ? 0.2 : 1;

  return (
    <button
      className="absolute z-20 flex flex-col items-center justify-center active:scale-90 transition-transform"
      style={{
        left: `${p.x * 100}%`,
        top: `${(1 - p.progress) * 80 + 10}%`,
        width: '80px', height: '80px',
        transform: 'translate(-50%, -50%)',
        opacity,
        transition: 'top 200ms linear, opacity 200ms',
      }}
      onClick={onTap}
    >
      {/* Sprite with danger ring */}
      <div className="relative flex items-center justify-center"
        style={{ animation: p.revealed ? 'pulse 1s infinite' : 'none' }}>
        {p.type === 'wrasse' ? (
          <CreatureSprite creature={PREDATOR_SPRITE[p.type]} size={56} animate />
        ) : (
          <PredatorSprite creature={p.type} size={56} animate />
        )}
        {/* Progress ring */}
        <svg className="absolute -inset-1 -rotate-90 pointer-events-none" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="29" fill="none" stroke={`${color.border}20`} strokeWidth="2.5" />
          <circle cx="32" cy="32" r="29" fill="none" stroke={color.border} strokeWidth="2.5"
            strokeDasharray={`${p.progress * 182} 182`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color.border})` }} />
        </svg>
      </div>
      {/* Label */}
      <div className="mt-0.5 px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(0,0,0,0.7)', border: `1px solid ${color.border}40` }}>
        {p.type === 'crab' ? (
          <div className="flex items-center gap-1">
            <span className="font-pixel text-[6px]" style={{ color: color.border }}>TAP</span>
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full"
                style={{ background: i < (p.taps || 0) ? color.border : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        ) : p.type === 'starfish' && !p.revealed ? (
          <span className="font-pixel text-[6px] text-text-muted">find me!</span>
        ) : (
          <span className="font-pixel text-[6px]" style={{ color: color.border }}>TAP!</span>
        )}
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Water flow overlay — animated streaks that react to fan speed      */
/* ------------------------------------------------------------------ */

function WaterFlowOverlay({ fanSpeed }: { fanSpeed: number }) {
  if (fanSpeed < 8) return null;
  const bubbleCount = Math.min(Math.floor(fanSpeed / 12), 7);
  const streakCount = Math.min(Math.floor(fanSpeed / 15), 5);
  const streakSpeed = Math.max(0.6, 2 - fanSpeed * 0.015);
  const streakOpacity = Math.min(fanSpeed * 0.003, 0.2);
  const bubbles = [KENNEY_FISH.bubble_a, KENNEY_FISH.bubble_b, KENNEY_FISH.bubble_c];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {/* Water flow streaks */}
      {Array.from({ length: streakCount }).map((_, i) => (
        <div key={`s${i}`} className="absolute"
          style={{
            top: `${10 + (i * 41) % 80}%`,
            left: '-10%', width: '120%', height: '1.5px',
            background: `linear-gradient(90deg, transparent 0%, rgba(120,200,255,${streakOpacity}) 30%, rgba(120,200,255,${streakOpacity * 0.6}) 70%, transparent 100%)`,
            animation: `waterFlow ${streakSpeed}s linear infinite`,
            animationDelay: `${i * 0.15}s`,
          }} />
      ))}
      {/* Floating bubble sprites */}
      {Array.from({ length: bubbleCount }).map((_, i) => (
        <img key={`b${i}`} src={bubbles[i % 3]} alt=""
          className="absolute"
          style={{
            left: `${10 + (i * 29) % 80}%`,
            bottom: `${5 + (i * 19) % 30}%`,
            width: 10 + (i % 3) * 4,
            height: 'auto',
            opacity: 0.25 + fanSpeed * 0.003,
            animation: `floatBubble ${2.5 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
            imageRendering: 'pixelated',
          }} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Egg grid                                                           */
/* ------------------------------------------------------------------ */

// Cuttlefish eggs look like dark, ink-stained "sea grapes" — small teardrop
// clusters, dark purple-black, slightly translucent with a faint sheen.
// Each egg gets subtle variation in hue/lightness to look organic.

function CuttlefishEgg({ index, style, className }: {
  index: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  // Subtle per-egg variation so they don't look identical
  const hue = 270 + (index % 5) * 3 - 6;          // 264-276 (deep purple range)
  const sat = 30 + (index % 4) * 5;                // 30-45%
  const light = 18 + (index % 6) * 2;              // 18-28% (very dark)
  const highlightX = 30 + (index % 3) * 10;        // specular highlight offset
  const highlightY = 20 + (index % 4) * 5;

  return (
    <div className={`rounded-[48%_48%_48%_48%/42%_42%_58%_58%] ${className ?? ''}`}
      style={{
        background: `
          radial-gradient(circle at ${highlightX}% ${highlightY}%,
            hsla(${hue}, ${sat + 15}%, ${light + 18}%, 0.5) 0%,
            transparent 45%),
          radial-gradient(circle at 60% 70%,
            hsla(${hue + 5}, ${sat}%, ${light - 4}%, 0.6) 0%,
            transparent 50%),
          linear-gradient(170deg,
            hsl(${hue}, ${sat}%, ${light + 6}%) 0%,
            hsl(${hue + 3}, ${sat - 5}%, ${light}%) 50%,
            hsl(${hue - 5}, ${sat - 8}%, ${light - 5}%) 100%)`,
        boxShadow: `
          inset -1px -2px 3px rgba(0,0,0,0.3),
          inset 1px 1px 2px hsla(${hue}, ${sat}%, ${light + 25}%, 0.15),
          0 1px 2px rgba(0,0,0,0.3)`,
        ...style,
      }}
    />
  );
}

/* Precompute organic nest layout — eggs in grape-like clusters */
const NEST_LAYOUT = (() => {
  const positions: { x: number; y: number; size: number }[] = [];
  // Seed a deterministic random from index
  const seed = (i: number) => {
    const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const cx = 50, cy = 50; // center of nest (%)
  const radiusX = 42, radiusY = 44;
  // Place eggs in concentric rings with organic jitter
  let idx = 0;
  // Center cluster
  for (let ring = 0; ring < 7 && idx < TOTAL_EGGS; ring++) {
    const r = ring * 6.2;
    const count = ring === 0 ? 1 : Math.min(Math.floor(ring * 5.5), TOTAL_EGGS - idx);
    for (let j = 0; j < count && idx < TOTAL_EGGS; j++) {
      const angle = (j / count) * Math.PI * 2 + ring * 0.7;
      const jitterR = r + (seed(idx * 3) - 0.5) * 4;
      const jitterA = angle + (seed(idx * 7 + 1) - 0.5) * 0.4;
      const x = cx + Math.cos(jitterA) * jitterR * (radiusX / 42);
      const y = cy + Math.sin(jitterA) * jitterR * (radiusY / 44);
      // Eggs near edge are slightly smaller
      const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / 45;
      const size = 28 + (1 - distFromCenter) * 6 + seed(idx * 11) * 4;
      positions.push({ x, y, size });
      idx++;
    }
  }
  // Fill remaining with scattered eggs around the edges
  while (idx < TOTAL_EGGS) {
    const angle = seed(idx * 13) * Math.PI * 2;
    const r = 30 + seed(idx * 17) * 14;
    const x = cx + Math.cos(angle) * r * (radiusX / 42);
    const y = cy + Math.sin(angle) * r * (radiusY / 44);
    positions.push({ x, y, size: 24 + seed(idx * 19) * 6 });
    idx++;
  }
  return positions;
})();

function EggGrid({ eggsDead, infections, onInfectionTap, eggZone }: {
  eggsDead: Set<number>;
  infections: InfectedEgg[];
  onInfectionTap: (id: number) => void;
  eggZone: EggZone;
}) {
  return (
    <div className="relative w-full" style={{ paddingBottom: '110%' }}>
      {Array.from({ length: TOTAL_EGGS }).map((_, i) => {
        const isDead = eggsDead.has(i);
        const infection = infections.find(inf => inf.index === i);
        const pos = NEST_LAYOUT[i];
        const eggStyle: React.CSSProperties = {
          position: 'absolute',
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          width: pos.size,
          height: pos.size * 1.35,
          transform: 'translate(-50%, -50%)',
        };

        if (isDead) {
          return <CuttlefishEgg key={i} index={i}
            style={{ ...eggStyle, opacity: 0.06, filter: 'grayscale(1)' }} />;
        }

        if (infection) {
          const urgency = Math.min(infection.age / 60, 1);
          return (
            <button key={i}
              onClick={() => onInfectionTap(infection.id)}
              className="relative transition-all active:scale-75"
              style={{ ...eggStyle, animation: 'pulse 0.8s infinite' }}>
              <CuttlefishEgg index={i}
                style={{
                  width: '100%', height: '100%',
                  filter: `hue-rotate(${40 + urgency * 30}deg) brightness(${1.2 + urgency * 0.5})`,
                  boxShadow: `0 0 ${6 + urgency * 6}px rgba(255,200,0,${0.3 + urgency * 0.3})`,
                }} />
              <span className="absolute inset-0 flex items-center justify-center text-[8px]">
                {urgency > 0.5 ? '⚠️' : '✨'}
              </span>
            </button>
          );
        }

        return <CuttlefishEgg key={i} index={i} style={eggStyle} />;
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Event toast                                                        */
/* ------------------------------------------------------------------ */

function EventToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl pointer-events-none"
      style={{
        background: 'rgba(0,0,0,0.8)',
        border: '1.5px solid rgba(239,83,80,0.4)',
        animation: 'fadeIn 0.2s ease-out',
      }}>
      <span className="font-pixel text-[8px] text-danger whitespace-nowrap">{message}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function EggTend({ onComplete, onFail, attemptNumber }: SceneProps) {
  const [showTutorial, setShowTutorial] = useState(attemptNumber === 1);
  const [day, setDay] = useState(1);
  const [tickInDay, setTickInDay] = useState(0);
  const [eggsAlive, setEggsAlive] = useState(TOTAL_EGGS);
  const [eggsDead, setEggsDead] = useState<Set<number>>(new Set());
  const [oxygenation, setOxygenation] = useState(55);
  const [temperature, setTemperature] = useState(22);
  const [eggZone, setEggZone] = useState<EggZone>('shaded');
  const [predators, setPredators] = useState<Predator[]>([]);
  const [infections, setInfections] = useState<InfectedEgg[]>([]);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [fanSpeed, setFanSpeed] = useState(55);
  const lastFanTouch = useRef(Date.now());
  const [predatorAlert, setPredatorAlert] = useState<string | null>(null);

  const stateRef = useRef({
    day, tickInDay, eggsAlive, eggsDead, oxygenation, temperature,
    eggZone, predators, infections, paused, gameOver, fanSpeed,
  });
  stateRef.current = {
    day, tickInDay, eggsAlive, eggsDead, oxygenation, temperature,
    eggZone, predators, infections, paused, gameOver, fanSpeed,
  };

  const predatorIdCounter = useRef(0);
  const infectionIdCounter = useRef(0);

  /* ---- Handlers ---- */
  const toggleZone = useCallback(() => {
    setEggZone(prev => prev === 'sunny' ? 'shaded' : 'sunny');
  }, []);

  const handlePredatorTap = useCallback((predatorId: number) => {
    setPredators(prev => prev.map(p => {
      if (p.id !== predatorId || !p.active) return p;
      if (p.type === 'wrasse') { sfxInkRelease(); return { ...p, active: false }; }
      if (p.type === 'crab') {
        const newTaps = (p.taps || 0) + 1;
        sfxTap();
        if (newTaps >= 3) { sfxTentacleStrike(); return { ...p, active: false, taps: 3 }; }
        return { ...p, taps: newTaps };
      }
      if (p.type === 'starfish') {
        if (!p.revealed) { sfxTap(); return { ...p, revealed: true }; }
        sfxTentacleStrike(); return { ...p, active: false };
      }
      return p;
    }));
  }, []);

  const handleInfectionTap = useCallback((infId: number) => {
    sfxTap();
    setInfections(prev => {
      const removed = prev.find(inf => inf.id === infId);
      if (!removed) return prev;
      setEggsDead(d => { const n = new Set(d); n.add(removed.index); return n; });
      setEggsAlive(a => Math.max(0, a - 1));
      return prev.filter(inf => inf.id !== infId);
    });
  }, []);

  /* ---- Game loop ---- */
  useEffect(() => {
    if (gameOver || paused || showTutorial) return;

    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.paused || s.gameOver) return;

      let newTickInDay = s.tickInDay + 1;
      let newDay = s.day;
      let newOxy = s.oxygenation;
      let newTemp = s.temperature;
      let eggLoss = 0;

      if (newTickInDay >= TICKS_PER_DAY) { newTickInDay = 0; newDay = s.day + 1; }

      // Fan speed decays — mother cuttlefish gets tired, must keep fanning
      const msSinceTouch = Date.now() - lastFanTouch.current;
      if (msSinceTouch > 800) {
        setFanSpeed(prev => Math.max(0, prev - 1.2));
      }

      // Natural O2 drift — currents push oxygen around randomly
      const drift = (Math.random() - 0.5) * 3;  // constant small drift ±1.5
      newOxy = clamp(newOxy + drift, 0, 100);

      // Occasional current surges push O2 harder
      if (Math.random() < 0.04) {
        const surge = (Math.random() - 0.5) * 24; // ±12
        newOxy = clamp(newOxy + surge, 0, 100);
      }

      // Fanning pulls O2 toward fan speed setting
      const oxyDelta = (s.fanSpeed - newOxy) * 0.15;
      newOxy = clamp(newOxy + oxyDelta, 0, 100);
      if (newOxy < OXY_SUFFOCATE) {
        if (Math.random() < ((OXY_SUFFOCATE - newOxy) / OXY_SUFFOCATE) * 0.3) eggLoss++;
      }
      if (newOxy > OXY_DETACH) {
        if (Math.random() < ((newOxy - OXY_DETACH) / (100 - OXY_DETACH)) * 0.3) eggLoss++;
      }

      // Temperature
      if (s.eggZone === 'sunny') newTemp = Math.min(28, newTemp + 0.1);
      else newTemp = Math.max(18, newTemp - 0.08);
      if (newTemp > 26 || newTemp < 19) { if (Math.random() < 0.15) eggLoss++; }

      // Predators: spawn
      const newPredators = [...s.predators];
      if (newTickInDay === 0) {
        for (const sp of PREDATOR_SCHEDULE.filter(ps => ps.day === newDay)) {
          predatorIdCounter.current++;
          newPredators.push({
            id: predatorIdCounter.current, type: sp.type,
            progress: 0, x: Math.random() * 0.6 + 0.2,
            revealed: sp.type !== 'starfish', active: true, spawnDay: newDay,
          });
          const alertMap: Record<PredatorType, string> = {
            wrasse: '🐟 Wrasse approaching! Tap it!',
            crab: '🦀 Crab spotted! Tap 3 times!',
            starfish: '⭐ Starfish hiding! Find & tap!',
          };
          setPredatorAlert(alertMap[sp.type]);
          sfxPredatorAlert();
          setTimeout(() => setPredatorAlert(null), 2500);
        }
      }

      // Predators: advance
      for (const p of newPredators) {
        if (!p.active) continue;
        p.progress = Math.min(1, p.progress + (p.type === 'wrasse' ? 0.06 : p.type === 'crab' ? 0.02 : 0.015));
        if (p.progress >= 1) {
          eggLoss += p.type === 'wrasse' ? randomInt(8, 15) : p.type === 'crab' ? randomInt(5, 10) : randomInt(3, 6);
          p.active = false;
          sfxWrong();
        }
      }

      // Infections
      const newInfections = [...s.infections];
      if (newTickInDay === 0 && Math.random() < 0.2 && newDay > 3) {
        const alive: number[] = [];
        for (let i = 0; i < TOTAL_EGGS; i++) {
          if (!s.eggsDead.has(i) && !newInfections.some(inf => inf.index === i)) alive.push(i);
        }
        if (alive.length > 0) {
          infectionIdCounter.current++;
          newInfections.push({ id: infectionIdCounter.current, index: alive[randomInt(0, alive.length - 1)], age: 0 });
        }
      }

      for (const inf of newInfections) {
        inf.age++;
        if (inf.age > 0 && inf.age % 51 === 0) {
          const row = Math.floor(inf.index / GRID_COLS), col = inf.index % GRID_COLS;
          const neighbors = [
            row > 0 ? (row - 1) * GRID_COLS + col : -1,
            row < GRID_ROWS - 1 ? (row + 1) * GRID_COLS + col : -1,
            col > 0 ? row * GRID_COLS + (col - 1) : -1,
            col < GRID_COLS - 1 ? row * GRID_COLS + (col + 1) : -1,
          ].filter(n => n >= 0 && !s.eggsDead.has(n) && !newInfections.some(i2 => i2.index === n));
          if (neighbors.length > 0) {
            infectionIdCounter.current++;
            newInfections.push({ id: infectionIdCounter.current, index: neighbors[randomInt(0, neighbors.length - 1)], age: 0 });
          }
        }
        if (inf.age > 85) { eggLoss++; inf.age = -9999; }
      }
      const cleanInfections = newInfections.filter(inf => inf.age > -9999);

      // Apply egg loss
      let newAlive = s.eggsAlive;
      const newDead = new Set(s.eggsDead);
      if (eggLoss > 0) {
        const aliveList: number[] = [];
        for (let i = 0; i < TOTAL_EGGS; i++) { if (!newDead.has(i)) aliveList.push(i); }
        const toKill = Math.min(eggLoss, aliveList.length);
        for (let k = 0; k < toKill; k++) {
          const pick = randomInt(0, aliveList.length - 1);
          newDead.add(aliveList[pick]);
          aliveList.splice(pick, 1);
        }
        newAlive = TOTAL_EGGS - newDead.size;
      }

      setDay(newDay); setTickInDay(newTickInDay);
      setOxygenation(Math.round(newOxy * 10) / 10);
      setTemperature(Math.round(newTemp * 10) / 10);
      setEggsAlive(newAlive); setEggsDead(newDead);
      setPredators(newPredators); setInfections(cleanInfections);

      // Auto-fail if too many eggs die (below 40% survival)
      const earlyFailPct = (newAlive / TOTAL_EGGS) * 100;
      if (earlyFailPct < 40) {
        setGameOver(true); clearInterval(interval);
        sfxWrong();
        onFail(`Only ${newAlive} of ${TOTAL_EGGS} eggs remain (${earlyFailPct.toFixed(0)}%). Too many were lost.`,
          'Cuttlefish mothers tend their eggs for weeks, carefully fanning them for oxygen, removing infections, and guarding against predators.');
        return;
      }

      if (newDay > TOTAL_DAYS) {
        setGameOver(true); clearInterval(interval);
        const pct = (newAlive / TOTAL_EGGS) * 100;
        if (pct < 60) {
          sfxWrong();
          onFail(`Only ${newAlive} of ${TOTAL_EGGS} eggs survived (${pct.toFixed(0)}%).`,
            'Cuttlefish mothers tend their eggs for weeks, carefully fanning them for oxygen, removing infections, and guarding against predators.');
        } else {
          sfxCorrect();
          const stars = pct >= 95 ? 5 : pct >= 90 ? 4 : pct >= 80 ? 3 : pct >= 70 ? 2 : 1;
          onComplete(stars, [
            { label: 'Eggs survived', value: `${newAlive} / ${TOTAL_EGGS}` },
            { label: 'Survival rate', value: `${pct.toFixed(1)}%` },
            { label: 'Predators repelled', value: `${newPredators.filter(p2 => !p2.active && p2.progress < 1).length}` },
            { label: 'Infections treated', value: `${infectionIdCounter.current - cleanInfections.length}` },
          ]);
        }
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [paused, gameOver, showTutorial, onComplete, onFail]);

  /* ---- Derived ---- */
  const survivalPct = (eggsAlive / TOTAL_EGGS) * 100;
  const dayProgress = tickInDay / TICKS_PER_DAY;
  const oxyColor =
    oxygenation < OXY_SUFFOCATE ? 'var(--danger)' :
    oxygenation > OXY_DETACH ? 'var(--danger)' :
    oxygenation < OXY_SWEET_LOW || oxygenation > OXY_SWEET_HIGH ? 'var(--warning)' : 'var(--success)';
  const tempColor =
    temperature >= 20 && temperature <= 25 ? 'var(--success)' :
    (temperature >= 19 && temperature < 20) || (temperature > 25 && temperature <= 26) ? 'var(--warning)' : 'var(--danger)';
  const activePredators = predators.filter(p => p.active);
  const isSunny = eggZone === 'sunny';

  if (showTutorial) return <Tutorial onDone={() => setShowTutorial(false)} />;

  /* ---- Pause ---- */
  if (paused) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
        style={{ background: 'rgba(6,4,16,0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-sm w-full">
          <div className="flex justify-center mb-4"><span className="text-4xl">⏸️</span></div>
          <h2 className="font-pixel text-sm text-center text-rarity-legendary mb-6">PAUSED</h2>
          <div className="rounded-2xl p-4 mb-6"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.06)' }}>
            <h3 className="font-pixel text-[8px] text-purple-400 mb-3">Quick Guide</h3>
            <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">💨</span>
                <p><strong className="text-text-primary">Fan Slider:</strong> Drag to control water flow. This brings oxygen to your eggs — keep O2 between 40-70%. You can see the water flowing over your eggs!</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">☀️</span>
                <p><strong className="text-text-primary">Sun / Shade:</strong> Tap to move eggs. Keep temperature between 20-25°C.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">🛡️</span>
                <p><strong className="text-text-primary">Predators:</strong> Wrasse = tap once. Crab = tap 3x. Starfish = find the faint star, then tap.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">✨</span>
                <p><strong className="text-text-primary">Infections:</strong> Tap glowing eggs to remove before they spread!</p>
              </div>
            </div>
          </div>
          <button onClick={() => { sfxTap(); setPaused(false); }}
            className="w-full py-3.5 rounded-xl font-pixel text-[10px] text-white active:scale-95"
            style={{ background: 'linear-gradient(135deg, #9c88ff, #7c68df)', border: '2px solid #9c88ff', boxShadow: '0 4px 20px rgba(156,136,255,0.3)' }}>
            Resume
          </button>
        </div>
      </div>
    );
  }

  /* ---- Main view ---- */
  return (
    <div className="fixed inset-0 z-30 flex flex-col game-viewport select-none">
      {/* Underwater background */}
      <UnderwaterBg brightness={isSunny ? 0.6 : 0.35} showForeground={false} />
      <AmbientFish count={3} />

      {/* Zone tint overlay */}
      <div className="absolute inset-0 transition-all duration-700 pointer-events-none z-[1]"
        style={{
          background: isSunny
            ? 'radial-gradient(ellipse at top, rgba(255,200,100,0.08), transparent 60%)'
            : 'radial-gradient(ellipse at top, rgba(30,60,120,0.06), transparent 60%)',
        }} />

      {/* Tiny top bar — just egg count + day */}
      <div className="shrink-0 relative z-10">
        <TopBar eggsAlive={eggsAlive} day={day} totalDays={TOTAL_DAYS}
          survivalPct={survivalPct} onPause={() => { sfxTap(); setPaused(true); }} />
      </div>

      {/* Egg area — takes up most of the screen */}
      <div className="flex-1 overflow-hidden relative z-10">
        {/* Water flow animation over eggs */}
        <WaterFlowOverlay fanSpeed={fanSpeed} />

        {/* Scrollable egg grid */}
        <div className="h-full overflow-y-auto px-3 py-2 relative z-[15]">
          <div className="rounded-3xl p-3"
            style={{
              background: 'rgba(10,8,24,0.7)',
              border: '1.5px solid rgba(255,255,255,0.04)',
              backdropFilter: 'blur(4px)',
            }}>
            <EggGrid eggsDead={eggsDead} infections={infections}
              onInfectionTap={handleInfectionTap} eggZone={eggZone} />
          </div>
        </div>

        {/* Predators overlay */}
        {activePredators.map(p => (
          <PredatorOverlay key={p.id} predator={p}
            onTap={() => handlePredatorTap(p.id)} />
        ))}

        {/* Alert toast */}
        <EventToast message={predatorAlert} />
      </div>

      {/* All controls at bottom */}
      <div className="shrink-0 border-t border-white/5 relative z-10">
        <BottomControls
          fanSpeed={fanSpeed} oxygenation={oxygenation} oxyColor={oxyColor}
          onFanChange={(v: number) => { lastFanTouch.current = Date.now(); setFanSpeed(v); }}
          zone={eggZone} temperature={temperature} tempColor={tempColor} onZoneToggle={toggleZone}
        />
      </div>
    </div>
  );
}
