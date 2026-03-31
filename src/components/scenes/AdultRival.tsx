'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { sfxTap, sfxCorrect, sfxWrong, sfxPredatorAlert } from '@/lib/audio';
import { UnderwaterBg } from '@/components/sprites';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SceneProps {
  onComplete: (stars: number, metrics: { label: string; value: string }[]) => void;
  onFail: (reason: string, explanation: string) => void;
  attemptNumber: number;
}

type TacticPath = 'aggressive' | 'sneaker' | 'retreat';
type GamePhase =
  | 'choose-tactic'
  // Aggressive
  | 'agg-display'
  | 'agg-tap'
  | 'agg-result'
  // Sneaker
  | 'snk-memorize'
  | 'snk-disguise'
  | 'snk-passes'
  | 'snk-result'
  // Retreat
  | 'ret-watch'
  | 'ret-result';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DISPLAY_PATTERNS = ['Zebra Pulse', 'Passing Cloud', 'Intense Flash', 'Lateral Flame', 'Dark Mantle'] as const;
const CORRECT_ORDER = [1, 3, 0, 4, 2]; // indices into DISPLAY_PATTERNS
const PATTERN_COLORS = ['#5588DD', '#44CC88', '#EE6644', '#DDAA33', '#9955CC'];

const FEMALE_COLORS = ['#C2956B', '#8B7355', '#D4A574', '#A67B5B', '#E8C9A0', '#7A5C3E'];
const FEMALE_PATTERNS = ['mottled', 'striped', 'smooth'] as const;
// Base female appearance — varied by attemptNumber in sneakerTarget
const CORRECT_FEMALE_COLOR_IDX = 2; // D4A574

const TAP_TARGET = 20;
const TAP_TIME_MS = 5000;

const FATIGUE_START_MS = 10000;
const FATIGUE_WINDOW_MS = 3000;
const RETREAT_OPPORTUNITIES = 2;

/* ------------------------------------------------------------------ */
/*  Tutorial                                                           */
/* ------------------------------------------------------------------ */

