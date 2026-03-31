'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useProfile } from '@/hooks/useProfile';
import {
  Organism, Predator, ORGANISM_CONFIGS, COVER_ZONES,
  ARENA_W, ARENA_H, STRIKE_RANGE, JOYSTICK_RADIUS, PLAYER_SPEED,
  CATCHES_NEEDED, MAX_ENERGY, PREDATOR_SCHEDULE, RETRY_TIME_OFFSET,
  STUN_DURATION, PREDATOR_DAMAGE,
  clamp, dist, spawnOrganisms,
} from './hatchlingHunt/types';
import { makePredator, updatePredator, checkPredatorCollision, isPredatorOffscreen, isPlayerInCover } from './hatchlingHunt/predators';
import HuntTutorial from './hatchlingHunt/Tutorial';
import { HuntHUD, OrganismLegend, PauseOverlay } from './hatchlingHunt/HUD';
import {
  RenderOrganism, RenderPlayer, RenderPredator, RenderJoystick, RenderCoverZone,
  RenderBackground, StrikeZone, StrikeFlashOverlay, StunOverlay,
  FeedbackPopup,
} from './hatchlingHunt/Renderers';

interface HatchlingHuntProps {
  onComplete: (stars: number, metrics: { label: string; value: string }[]) => void;
  onFail: (reason: string, explanation: string) => void;
  attemptNumber: number;
}

