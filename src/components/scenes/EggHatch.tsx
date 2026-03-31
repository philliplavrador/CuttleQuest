'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sfxTap, sfxCorrect } from '@/lib/audio';
import { UnderwaterBg, AmbientFish, CreatureSprite } from '@/components/sprites';
import CuttlefishAvatar from '@/components/cuttlefishAvatar';
import type { SceneProps } from '@/types/game';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EggHatchProps extends SceneProps {
  eggsSurvived: number;
  totalEggs: number;
}

type Phase = 'intro' | 'hatching' | 'breaking' | 'burst' | 'escape' | 'escaped';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TAPS_TO_HATCH = 15;
const EGG_SIZE = 160;
const HEARTBEAT_PERIOD = 1200;
const RHYTHM_WINDOW = 180;
const OFF_RHYTHM_VALUE = 0.5;
const MAX_FREEZES = 5;
const ESCAPE_TIMEOUT = 4000;

const EGG_FRAMES = Array.from({ length: 9 }, (_, i) => `/assets/hatching-eggs/frames/egg_${i}.png`);

function progressToFrame(progress: number): number {
  if (progress <= 0) return 0;
  if (progress < 0.15) return 1;
  if (progress < 0.25) return 2;
  if (progress < 0.35) return 1;
  if (progress < 0.45) return 3;
  if (progress < 0.55) return 4;
  if (progress < 0.65) return 5;
  if (progress < 0.75) return 6;
  if (progress < 0.85) return 7;
  return 8;
}

/* Difficulty: eggsSurvived controls how often and how fast predators pass */
function getDifficulty(eggsSurvived: number) {
  if (eggsSurvived >= 150) return {
    passDuration: 2200,  // ms for fish to cross screen (slower = easier to avoid)
    gapBetween: 3500,    // ms gap between passes
    firstDelay: 2000,    // ms before first predator
  };
  if (eggsSurvived >= 80) return {
    passDuration: 1800,
    gapBetween: 2500,
    firstDelay: 1500,
  };
  return { // few siblings = frequent fast passes
    passDuration: 1400,
    gapBetween: 1800,
    firstDelay: 1200,
  };
}

function calculateStars(freezes: number, rhythmAccuracy: number, escapeTimeMs: number): number {
  if (freezes === 0 && rhythmAccuracy >= 0.85 && escapeTimeMs <= 2000) return 5;
  if (freezes <= 1 && rhythmAccuracy >= 0.70 && escapeTimeMs <= 3000) return 4;
  if (freezes <= 2 && rhythmAccuracy >= 0.50) return 3;
  if (freezes <= 4) return 2;
  return 1;
}

function isOnBeat(now: number, startTime: number): boolean {
  const elapsed = (now - startTime) % HEARTBEAT_PERIOD;
  return elapsed <= RHYTHM_WINDOW || elapsed >= (HEARTBEAT_PERIOD - RHYTHM_WINDOW);
}

