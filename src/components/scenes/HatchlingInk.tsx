'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UnderwaterBg, CreatureSprite } from '@/components/sprites';

interface HatchlingInkProps {
  onComplete: (stars: number, metrics: { label: string; value: string }[]) => void;
  onFail: (reason: string, explanation: string) => void;
  attemptNumber: number;
}

// --- Types ---

type InkType = 'cloud' | 'pseudomorph' | 'jet';
type GamePhase = 'ink-choice' | 'jet-escape' | 'find-cover' | 'recamo' | 'exchange-result' | 'won' | 'lost';
type PredatorDistance = 'far' | 'medium' | 'close';

interface HidingSpot {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  fits: boolean;
  label: string;
}

interface CamoOption {
  id: number;
  color: string;
  label: string;
  correct: boolean;
}

interface ExchangeConfig {
  predatorDistance: PredatorDistance;
  idealInk: InkType;
  hidingSpots: HidingSpot[];
  camoOptions: CamoOption[];
  spotColor: string;
}

// --- Constants ---

const ARENA_W = 360;
const ARENA_H = 520;
const JOYSTICK_RADIUS = 70;
const PLAYER_SPEED = 3.5;
const MAX_INK = 5;
const TOTAL_EXCHANGES = 3;
const ESCAPE_TIME = 4000; // ms to reach cover

const INK_INFO: Record<InkType, { label: string; desc: string; color: string }> = {
  cloud: { label: 'Full Cloud', desc: 'Best at medium range', color: '#333' },
  pseudomorph: { label: 'Pseudomorph', desc: 'Decoy - best close', color: '#222' },
  jet: { label: 'Directed Jet', desc: 'Best at far range', color: '#1a1a1a' },
};