export default function HatchlingHunt({ onComplete, onFail, attemptNumber }: HatchlingHuntProps) {
  const { profile } = useProfile();
  const [showTutorial, setShowTutorial] = useState(attemptNumber === 1);

  // --- Game state ---
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'won' | 'lost'>('playing');
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [catches, setCatches] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [wrongSpecies, setWrongSpecies] = useState(0);
  const [allFromBelow, setAllFromBelow] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
  const [strikeFlash, setStrikeFlash] = useState(false);
  const [stunned, setStunned] = useState(false);
  const [predatorActive, setPredatorActive] = useState(false);
  const [playerHidden, setPlayerHidden] = useState(false);

  // --- Refs ---
  const organismsRef = useRef<Organism[]>(spawnOrganisms());
  const predatorsRef = useRef<Predator[]>([]);
  const playerRef = useRef({ x: ARENA_W / 2, y: ARENA_H - 80 });
  const joystickRef = useRef({ active: false, originX: 0, originY: 0, dx: 0, dy: 0 });
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const elapsedRef = useRef(0);
  const stunTimerRef = useRef(0);
  const predatorHitsRef = useRef(0);
  const spawnedIndicesRef = useRef<Set<number>>(new Set());

  // Sync refs
  const gameStateRef = useRef(gameState);
  const energyRef = useRef(energy);
  const catchesRef = useRef(catches);
  const totalAttemptsRef = useRef(totalAttempts);
  const wrongSpeciesRef = useRef(wrongSpecies);
  const allFromBelowRef = useRef(allFromBelow);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { energyRef.current = energy; }, [energy]);
  useEffect(() => { catchesRef.current = catches; }, [catches]);
  useEffect(() => { totalAttemptsRef.current = totalAttempts; }, [totalAttempts]);
  useEffect(() => { wrongSpeciesRef.current = wrongSpecies; }, [wrongSpecies]);
  useEffect(() => { allFromBelowRef.current = allFromBelow; }, [allFromBelow]);

  const [, setTick] = useState(0);

  const showFeedbackMsg = useCallback((msg: string, type: 'success' | 'error') => {
    setFeedback(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedback(null), 1200);
  }, []);

  // --- Game loop ---
  const gameLoop = useCallback((time: number) => {
    if (gameStateRef.current !== 'playing') return;

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = time;
    elapsedRef.current += dt;
    const elapsed = elapsedRef.current;

    // --- Stun timer ---
    if (stunTimerRef.current > 0) {
      stunTimerRef.current -= dt;
      if (stunTimerRef.current <= 0) {
        stunTimerRef.current = 0;
        setStunned(false);
      }
    }

    // --- Move player (if not stunned) ---
    const joy = joystickRef.current;
    if (stunTimerRef.current <= 0 && joy.active) {
      const mag = Math.sqrt(joy.dx ** 2 + joy.dy ** 2);
      if (mag > 10) {
        const nx = joy.dx / mag;
        const ny = joy.dy / mag;
        const strength = Math.min(mag / JOYSTICK_RADIUS, 1);
        playerRef.current.x = clamp(playerRef.current.x + nx * PLAYER_SPEED * strength * dt * 60, 16, ARENA_W - 16);
        playerRef.current.y = clamp(playerRef.current.y + ny * PLAYER_SPEED * strength * dt * 60, 16, ARENA_H - 16);
      }
    }

    // --- Check if player is hidden in cover ---
    const px = playerRef.current.x;
    const py = playerRef.current.y;
    const hidden = isPlayerInCover(px, py, COVER_ZONES);
    setPlayerHidden(hidden);

    // --- Update organisms ---
    for (const org of organismsRef.current) {
      if (!org.alive) continue;
      const cfg = ORGANISM_CONFIGS[org.type];

      if (org.paused) {
        org.pauseTimer -= dt;
        if (org.pauseTimer <= 0) {
          org.paused = false;
          org.moveTimer = 1.5 + Math.random() * 2.5;
          const angle = Math.random() * Math.PI * 2;
          org.vx = Math.cos(angle) * cfg.speed;
          org.vy = Math.sin(angle) * cfg.speed;
          if (org.type === 'copepod') { org.vx *= 1.5 + Math.random(); org.vy *= 1.5 + Math.random(); }
          if (org.type === 'amphipod') { org.vx *= 2; org.vy *= 0.3; }
        }
      } else {
        org.x += org.vx * dt * 60;
        org.y += org.vy * dt * 60;
        if (org.x < 10 || org.x > ARENA_W - 10) { org.vx *= -1; org.x = clamp(org.x, 10, ARENA_W - 10); }
        if (org.y < 10 || org.y > ARENA_H - 60) { org.vy *= -1; org.y = clamp(org.y, 10, ARENA_H - 60); }
        if (org.type === 'mysid') org.vy *= 0.95;
        org.moveTimer -= dt;
        if (org.moveTimer <= 0) { org.paused = true; org.pauseTimer = 1 + Math.random() * 1.5; org.vx = 0; org.vy = 0; }
      }
    }

    // --- Spawn predators on schedule ---
    const timeOffset = attemptNumber >= 3 ? RETRY_TIME_OFFSET : 0;
    for (let i = 0; i < PREDATOR_SCHEDULE.length; i++) {
      if (spawnedIndicesRef.current.has(i)) continue;
      const entry = PREDATOR_SCHEDULE[i];
      const spawnTime = entry.time - timeOffset;
      if (elapsed >= spawnTime) {
        // Only spawn if no other predator is currently active
        const anyCurrentlyActive = predatorsRef.current.some(p => p.active);
        if (!anyCurrentlyActive) {
          spawnedIndicesRef.current.add(i);
          predatorsRef.current.push(makePredator(entry.type, elapsed));
          showFeedbackMsg('Predator approaching! Find cover!', 'error');
        }
      }
    }

    // --- Update predators ---
    let anyActive = false;
    for (const pred of predatorsRef.current) {
      if (!pred.active) continue;

      updatePredator(pred, px, py, hidden, dt);

      // If player is hidden, predator retreats — check if offscreen
      if (hidden && isPredatorOffscreen(pred)) {
        pred.active = false;
        showFeedbackMsg('Predator retreated!', 'success');
        continue;
      }

      // Collision (skip during stun, skip if hidden)
      if (!hidden && stunTimerRef.current <= 0 && !pred.hasHitPlayer) {
        if (checkPredatorCollision(pred, px, py)) {
          pred.hasHitPlayer = true;
          pred.active = false;
          predatorHitsRef.current++;
          stunTimerRef.current = STUN_DURATION;
          setStunned(true);
          setEnergy(e => {
            const newE = Math.max(0, e - PREDATOR_DAMAGE);
            if (newE <= 0 && catchesRef.current < CATCHES_NEEDED) {
              setTimeout(() => {
                setGameState('lost');
                onFail(
                  'A predator caught you before you could find cover.',
                  'Hatchling cuttlefish face enormous predation pressure — over 90% are eaten in their first weeks. In the wild, hatchlings dash to kelp forests and rock crevices to hide from predators.'
                );
              }, 500);
            }
            return newE;
          });
          showFeedbackMsg('Predator hit! -2 energy', 'error');
        }
      }

      if (pred.active) anyActive = true;
    }
    setPredatorActive(anyActive);

    setTick(t => t + 1);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [attemptNumber, onFail, showFeedbackMsg]);

  // Start/stop game loop
  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(gameLoop);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [gameState, gameLoop]);

  // --- Joystick handlers ---
  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    joystickRef.current = { active: true, originX: touch.clientX - rect.left, originY: touch.clientY - rect.top, dx: 0, dy: 0 };
    setTick(t => t + 1);
  }, []);

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!joystickRef.current.active) return;
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let dx = touch.clientX - rect.left - joystickRef.current.originX;
    let dy = touch.clientY - rect.top - joystickRef.current.originY;
    const mag = Math.sqrt(dx ** 2 + dy ** 2);
    if (mag > JOYSTICK_RADIUS) { dx = (dx / mag) * JOYSTICK_RADIUS; dy = (dy / mag) * JOYSTICK_RADIUS; }
    joystickRef.current.dx = dx;
    joystickRef.current.dy = dy;
  }, []);

  const handleJoystickEnd = useCallback(() => {
    joystickRef.current.active = false;
    joystickRef.current.dx = 0;
    joystickRef.current.dy = 0;
    setTick(t => t + 1);
  }, []);

  const handleJoystickMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    joystickRef.current = { active: true, originX: e.clientX - rect.left, originY: e.clientY - rect.top, dx: 0, dy: 0 };
    setTick(t => t + 1);
    const onMove = (me: MouseEvent) => {
      if (!joystickRef.current.active) return;
      let dx = me.clientX - rect.left - joystickRef.current.originX;
      let dy = me.clientY - rect.top - joystickRef.current.originY;
      const mag = Math.sqrt(dx ** 2 + dy ** 2);
      if (mag > JOYSTICK_RADIUS) { dx = (dx / mag) * JOYSTICK_RADIUS; dy = (dy / mag) * JOYSTICK_RADIUS; }
      joystickRef.current.dx = dx;
      joystickRef.current.dy = dy;
    };
    const onUp = () => {
      joystickRef.current.active = false;
      joystickRef.current.dx = 0;
      joystickRef.current.dy = 0;
      setTick(t => t + 1);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  // --- Strike handler ---
  const handleStrike = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    if (energyRef.current <= 0) return;
    if (stunTimerRef.current > 0) return;

    setStrikeFlash(true);
    setTimeout(() => setStrikeFlash(false), 150);

    const px = playerRef.current.x;
    const py = playerRef.current.y;

    let closest: Organism | null = null;
    let closestDist = Infinity;
    for (const org of organismsRef.current) {
      if (!org.alive) continue;
      const d = dist(px, py, org.x, org.y);
      if (d < STRIKE_RANGE && d < closestDist) { closest = org; closestDist = d; }
    }

    if (!closest) {
      setEnergy(e => e - 1);
      setTotalAttempts(a => a + 1);
      showFeedbackMsg('Miss! Nothing in range', 'error');
      if (energyRef.current - 1 <= 0 && catchesRef.current < CATCHES_NEEDED) {
        setTimeout(() => {
          setGameState('lost');
          onFail('Ran out of energy before catching enough prey.', 'Young cuttlefish must be precise hunters. Each missed strike wastes precious energy that a hatchling cannot afford to lose.');
        }, 500);
      }
      return;
    }

    setTotalAttempts(a => a + 1);

    if (closest.type !== 'mysid') {
      setEnergy(e => e - 1);
      setWrongSpecies(w => w + 1);
      showFeedbackMsg(`Wrong! That's a ${ORGANISM_CONFIGS[closest.type].label}`, 'error');
      if (energyRef.current - 1 <= 0 && catchesRef.current < CATCHES_NEEDED) {
        setTimeout(() => {
          setGameState('lost');
          onFail('Ran out of energy striking wrong prey.', 'Cuttlefish hatchlings learn to identify mysid shrimp by their distinctive split tail and pinkish color. Mistaking other organisms wastes critical energy.');
        }, 500);
      }
      return;
    }

    if (!closest.paused) {
      setEnergy(e => e - 1);
      showFeedbackMsg('Too fast! Wait for it to pause', 'error');
      if (energyRef.current - 1 <= 0 && catchesRef.current < CATCHES_NEEDED) {
        setTimeout(() => {
          setGameState('lost');
          onFail('Ran out of energy with poorly timed strikes.', 'Cuttlefish are ambush predators. They time their tentacle strike for the moment prey pauses, when the catch probability is highest.');
        }, 500);
      }
      return;
    }

    const fromBelow = py > closest.y;
    if (!fromBelow) setAllFromBelow(false);

    closest.alive = false;
    const newCatches = catchesRef.current + 1;
    setCatches(newCatches);
    showFeedbackMsg(`Caught! (${newCatches}/${CATCHES_NEEDED})`, 'success');

    if (newCatches >= CATCHES_NEEDED) {
      setTimeout(() => {
        setGameState('won');
        const finalAttempts = totalAttemptsRef.current + 1;
        const finalWrong = wrongSpeciesRef.current;
        const finalFromBelow = allFromBelowRef.current && fromBelow;

        let stars = 1;
        if (finalAttempts <= 6) stars = 2;
        if (finalAttempts <= 4 && finalWrong === 0) stars = 3;
        if (finalAttempts === 3 && finalWrong === 0 && finalFromBelow) stars = 4;
        if (finalAttempts === 3 && finalWrong === 0 && finalFromBelow && predatorHitsRef.current === 0) stars = 5;

        onComplete(stars, [
          { label: 'Prey caught', value: `${CATCHES_NEEDED}/${CATCHES_NEEDED}` },
          { label: 'Attempts used', value: `${finalAttempts}` },
          { label: 'Wrong species', value: `${finalWrong}` },
          { label: 'Predator hits', value: `${predatorHitsRef.current}` },
          { label: 'Energy remaining', value: `${energyRef.current}` },
          { label: 'Approached from below', value: finalFromBelow ? 'Always' : 'Not always' },
        ]);
      }, 800);
    }
  }, [onComplete, onFail, showFeedbackMsg]);

  const togglePause = useCallback(() => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  }, []);

  // --- Render ---
  if (showTutorial) return <HuntTutorial onDone={() => setShowTutorial(false)} />;
  if (gameState === 'won' || gameState === 'lost') return null;

  const px = playerRef.current.x;
  const py = playerRef.current.y;

  return (
    <div className="game-viewport" style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'var(--bg-dark)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      zIndex: 30,
    }}>
      <HuntHUD
        energy={energy}
        catches={catches}
        catchesNeeded={CATCHES_NEEDED}
        predatorActive={predatorActive}
        onPause={togglePause}
      />

      <div style={{
        position: 'relative',
        width: '100%', maxWidth: ARENA_W, flex: 1,
        overflow: 'hidden', touchAction: 'none',
      }}>
        <RenderBackground />

        {COVER_ZONES.map(zone => (
          <RenderCoverZone
            key={zone.id}
            zone={zone}
            playerNearby={dist(px, py, zone.x + zone.width / 2, zone.y + zone.height / 2) < 80}
          />
        ))}

        {organismsRef.current.map(org => (
          <RenderOrganism key={org.id} org={org} playerX={px} playerY={py} />
        ))}

        {predatorsRef.current.map(pred => (
          <RenderPredator key={pred.id} pred={pred} />
        ))}

        <RenderPlayer
          x={px} y={py}
          strikeFlash={strikeFlash}
          stunned={stunned}
          hidden={playerHidden}
          equipped={profile.equippedCosmetics}
        />

        <RenderJoystick
          joy={joystickRef.current}
          onTouchStart={handleJoystickStart}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onMouseDown={handleJoystickMouseDown}
        />

        <StrikeZone onStrike={handleStrike} />

        {feedback && <FeedbackPopup message={feedback} type={feedbackType} />}
        {strikeFlash && <StrikeFlashOverlay />}
        {stunned && <StunOverlay />}
      </div>

      <OrganismLegend />

      {gameState === 'paused' && <PauseOverlay onResume={togglePause} />}
    </div>
  );
}
