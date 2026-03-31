'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  sfxTap,
  sfxCorrect,
  sfxWrong,
  sfxTentacleStrike,
  sfxDetectionWarning,
  sfxCamouflageActivate,
} from '@/lib/audio';
import { UnderwaterBg, CreatureSprite } from '@/components/sprites';

/* ─── types ─── */

interface JuvenileHuntingProps {
  onComplete: (stars: number, metrics: { label: string; value: string }[]) => void;
  onFail: (reason: string, explanation: string) => void;
  attemptNumber: number;
}

type Phase = 'stalk' | 'hypnosis' | 'strike' | 'done';

interface Vec2 {
  x: number;
  y: number;
}

/* substrate color names */
const SUBSTRATES = ['sand', 'rock', 'coral', 'kelp'] as const;
type Substrate = (typeof SUBSTRATES)[number];

const SUBSTRATE_COLORS: Record<Substrate, string> = {
  sand: '#c2a869',
  rock: '#6b6b7b',
  coral: '#c75050',
  kelp: '#3b7a3b',
};

/* ─── constants ─── */

const ARENA_W = 360;
const ARENA_H = 480;
const PREY_RADIUS = 14;
const PLAYER_RADIUS = 12;
const STALK_DETECT_THRESHOLD = 75;
const SUBSTRATE_CHANGE_INTERVAL = 4000; // ms between substrate shifts
const RHYTHM_BEATS = 8;
const METRONOME_PERIOD = 900; // ms per sweep
const HIT_WINDOW = 120; // ms tolerance for rhythm hit
const STRIKE_WINDOW = 1500; // ms
const ENGAGE_DIST = 60; // px distance to enter hypnosis

/* ─── tutorial ─── */

function HuntingTutorial({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: 'Advanced Hunting',
      body: "You've grown bigger, and now you hunt crabs using a sophisticated three-phase attack:\n\n  1. Stalk — sneak close\n  2. Hypnotize — mesmerize with rhythmic displays\n  3. Strike — grab the stunned prey",
    },
    {
      title: 'Phase 1: Stalk',
      body: "Use the joystick to creep toward the crab. Watch the DETECTION meter — if it fills up, the crab escapes!\n\nStay hidden by:\n  • Moving slowly (fast = detected)\n  • Pressing MATCH to camouflage your color\n  • Pressing FLAT to flatten your body\n\nThe substrate color changes — keep pressing MATCH to stay camouflaged!",
    },
    {
      title: 'Phase 2: Hypnotize',
      body: "Once you're close enough, you start your Passing Cloud display — a mesmerizing wave pattern across your skin.\n\nTap the button IN RHYTHM with the markers on the metronome bar. Hit 8 beats accurately to fully hypnotize the crab.\n\nMissing beats breaks the spell!",
    },
    {
      title: 'Phase 3: Strike!',
      body: "The crab is stunned — you have 1.5 seconds to strike!\n\nTap the right side of the screen to lunge. The faster you react, the better your score.\n\nGood luck, hunter!",
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
          {step === steps.length - 1 ? 'Begin the Hunt!' : 'Next'}
        </button>
      </div>
    </div>
  );
}

/* ─── component ─── */