const BEST_INK: Record<PredatorDistance, InkType> = {
  far: 'jet',
  medium: 'cloud',
  close: 'pseudomorph',
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// --- Exchange configs ---

function generateExchanges(): ExchangeConfig[] {
  return [
    {
      predatorDistance: 'medium',
      idealInk: 'cloud',
      hidingSpots: [
        { id: 0, x: 50, y: 120, w: 70, h: 50, color: '#3a3020', fits: true, label: 'Rock crevice' },
        { id: 1, x: 220, y: 80, w: 30, h: 25, color: '#4a4030', fits: false, label: 'Small crack' },
        { id: 2, x: 260, y: 200, w: 65, h: 55, color: '#2a2818', fits: true, label: 'Coral ledge' },
        { id: 3, x: 80, y: 280, w: 25, h: 20, color: '#3a3828', fits: false, label: 'Tiny hole' },
      ],
      camoOptions: [
        { id: 0, color: '#3a3020', label: 'Dark brown', correct: true },
        { id: 1, color: '#8a6040', label: 'Tan', correct: false },
        { id: 2, color: '#205030', label: 'Green', correct: false },
        { id: 3, color: '#604020', label: 'Rust', correct: false },
      ],
      spotColor: '#3a3020',
    },
    {
      predatorDistance: 'close',
      idealInk: 'pseudomorph',
      hidingSpots: [
        { id: 0, x: 150, y: 150, w: 60, h: 45, color: '#504030', fits: true, label: 'Under sponge' },
        { id: 1, x: 40, y: 230, w: 22, h: 18, color: '#605040', fits: false, label: 'Narrow slit' },
        { id: 2, x: 270, y: 120, w: 55, h: 60, color: '#3a3020', fits: true, label: 'Anemone base' },
      ],
      camoOptions: [
        { id: 0, color: '#806050', label: 'Light brown', correct: false },
        { id: 1, color: '#504030', label: 'Mud brown', correct: true },
        { id: 2, color: '#2a1a10', label: 'Dark', correct: false },
        { id: 3, color: '#907060', label: 'Sandy', correct: false },
      ],
      spotColor: '#504030',
    },
    {
      predatorDistance: 'far',
      idealInk: 'jet',
      hidingSpots: [
        { id: 0, x: 100, y: 100, w: 75, h: 55, color: '#2a3028', fits: true, label: 'Kelp shadow' },
        { id: 1, x: 250, y: 180, w: 20, h: 15, color: '#3a3830', fits: false, label: 'Barnacle gap' },
        { id: 2, x: 40, y: 250, w: 50, h: 50, color: '#2a2818', fits: true, label: 'Rock hollow' },
        { id: 3, x: 200, y: 80, w: 65, h: 45, color: '#303828', fits: true, label: 'Seaweed bed' },
      ],
      camoOptions: [
        { id: 0, color: '#4a5040', label: 'Olive', correct: false },
        { id: 1, color: '#2a3028', label: 'Dark green', correct: true },
        { id: 2, color: '#604830', label: 'Brown', correct: false },
        { id: 3, color: '#1a1a18', label: 'Black', correct: false },
      ],
      spotColor: '#2a3028',
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Tutorial                                                           */
/* ------------------------------------------------------------------ */

function InkTutorial({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: 'Ink Defense',
      body: "A predator has spotted you! You'll need to use your ink sac to escape.\n\nYou have 5 ink charges for 3 encounters — choose wisely!",
    },
    {
      title: 'Choose Your Ink',
      body: "Each ink type works best at a different distance:\n\n  Full Cloud — best at MEDIUM range\n  Creates a dark cloud that blinds the predator\n\n  Pseudomorph — best CLOSE up\n  Leaves a decoy blob shaped like you\n\n  Directed Jet — best from FAR away\n  A precise stream aimed at the predator's face\n\nWatch the distance indicator and pick the right one!",
    },
    {
      title: 'Escape & Hide',
      body: "After inking, you jet away! The controls are INVERTED — push the joystick the opposite direction you want to go (just like a real jet-propelled cuttlefish).\n\nThen find a hiding spot that's big enough to fit you. Small crevices won't work!",
    },
    {
      title: 'Re-camouflage',
      body: "Once hidden, you need to match your hiding spot's color to stay invisible.\n\nPick the color swatch that best matches where you're hiding. Get it right and the predator swims right past!",
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
          {step === steps.length - 1 ? 'Ready to Escape!' : 'Next'}
        </button>
      </div>
    </div>
  );
}

export default function HatchlingInk({ onComplete, onFail, attemptNumber }: HatchlingInkProps) {
  const [showTutorial, setShowTutorial] = useState(attemptNumber === 1);
  // --- State ---
  const [phase, setPhase] = useState<GamePhase>('ink-choice');
  const [gameActive, setGameActive] = useState(true);
  const [paused, setPaused] = useState(false);
  const [currentExchange, setCurrentExchange] = useState(0);
  const [inkRemaining, setInkRemaining] = useState(MAX_INK);
  const [inkUsed, setInkUsed] = useState(0);
  const [correctInkCount, setCorrectInkCount] = useState(0);
  const [goodCamoCount, setGoodCamoCount] = useState(0);
  const [usedPseudomorph, setUsedPseudomorph] = useState(false);
  const [navigationScore, setNavigationScore] = useState(0);
  const [totalNavAttempts, setTotalNavAttempts] = useState(0);

  // Escape phase
  const [escapeTimer, setEscapeTimer] = useState(ESCAPE_TIME);
  const [selectedSpot, setSelectedSpot] = useState<HidingSpot | null>(null);
  const [spotWarning, setSpotWarning] = useState<string | null>(null);

  // Camo phase
  const [selectedCamo, setSelectedCamo] = useState<number | null>(null);

  // Ink cloud visual
  const [showInkCloud, setShowInkCloud] = useState(false);
  const [inkCloudType, setInkCloudType] = useState<InkType>('cloud');

  // Exchange result
  const [exchangeSuccess, setExchangeSuccess] = useState(false);

  // Inverted joystick label flash
  const [invertedFlash, setInvertedFlash] = useState(true);

  // Predator approach animation
  const [predatorApproachX, setPredatorApproachX] = useState(ARENA_W + 80);
  const [predatorVisible, setPredatorVisible] = useState(true);

  const exchangesRef = useRef<ExchangeConfig[]>(generateExchanges());
  const playerRef = useRef({ x: ARENA_W / 2, y: ARENA_H - 100 });
  const joystickRef = useRef({ active: false, originX: 0, originY: 0, dx: 0, dy: 0 });
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const escapeStartRef = useRef<number>(0);

  const currentConfig = exchangesRef.current[currentExchange] || exchangesRef.current[0];

  // Flash inverted label
  useEffect(() => {
    if (phase !== 'jet-escape') return;
    const interval = setInterval(() => {
      setInvertedFlash(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, [phase]);

  // Predator approach animation on ink-choice phase
  useEffect(() => {
    if (phase !== 'ink-choice') return;
    setPredatorVisible(true);
    const distMap: Record<PredatorDistance, number> = { far: ARENA_W - 40, medium: ARENA_W / 2 + 40, close: 120 };
    const targetX = distMap[currentConfig.predatorDistance];
    setPredatorApproachX(ARENA_W + 80);

    const t = setTimeout(() => {
      setPredatorApproachX(targetX);
    }, 200);
    return () => clearTimeout(t);
  }, [phase, currentExchange, currentConfig.predatorDistance]);

  // --- Ink choice ---
  const handleInkChoice = useCallback((type: InkType) => {
    if (inkRemaining <= 0) return;

    setInkUsed(prev => prev + 1);
    setInkRemaining(prev => prev - 1);

    if (type === 'pseudomorph') setUsedPseudomorph(true);

    const isCorrect = type === currentConfig.idealInk;
    if (isCorrect) setCorrectInkCount(prev => prev + 1);

    // Show ink cloud
    setInkCloudType(type);
    setShowInkCloud(true);
    setPredatorVisible(false);

    setTimeout(() => {
      setShowInkCloud(false);
      // Transition to escape phase
      setPhase('jet-escape');
      playerRef.current = { x: ARENA_W / 2, y: ARENA_H - 100 };
      escapeStartRef.current = Date.now();
      setEscapeTimer(ESCAPE_TIME);
      setSelectedSpot(null);
      setSpotWarning(null);
    }, 1200);
  }, [inkRemaining, currentConfig.idealInk]);

  // --- Escape game loop (inverted controls) ---
  const escapeLoop = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = time;

    // Inverted joystick: push direction you flee FROM (so invert)
    const joy = joystickRef.current;
    if (joy.active) {
      const mag = Math.sqrt(joy.dx ** 2 + joy.dy ** 2);
      if (mag > 10) {
        // INVERTED: negate the direction
        const nx = -(joy.dx / mag);
        const ny = -(joy.dy / mag);
        const strength = Math.min(mag / JOYSTICK_RADIUS, 1);
        playerRef.current.x = clamp(playerRef.current.x + nx * PLAYER_SPEED * strength * dt * 60, 16, ARENA_W - 16);
        playerRef.current.y = clamp(playerRef.current.y + ny * PLAYER_SPEED * strength * dt * 60, 16, ARENA_H - 16);
      }
    }

    // Update timer
    const elapsed = Date.now() - escapeStartRef.current;
    const remaining = Math.max(0, ESCAPE_TIME - elapsed);
    setEscapeTimer(remaining);

    if (remaining <= 0) {
      // Time out - fail if no spot selected
      return;
    }

    rafRef.current = requestAnimationFrame(escapeLoop);
  }, []);

  useEffect(() => {
    if (phase === 'jet-escape' && !paused) {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(escapeLoop);
      return () => cancelAnimationFrame(rafRef.current);
    }
  }, [phase, paused, escapeLoop]);

  // Check escape timer expiry
  useEffect(() => {
    if (phase === 'jet-escape' && escapeTimer <= 0 && !selectedSpot) {
      setPhase('lost');
      setGameActive(false);
      onFail(
        'Failed to find cover in time. The predator circled back.',
        'After deploying ink, cuttlefish must immediately jet away and find shelter. Speed and directional awareness are essential for survival.'
      );
    }
  }, [phase, escapeTimer, selectedSpot, onFail]);

  // --- Handle spot selection ---
  const handleSpotSelect = useCallback((spot: HidingSpot) => {
    if (phase !== 'find-cover') return;

    if (!spot.fits) {
      setSpotWarning(`Too small! ${spot.label} won't fit.`);
      setTimeout(() => setSpotWarning(null), 1500);
      return;
    }

    setSelectedSpot(spot);
    setNavigationScore(prev => prev + 1);
    setTotalNavAttempts(prev => prev + 1);

    // Move to recamo phase
    setTimeout(() => {
      setPhase('recamo');
      setSelectedCamo(null);
    }, 600);
  }, [phase]);

  // Transition from escape to find-cover after player moves enough
  useEffect(() => {
    if (phase !== 'jet-escape') return;
    // After half the escape time or when near a spot, switch to find-cover
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - escapeStartRef.current;
      if (elapsed > ESCAPE_TIME * 0.3) {
        cancelAnimationFrame(rafRef.current);
        setPhase('find-cover');
        setTotalNavAttempts(prev => prev + 1);
      }
    }, 500);
    return () => clearInterval(checkInterval);
  }, [phase]);

  // --- Handle camo selection ---
  const handleCamoSelect = useCallback((optionId: number) => {
    setSelectedCamo(optionId);
    const option = currentConfig.camoOptions.find(o => o.id === optionId);
    if (option?.correct) {
      setGoodCamoCount(prev => prev + 1);
    }

    // Show exchange result
    setTimeout(() => {
      setExchangeSuccess(true);
      setPhase('exchange-result');
    }, 800);
  }, [currentConfig.camoOptions]);

  // --- Advance exchange ---
  const advanceExchange = useCallback(() => {
    if (currentExchange >= TOTAL_EXCHANGES - 1) {
      // All exchanges complete - survived!
      setGameActive(false);
      setPhase('won');

      const totalInk = inkUsed;
      const correctInk = correctInkCount;
      const goodCamo = goodCamoCount;
      const navScore = navigationScore;
      const didPseudo = usedPseudomorph;

      let stars = 1; // survived
      if (totalInk <= 3) stars = 2;
      if (totalInk <= 2 && correctInk >= 2 && goodCamo >= 2) stars = 3;
      if (totalInk === TOTAL_EXCHANGES && correctInk === TOTAL_EXCHANGES && navScore >= TOTAL_EXCHANGES && goodCamo === TOTAL_EXCHANGES) stars = 4;
      if (stars >= 4 && didPseudo) stars = 5;

      onComplete(stars, [
        { label: 'Ink used', value: `${totalInk}/${MAX_INK}` },
        { label: 'Correct ink type', value: `${correctInk}/${TOTAL_EXCHANGES}` },
        { label: 'Good camouflage', value: `${goodCamo}/${TOTAL_EXCHANGES}` },
        { label: 'Pseudomorph deployed', value: didPseudo ? 'Yes' : 'No' },
        { label: 'Exchanges survived', value: `${TOTAL_EXCHANGES}/${TOTAL_EXCHANGES}` },
      ]);
    } else {
      // Next exchange
      setCurrentExchange(prev => prev + 1);
      setPhase('ink-choice');
      setExchangeSuccess(false);
      setSelectedSpot(null);
      setSelectedCamo(null);
      setSpotWarning(null);
      playerRef.current = { x: ARENA_W / 2, y: ARENA_H - 100 };
    }
  }, [currentExchange, inkUsed, correctInkCount, goodCamoCount, navigationScore, usedPseudomorph, onComplete]);

  // --- Joystick handlers ---
  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    joystickRef.current = {
      active: true,
      originX: touch.clientX - rect.left,
      originY: touch.clientY - rect.top,
      dx: 0,
      dy: 0,
    };
  }, []);

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!joystickRef.current.active) return;
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let dx = (touch.clientX - rect.left) - joystickRef.current.originX;
    let dy = (touch.clientY - rect.top) - joystickRef.current.originY;
    const mag = Math.sqrt(dx ** 2 + dy ** 2);
    if (mag > JOYSTICK_RADIUS) {
      dx = (dx / mag) * JOYSTICK_RADIUS;
      dy = (dy / mag) * JOYSTICK_RADIUS;
    }
    joystickRef.current.dx = dx;
    joystickRef.current.dy = dy;
  }, []);

  const handleJoystickEnd = useCallback(() => {
    joystickRef.current.active = false;
    joystickRef.current.dx = 0;
    joystickRef.current.dy = 0;
  }, []);

  // Mouse fallback
  const handleJoystickMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    joystickRef.current = {
      active: true,
      originX: e.clientX - rect.left,
      originY: e.clientY - rect.top,
      dx: 0,
      dy: 0,
    };

    const onMove = (me: MouseEvent) => {
      let dx = (me.clientX - rect.left) - joystickRef.current.originX;
      let dy = (me.clientY - rect.top) - joystickRef.current.originY;
      const mag = Math.sqrt(dx ** 2 + dy ** 2);
      if (mag > JOYSTICK_RADIUS) {
        dx = (dx / mag) * JOYSTICK_RADIUS;
        dy = (dy / mag) * JOYSTICK_RADIUS;
      }
      joystickRef.current.dx = dx;
      joystickRef.current.dy = dy;
    };

    const onUp = () => {
      joystickRef.current.active = false;
      joystickRef.current.dx = 0;
      joystickRef.current.dy = 0;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  // --- Pause ---
  const togglePause = useCallback(() => {
    setPaused(prev => !prev);
  }, []);

  // Check if out of ink
  useEffect(() => {
    if (phase === 'ink-choice' && inkRemaining <= 0) {
      setGameActive(false);
      setPhase('lost');
      onFail(
        'Ran out of ink reserves.',
        'Cuttlefish have a limited ink supply stored in the ink sac. Each deployment must be strategic, as ink is metabolically expensive to produce.'
      );
    }
  }, [phase, inkRemaining, onFail]);

  // --- Render predator ---
  const renderPredator = () => {
    if (!predatorVisible && phase === 'ink-choice') return null;
    if (phase !== 'ink-choice') return null;

    return (
      <div style={{
        position: 'absolute',
        left: predatorApproachX,
        top: ARENA_H / 2 - 30,
        width: 90,
        height: 50,
        transition: 'left 1.5s ease-out',
        zIndex: 10,
      }}>
        {/* Predator fish */}
        <CreatureSprite creature="shark_blue" size={64} animate />
        {/* Distance label */}
        <div style={{
          position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}>
          <span className="font-pixel" style={{
            fontSize: 7,
            color: currentConfig.predatorDistance === 'close' ? 'var(--danger)' :
              currentConfig.predatorDistance === 'medium' ? 'var(--warning)' : 'var(--text-muted)',
          }}>
            {currentConfig.predatorDistance.toUpperCase()} RANGE
          </span>
        </div>
      </div>
    );
  };

  // --- Render ink cloud ---
  const renderInkCloud = () => {
    if (!showInkCloud) return null;
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        animation: 'fadeIn 0.3s',
        pointerEvents: 'none',
      }}>
        {inkCloudType === 'cloud' && (
          // Full cloud - large expanding dark mass
          <div style={{
            position: 'absolute',
            left: '30%', top: '30%',
            width: '40%', height: '40%',
            backgroundColor: 'rgba(10,10,10,0.9)',
            borderRadius: '50%',
            animation: 'pulse 0.5s ease-out',
            boxShadow: '0 0 80px 40px rgba(10,10,10,0.7)',
          }} />
        )}
        {inkCloudType === 'pseudomorph' && (
          // Pseudomorph - cuttlefish-shaped decoy blob
          <>
            <div style={{
              position: 'absolute',
              left: '40%', top: '40%',
              width: 50, height: 30,
              backgroundColor: 'rgba(20,20,20,0.95)',
              borderRadius: '50% 50% 30% 30%',
            }} />
            {/* "Tentacles" */}
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                position: 'absolute',
                left: `${42 + i * 5}%`,
                top: '55%',
                width: 4, height: 15,
                backgroundColor: 'rgba(20,20,20,0.8)',
                borderRadius: 2,
              }} />
            ))}
          </>
        )}
        {inkCloudType === 'jet' && (
          // Directed jet - narrow streak
          <div style={{
            position: 'absolute',
            left: '45%', top: '35%',
            width: 20, height: '30%',
            backgroundColor: 'rgba(15,15,15,0.85)',
            borderRadius: '10px',
            transform: 'rotate(-10deg)',
          }} />
        )}
      </div>
    );
  };

  // --- Render player cuttlefish (escape phase) ---
  const renderEscapePlayer = () => {
    if (phase !== 'jet-escape' && phase !== 'find-cover') return null;
    const px = playerRef.current.x;
    const py = playerRef.current.y;

    return (
      <div style={{
        position: 'absolute',
        left: px - 20,
        top: py - 20,
        width: 40,
        height: 40,
        zIndex: 12,
        pointerEvents: 'none',
      }}>
        <CreatureSprite creature="cuttlefish" size={40} animate />
      </div>
    );
  };

  // --- Render hiding spots ---
  const renderHidingSpots = () => {
    if (phase !== 'find-cover') return null;

    return currentConfig.hidingSpots.map(spot => (
      <div
        key={spot.id}
        onClick={() => handleSpotSelect(spot)}
        style={{
          position: 'absolute',
          left: spot.x,
          top: spot.y,
          width: spot.w,
          height: spot.h,
          backgroundColor: spot.color,
          borderRadius: 8,
          border: `2px solid ${spot.fits ? 'var(--border-active)' : 'var(--border-subtle)'}`,
          cursor: 'pointer',
          animation: 'pulse 1.5s infinite',
          animationDelay: `${spot.id * 0.3}s`,
          zIndex: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 44,
          minHeight: 44,
        }}
      >
        <span className="font-pixel" style={{
          fontSize: 6,
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'center',
          lineHeight: 1.2,
        }}>
          {spot.label}
        </span>
      </div>
    ));
  };

  // --- Render joystick (inverted) ---
  const renderJoystick = () => {
    if (phase !== 'jet-escape') return null;
    const joy = joystickRef.current;

    return (
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          width: JOYSTICK_RADIUS * 2 + 20,
          height: JOYSTICK_RADIUS * 2 + 20,
          touchAction: 'none',
          zIndex: 20,
        }}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onMouseDown={handleJoystickMouseDown}
      >
        {joy.active ? (
          <>
            {/* Outer ring - RED for inverted */}
            <div style={{
              position: 'absolute',
              left: joy.originX - JOYSTICK_RADIUS,
              top: joy.originY - JOYSTICK_RADIUS,
              width: JOYSTICK_RADIUS * 2,
              height: JOYSTICK_RADIUS * 2,
              borderRadius: '50%',
              border: '3px solid rgba(200,60,60,0.5)',
              backgroundColor: 'rgba(163,45,45,0.15)',
            }} />
            {/* Thumb */}
            <div style={{
              position: 'absolute',
              left: joy.originX + joy.dx - 18,
              top: joy.originY + joy.dy - 18,
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: 'rgba(200,60,60,0.5)',
              border: '2px solid rgba(200,60,60,0.7)',
            }} />
          </>
        ) : (
          <div style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.4,
            textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56,
              borderRadius: '50%',
              border: '2px dashed var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
            }}>
              <span className="font-pixel" style={{ fontSize: 6, color: 'var(--danger)' }}>MOVE</span>
            </div>
          </div>
        )}
        {/* INVERTED label */}
        <div style={{
          position: 'absolute',
          bottom: -18,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: invertedFlash ? 1 : 0.3,
          transition: 'opacity 0.2s',
        }}>
          <span className="font-pixel" style={{ fontSize: 8, color: 'var(--danger)' }}>
            INVERTED
          </span>
        </div>
      </div>
    );
  };

  // --- Background ---
  const renderBackground = () => (
    <UnderwaterBg brightness={0.3} />
  );

  // --- Main render ---
  if (showTutorial) return <InkTutorial onDone={() => setShowTutorial(false)} />;
  if (!gameActive && phase !== 'lost') return null;

  return (
    <div
      className="game-viewport"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-dark)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 30,
      }}
    >
      {/* HUD */}
      <div style={{
        width: '100%',
        padding: '8px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        zIndex: 25,
      }}>
        {/* Ink meter */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span className="font-pixel" style={{ fontSize: 7, color: 'var(--text-muted)', marginRight: 2 }}>INK</span>
          {Array.from({ length: MAX_INK }).map((_, i) => (
            <div key={i} style={{
              width: 10, height: 14, borderRadius: 2,
              backgroundColor: i < inkRemaining ? '#333' : 'var(--border-subtle)',
              border: `1px solid ${i < inkRemaining ? '#555' : 'var(--border-subtle)'}`,
              transition: 'all 0.2s',
            }} />
          ))}
        </div>
        {/* Exchange counter */}
        <span className="font-pixel" style={{ fontSize: 9, color: 'var(--text-primary)' }}>
          {currentExchange + 1}/{TOTAL_EXCHANGES}
        </span>
        {/* Pause */}
        <button
          onClick={togglePause}
          style={{
            width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8, cursor: 'pointer',
            color: 'var(--text-primary)',
          }}
        >
          <span className="font-pixel" style={{ fontSize: 10 }}>II</span>
        </button>
      </div>

      {/* Arena */}
      <div style={{
        position: 'relative',
        width: '100%',
        flex: 1,
        overflow: 'hidden',
        touchAction: 'none',
      }}>
        {renderBackground()}
        {renderPredator()}
        {renderInkCloud()}
        {renderEscapePlayer()}
        {renderHidingSpots()}
        {renderJoystick()}

        {/* Escape timer bar */}
        {(phase === 'jet-escape' || phase === 'find-cover') && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, height: 4,
            backgroundColor: 'var(--border-subtle)',
            zIndex: 15,
          }}>
            <div style={{
              height: '100%',
              width: `${(escapeTimer / ESCAPE_TIME) * 100}%`,
              backgroundColor: escapeTimer > ESCAPE_TIME * 0.3 ? 'var(--success)' : 'var(--danger)',
              transition: 'width 0.5s linear',
            }} />
          </div>
        )}

        {/* Find cover instruction */}
        {phase === 'find-cover' && (
          <div style={{
            position: 'absolute',
            top: 12, left: '50%', transform: 'translateX(-50%)',
            padding: '6px 14px',
            backgroundColor: 'rgba(13,13,26,0.8)',
            borderRadius: 6,
            zIndex: 15,
          }}>
            <span className="font-pixel" style={{ fontSize: 8, color: 'var(--warning)' }}>
              FIND COVER - TAP A SPOT
            </span>
          </div>
        )}

        {/* Spot warning */}
        {spotWarning && (
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            padding: '8px 16px',
            backgroundColor: 'rgba(163,45,45,0.9)',
            border: '2px solid var(--danger)',
            borderRadius: 8,
            zIndex: 25,
            animation: 'shake 0.3s',
          }}>
            <span className="font-pixel" style={{ fontSize: 9, color: '#fff' }}>
              {spotWarning}
            </span>
          </div>
        )}

        {/* INK CHOICE UI */}
        {phase === 'ink-choice' && (
          <div style={{
            position: 'absolute',
            bottom: 20, left: 16, right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            zIndex: 15,
          }}>
            <div style={{
              textAlign: 'center',
              padding: '8px',
              backgroundColor: 'rgba(13,13,26,0.7)',
              borderRadius: 8,
            }}>
              <span className="font-pixel" style={{ fontSize: 9, color: 'var(--warning)' }}>
                PREDATOR LOCKED ON! Choose ink type:
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['cloud', 'pseudomorph', 'jet'] as InkType[]).map(type => (
                <button
                  key={type}
                  onClick={() => handleInkChoice(type)}
                  disabled={inkRemaining <= 0}
                  style={{
                    flex: 1,
                    minHeight: 70,
                    backgroundColor: INK_INFO[type].color,
                    border: '2px solid var(--border-subtle)',
                    borderRadius: 10,
                    cursor: inkRemaining > 0 ? 'pointer' : 'not-allowed',
                    opacity: inkRemaining > 0 ? 1 : 0.4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 4px',
                    gap: 4,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--border-active)'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)'; }}
                >
                  <span className="font-pixel" style={{ fontSize: 8, color: 'var(--text-primary)' }}>
                    {INK_INFO[type].label}
                  </span>
                  <span className="font-pixel" style={{ fontSize: 6, color: 'var(--text-muted)', textAlign: 'center' }}>
                    {INK_INFO[type].desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* JET ESCAPE instruction */}
        {phase === 'jet-escape' && (
          <div style={{
            position: 'absolute',
            top: 12, left: '50%', transform: 'translateX(-50%)',
            padding: '6px 14px',
            backgroundColor: 'rgba(163,45,45,0.15)',
            border: '1px solid rgba(163,45,45,0.3)',
            borderRadius: 6,
            zIndex: 15,
          }}>
            <span className="font-pixel" style={{ fontSize: 8, color: 'var(--danger)' }}>
              JET ESCAPE! Controls inverted!
            </span>
          </div>
        )}

        {/* Red tint border during jet escape */}
        {phase === 'jet-escape' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            border: '4px solid rgba(163,45,45,0.3)',
            pointerEvents: 'none',
            zIndex: 14,
          }} />
        )}

        {/* RECAMO UI */}
        {phase === 'recamo' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(13,13,26,0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            padding: 20,
          }}>
            <div style={{
              padding: '16px 24px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 12,
              border: '2px solid var(--border-subtle)',
              width: '100%',
              maxWidth: 320,
            }}>
              <h3 className="font-pixel" style={{
                fontSize: 10,
                color: 'var(--text-primary)',
                marginBottom: 12,
                textAlign: 'center',
              }}>
                RE-CAMOUFLAGE
              </h3>
              <p className="font-pixel" style={{
                fontSize: 7,
                color: 'var(--text-muted)',
                marginBottom: 16,
                textAlign: 'center',
              }}>
                Match the hiding spot color:
              </p>
              {/* Show spot color preview */}
              <div style={{
                width: 60, height: 30,
                backgroundColor: currentConfig.spotColor,
                borderRadius: 6,
                border: '1px solid var(--border-subtle)',
                margin: '0 auto 16px',
              }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {currentConfig.camoOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleCamoSelect(opt.id)}
                    style={{
                      minHeight: 52,
                      backgroundColor: opt.color,
                      border: `3px solid ${selectedCamo === opt.id ? 'var(--border-active)' : 'var(--border-subtle)'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <span className="font-pixel" style={{
                      fontSize: 7,
                      color: 'rgba(255,255,255,0.7)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EXCHANGE RESULT */}
        {phase === 'exchange-result' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(13,13,26,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 25,
            animation: 'fadeIn 0.3s',
          }}>
            <div style={{
              padding: '24px 32px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 12,
              border: '2px solid var(--success)',
              textAlign: 'center',
            }}>
              <h3 className="font-pixel" style={{ fontSize: 14, color: 'var(--success)', marginBottom: 8 }}>
                SAFE!
              </h3>
              <p className="font-pixel" style={{ fontSize: 8, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Predator fooled. It circles back...
              </p>
              <button
                onClick={advanceExchange}
                className="btn btn-primary"
                style={{ fontSize: 9, minWidth: 120, minHeight: 44 }}
              >
                {currentExchange >= TOTAL_EXCHANGES - 1 ? 'Finish' : 'Next Exchange'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pause overlay */}
      {paused && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(13,13,26,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}>
          <h2 className="font-pixel" style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 24 }}>
            PAUSED
          </h2>
          <button
            onClick={togglePause}
            className="btn btn-primary"
            style={{ fontSize: 10, minWidth: 140 }}
          >
            Resume
          </button>
        </div>
      )}
    </div>
  );
}