function RivalTutorial({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: 'Rival Encounter',
      body: "A dominant male is guarding a female you want to court. You must choose one of THREE tactics to get past him:\n\n  1. Aggressive Display — intimidate with chromatic power\n  2. Sneaker Male — disguise as a female to slip past\n  3. Tactical Retreat — wait for the rival to tire\n\nEach tactic plays completely differently!",
    },
    {
      title: 'Tactic 1: Aggressive Display',
      body: "Challenge the rival head-on with escalating displays.\n\nFirst, select patterns in the correct ESCALATION ORDER (Passing Cloud, Lateral Flame, Zebra Pulse, Dark Mantle, Intense Flash).\n\nThen win a TAP CONTEST — rapidly tap the screen to build intensity. You need 20 taps in 5 seconds!\n\nMistakes in the order weaken your display.",
    },
    {
      title: 'Tactic 2: Sneaker Male',
      body: "Smaller males can disguise themselves as females!\n\nFirst MEMORIZE the female's appearance (color, pattern, texture). Then match it using the controls.\n\nDuring 3 close passes by the rival, hold the SUPPRESS button to hide your male patterns. If your disguise is bad or you flash your colors, you'll be detected!",
    },
    {
      title: 'Tactic 3: Tactical Retreat',
      body: "Back off and watch the rival for signs of fatigue.\n\nThe rival's colors will dull and movements slow when he tires — that's your window!\n\nTap APPROACH when you see fatigue signals. Too early = detected, too late = missed opportunity. You only get 2 attempts!\n\nChoose wisely, and good luck!",
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
            }} />
          ))}
        </div>
        <h2 className="font-pixel text-sm text-purple-300 mb-3 text-center">{s.title}</h2>
        <p className="text-xs text-text-secondary whitespace-pre-line leading-relaxed text-center">
          {s.body}
        </p>
        <button onClick={() => step < steps.length - 1 ? setStep(step + 1) : onDone()}
          className="w-full py-3.5 rounded-xl font-pixel text-[10px] text-white mt-6 active:scale-95 transition-all"
          style={{
            background: step === steps.length - 1
              ? 'linear-gradient(135deg, #66bb6a, #4caf50)'
              : 'linear-gradient(135deg, #7c5cbf, #ab7cff)',
            border: `2px solid ${step === steps.length - 1 ? 'rgba(102,187,106,0.5)' : 'rgba(171,124,255,0.5)'}`,
          }}>
          {step === steps.length - 1 ? 'Face the Rival!' : 'Next'}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdultRival({ onComplete, onFail, attemptNumber }: SceneProps) {
  const [showTutorial, setShowTutorial] = useState(attemptNumber === 1);
  const [phase, setPhase] = useState<GamePhase>('choose-tactic');
  const [chosenPath, setChosenPath] = useState<TacticPath | null>(null);
  const [paused, setPaused] = useState(false);

  // Aggressive state
  const [displayOrder, setDisplayOrder] = useState<number[]>([]);
  const [displayStep, setDisplayStep] = useState(0);
  const [intensity, setIntensity] = useState(0);
  const [aggMistakes, setAggMistakes] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [tapStartTime, setTapStartTime] = useState(0);
  const [tapTimeLeft, setTapTimeLeft] = useState(TAP_TIME_MS);
  const tapTimerRef = useRef<number | null>(null);

  // Sneaker state
  const [snkColorIdx, setSnkColorIdx] = useState(0);
  const [snkPattern, setSnkPattern] = useState<typeof FEMALE_PATTERNS[number]>('smooth');
  const [snkTexture, setSnkTexture] = useState(false);
  const [snkMemorizeTime, setSnkMemorizeTime] = useState(4);
  const [snkPassIndex, setSnkPassIndex] = useState(0);
  const [snkSuppressed, setSnkSuppressed] = useState(false);
  const [snkPassActive, setSnkPassActive] = useState(false);
  const [snkPassTimer, setSnkPassTimer] = useState(0);
  const [snkDetections, setSnkDetections] = useState(0);
  const [snkFlashes, setSnkFlashes] = useState(0);
  const [snkPassResults, setSnkPassResults] = useState<boolean[]>([]);
  const snkPassTimerRef = useRef<number | null>(null);
  const snkMemTimerRef = useRef<number | null>(null);

  // Retreat state
  const [retElapsed, setRetElapsed] = useState(0);
  const [retFatigueVisible, setRetFatigueVisible] = useState(false);
  const [retAttempts, setRetAttempts] = useState(0);
  const [retEarlyTaps, setRetEarlyTaps] = useState(0);
  const [retSuccess, setRetSuccess] = useState(false);
  // retWaitingForFatigue is tracked implicitly via retFatigueVisible
  const retTimerRef = useRef<number | null>(null);
  const retStartRef = useRef(0);

  // Seed-based variation for sneaker target
  const sneakerTarget = useMemo(() => ({
    colorIdx: (CORRECT_FEMALE_COLOR_IDX + (attemptNumber % 3)) % FEMALE_COLORS.length,
    pattern: FEMALE_PATTERNS[(attemptNumber % 3)] as typeof FEMALE_PATTERNS[number],
    texture: attemptNumber % 2 === 0,
  }), [attemptNumber]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (tapTimerRef.current) cancelAnimationFrame(tapTimerRef.current);
      if (snkPassTimerRef.current) clearInterval(snkPassTimerRef.current);
      if (snkMemTimerRef.current) clearInterval(snkMemTimerRef.current);
      if (retTimerRef.current) cancelAnimationFrame(retTimerRef.current);
    };
  }, []);

  /* ---- Tactic choice ------------------------------------------------ */

  const handleChooseTactic = useCallback((path: TacticPath) => {
    sfxTap();
    setChosenPath(path);
    if (path === 'aggressive') {
      setPhase('agg-display');
      setDisplayOrder([]);
      setDisplayStep(0);
      setIntensity(0);
      setAggMistakes(0);
    } else if (path === 'sneaker') {
      setPhase('snk-memorize');
      setSnkMemorizeTime(4);
      // Start memorize countdown
      const id = setInterval(() => {
        setSnkMemorizeTime(prev => {
          if (prev <= 1) {
            clearInterval(id);
            setPhase('snk-disguise');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      snkMemTimerRef.current = id as unknown as number;
    } else {
      setPhase('ret-watch');
      setRetElapsed(0);
      setRetFatigueVisible(false);
      setRetAttempts(0);
      setRetEarlyTaps(0);
      setRetSuccess(false);

      // Start retreat timer
      retStartRef.current = performance.now();
      const animate = (now: number) => {
        const elapsed = now - retStartRef.current;
        setRetElapsed(elapsed);

        // The fatigue window is between FATIGUE_START_MS and FATIGUE_END_MS
        // Add some randomness based on attempt
        const fatigueOffset = (attemptNumber * 1337) % 3000;
        const fatigueStart = FATIGUE_START_MS + fatigueOffset;
        const fatigueEnd = fatigueStart + FATIGUE_WINDOW_MS;

        if (elapsed >= fatigueStart && elapsed < fatigueEnd) {
          setRetFatigueVisible(true);
        } else if (elapsed >= fatigueEnd) {
          setRetFatigueVisible(false);
        }

        retTimerRef.current = requestAnimationFrame(animate);
      };
      retTimerRef.current = requestAnimationFrame(animate);
    }
  }, [attemptNumber]);

  /* ---- Aggressive: Display Sequence --------------------------------- */

  const handleDisplayChoice = useCallback((patternIdx: number) => {
    sfxTap();
    const expectedIdx = CORRECT_ORDER[displayStep];

    if (patternIdx === expectedIdx) {
      sfxCorrect();
      const newOrder = [...displayOrder, patternIdx];
      setDisplayOrder(newOrder);
      setIntensity(prev => Math.min(100, prev + 20));
      const nextStep = displayStep + 1;
      setDisplayStep(nextStep);

      if (nextStep >= CORRECT_ORDER.length) {
        // All patterns correct, move to tap phase
        setPhase('agg-tap');
        setTapCount(0);
        const start = Date.now();
        setTapStartTime(start);
        setTapTimeLeft(TAP_TIME_MS);

        const animate = () => {
          const remaining = TAP_TIME_MS - (Date.now() - start);
          setTapTimeLeft(Math.max(0, remaining));
          if (remaining > 0) {
            tapTimerRef.current = requestAnimationFrame(animate);
          }
        };
        tapTimerRef.current = requestAnimationFrame(animate);
      }
    } else {
      sfxWrong();
      setAggMistakes(prev => prev + 1);
      setIntensity(prev => Math.max(0, prev - 15));
    }
  }, [displayStep, displayOrder]);

  const handleTap = useCallback(() => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    sfxTap();

    if (newCount >= TAP_TARGET) {
      // Won the tap contest
      if (tapTimerRef.current) cancelAnimationFrame(tapTimerRef.current);
      setPhase('agg-result');
    }
  }, [tapCount]);

  // Check tap timer expiry
  useEffect(() => {
    if (phase === 'agg-tap' && tapTimeLeft <= 0 && tapCount < TAP_TARGET) {
      if (tapTimerRef.current) cancelAnimationFrame(tapTimerRef.current);
      setPhase('agg-result');
    }
  }, [phase, tapTimeLeft, tapCount]);

  /* ---- Sneaker: Disguise & Passes ----------------------------------- */

  const handleSnkConfirmDisguise = useCallback(() => {
    sfxTap();
    setSnkPassIndex(0);
    setSnkPassResults([]);
    setSnkDetections(0);
    setSnkFlashes(0);
    setPhase('snk-passes');
  }, []);

  const startNextPass = useCallback(() => {
    setSnkPassActive(true);
    setSnkPassTimer(2000);
    setSnkSuppressed(false);

    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = 2000 - elapsed;
      setSnkPassTimer(Math.max(0, remaining));

      if (remaining <= 0) {
        clearInterval(id);
        setSnkPassActive(false);
      }
    }, 50);
    snkPassTimerRef.current = id as unknown as number;
  }, []);

  useEffect(() => {
    if (phase === 'snk-passes' && !snkPassActive && snkPassResults.length === snkPassIndex && snkPassIndex < 3) {
      // Auto-start next pass after a brief delay
      const timeout = setTimeout(() => startNextPass(), 800);
      return () => clearTimeout(timeout);
    }
  }, [phase, snkPassActive, snkPassResults.length, snkPassIndex, startNextPass]);

  // When pass ends, record result
  useEffect(() => {
    if (phase === 'snk-passes' && !snkPassActive && snkPassTimer === 0 && snkPassResults.length === snkPassIndex && snkPassIndex < 3) {
      // This means the pass just ended
    }
  }, [phase, snkPassActive, snkPassTimer, snkPassResults.length, snkPassIndex]);

  const handleSnkPassEnd = useCallback(() => {
    // Calculate if this pass was detected
    const colorMatch = snkColorIdx === sneakerTarget.colorIdx;
    const patternMatch = snkPattern === sneakerTarget.pattern;
    const textureMatch = snkTexture === sneakerTarget.texture;
    const matchScore = (colorMatch ? 1 : 0) + (patternMatch ? 1 : 0) + (textureMatch ? 1 : 0);
    const goodMatch = matchScore >= 2; // at least 2/3 match
    const wasSuppressed = snkSuppressed;

    const passed = goodMatch && wasSuppressed;
    const newResults = [...snkPassResults, passed];
    setSnkPassResults(newResults);

    if (!passed) {
      setSnkDetections(prev => prev + 1);
      sfxWrong();
    } else {
      sfxCorrect();
    }

    const nextIdx = snkPassIndex + 1;
    setSnkPassIndex(nextIdx);

    if (nextIdx >= 3) {
      // All passes done
      setTimeout(() => setPhase('snk-result'), 500);
    }
  }, [snkColorIdx, snkPattern, snkTexture, sneakerTarget, snkSuppressed, snkPassResults, snkPassIndex]);

  // Auto-end pass when timer reaches 0
  useEffect(() => {
    if (phase === 'snk-passes' && snkPassActive && snkPassTimer === 0) {
      setSnkPassActive(false);
      handleSnkPassEnd();
    }
  }, [phase, snkPassActive, snkPassTimer, handleSnkPassEnd]);

  const handleSnkFlash = useCallback(() => {
    // Releasing suppress during a pass = flash
    setSnkFlashes(prev => prev + 1);
    sfxPredatorAlert();
  }, []);

  /* ---- Retreat: Watch & Re-approach --------------------------------- */

  const handleRetApproach = useCallback(() => {
    sfxTap();
    const fatigueOffset = (attemptNumber * 1337) % 3000;
    const fatigueStart = FATIGUE_START_MS + fatigueOffset;
    const fatigueEnd = fatigueStart + FATIGUE_WINDOW_MS;

    const inWindow = retElapsed >= fatigueStart && retElapsed < fatigueEnd;

    const newAttempts = retAttempts + 1;
    setRetAttempts(newAttempts);

    if (inWindow) {
      // Success!
      sfxCorrect();
      setRetSuccess(true);
      if (retTimerRef.current) cancelAnimationFrame(retTimerRef.current);
      setPhase('ret-result');
    } else if (retElapsed < fatigueStart) {
      // Too early
      sfxWrong();
      setRetEarlyTaps(prev => prev + 1);

      if (newAttempts >= RETREAT_OPPORTUNITIES) {
        // Out of opportunities
        if (retTimerRef.current) cancelAnimationFrame(retTimerRef.current);
        setPhase('ret-result');
      }
    } else {
      // Too late (after window)
      sfxWrong();
      setRetEarlyTaps(prev => prev + 1);

      if (newAttempts >= RETREAT_OPPORTUNITIES) {
        if (retTimerRef.current) cancelAnimationFrame(retTimerRef.current);
        setPhase('ret-result');
      }
    }
  }, [retElapsed, retAttempts, attemptNumber]);

  /* ---- Results calculation ------------------------------------------ */

  const calculateAggStars = useCallback((): number => {
    const tapSuccess = tapCount >= TAP_TARGET;
    const perfectOrder = aggMistakes === 0;

    if (!tapSuccess && aggMistakes > 2) return 1;
    if (!tapSuccess) return 1;
    if (aggMistakes > 1) return 2;
    if (aggMistakes === 1) return 3;
    if (perfectOrder && tapSuccess && tapTimeLeft > TAP_TIME_MS * 0.3) return 5;
    if (perfectOrder && tapSuccess) return 4;
    return 3;
  }, [tapCount, aggMistakes, tapTimeLeft]);

  const calculateSnkStars = useCallback((): number => {
    const passCount = snkPassResults.filter(Boolean).length;
    const colorMatch = snkColorIdx === sneakerTarget.colorIdx;
    const patternMatch = snkPattern === sneakerTarget.pattern;
    const textureMatch = snkTexture === sneakerTarget.texture;
    const perfectDisguise = colorMatch && patternMatch && textureMatch;

    if (passCount === 0) return 1;
    if (passCount === 1) return 2;
    if (passCount === 2 && !perfectDisguise) return 3;
    if (passCount === 3 && !perfectDisguise) return 4;
    if (passCount === 3 && perfectDisguise && snkFlashes === 0) return 5;
    return 3;
  }, [snkPassResults, snkColorIdx, snkPattern, snkTexture, sneakerTarget, snkFlashes]);

  const calculateRetStars = useCallback((): number => {
    if (!retSuccess && retAttempts >= RETREAT_OPPORTUNITIES) return 1;
    if (!retSuccess) return 1;
    if (retEarlyTaps > 0) return 2;
    if (retAttempts === 1 && retEarlyTaps === 0) return 5;
    return 3;
  }, [retSuccess, retAttempts, retEarlyTaps]);

  const handleResult = useCallback(() => {
    let stars = 1;
    const metrics: { label: string; value: string }[] = [];

    if (chosenPath === 'aggressive') {
      stars = calculateAggStars();
      const tapSuccess = tapCount >= TAP_TARGET;
      metrics.push(
        { label: 'Strategy', value: 'Aggressive Display' },
        { label: 'Display Order Mistakes', value: String(aggMistakes) },
        { label: 'Intensity Reached', value: `${intensity}%` },
        { label: 'Tap Contest', value: tapSuccess ? `Won (${tapCount} taps)` : `Lost (${tapCount}/${TAP_TARGET})` },
        { label: 'Time Remaining', value: `${(tapTimeLeft / 1000).toFixed(1)}s` },
      );

      if (stars === 0 || (!tapSuccess && aggMistakes > 2)) {
        onFail(
          'Your display was too weak to intimidate the rival.',
          'Male cuttlefish use escalating chromatic displays to establish dominance. The zebra pattern, passing clouds, and intense flashes are shown in specific sequences to signal increasing aggression. Weak displays invite challenge.',
        );
        return;
      }
    } else if (chosenPath === 'sneaker') {
      stars = calculateSnkStars();
      const passCount = snkPassResults.filter(Boolean).length;
      metrics.push(
        { label: 'Strategy', value: 'Sneaker Male' },
        { label: 'Passes Undetected', value: `${passCount}/3` },
        { label: 'Disguise Quality', value: snkColorIdx === sneakerTarget.colorIdx && snkPattern === sneakerTarget.pattern && snkTexture === sneakerTarget.texture ? 'Perfect' : 'Partial' },
        { label: 'Chromatophore Flashes', value: String(snkFlashes) },
        { label: 'Detections', value: String(snkDetections) },
      );

      if (passCount === 0) {
        onFail(
          'You were detected on every pass. The rival drove you away.',
          'Smaller male cuttlefish sometimes disguise themselves as females to sneak past dominant males. They suppress their aggressive chromatic patterns and mimic female coloration and texture to avoid detection.',
        );
        return;
      }
    } else {
      stars = calculateRetStars();
      metrics.push(
        { label: 'Strategy', value: 'Tactical Retreat' },
        { label: 'Outcome', value: retSuccess ? 'Found fatigue window' : 'Missed opportunity' },
        { label: 'Approach Attempts', value: `${retAttempts}/${RETREAT_OPPORTUNITIES}` },
        { label: 'Early/Late Taps', value: String(retEarlyTaps) },
        { label: 'Wait Time', value: `${(retElapsed / 1000).toFixed(1)}s` },
      );

      if (!retSuccess) {
        onFail(
          'You could not find the right moment to re-approach.',
          'Cuttlefish sometimes retreat from a dominant rival and wait for signs of fatigue - dulling colors, slower movements - before re-approaching. Timing is critical: too early means detection, too late means the opportunity passes.',
        );
        return;
      }
    }

    onComplete(stars, metrics);
  }, [chosenPath, calculateAggStars, calculateSnkStars, calculateRetStars,
    tapCount, aggMistakes, intensity, tapTimeLeft, snkPassResults,
    snkColorIdx, snkPattern, snkTexture, sneakerTarget, snkFlashes, snkDetections,
    retSuccess, retAttempts, retEarlyTaps, retElapsed,
    onComplete, onFail]);

  // Auto-trigger result when entering result phases
  useEffect(() => {
    if (phase === 'agg-result' || phase === 'snk-result' || phase === 'ret-result') {
      const timeout = setTimeout(handleResult, 600);
      return () => clearTimeout(timeout);
    }
  }, [phase, handleResult]);

  /* ---- Rival visual ------------------------------------------------- */

  const rivalSaturation = useMemo(() => {
    if (phase !== 'ret-watch') return 100;
    const fatigueOffset = (attemptNumber * 1337) % 3000;
    const fatigueStart = FATIGUE_START_MS + fatigueOffset;
    const fatigueEnd = fatigueStart + FATIGUE_WINDOW_MS;

    if (retElapsed < fatigueStart) {
      // Slowly desaturate as we approach fatigue
      return 100 - (retElapsed / fatigueStart) * 30;
    }
    if (retElapsed >= fatigueStart && retElapsed < fatigueEnd) {
      return 40; // Clearly fatigued
    }
    return 70; // Recovering
  }, [phase, retElapsed, attemptNumber]);

  /* ---- Tutorial ----------------------------------------------------- */

  if (showTutorial) {
    return <RivalTutorial onDone={() => setShowTutorial(false)} />;
  }

  /* ---- Pause overlay ------------------------------------------------ */

  if (paused) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-dark flex flex-col items-center justify-center px-6">
        <h2 className="font-pixel text-sm text-rarity-legendary mb-6">PAUSED</h2>
        <div className="card mb-6 max-w-sm text-left">
          <h3 className="font-pixel text-[9px] text-border-active mb-3">BRIEFING RECAP</h3>
          <p className="text-text-secondary text-xs leading-relaxed">
            {chosenPath === 'aggressive' && 'Show display patterns in the correct escalation order, then win the physical contest with rapid taps.'}
            {chosenPath === 'sneaker' && 'Disguise yourself as a female by matching coloration, pattern, and texture. Hold suppress during close passes.'}
            {chosenPath === 'retreat' && 'Watch the rival for fatigue signals (dulling colors, slow movement). Re-approach during the fatigue window.'}
            {!chosenPath && 'Choose a tactic to challenge the rival male: Aggressive Display, Sneaker Male, or Tactical Retreat.'}
          </p>
        </div>
        <button onClick={() => { sfxTap(); setPaused(false); }} className="btn btn-primary text-[10px]">
          Resume
        </button>
      </div>
    );
  }

  /* ---- Phase: Choose Tactic ----------------------------------------- */

  if (phase === 'choose-tactic') {
    return (
      <div className="fixed inset-0 z-30 bg-bg-dark flex flex-col game-viewport">
        <UnderwaterBg brightness={0.35} />
        <div className="flex items-center justify-between p-4 border-b-2 border-border-subtle shrink-0">
          <span className="font-pixel text-[10px] text-rarity-legendary">RIVAL ENCOUNTER</span>
          <div className="flex items-center gap-2">
            {attemptNumber > 1 && (
              <span className="font-pixel text-[7px] text-text-muted">Attempt #{attemptNumber}</span>
            )}
            <button onClick={() => { sfxTap(); setPaused(true); }} className="btn text-[8px] py-2 px-4">Pause</button>
          </div>
        </div>

        <div className="px-4 py-3 shrink-0">
          <p className="text-text-secondary text-xs leading-relaxed">
            A rival male blocks your path to the female. Choose your tactic.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-4 justify-center">
          {/* Aggressive Card */}
          <button
            onClick={() => handleChooseTactic('aggressive')}
            className="w-full text-left card transition-all duration-200 border-danger"
            style={{ minHeight: 100 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-btn flex items-center justify-center shrink-0 text-3xl"
                style={{ background: 'rgba(163,45,45,0.2)' }}>
                {'\u{1F525}'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-pixel text-[10px] text-danger leading-relaxed">AGGRESSIVE DISPLAY</h3>
                <p className="text-text-muted text-[10px] mt-1">
                  Challenge with escalating chromatic patterns. Overpower the rival.
                </p>
              </div>
            </div>
          </button>

          {/* Sneaker Card */}
          <button
            onClick={() => handleChooseTactic('sneaker')}
            className="w-full text-left card transition-all duration-200 border-rarity-rare"
            style={{ minHeight: 100 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-btn flex items-center justify-center shrink-0 text-3xl"
                style={{ background: 'rgba(55,138,221,0.2)' }}>
                {'\u{1F3AD}'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-pixel text-[10px] text-rarity-rare leading-relaxed">SNEAKER MALE</h3>
                <p className="text-text-muted text-[10px] mt-1">
                  Disguise as female. Slip past the rival undetected.
                </p>
              </div>
            </div>
          </button>

          {/* Retreat Card */}
          <button
            onClick={() => handleChooseTactic('retreat')}
            className="w-full text-left card transition-all duration-200 border-rarity-epic"
            style={{ minHeight: 100 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-btn flex items-center justify-center shrink-0 text-3xl"
                style={{ background: 'rgba(127,119,221,0.2)' }}>
                {'\u{1F440}'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-pixel text-[10px] text-rarity-epic leading-relaxed">TACTICAL RETREAT</h3>
                <p className="text-text-muted text-[10px] mt-1">
                  Retreat and watch. Return when the rival tires.
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  /* ---- Phase: Aggressive Display ------------------------------------ */

  if (phase === 'agg-display') {
    return (
      <div className="fixed inset-0 z-30 bg-bg-dark flex flex-col game-viewport">
        <UnderwaterBg brightness={0.35} />
        <div className="flex items-center justify-between p-4 border-b-2 border-border-subtle shrink-0">
          <span className="font-pixel text-[10px] text-danger">DISPLAY SEQUENCE</span>
          <button onClick={() => { sfxTap(); setPaused(true); }} className="btn text-[8px] py-2 px-4">Pause</button>
        </div>

        {/* Intensity meter */}
        <div className="px-4 py-3 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[7px] text-text-muted">INTENSITY</span>
            <span className="font-pixel text-[7px] text-danger">{intensity}%</span>
          </div>
          <div className="w-full h-3 bg-bg-surface rounded-full border border-border-subtle overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${intensity}%`,
                background: `linear-gradient(90deg, #A32D2D, #EF9F27)`,
              }}
            />
          </div>
          <p className="text-text-muted text-[10px] mt-2">
            Step {displayStep + 1} of {CORRECT_ORDER.length}: Choose the correct escalation pattern
          </p>
          {aggMistakes > 0 && (
            <p className="text-danger text-[10px] mt-1">Mistakes: {aggMistakes}</p>
          )}
        </div>

        {/* Rival display area */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-xs">
            {/* Show the current sequence so far */}
            <div className="flex gap-2 justify-center mb-4 flex-wrap">
              {displayOrder.map((idx, i) => (
                <div
                  key={i}
                  className="px-2 py-1 rounded-btn font-pixel text-[7px]"
                  style={{ background: PATTERN_COLORS[idx], color: '#fff' }}
                >
                  {DISPLAY_PATTERNS[idx]}
                </div>
              ))}
              <div className="px-2 py-1 rounded-btn font-pixel text-[7px] border-2 border-dashed border-text-muted text-text-muted">
                ?
              </div>
            </div>

            {/* Rival cuttlefish visual */}
            <div
              className="w-32 h-32 mx-auto rounded-full mb-4 flex items-center justify-center"
              style={{
                background: `radial-gradient(circle, ${PATTERN_COLORS[CORRECT_ORDER[displayStep]] || '#444'}44, var(--bg-surface))`,
                border: '3px solid var(--border-subtle)',
                animation: intensity > 60 ? 'pulse 0.5s infinite' : undefined,
              }}
            >
              <span className="text-5xl">{'\u{1F991}'}</span>
            </div>
          </div>
        </div>

        {/* Pattern buttons */}
        <div className="px-4 pb-6 pt-2 border-t-2 border-border-subtle shrink-0">
          <div className="grid grid-cols-2 gap-2">
            {DISPLAY_PATTERNS.map((name, idx) => (
              <button
                key={idx}
                onClick={() => handleDisplayChoice(idx)}
                className="btn text-[8px] py-3 px-2"
                style={{
                  borderColor: PATTERN_COLORS[idx],
                  color: PATTERN_COLORS[idx],
                  minHeight: 44,
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---- Phase: Aggressive Tap Contest -------------------------------- */

  if (phase === 'agg-tap') {
    const progress = Math.min(100, (tapCount / TAP_TARGET) * 100);
    const timeProgress = (tapTimeLeft / TAP_TIME_MS) * 100;

    return (
      <div className="fixed inset-0 z-30 bg-bg-dark flex flex-col game-viewport">
        <UnderwaterBg brightness={0.35} />
        <div className="flex items-center justify-between p-4 border-b-2 border-border-subtle shrink-0">
          <span className="font-pixel text-[10px] text-danger">PHYSICAL CONTEST</span>
          <button onClick={() => { sfxTap(); setPaused(true); }} className="btn text-[8px] py-2 px-4">Pause</button>
        </div>

        {/* Timer bar */}
        <div className="px-4 py-2 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[7px] text-text-muted">TIME</span>
            <span className="font-pixel text-[7px]" style={{ color: timeProgress < 30 ? '#A32D2D' : 'var(--text-muted)' }}>
              {(tapTimeLeft / 1000).toFixed(1)}s
            </span>
          </div>
          <div className="w-full h-2 bg-bg-surface rounded-full border border-border-subtle overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${timeProgress}%`,
                background: timeProgress < 30 ? '#A32D2D' : 'var(--border-active)',
                transition: 'width 0.05s linear',
              }}
            />
          </div>
        </div>

        {/* Tap progress */}
        <div className="px-4 py-2 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[7px] text-text-muted">POWER</span>
            <span className="font-pixel text-[7px] text-rarity-legendary">{tapCount}/{TAP_TARGET}</span>
          </div>
          <div className="w-full h-3 bg-bg-surface rounded-full border border-border-subtle overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #A32D2D, #EF9F27)',
              }}
            />
          </div>
        </div>

        {/* Big tap button */}
        <div className="flex-1 flex items-center justify-center px-4">
          <button
            onClick={handleTap}
            className="w-48 h-48 rounded-full flex flex-col items-center justify-center transition-transform active:scale-90"
            style={{
              background: `radial-gradient(circle, #A32D2D, #6A1E1E)`,
              border: '4px solid #EF9F27',
              boxShadow: `0 0 ${20 + tapCount * 2}px rgba(163,45,45,0.5)`,
            }}
          >
            <span className="text-4xl mb-1">{'\u{1F44A}'}</span>
            <span className="font-pixel text-[8px] text-white">TAP!</span>
          </button>
        </div>

        <div className="px-4 pb-6 shrink-0 text-center">
          <p className="font-pixel text-[8px] text-text-muted">
            Tap rapidly to overpower the rival!
          </p>
        </div>
      </div>
    );
  }

  /* ---- Phase: Sneaker Memorize -------------------------------------- */

  if (phase === 'snk-memorize') {
    return (
      <div className="fixed inset-0 z-30 bg-bg-dark flex flex-col items-center justify-center game-viewport px-6">
        <UnderwaterBg brightness={0.35} />
        <div className="absolute top-4 right-4">
          <button onClick={() => { sfxTap(); setPaused(true); }} className="btn text-[8px] py-2 px-4">Pause</button>
        </div>

        <h2 className="font-pixel text-[10px] text-rarity-rare mb-4">MEMORIZE THE FEMALE</h2>
        <p className="text-text-muted text-[10px] mb-4">Disappears in {snkMemorizeTime}s...</p>

        {/* Female appearance target */}
        <div className="card mb-4" style={{ borderColor: 'var(--rarity-rare)' }}>
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-btn flex items-center justify-center"
              style={{
                background: FEMALE_COLORS[sneakerTarget.colorIdx],
                backgroundImage: sneakerTarget.pattern === 'mottled'
                  ? 'radial-gradient(circle at 30% 30%, rgba(0,0,0,0.2) 10%, transparent 11%), radial-gradient(circle at 70% 60%, rgba(0,0,0,0.2) 8%, transparent 9%)'
                  : sneakerTarget.pattern === 'striped'
                    ? 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 8px)'
                    : 'none',
                filter: sneakerTarget.texture ? 'contrast(1.1)' : 'none',
              }}
            >
              <span className="text-3xl">{'\u{1F991}'}</span>
            </div>
            <div>
              <p className="font-pixel text-[8px] text-text-primary mb-1">
                Color: <span style={{ color: FEMALE_COLORS[sneakerTarget.colorIdx] }}>{FEMALE_COLORS[sneakerTarget.colorIdx]}</span>
              </p>
              <p className="font-pixel text-[8px] text-text-primary mb-1">
                Pattern: {sneakerTarget.pattern}
              </p>
              <p className="font-pixel text-[8px] text-text-primary">
                Texture: {sneakerTarget.texture ? 'rough' : 'smooth'}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-xs h-2 bg-bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-rarity-rare rounded-full transition-all duration-1000"
            style={{ width: `${(snkMemorizeTime / 4) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  /* ---- Phase: Sneaker Disguise -------------------------------------- */

  if (phase === 'snk-disguise') {
    return (
      <div className="fixed inset-0 z-30 bg-bg-dark flex flex-col game-viewport">
        <UnderwaterBg brightness={0.35} />
        <div className="flex items-center justify-between p-4 border-b-2 border-border-subtle shrink-0">
          <span className="font-pixel text-[10px] text-rarity-rare">MATCH DISGUISE</span>
          <button onClick={() => { sfxTap(); setPaused(true); }} className="btn text-[8px] py-2 px-4">Pause</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Preview of your disguise */}
          <div className="flex justify-center mb-4">
            <div
              className="w-24 h-24 rounded-btn flex items-center justify-center border-2 border-border-active"
              style={{
                background: FEMALE_COLORS[snkColorIdx],
                backgroundImage: snkPattern === 'mottled'
                  ? 'radial-gradient(circle at 30% 30%, rgba(0,0,0,0.2) 10%, transparent 11%), radial-gradient(circle at 70% 60%, rgba(0,0,0,0.2) 8%, transparent 9%)'
                  : snkPattern === 'striped'
                    ? 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 8px)'
                    : 'none',
                filter: snkTexture ? 'contrast(1.1)' : 'none',
              }}
            >
              <span className="text-4xl">{'\u{1F991}'}</span>
            </div>
          </div>

          {/* Color palette */}
          <div className="mb-4">
            <span className="font-pixel text-[8px] text-text-muted block mb-2">COLOR</span>
            <div className="grid grid-cols-6 gap-2">
              {FEMALE_COLORS.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => { sfxTap(); setSnkColorIdx(idx); }}
                  className="w-full aspect-square rounded-btn transition-all"
                  style={{
                    background: color,
                    border: snkColorIdx === idx ? '3px solid var(--border-active)' : '2px solid var(--border-subtle)',
                    boxShadow: snkColorIdx === idx ? '0 0 8px var(--border-active)' : 'none',
                    minHeight: 44,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Pattern selection */}
          <div className="mb-4">
            <span className="font-pixel text-[8px] text-text-muted block mb-2">PATTERN</span>
            <div className="grid grid-cols-3 gap-2">
              {FEMALE_PATTERNS.map(pat => (
                <button
                  key={pat}
                  onClick={() => { sfxTap(); setSnkPattern(pat); }}
                  className="btn text-[8px] py-3"
                  style={{
                    borderColor: snkPattern === pat ? 'var(--border-active)' : 'var(--border-subtle)',
                    background: snkPattern === pat ? 'rgba(83,74,183,0.2)' : 'var(--bg-surface)',
                    minHeight: 44,
                  }}
                >
                  {pat}
                </button>
              ))}
            </div>
          </div>

          {/* Texture toggle */}
          <div className="mb-4">
            <span className="font-pixel text-[8px] text-text-muted block mb-2">TEXTURE</span>
            <button
              onClick={() => { sfxTap(); setSnkTexture(!snkTexture); }}
              className="btn w-full text-[8px] py-3"
              style={{
                borderColor: 'var(--border-active)',
                background: snkTexture ? 'rgba(83,74,183,0.3)' : 'var(--bg-surface)',
                minHeight: 44,
              }}
            >
              {snkTexture ? 'ROUGH (active)' : 'SMOOTH (active)'}
            </button>
          </div>
        </div>

        {/* Confirm */}
        <div className="p-4 border-t-2 border-border-subtle shrink-0">
          <button
            onClick={handleSnkConfirmDisguise}
            className="btn btn-primary w-full text-[10px]"
          >
            Begin Approach
          </button>
        </div>
      </div>
    );
  }

  /* ---- Phase: Sneaker Passes ---------------------------------------- */

  if (phase === 'snk-passes') {
    return (
      <div className="fixed inset-0 z-30 bg-bg-dark flex flex-col game-viewport">
        <UnderwaterBg brightness={0.35} />
        <div className="flex items-center justify-between p-4 border-b-2 border-border-subtle shrink-0">
          <span className="font-pixel text-[10px] text-rarity-rare">PASS {snkPassIndex + 1}/3</span>
          <button onClick={() => { sfxTap(); setPaused(true); }} className="btn text-[8px] py-2 px-4">Pause</button>
        </div>

        {/* Pass results so far */}
        <div className="flex justify-center gap-3 py-3 shrink-0">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-8 h-8 rounded-full flex items-center justify-center font-pixel text-[8px]"
              style={{
                background: i < snkPassResults.length
                  ? (snkPassResults[i] ? 'rgba(59,109,17,0.3)' : 'rgba(163,45,45,0.3)')
                  : 'var(--bg-surface)',
                border: `2px solid ${i < snkPassResults.length
                  ? (snkPassResults[i] ? 'var(--success)' : 'var(--danger)')
                  : i === snkPassIndex ? 'var(--border-active)' : 'var(--border-subtle)'}`,
              }}
            >
              {i < snkPassResults.length ? (snkPassResults[i] ? '\u2713' : '\u2717') : (i + 1)}
            </div>
          ))}
        </div>

        {/* Pass visualization */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {snkPassActive ? (
            <>
              {/* Moving cuttlefish */}
              <div className="relative w-full max-w-xs h-32 mb-4">
                {/* Rival */}
                <div
                  className="absolute top-0 right-4 text-4xl"
                  style={{ animation: 'pulse 1s infinite' }}
                >
                  {'\u{1F991}'}
                  <span className="font-pixel text-[6px] text-danger block text-center">RIVAL</span>
                </div>
                {/* Player sneaking */}
                <div
                  className="absolute top-8 text-3xl"
                  style={{
                    left: `${Math.min(70, (1 - snkPassTimer / 2000) * 80)}%`,
                    transition: 'left 0.05s linear',
                  }}
                >
                  {'\u{1F991}'}
                  <span className="font-pixel text-[6px] text-rarity-rare block text-center">YOU</span>
                </div>
              </div>

              {/* Timer bar */}
              <div className="w-full max-w-xs h-2 bg-bg-surface rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-rarity-rare rounded-full"
                  style={{ width: `${(snkPassTimer / 2000) * 100}%`, transition: 'width 0.05s linear' }}
                />
              </div>

              {/* Suppress button - must be HELD */}
              <button
                onPointerDown={() => { setSnkSuppressed(true); sfxTap(); }}
                onPointerUp={() => { setSnkSuppressed(false); handleSnkFlash(); }}
                onPointerLeave={() => {
                  if (snkSuppressed) {
                    setSnkSuppressed(false);
                    handleSnkFlash();
                  }
                }}
                className="btn w-full max-w-xs text-[10px] py-4 select-none"
                style={{
                  borderColor: snkSuppressed ? 'var(--success)' : 'var(--danger)',
                  background: snkSuppressed ? 'rgba(59,109,17,0.3)' : 'rgba(163,45,45,0.2)',
                  minHeight: 56,
                }}
              >
                {snkSuppressed ? 'SUPPRESSING... (hold)' : 'HOLD TO SUPPRESS'}
              </button>

              {snkFlashes > 0 && (
                <p className="font-pixel text-[7px] text-danger mt-2">
                  Chromatophore flashes: {snkFlashes}
                </p>
              )}
            </>
          ) : (
            <div className="text-center">
              <p className="font-pixel text-[9px] text-text-muted mb-2">
                {snkPassIndex < 3 ? 'Preparing next pass...' : 'All passes complete'}
              </p>
              <div className="w-8 h-8 border-2 border-border-active border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---- Phase: Retreat Watch ----------------------------------------- */

  if (phase === 'ret-watch') {
    const elapsedSec = (retElapsed / 1000).toFixed(1);

    return (
      <div className="fixed inset-0 z-30 bg-bg-dark flex flex-col game-viewport">
        <UnderwaterBg brightness={0.35} />
        <div className="flex items-center justify-between p-4 border-b-2 border-border-subtle shrink-0">
          <span className="font-pixel text-[10px] text-rarity-epic">WATCHING RIVAL</span>
          <button onClick={() => { sfxTap(); setPaused(true); }} className="btn text-[8px] py-2 px-4">Pause</button>
        </div>

        <div className="px-4 py-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[7px] text-text-muted">TIME ELAPSED</span>
            <span className="font-pixel text-[7px] text-text-muted">{elapsedSec}s</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-pixel text-[7px] text-text-muted">ATTEMPTS LEFT</span>
            <span className="font-pixel text-[7px] text-rarity-epic">{RETREAT_OPPORTUNITIES - retAttempts}</span>
          </div>
        </div>

        {/* Rival cuttlefish display */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="relative mb-6">
            <div
              className="w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500"
              style={{
                background: `radial-gradient(circle, hsla(${retFatigueVisible ? 30 : 0}, ${rivalSaturation}%, ${retFatigueVisible ? 30 : 50}%, 0.3), var(--bg-surface))`,
                border: `3px solid ${retFatigueVisible ? 'var(--warning)' : 'var(--border-subtle)'}`,
                filter: `saturate(${rivalSaturation}%)`,
              }}
            >
              <span className="text-6xl" style={{
                transition: 'transform 0.5s',
                transform: retFatigueVisible ? 'scale(0.85) rotate(-5deg)' : 'scale(1) rotate(0deg)',
              }}>
                {'\u{1F991}'}
              </span>
            </div>

            {/* Subtle fatigue indicators */}
            {retFatigueVisible && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <span className="font-pixel text-[7px] text-warning animate-pulse">
                  colors dulling...
                </span>
              </div>
            )}
          </div>

          <p className="text-text-muted text-[10px] text-center mb-2">
            Watch for signs of fatigue. Dulling colors, slower movement.
          </p>

          {retEarlyTaps > 0 && (
            <p className="font-pixel text-[7px] text-danger mb-2">
              Detected! {RETREAT_OPPORTUNITIES - retAttempts} chance{RETREAT_OPPORTUNITIES - retAttempts !== 1 ? 's' : ''} left
            </p>
          )}
        </div>

        {/* Re-approach button */}
        <div className="p-4 border-t-2 border-border-subtle shrink-0">
          <button
            onClick={handleRetApproach}
            disabled={retAttempts >= RETREAT_OPPORTUNITIES}
            className="btn btn-primary w-full text-[10px] py-4"
            style={{ minHeight: 56 }}
          >
            RE-APPROACH NOW
          </button>
        </div>
      </div>
    );
  }

  /* ---- Phase: Results (brief loading while calculating) ------------- */

  return (
    <div className="fixed inset-0 z-30 bg-bg-dark flex flex-col items-center justify-center game-viewport">
      <UnderwaterBg brightness={0.35} />
      <div className="w-8 h-8 border-2 border-border-active border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-pixel text-[9px] text-text-muted">Evaluating outcome...</p>
    </div>
  );
}