export default function JuvenileHunting({ onComplete, onFail, attemptNumber }: JuvenileHuntingProps) {
  const [showTutorial, setShowTutorial] = useState(attemptNumber === 1);
  /* Higher attempts = tighter detection threshold (harder prey) */
  const detectThreshold = Math.max(50, STALK_DETECT_THRESHOLD - (attemptNumber - 1) * 5);

  /* ─── game state ─── */
  const [phase, setPhase] = useState<Phase>('stalk');
  const [paused, setPaused] = useState(false);

  /* stalk */
  const [playerPos, setPlayerPos] = useState<Vec2>({ x: ARENA_W / 2, y: ARENA_H - 60 });
  const [preyPos] = useState<Vec2>(() => ({
    x: ARENA_W / 2 + (Math.random() - 0.5) * 120,
    y: 80 + Math.random() * 40,
  }));
  const [detection, setDetection] = useState(0);
  const [currentSubstrate, setCurrentSubstrate] = useState<Substrate>('sand');
  const [matchedColor, setMatchedColor] = useState<Substrate>('sand');
  const [isFlat, setIsFlat] = useState(true);
  const [colorMatchPct, setColorMatchPct] = useState(100);
  const [flatEntireTime, setFlatEntireTime] = useState(true);
  const [peakDetection, setPeakDetection] = useState(0);
  const [preyBolted, setPreyBolted] = useState(false);

  /* joystick */
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickOrigin, setJoystickOrigin] = useState<Vec2>({ x: 0, y: 0 });
  const [joystickDelta, setJoystickDelta] = useState<Vec2>({ x: 0, y: 0 });
  const joystickSpeed = useRef(0);

  /* hypnosis */
  const [rhythmIndex, setRhythmIndex] = useState(0);
  const [metronomePos, setMetronomePos] = useState(0); // 0..1
  const [rhythmMissed, setRhythmMissed] = useState(false);
  const [perfectRhythm, setPerfectRhythm] = useState(true);
  const rhythmStartRef = useRef(0);
  const beatMarkersRef = useRef<number[]>([]);

  /* strike */
  const [strikeStart, setStrikeStart] = useState(0);
  const [strikeHit, setStrikeHit] = useState(false);
  const [strikeTime, setStrikeTime] = useState(0); // ms within window when struck
  const [strikeMissed, setStrikeMissed] = useState(false);
  const [firstStrike, setFirstStrike] = useState(true);

  /* tracking */
  const totalColorSamplesRef = useRef(0);
  const matchedColorSamplesRef = useRef(0);
  const frameRef = useRef(0);
  const lastSubstrateChangeRef = useRef(Date.now());
  const gameLoopRef = useRef<number>(0);
  const arenaRef = useRef<HTMLDivElement>(null);

  /* ─── substrate cycling ─── */
  const pickNextSubstrate = useCallback(() => {
    setCurrentSubstrate((prev) => {
      const others = SUBSTRATES.filter((s) => s !== prev);
      return others[Math.floor(Math.random() * others.length)];
    });
    lastSubstrateChangeRef.current = Date.now();
  }, []);

  /* ─── game loop ─── */
  useEffect(() => {
    if (phase !== 'stalk' || paused || preyBolted) return;

    let running = true;
    const loop = () => {
      if (!running) return;
      frameRef.current++;

      /* substrate change */
      if (Date.now() - lastSubstrateChangeRef.current > SUBSTRATE_CHANGE_INTERVAL) {
        pickNextSubstrate();
      }

      /* track color match samples */
      totalColorSamplesRef.current++;
      if (matchedColor === currentSubstrate) {
        matchedColorSamplesRef.current++;
      }
      const colorPct =
        totalColorSamplesRef.current > 0
          ? Math.round((matchedColorSamplesRef.current / totalColorSamplesRef.current) * 100)
          : 100;
      setColorMatchPct(colorPct);

      /* movement */
      const speed = joystickSpeed.current;
      if (speed > 0 && joystickActive) {
        const mag = Math.sqrt(joystickDelta.x ** 2 + joystickDelta.y ** 2) || 1;
        const nx = joystickDelta.x / mag;
        const ny = joystickDelta.y / mag;
        const moveSpeed = speed * 1.8;
        setPlayerPos((prev) => ({
          x: Math.max(PLAYER_RADIUS, Math.min(ARENA_W - PLAYER_RADIUS, prev.x + nx * moveSpeed)),
          y: Math.max(PLAYER_RADIUS, Math.min(ARENA_H - PLAYER_RADIUS, prev.y + ny * moveSpeed)),
        }));
      }

      /* detection change */
      setDetection((prev) => {
        let delta = -0.2; // natural decay
        if (speed > 0.5) delta += speed * 0.8; // moving too fast
        if (matchedColor !== currentSubstrate) delta += 0.4; // color mismatch
        if (!isFlat) delta += 0.3; // not flat
        const next = Math.max(0, Math.min(100, prev + delta));
        if (next > peakDetection) setPeakDetection(next);
        if (next >= detectThreshold) {
          setPreyBolted(true);
        }
        return next;
      });

      /* check engagement distance */
      setPlayerPos((pp) => {
        const dx = pp.x - preyPos.x;
        const dy = pp.y - preyPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= ENGAGE_DIST && !preyBolted) {
          setPhase('hypnosis');
        }
        return pp;
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, [
    phase,
    paused,
    preyBolted,
    joystickActive,
    joystickDelta,
    matchedColor,
    currentSubstrate,
    isFlat,
    peakDetection,
    preyPos,
    pickNextSubstrate,
    detectThreshold,
  ]);

  /* ─── prey bolted → fail ─── */
  useEffect(() => {
    if (preyBolted) {
      sfxWrong();
      const timer = setTimeout(() => {
        onFail(
          'The prey detected you and escaped!',
          'Cuttlefish are ambush predators that rely on stealth. Moving too fast, failing to match the substrate color, or not maintaining a flattened body profile will alert prey. In the wild, detection means losing a meal and expending precious energy.',
        );
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [preyBolted, onFail]);

  /* ─── flat toggled off tracking ─── */
  useEffect(() => {
    if (!isFlat) setFlatEntireTime(false);
  }, [isFlat]);

  /* ─── hypnosis metronome ─── */
  useEffect(() => {
    if (phase !== 'hypnosis' || paused) return;

    /* generate beat markers evenly spaced */
    const markers: number[] = [];
    for (let i = 0; i < RHYTHM_BEATS; i++) {
      markers.push((i + 1) / (RHYTHM_BEATS + 1));
    }
    beatMarkersRef.current = markers;
    rhythmStartRef.current = Date.now();
    setRhythmIndex(0);
    setMetronomePos(0);

    let running = true;
    const loop = () => {
      if (!running) return;
      const elapsed = Date.now() - rhythmStartRef.current;
      const sweepPos = (elapsed % METRONOME_PERIOD) / METRONOME_PERIOD;
      setMetronomePos(sweepPos);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      running = false;
    };
  }, [phase, paused]);

  /* ─── auto-fail metronome if marker missed ─── */
  useEffect(() => {
    if (phase !== 'hypnosis' || paused || rhythmIndex >= RHYTHM_BEATS) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - rhythmStartRef.current;
      const sweepPos = (elapsed % METRONOME_PERIOD) / METRONOME_PERIOD;
      const marker = beatMarkersRef.current[rhythmIndex];
      /* if the metronome has passed the marker + tolerance, it was missed */
      const markerTime = marker * METRONOME_PERIOD;
      const currentTime = elapsed % METRONOME_PERIOD;
      if (currentTime > markerTime + HIT_WINDOW && sweepPos > marker + 0.15) {
        setPerfectRhythm(false);
        setRhythmMissed(true);
        sfxWrong();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [phase, paused, rhythmIndex]);

  /* ─── rhythm miss → fail ─── */
  useEffect(() => {
    if (rhythmMissed) {
      const timer = setTimeout(() => {
        onFail(
          'The prey snapped out of the hypnotic display!',
          'Cuttlefish use rhythmic "passing cloud" displays - dark bands flowing across their skin - to mesmerize prey. The timing must be consistent. If the rhythm breaks, the prey escapes the trance and flees.',
        );
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [rhythmMissed, onFail]);

  /* ─── all beats hit → enter strike ─── */
  useEffect(() => {
    if (phase === 'hypnosis' && rhythmIndex >= RHYTHM_BEATS && !rhythmMissed) {
      sfxCorrect();
      const timer = setTimeout(() => {
        setPhase('strike');
        setStrikeStart(Date.now());
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [phase, rhythmIndex, rhythmMissed]);

  /* ─── strike window timer ─── */
  useEffect(() => {
    if (phase !== 'strike' || paused || strikeHit) return;
    const timer = setTimeout(() => {
      setStrikeMissed(true);
      setFirstStrike(false);
      sfxWrong();
      /* restart with harder prey */
      const restart = setTimeout(() => {
        setPhase('stalk');
        setDetection(0);
        setPlayerPos({ x: ARENA_W / 2, y: ARENA_H - 60 });
        setRhythmIndex(0);
        setRhythmMissed(false);
        setStrikeMissed(false);
        setStrikeHit(false);
        setPreyBolted(false);
        setPeakDetection(0);
        totalColorSamplesRef.current = 0;
        matchedColorSamplesRef.current = 0;
        lastSubstrateChangeRef.current = Date.now();
      }, 1200);
      return () => clearTimeout(restart);
    }, STRIKE_WINDOW);
    return () => clearTimeout(timer);
  }, [phase, paused, strikeHit]);

  /* ─── strike hit → score ─── */
  useEffect(() => {
    if (!strikeHit || phase !== 'done') return;

    const finalColorPct = colorMatchPct;
    const det = peakDetection;
    const fast = strikeTime < STRIKE_WINDOW * 0.5;

    let stars = 1; // caught prey
    if (det < 50 && firstStrike) stars = 2;
    if (det < 30 && finalColorPct >= 80 && perfectRhythm && firstStrike) stars = 3;
    if (det < 15 && finalColorPct >= 90 && perfectRhythm && fast) stars = 4;
    if (det < 5 && finalColorPct >= 95 && perfectRhythm && fast && flatEntireTime) stars = 5;

    const metrics = [
      { label: 'Peak Detection', value: `${Math.round(det)}%` },
      { label: 'Color Accuracy', value: `${finalColorPct}%` },
      { label: 'Rhythm', value: perfectRhythm ? 'Perfect' : 'Missed beats' },
      { label: 'Strike Timing', value: `${Math.round(strikeTime)}ms` },
      { label: 'First Strike', value: firstStrike ? 'Yes' : 'No' },
      { label: 'Flat Posture', value: flatEntireTime ? 'Always' : 'Broke posture' },
    ];

    const timer = setTimeout(() => onComplete(stars, metrics), 600);
    return () => clearTimeout(timer);
  }, [strikeHit, phase, colorMatchPct, peakDetection, strikeTime, firstStrike, perfectRhythm, flatEntireTime, onComplete]);

  /* ─── handlers ─── */

  const handleJoystickStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const pt = 'touches' in e ? e.touches[0] : e;
    setJoystickOrigin({ x: pt.clientX, y: pt.clientY });
    setJoystickActive(true);
  }, []);

  const handleJoystickMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!joystickActive) return;
      const pt = 'touches' in e ? e.touches[0] : e;
      const dx = pt.clientX - joystickOrigin.x;
      const dy = pt.clientY - joystickOrigin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 50;
      const clampedDist = Math.min(dist, maxDist);
      joystickSpeed.current = clampedDist / maxDist;
      setJoystickDelta({ x: dx, y: dy });
    },
    [joystickActive, joystickOrigin],
  );

  const handleJoystickEnd = useCallback(() => {
    setJoystickActive(false);
    setJoystickDelta({ x: 0, y: 0 });
    joystickSpeed.current = 0;
  }, []);

  const handleMatchColor = useCallback(() => {
    sfxCamouflageActivate();
    setMatchedColor(currentSubstrate);
  }, [currentSubstrate]);

  const handleRhythmTap = useCallback(() => {
    if (phase !== 'hypnosis' || rhythmIndex >= RHYTHM_BEATS) return;
    const elapsed = Date.now() - rhythmStartRef.current;
    const currentTime = elapsed % METRONOME_PERIOD;
    const marker = beatMarkersRef.current[rhythmIndex];
    const markerTime = marker * METRONOME_PERIOD;
    const diff = Math.abs(currentTime - markerTime);

    if (diff <= HIT_WINDOW) {
      sfxCorrect();
      setRhythmIndex((prev) => prev + 1);
    } else {
      setPerfectRhythm(false);
      setRhythmMissed(true);
      sfxWrong();
    }
  }, [phase, rhythmIndex]);

  const handleStrike = useCallback(() => {
    if (phase !== 'strike' || strikeHit || strikeMissed) return;
    sfxTentacleStrike();
    const elapsed = Date.now() - strikeStart;
    setStrikeTime(elapsed);
    setStrikeHit(true);
    setPhase('done');
  }, [phase, strikeHit, strikeMissed, strikeStart]);

  /* ─── detection warning SFX ─── */
  useEffect(() => {
    if (detection > 50 && detection < detectThreshold) {
      sfxDetectionWarning();
    }
  }, [Math.round(detection / 10)]); // trigger every ~10% jump

  /* ─── render ─── */

  if (showTutorial) {
    return <HuntingTutorial onDone={() => setShowTutorial(false)} />;
  }

  const substrateColor = SUBSTRATE_COLORS[currentSubstrate];
  const colorMismatch = matchedColor !== currentSubstrate;

  return (
    <div className="fixed inset-0 z-30 bg-bg-dark flex flex-col game-viewport select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-border-subtle bg-bg-surface">
        <span className="font-pixel text-[8px] text-rarity-legendary">HUNT</span>
        <span className="font-pixel text-[7px] text-text-muted uppercase">
          {phase === 'stalk' ? 'Stalk' : phase === 'hypnosis' ? 'Hypnosis' : phase === 'strike' ? 'Strike!' : 'Done'}
        </span>
        <button
          onClick={() => { sfxTap(); setPaused((p) => !p); }}
          className="btn text-[7px] py-1 px-3"
          style={{ minHeight: 44, minWidth: 44 }}
        >
          {paused ? 'Play' : 'Pause'}
        </button>
      </div>

      {/* Detection meter */}
      <div className="px-3 py-2 bg-bg-surface border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[7px] text-text-muted w-16">DETECT</span>
          <div className="flex-1 h-3 rounded bg-bg-dark border border-border-subtle overflow-hidden">
            <div
              className="h-full transition-all duration-100"
              style={{
                width: `${detection}%`,
                backgroundColor:
                  detection < 30 ? 'var(--success)' : detection < 60 ? 'var(--warning)' : 'var(--danger)',
              }}
            />
          </div>
          <span className="font-pixel text-[7px] text-text-primary w-10 text-right">{Math.round(detection)}%</span>
        </div>
        {/* Status indicators */}
        <div className="flex gap-3 mt-1">
          <span
            className="font-pixel text-[6px]"
            style={{ color: colorMismatch ? 'var(--danger)' : 'var(--success)' }}
          >
            COLOR: {colorMismatch ? 'MISMATCH' : 'OK'}
          </span>
          <span
            className="font-pixel text-[6px]"
            style={{ color: isFlat ? 'var(--success)' : 'var(--danger)' }}
          >
            FLAT: {isFlat ? 'ON' : 'OFF'}
          </span>
          <span className="font-pixel text-[6px] text-text-muted">
            SURFACE: {currentSubstrate.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main arena */}
      <div className="flex-1 relative overflow-hidden" ref={arenaRef}>
        <UnderwaterBg brightness={0.4} />

        {/* Pause overlay */}
        {paused && (
          <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center">
            <p className="font-pixel text-sm text-text-primary">PAUSED</p>
          </div>
        )}

        {/* ─── STALK PHASE ─── */}
        {phase === 'stalk' && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: substrateColor + '30', zIndex: 1 }}
          >
            {/* Substrate indicator bands */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `repeating-linear-gradient(45deg, ${substrateColor}20 0px, ${substrateColor}20 20px, transparent 20px, transparent 40px)`,
              }}
            />

            {/* Prey (crab) */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: preyPos.x - PREY_RADIUS,
                top: preyPos.y - PREY_RADIUS,
                width: PREY_RADIUS * 2,
                height: PREY_RADIUS * 2,
                zIndex: 2,
                animation: preyBolted ? 'shake 0.2s infinite' : undefined,
              }}
            >
              <CreatureSprite creature="crab" size={PREY_RADIUS * 2} />
            </div>

            {/* Player (cuttlefish) */}
            <div
              className="absolute transition-all duration-75"
              style={{
                left: playerPos.x - PLAYER_RADIUS,
                top: playerPos.y - PLAYER_RADIUS,
                width: PLAYER_RADIUS * 2,
                height: isFlat ? PLAYER_RADIUS * 1.2 : PLAYER_RADIUS * 2,
                zIndex: 2,
              }}
            >
              <CreatureSprite
                creature="cuttlefish"
                size={PLAYER_RADIUS * 2}
                style={{
                  opacity: colorMismatch ? 0.9 : 0.7,
                  filter: colorMismatch ? 'drop-shadow(0 0 3px var(--danger))' : undefined,
                  transform: isFlat ? 'scaleY(0.6)' : undefined,
                  transition: 'all 0.3s ease',
                }}
              />
            </div>

            {/* Engagement radius indicator */}
            <div
              className="absolute rounded-full border border-dashed opacity-20 pointer-events-none"
              style={{
                left: preyPos.x - ENGAGE_DIST,
                top: preyPos.y - ENGAGE_DIST,
                width: ENGAGE_DIST * 2,
                height: ENGAGE_DIST * 2,
                borderColor: 'var(--border-active)',
              }}
            />

            {/* Virtual joystick area */}
            <div
              className="absolute bottom-4 left-4 w-36 h-36"
              onTouchStart={handleJoystickStart}
              onTouchMove={handleJoystickMove}
              onTouchEnd={handleJoystickEnd}
              onMouseDown={handleJoystickStart}
              onMouseMove={handleJoystickMove}
              onMouseUp={handleJoystickEnd}
              onMouseLeave={handleJoystickEnd}
            >
              {/* Joystick base */}
              <div
                className="absolute inset-0 rounded-full border-2 border-border-subtle opacity-40"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              />
              {/* Joystick knob */}
              <div
                className="absolute w-12 h-12 rounded-full border-2"
                style={{
                  backgroundColor: joystickActive ? 'var(--border-active)' : 'var(--bg-surface)',
                  borderColor: 'var(--border-active)',
                  left: 72 - 24 + Math.min(40, Math.max(-40, joystickDelta.x * 0.8)),
                  top: 72 - 24 + Math.min(40, Math.max(-40, joystickDelta.y * 0.8)),
                  transition: joystickActive ? 'none' : 'all 0.2s ease',
                }}
              />
            </div>

            {/* Right-side buttons */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-3">
              <button
                onClick={handleMatchColor}
                className="btn text-[7px] py-2 px-4"
                style={{
                  minHeight: 48,
                  minWidth: 48,
                  borderColor: colorMismatch ? 'var(--danger)' : 'var(--success)',
                  animation: colorMismatch ? 'pulse 0.8s infinite' : undefined,
                }}
              >
                Match
              </button>
              <button
                onClick={() => { sfxTap(); setIsFlat((f) => !f); }}
                className="btn text-[7px] py-2 px-4"
                style={{
                  minHeight: 48,
                  minWidth: 48,
                  borderColor: isFlat ? 'var(--success)' : 'var(--danger)',
                  backgroundColor: isFlat ? 'var(--success)' : 'var(--bg-surface)',
                  color: isFlat ? '#fff' : 'var(--text-primary)',
                }}
              >
                Flat
              </button>
            </div>
          </div>
        )}

        {/* ─── HYPNOSIS PHASE ─── */}
        {phase === 'hypnosis' && !rhythmMissed && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: '#0a0a20', zIndex: 1 }}
          >
            {/* Dark bands rippling across cuttlefish body (visual) */}
            <div className="relative w-40 h-24 mb-8 overflow-hidden rounded-lg" style={{ backgroundColor: '#c4956a' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-y-0 w-3"
                  style={{
                    backgroundColor: '#2a1508',
                    opacity: 0.7,
                    left: `${((Date.now() / 300 + i * 30) % 180) - 10}px`,
                    animation: `passingCloud ${METRONOME_PERIOD}ms linear infinite`,
                    animationDelay: `${i * (METRONOME_PERIOD / 6)}ms`,
                  }}
                />
              ))}
              {/* Eyes */}
              <div
                style={{
                  position: 'absolute',
                  top: '35%',
                  left: '30%',
                  width: 8,
                  height: 8,
                  backgroundColor: '#e0d8ff',
                  borderRadius: '50%',
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '35%',
                  right: '30%',
                  width: 8,
                  height: 8,
                  backgroundColor: '#e0d8ff',
                  borderRadius: '50%',
                  zIndex: 2,
                }}
              />
            </div>

            {/* Prey (mesmerized crab) */}
            <div className="mb-6 opacity-60 flex flex-col items-center">
              <CreatureSprite creature="crab" size={28} animate={false} />
              <p className="font-pixel text-[6px] text-text-muted mt-1 text-center">mesmerized</p>
            </div>

            {/* Rhythm info */}
            <p className="font-pixel text-[8px] text-text-secondary mb-2">
              Beat {rhythmIndex}/{RHYTHM_BEATS}
            </p>

            {/* Metronome bar */}
            <div className="relative w-72 h-12 border-2 border-border-subtle rounded bg-bg-surface mx-auto mb-4">
              {/* Markers */}
              {beatMarkersRef.current.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-1"
                  style={{
                    left: `${m * 100}%`,
                    backgroundColor: i < rhythmIndex ? 'var(--success)' : 'var(--rarity-legendary)',
                    opacity: i < rhythmIndex ? 0.5 : 1,
                  }}
                />
              ))}
              {/* Sweep cursor */}
              <div
                className="absolute top-0 bottom-0 w-0.5"
                style={{
                  left: `${metronomePos * 100}%`,
                  backgroundColor: 'var(--text-primary)',
                  boxShadow: '0 0 6px var(--text-primary)',
                }}
              />
            </div>

            {/* Tap button */}
            <button
              onClick={handleRhythmTap}
              className="btn btn-primary text-[10px] px-8 py-4"
              style={{ minHeight: 56, minWidth: 120 }}
            >
              TAP
            </button>
          </div>
        )}

        {/* ─── STRIKE PHASE ─── */}
        {phase === 'strike' && !strikeHit && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 1 }}>
            {/* Timer bar */}
            <div className="absolute top-4 left-4 right-4 h-3 rounded bg-bg-surface border border-border-subtle overflow-hidden">
              <div
                className="h-full bg-danger"
                style={{
                  width: `${Math.max(0, 100 - ((Date.now() - strikeStart) / STRIKE_WINDOW) * 100)}%`,
                  transition: 'width 0.1s linear',
                }}
              />
            </div>

            <p className="font-pixel text-sm text-danger mb-4" style={{ animation: 'pulse 0.5s infinite' }}>
              STRIKE NOW!
            </p>

            {/* Prey */}
            <div className="mb-8 flex justify-center">
              <CreatureSprite creature="crab" size={36} />
            </div>

            {/* Strike zone - right half of screen */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-center"
              onClick={handleStrike}
              onTouchStart={(e) => { e.preventDefault(); handleStrike(); }}
              style={{ cursor: 'pointer' }}
            >
              <div
                className="w-20 h-20 rounded-full border-4 flex items-center justify-center"
                style={{
                  borderColor: 'var(--danger)',
                  backgroundColor: 'var(--danger)',
                  opacity: 0.8,
                  animation: 'pulse 0.4s infinite',
                }}
              >
                <span className="font-pixel text-[10px] text-white">STRIKE</span>
              </div>
            </div>

            {/* Left hint */}
            <div className="absolute left-4 bottom-8">
              <p className="font-pixel text-[6px] text-text-muted">Tap right side</p>
            </div>
          </div>
        )}

        {/* ─── STRIKE MISS ─── */}
        {phase === 'strike' && strikeMissed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50" style={{ zIndex: 1 }}>
            <div className="text-center">
              <p className="font-pixel text-sm text-danger mb-2">MISSED!</p>
              <p className="font-pixel text-[7px] text-text-muted">Prey escapes. Hunting again...</p>
            </div>
          </div>
        )}

        {/* ─── DONE ─── */}
        {phase === 'done' && strikeHit && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50" style={{ zIndex: 1 }}>
            <div className="text-center" style={{ animation: 'slam 0.4s ease-out' }}>
              <p className="font-pixel text-sm text-success mb-2">CATCH!</p>
              <p className="font-pixel text-[7px] text-text-secondary">Prey captured successfully!</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