function getPulseIntensity(now: number, startTime: number): number {
  const elapsed = (now - startTime) % HEARTBEAT_PERIOD;
  return Math.cos((elapsed / HEARTBEAT_PERIOD) * Math.PI * 2) * 0.5 + 0.5;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function EggHatch({
  eggsSurvived, onComplete, onFail,
}: EggHatchProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [hatchProgress, setHatchProgress] = useState(0);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [freezeCount, setFreezeCount] = useState(0);
  const [showFreeze, setShowFreeze] = useState(false);
  const [totalTaps, setTotalTaps] = useState(0);
  const [onBeatTaps, setOnBeatTaps] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [escapeProgress, setEscapeProgress] = useState(0);

  // Predator pass state
  const [predatorPassing, setPredatorPassing] = useState(false);
  const [predatorFromLeft, setPredatorFromLeft] = useState(true);
  const [predatorKey, setPredatorKey] = useState(0); // bumped to re-trigger CSS animation

  const startTimeRef = useRef(0);
  const escapeStartRef = useRef(0);
  const escapeTimeRef = useRef(0);
  const pulseTimerRef = useRef<number>(0);
  const predatorIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const escapeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const failedRef = useRef(false);
  const predatorPassingRef = useRef(false); // sync ref for rAF reads

  const difficulty = getDifficulty(eggsSurvived);
  const progress = Math.min(hatchProgress / TAPS_TO_HATCH, 1);
  const frameIndex = phase === 'breaking' ? 8 : progressToFrame(progress);

  // Preload egg frames
  useEffect(() => {
    EGG_FRAMES.forEach(src => { const img = new Image(); img.src = src; });
  }, []);

  /* ---- Predator pass scheduler ---- */
  useEffect(() => {
    if (phase !== 'hatching') return;

    function spawnPass() {
      const fromLeft = Math.random() > 0.5;
      setPredatorFromLeft(fromLeft);
      setPredatorKey(k => k + 1);
      setPredatorPassing(true);
      predatorPassingRef.current = true;

      // End the pass after it crosses the screen
      passTimeoutRef.current = setTimeout(() => {
        setPredatorPassing(false);
        predatorPassingRef.current = false;

        // Schedule next pass
        predatorIntervalRef.current = setTimeout(spawnPass, difficulty.gapBetween);
      }, difficulty.passDuration);
    }

    // First predator after a delay
    predatorIntervalRef.current = setTimeout(spawnPass, difficulty.firstDelay);

    return () => {
      if (predatorIntervalRef.current) clearTimeout(predatorIntervalRef.current);
      if (passTimeoutRef.current) clearTimeout(passTimeoutRef.current);
    };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Heartbeat pulse loop ---- */
  useEffect(() => {
    if (phase !== 'hatching') return;
    startTimeRef.current = performance.now();

    function tick() {
      const now = performance.now();
      setPulseIntensity(getPulseIntensity(now, startTimeRef.current));
      pulseTimerRef.current = requestAnimationFrame(tick);
    }

    pulseTimerRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(pulseTimerRef.current);
  }, [phase]);

  /* ---- Intro auto-advance ---- */
  useEffect(() => {
    if (phase === 'intro') {
      const t = setTimeout(() => setPhase('hatching'), 2500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  /* ---- Breaking -> burst ---- */
  useEffect(() => {
    if (phase === 'breaking') {
      // Clean up predator timers
      if (predatorIntervalRef.current) clearTimeout(predatorIntervalRef.current);
      if (passTimeoutRef.current) clearTimeout(passTimeoutRef.current);
      cancelAnimationFrame(pulseTimerRef.current);
      const t = setTimeout(() => { sfxCorrect(); setPhase('burst'); }, 1200);
      return () => clearTimeout(t);
    }
  }, [phase]);

  /* ---- Burst -> escape ---- */
  useEffect(() => {
    if (phase === 'burst') {
      const t = setTimeout(() => {
        escapeStartRef.current = performance.now();
        setPhase('escape');
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  /* ---- Escape timeout ---- */
  useEffect(() => {
    if (phase === 'escape') {
      escapeTimerRef.current = setTimeout(() => {
        if (!failedRef.current) {
          failedRef.current = true;
          onFail(
            'Caught by a predator!',
            'The hatchling lingered too long after emerging. In nature, newly hatched cuttlefish must jet to shelter immediately \u2014 hesitation is fatal when you\'re only 8mm long.'
          );
        }
      }, ESCAPE_TIMEOUT);
      return () => { if (escapeTimerRef.current) clearTimeout(escapeTimerRef.current); };
    }
  }, [phase, onFail]);

  /* ---- Shake decay ---- */
  useEffect(() => {
    if (shakeIntensity > 0) {
      const t = setTimeout(() => setShakeIntensity(s => Math.max(0, s - 1)), 100);
      return () => clearTimeout(t);
    }
  }, [shakeIntensity]);

  /* ---- Freeze flash decay ---- */
  useEffect(() => {
    if (showFreeze) {
      const t = setTimeout(() => setShowFreeze(false), 400);
      return () => clearTimeout(t);
    }
  }, [showFreeze]);

  /* ---- Tap handler (hatching phase) ---- */
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (phase === 'intro') { setPhase('hatching'); return; }
    if (phase !== 'hatching') return;

    e.stopPropagation();
    const now = performance.now();

    // Tapping while predator is passing = freeze
    if (predatorPassingRef.current) {
      sfxTap();
      const newFreezes = freezeCount + 1;
      setFreezeCount(newFreezes);
      setShowFreeze(true);

      if (newFreezes >= MAX_FREEZES && !failedRef.current) {
        failedRef.current = true;
        onFail(
          'Detected by a predator!',
          `Too much movement inside the egg attracted a wrasse. After ${newFreezes} freezes, the predator struck. In the wild, cuttlefish embryos can detect approaching predators through the egg wall and freeze to avoid detection.`
        );
      }
      return;
    }

    // Safe to tap
    sfxTap();
    setTotalTaps(t => t + 1);
    const onBeat = isOnBeat(now, startTimeRef.current);
    if (onBeat) setOnBeatTaps(t => t + 1);

    const increment = onBeat ? 1 : OFF_RHYTHM_VALUE;
    const newProgress = hatchProgress + increment;
    setHatchProgress(newProgress);
    setShakeIntensity(Math.min(6, shakeIntensity + 3));

    if (newProgress >= TAPS_TO_HATCH) {
      setPhase('breaking');
    }
  }, [phase, freezeCount, hatchProgress, shakeIntensity, onFail]);

  /* ---- Swipe handlers (escape phase) ---- */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (phase !== 'escape') return;
    swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, [phase]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (phase !== 'escape') return;
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
  }, [phase]);

  const completeEscape = useCallback((endX: number) => {
    if (phase !== 'escape' || !swipeStartRef.current || failedRef.current) return;
    const dx = endX - swipeStartRef.current.x;

    if (dx > 50) {
      escapeTimeRef.current = performance.now() - escapeStartRef.current;
      if (escapeTimerRef.current) clearTimeout(escapeTimerRef.current);
      setEscapeProgress(1);
      setPhase('escaped');
    }
    swipeStartRef.current = null;
  }, [phase]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.changedTouches.length > 0) completeEscape(e.changedTouches[0].clientX);
  }, [completeEscape]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    completeEscape(e.clientX);
  }, [completeEscape]);

  /* ---- Escaped -> complete ---- */
  useEffect(() => {
    if (phase === 'escaped') {
      const rhythmAccuracy = totalTaps > 0 ? onBeatTaps / totalTaps : 0;
      const escapeTime = escapeTimeRef.current;
      const stars = calculateStars(freezeCount, rhythmAccuracy, escapeTime);

      const t = setTimeout(() => {
        onComplete(stars, [
          { label: 'Freezes', value: `${freezeCount}` },
          { label: 'Rhythm', value: `${Math.round(rhythmAccuracy * 100)}%` },
          { label: 'Escape', value: `${(escapeTime / 1000).toFixed(1)}s` },
        ]);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- render ---- */
  const shakeX = shakeIntensity > 0 ? (Math.random() - 0.5) * shakeIntensity * 2 : 0;
  const shakeY = shakeIntensity > 0 ? (Math.random() - 0.5) * shakeIntensity * 2 : 0;

  return (
    <div
      className="fixed inset-0 z-30 bg-bg-dark flex flex-col game-viewport overflow-hidden"
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Background */}
      <div className="absolute inset-0">
        <UnderwaterBg brightness={0.6} />
        <AmbientFish count={3} />
      </div>

      {/* Light rays */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="absolute" style={{
            top: 0, left: `${20 + i * 25}%`, width: 60, height: '100%',
            background: `linear-gradient(180deg, rgba(140,200,255,${0.06 - i * 0.015}) 0%, transparent 60%)`,
            transform: `rotate(${-8 + i * 8}deg)`, transformOrigin: 'top center',
          }} />
        ))}
      </div>

      {/* Seagrass cover (right side) */}
      <div className="absolute right-0 bottom-0 z-[2] pointer-events-none" style={{
        width: '25%', height: '60%',
        background: 'linear-gradient(to left, rgba(34,120,60,0.5) 0%, rgba(34,120,60,0.15) 60%, transparent 100%)',
        opacity: phase === 'escape' || phase === 'escaped' ? 1 : 0.3,
        transition: 'opacity 0.5s',
      }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="absolute bottom-0" style={{
            right: `${10 + i * 18}%`, width: 8, height: `${50 + i * 8}%`,
            background: `linear-gradient(to top, #2a7840, #45a060${i % 2 === 0 ? 'cc' : '99'})`,
            borderRadius: '50% 50% 0 0',
            transform: `rotate(${(i - 2) * 5}deg)`,
            transformOrigin: 'bottom center',
            animation: `seagrassWave ${2 + i * 0.3}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      {/* ---- PREDATOR PASSING (big fish swimming across) ---- */}
      {predatorPassing && phase === 'hatching' && (
        <div
          key={predatorKey}
          className="absolute z-[15] pointer-events-none"
          style={{
            top: '38%',
            animation: predatorFromLeft
              ? `predatorPassLR ${difficulty.passDuration}ms linear forwards`
              : `predatorPassRL ${difficulty.passDuration}ms linear forwards`,
          }}
        >
          <div style={{ position: 'relative' }}>
            <img
              src="/assets/fish-pack/PNG/Double/fish_red.png"
              alt="predator"
              style={{
                width: 80, height: 'auto',
                transform: predatorFromLeft ? 'scaleX(-1)' : 'scaleX(1)',
                filter: 'drop-shadow(0 0 12px rgba(255,80,50,0.5))',
                imageRendering: 'pixelated',
              }}
            />
            {/* DANGER label */}
            <div style={{
              position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
            }}>
              <span className="font-pixel text-[8px]" style={{
                color: '#ff6b4a',
                animation: 'pulse 0.4s infinite',
                textShadow: '0 0 8px rgba(255,80,50,0.6)',
              }}>
                DANGER
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ---- Screen edge warning tint when predator passing ---- */}
      {predatorPassing && phase === 'hatching' && (
        <div className="absolute inset-0 z-[12] pointer-events-none" style={{
          boxShadow: 'inset 0 0 60px rgba(255,80,50,0.2)',
          animation: 'pulseRedBorder 0.8s ease-in-out infinite',
        }} />
      )}

      {/* ---- FREEZE FLASH ---- */}
      {showFreeze && (
        <div className="absolute inset-0 z-20 pointer-events-none" style={{
          background: 'rgba(255,80,50,0.3)',
          animation: 'freezeFlash 0.4s ease-out forwards',
        }} />
      )}

      {/* ---- INTRO ---- */}
      {phase === 'intro' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8"
          style={{ animation: 'fadeIn 1s ease-out' }}>
          <img src={EGG_FRAMES[0]} alt="egg"
            style={{ width: 128, height: 128, imageRendering: 'pixelated', animation: 'pulse 2s ease-in-out infinite' }} />
          <h2 className="font-pixel text-sm text-text-primary text-center leading-relaxed mb-3 mt-6">
            Predators are circling...
          </h2>
          <p className="text-text-secondary text-sm text-center leading-relaxed max-w-xs">
            Tap to dissolve the membrane. Stop tapping when a predator swims past!
          </p>
          <span className="font-pixel text-[7px] text-text-muted mt-8" style={{ animation: 'pulse 2s infinite' }}>
            Tap to start
          </span>
        </div>
      )}

      {/* ---- HATCHING (rhythm tap + predator dodge) ---- */}
      {(phase === 'hatching' || phase === 'breaking') && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          {/* HUD */}
          <div className="absolute top-[8%] left-0 right-0 px-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-pixel text-[9px]" style={{
                color: predatorPassing ? '#ff6b4a' : '#d0c4f0',
              }}>
                {phase === 'breaking' ? 'BREAKING FREE!' :
                  predatorPassing ? 'STOP TAPPING!' : 'TAP TO HATCH!'}
              </h2>
              {/* Freeze counter */}
              <div className="flex items-center" style={{ gap: 3 }}>
                {Array.from({ length: MAX_FREEZES }).map((_, i) => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: i < freezeCount ? '#ff6b4a' : 'rgba(255,255,255,0.15)',
                    transition: 'background 0.2s',
                  }} />
                ))}
              </div>
            </div>
            {phase === 'hatching' && (
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full transition-all duration-150" style={{
                  width: `${progress * 100}%`,
                  background: predatorPassing
                    ? 'linear-gradient(90deg, #ff6b4a, #ff8a70)'
                    : 'linear-gradient(90deg, #66bb6a, #8bc34a)',
                }} />
              </div>
            )}
          </div>

          {/* Egg with heartbeat glow */}
          <div className="relative" style={{
            width: EGG_SIZE, height: EGG_SIZE,
            transform: `translate(${shakeX}px, ${shakeY}px) ${phase === 'breaking' ? 'scale(1.15)' : ''}`,
            transition: phase === 'breaking' ? 'transform 0.3s ease-out' : undefined,
          }}>
            {/* Heartbeat pulse glow */}
            <div className="absolute -inset-12 rounded-full pointer-events-none" style={{
              background: predatorPassing
                ? `radial-gradient(circle, rgba(255,100,80,${0.05 + pulseIntensity * 0.15}) 0%, transparent 70%)`
                : `radial-gradient(circle, rgba(200,180,255,${0.1 + pulseIntensity * 0.35}) 0%, transparent 70%)`,
              transition: 'background 0.3s',
            }} />

            {/* Heartbeat ring */}
            {phase === 'hatching' && !predatorPassing && (
              <div className="absolute -inset-4 rounded-full pointer-events-none" style={{
                border: `2px solid rgba(200,180,255,${pulseIntensity * 0.6})`,
                transform: `scale(${1 + pulseIntensity * 0.08})`,
              }} />
            )}

            {/* Egg sprite */}
            <img src={EGG_FRAMES[frameIndex]} alt="egg"
              className="absolute inset-0 w-full h-full"
              style={{
                imageRendering: 'pixelated',
                filter: phase === 'breaking' ? 'brightness(1.8)'
                  : predatorPassing ? 'brightness(0.7) saturate(0.5)' : undefined,
                transition: 'filter 0.3s',
              }} />

            {/* Breaking flash */}
            {phase === 'breaking' && (
              <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                background: 'radial-gradient(circle, rgba(255,240,200,0.5) 0%, transparent 70%)',
                animation: 'pulse 0.3s ease-in-out infinite',
              }} />
            )}
          </div>

          {/* Hint text */}
          {phase === 'hatching' && (
            <div className="absolute bottom-[18%] left-0 right-0 text-center">
              <span className="font-pixel text-[7px]" style={{
                color: predatorPassing ? '#ff6b4a' :
                  progress < 0.3 ? '#5a5480' : progress < 0.7 ? '#d0c4f0' : '#ffb74d',
              }}>
                {predatorPassing ? "Don't move!" :
                  progress === 0 ? 'Tap the egg!' :
                    progress < 0.3 ? 'Keep going!' :
                      progress < 0.5 ? "It's wobbling!" :
                        progress < 0.7 ? 'Cracks forming!' :
                          'Almost free!'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ---- BURST ---- */}
      {phase === 'burst' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(circle at 50% 45%, rgba(200,180,255,0.4) 0%, transparent 60%)',
            animation: 'burstFlash 1.5s ease-out forwards',
          }} />
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            return (
              <div key={i} className="absolute pointer-events-none" style={{
                left: '50%', top: '45%', width: 12, height: 16,
                background: 'linear-gradient(135deg, rgba(180,140,100,0.9), rgba(140,100,60,0.7))',
                borderRadius: '30% 60% 40% 50%',
                animation: 'shellFly 1.2s ease-out forwards',
                transform: 'translate(-50%, -50%)',
                ['--fly-x' as string]: `${Math.cos(angle) * (80 + Math.random() * 60)}px`,
                ['--fly-y' as string]: `${Math.sin(angle) * (80 + Math.random() * 60)}px`,
                ['--fly-rot' as string]: `${Math.random() * 360}deg`,
                animationDelay: `${i * 0.05}s`,
              }} />
            );
          })}
          <div style={{ animation: 'babyAppear 1s ease-out 0.3s both' }}>
            <CuttlefishAvatar stage="hatchling" size={96} />
          </div>
          <h2 className="font-pixel text-sm text-rarity-legendary mt-6"
            style={{ animation: 'slam 0.6s ease-out 0.5s both' }}>
            HATCHED!
          </h2>
        </div>
      )}

      {/* ---- ESCAPE ---- */}
      {phase === 'escape' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          {/* Approaching predator */}
          <div className="absolute z-[5]" style={{
            left: '5%', top: '42%',
            animation: `predatorApproach ${ESCAPE_TIMEOUT}ms linear forwards`,
          }}>
            <img
              src="/assets/fish-pack/PNG/Double/fish_red.png"
              alt="predator"
              style={{
                width: 64, height: 'auto',
                transform: 'scaleX(-1)',
                filter: 'drop-shadow(0 0 10px rgba(255,80,50,0.5))',
                imageRendering: 'pixelated',
              }}
            />
          </div>

          {/* Hatchling */}
          <div style={{
            transform: `translateX(${escapeProgress * 120}px)`,
            transition: 'transform 0.3s ease-out',
          }}>
            <CuttlefishAvatar stage="hatchling" size={80} />
          </div>

          {/* Instruction */}
          <div className="absolute bottom-[20%] left-0 right-0 text-center px-8">
            <span className="font-pixel text-[10px] text-rarity-legendary" style={{ animation: 'pulse 0.5s infinite' }}>
              {'SWIPE RIGHT \u25B6'}
            </span>
            <br />
            <span className="font-pixel text-[7px] text-text-muted mt-1 inline-block">
              Jet to the seagrass!
            </span>
          </div>

          {/* Danger timer */}
          <div className="absolute top-[10%] left-0 right-0 px-8">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full" style={{
                background: 'linear-gradient(90deg, #ff6b4a, #ff3320)',
                animation: `dangerFill ${ESCAPE_TIMEOUT}ms linear forwards`,
              }} />
            </div>
            <span className="font-pixel text-[7px] text-error mt-1 block text-center">PREDATOR APPROACHING</span>
          </div>
        </div>
      )}

      {/* ---- ESCAPED ---- */}
      {phase === 'escaped' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <div className="absolute right-[10%] top-[40%]" style={{ animation: 'safeGlow 1.5s ease-out' }}>
            <CuttlefishAvatar stage="hatchling" size={64} />
          </div>
          <h2 className="font-pixel text-sm text-success mb-2"
            style={{ animation: 'slam 0.5s ease-out both' }}>
            SAFE!
          </h2>
          <p className="font-pixel text-[8px] text-text-secondary">
            You made it to the seagrass!
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes burstFlash { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes shellFly {
          0% { transform: translate(-50%, -50%) rotate(0deg); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--fly-x)), calc(-50% + var(--fly-y))) rotate(var(--fly-rot)); opacity: 0; }
        }
        @keyframes babyAppear {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes freezeFlash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes seagrassWave {
          0% { transform: rotate(-3deg); }
          100% { transform: rotate(3deg); }
        }
        @keyframes predatorPassLR {
          0% { left: -15%; }
          100% { left: 110%; }
        }
        @keyframes predatorPassRL {
          0% { left: 110%; }
          100% { left: -15%; }
        }
        @keyframes predatorApproach {
          0% { left: 5%; }
          100% { left: 45%; }
        }
        @keyframes dangerFill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes safeGlow {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulseRedBorder {
          0%, 100% { box-shadow: inset 0 0 40px rgba(255,80,50,0.15); }
          50% { box-shadow: inset 0 0 80px rgba(255,80,50,0.3); }
        }
      `}</style>
    </div>
  );
}
