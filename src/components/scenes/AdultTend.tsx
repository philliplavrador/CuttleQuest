'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { sfxTap, sfxCorrect, sfxWrong } from '@/lib/audio';
import { UnderwaterBg } from '@/components/sprites';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SceneProps {
  onComplete: (stars: number, metrics: { label: string; value: string }[]) => void;
  onFail: (reason: string, explanation: string) => void;
  attemptNumber: number;
}

type PredatorType = 'wrasse' | 'crab' | 'starfish' | 'moray' | 'octopus';
type EggStatus = 'healthy' | 'low-oxygen' | 'infected' | 'dead';
type EventType = 'predator' | 'infection' | 'temperature' | 'oxygen-drop';

interface EggCluster {
  id: number;
  x: number; // percent 0-100
  y: number; // percent 0-100
  status: EggStatus;
  eggs: number;
  oxygenation: number; // 0-100
  temperature: number; // degrees offset from ideal (0 is ideal)
}

interface GameEvent {
  id: number;
  type: EventType;
  clusterId: number;
  predator?: PredatorType;
  timeMs: number;
  resolved: boolean;
  expiresMs: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TOTAL_EGGS = 300;
const CLUSTER_COUNT = 15;
const EGGS_PER_CLUSTER = Math.ceil(TOTAL_EGGS / CLUSTER_COUNT);
const GAME_DURATION_MS = 90_000; // 90 seconds
const PASS_THRESHOLD = 0.5; // 50% survival

// Senescence settings
const MAX_INPUT_LAG_MS = 200;
const MAX_BLUR_PX = 2;
const MAX_OFFSET_PX = 15;

// Predator info
const PREDATOR_INFO: Record<PredatorType, { icon: string; name: string; action: string; color: string }> = {
  wrasse: { icon: '\u{1F41F}', name: 'Wrasse', action: 'Fan water jets', color: '#378ADD' },
  crab: { icon: '\u{1F980}', name: 'Crab', action: 'Ink spray', color: '#BA7517' },
  starfish: { icon: '\u{2B50}', name: 'Starfish', action: 'Peel away', color: '#7F77DD' },
  moray: { icon: '\u{1F40D}', name: 'Moray Eel', action: 'Flash display', color: '#A32D2D' },
  octopus: { icon: '\u{1F419}', name: 'Octopus', action: 'Jet attack', color: '#639922' },
};

const PREDATOR_ACTIONS: Record<PredatorType, string> = {
  wrasse: 'fan',
  crab: 'ink',
  starfish: 'peel',
  moray: 'flash',
  octopus: 'jet',
};

// Senescence warning messages
const SENESCENCE_MESSAGES = [
  { threshold: 0.25, text: 'Your muscles are weakening...' },
  { threshold: 0.50, text: 'Vision is fading...' },
  { threshold: 0.70, text: 'Reflexes are slowing...' },
  { threshold: 0.85, text: 'Your body is failing...' },
  { threshold: 0.95, text: 'The end approaches...' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateClusters(attemptNumber: number): EggCluster[] {
  const rng = seededRandom(attemptNumber * 31 + 7);
  const clusters: EggCluster[] = [];
  for (let i = 0; i < CLUSTER_COUNT; i++) {
    clusters.push({
      id: i,
      x: 8 + rng() * 84, // 8-92% to keep in bounds
      y: 8 + rng() * 74, // 8-82%
      status: 'healthy',
      eggs: EGGS_PER_CLUSTER,
      oxygenation: 80 + rng() * 20,
      temperature: 0,
    });
  }
  return clusters;
}

function generateEvents(attemptNumber: number): GameEvent[] {
  const rng = seededRandom(attemptNumber * 97 + 13);
  const events: GameEvent[] = [];
  let eventId = 0;
  const predatorTypes: PredatorType[] = ['wrasse', 'crab', 'starfish', 'moray', 'octopus'];

  // Generate predator events — more frequent than Stage 1
  const predatorCount = 12 + Math.floor(rng() * 6);
  for (let i = 0; i < predatorCount; i++) {
    const timeMs = 5000 + rng() * (GAME_DURATION_MS - 15000);
    events.push({
      id: eventId++,
      type: 'predator',
      clusterId: Math.floor(rng() * CLUSTER_COUNT),
      predator: predatorTypes[Math.floor(rng() * predatorTypes.length)],
      timeMs,
      resolved: false,
      expiresMs: timeMs + 4000 + rng() * 2000,
    });
  }

  // Infection events — spreads faster
  const infectionCount = 6 + Math.floor(rng() * 4);
  for (let i = 0; i < infectionCount; i++) {
    const timeMs = 8000 + rng() * (GAME_DURATION_MS - 20000);
    events.push({
      id: eventId++,
      type: 'infection',
      clusterId: Math.floor(rng() * CLUSTER_COUNT),
      timeMs,
      resolved: false,
      expiresMs: timeMs + 3000,
    });
  }

  // Temperature events
  const tempCount = 5 + Math.floor(rng() * 3);
  for (let i = 0; i < tempCount; i++) {
    const timeMs = 3000 + rng() * (GAME_DURATION_MS - 15000);
    events.push({
      id: eventId++,
      type: 'temperature',
      clusterId: Math.floor(rng() * CLUSTER_COUNT),
      timeMs,
      resolved: false,
      expiresMs: timeMs + 5000,
    });
  }

  // Oxygen drop events
  const oxygenCount = 6 + Math.floor(rng() * 4);
  for (let i = 0; i < oxygenCount; i++) {
    const timeMs = 4000 + rng() * (GAME_DURATION_MS - 12000);
    events.push({
      id: eventId++,
      type: 'oxygen-drop',
      clusterId: Math.floor(rng() * CLUSTER_COUNT),
      timeMs,
      resolved: false,
      expiresMs: timeMs + 4000,
    });
  }

  // Sort by time
  events.sort((a, b) => a.timeMs - b.timeMs);
  return events;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdultTend({ onComplete, onFail, attemptNumber }: SceneProps) {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [paused, setPaused] = useState(false);
  const [clusters, setClusters] = useState<EggCluster[]>(() => generateClusters(attemptNumber));
  const [events, setEvents] = useState<GameEvent[]>(() => generateEvents(attemptNumber));
  const [elapsed, setElapsed] = useState(0);
  const [activeEvents, setActiveEvents] = useState<GameEvent[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [senescenceLevel, setSenescenceLevel] = useState(0); // 0-1
  const [senescenceMsg, setSenescenceMsg] = useState('');
  const [inputLag, setInputLag] = useState(0);
  const [blurPx, setBlurPx] = useState(0);
  const [offsetPx, setOffsetPx] = useState(0);

  // Stats tracking
  const [predatorsHandled, setPredatorsHandled] = useState(0);
  const [correctPredatorIDs, setCorrectPredatorIDs] = useState(0);
  const [infectionsStopped, setInfectionsStopped] = useState(0);
  const [infectionsSpread, setInfectionsSpread] = useState(0);
  const [oxygenActions, setOxygenActions] = useState(0);
  const [tempActions, setTempActions] = useState(0);

  const startTimeRef = useRef(0);
  const pauseTimeRef = useRef(0);
  const pauseAccumulatorRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const eventsRef = useRef(events);
  const clustersRef = useRef(clusters);
  const gameStateRef = useRef(gameState);
  const pausedRef = useRef(paused);

  // Keep refs in sync
  useEffect(() => { eventsRef.current = events; }, [events]);
  useEffect(() => { clustersRef.current = clusters; }, [clusters]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  /* ---- Start game --------------------------------------------------- */

  const startGame = useCallback(() => {
    sfxTap();
    setGameState('playing');
    startTimeRef.current = performance.now();
    pauseAccumulatorRef.current = 0;
    setClusters(generateClusters(attemptNumber));
    setEvents(generateEvents(attemptNumber));
    setElapsed(0);
    setActiveEvents([]);
    setSelectedCluster(null);
    setSenescenceLevel(0);
    setSenescenceMsg('');
    setInputLag(0);
    setBlurPx(0);
    setOffsetPx(0);
    setPredatorsHandled(0);
    setCorrectPredatorIDs(0);
    setInfectionsStopped(0);
    setInfectionsSpread(0);
    setOxygenActions(0);
    setTempActions(0);
  }, [attemptNumber]);

  /* ---- Game loop ---------------------------------------------------- */

  const gameLoop = useCallback((now: number) => {
    if (gameStateRef.current !== 'playing') return;
    if (pausedRef.current) {
      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const rawElapsed = now - startTimeRef.current - pauseAccumulatorRef.current;
    const currentElapsed = Math.min(rawElapsed, GAME_DURATION_MS);
    setElapsed(currentElapsed);

    // Senescence progression
    const senLevel = Math.min(1, currentElapsed / GAME_DURATION_MS);
    setSenescenceLevel(senLevel);
    setInputLag(senLevel * MAX_INPUT_LAG_MS);
    setBlurPx(senLevel * MAX_BLUR_PX);
    setOffsetPx(senLevel * MAX_OFFSET_PX);

    // Senescence messages
    for (let i = SENESCENCE_MESSAGES.length - 1; i >= 0; i--) {
      if (senLevel >= SENESCENCE_MESSAGES[i].threshold) {
        setSenescenceMsg(SENESCENCE_MESSAGES[i].text);
        break;
      }
    }

    // Activate new events
    const currentEvents = eventsRef.current;
    const newlyActive: GameEvent[] = [];
    for (const ev of currentEvents) {
      if (!ev.resolved && ev.timeMs <= currentElapsed && ev.expiresMs > currentElapsed) {
        newlyActive.push(ev);
      }
    }
    setActiveEvents(newlyActive);

    // Process expired/unresolved events
    const currentClusters = [...clustersRef.current];
    let infSpread = 0;

    for (const ev of currentEvents) {
      if (ev.resolved) continue;
      if (ev.expiresMs <= currentElapsed) {
        // Event expired unresolved — apply damage
        const cluster = currentClusters.find(c => c.id === ev.clusterId);
        if (!cluster) continue;

        switch (ev.type) {
          case 'predator': {
            const lost = Math.ceil(cluster.eggs * 0.3);
            cluster.eggs = Math.max(0, cluster.eggs - lost);
            if (cluster.eggs === 0) cluster.status = 'dead';
            break;
          }
          case 'infection': {
            cluster.status = 'infected';
            cluster.eggs = Math.max(0, Math.floor(cluster.eggs * 0.6));
            // Spread to adjacent clusters
            const adjacent = currentClusters
              .filter(c => c.id !== cluster.id && c.status !== 'dead')
              .sort((a, b) => {
                const distA = Math.hypot(a.x - cluster.x, a.y - cluster.y);
                const distB = Math.hypot(b.x - cluster.x, b.y - cluster.y);
                return distA - distB;
              })
              .slice(0, 2);
            for (const adj of adjacent) {
              if (adj.status === 'healthy') {
                adj.status = 'infected';
                adj.eggs = Math.max(0, Math.floor(adj.eggs * 0.8));
                infSpread++;
              }
            }
            break;
          }
          case 'temperature': {
            cluster.temperature += 3;
            if (Math.abs(cluster.temperature) > 4) {
              cluster.eggs = Math.max(0, Math.floor(cluster.eggs * 0.7));
            }
            break;
          }
          case 'oxygen-drop': {
            cluster.oxygenation = Math.max(0, cluster.oxygenation - 30);
            cluster.status = cluster.oxygenation < 30 ? 'low-oxygen' : cluster.status;
            if (cluster.oxygenation < 20) {
              cluster.eggs = Math.max(0, Math.floor(cluster.eggs * 0.8));
            }
            break;
          }
        }

        // Mark as resolved
        ev.resolved = true;
      }
    }

    if (infSpread > 0) {
      setInfectionsSpread(prev => prev + infSpread);
    }

    // Natural oxygenation decay
    if (Math.floor(currentElapsed / 3000) !== Math.floor((currentElapsed - 16) / 3000)) {
      for (const cluster of currentClusters) {
        if (cluster.status !== 'dead') {
          cluster.oxygenation = Math.max(0, cluster.oxygenation - 2);
          if (cluster.oxygenation < 20 && cluster.status === 'healthy') {
            cluster.status = 'low-oxygen';
          }
        }
      }
    }

    setClusters(currentClusters);
    setEvents([...currentEvents]);

    // Check game end
    if (currentElapsed >= GAME_DURATION_MS) {
      setGameState('ended');
      return;
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // Start/stop game loop
  useEffect(() => {
    if (gameState === 'playing') {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gameState, gameLoop]);

  // Pause handling
  useEffect(() => {
    if (paused) {
      pauseTimeRef.current = performance.now();
    } else if (pauseTimeRef.current > 0) {
      pauseAccumulatorRef.current += performance.now() - pauseTimeRef.current;
      pauseTimeRef.current = 0;
    }
  }, [paused]);

  /* ---- Handle game end ---------------------------------------------- */

  useEffect(() => {
    if (gameState !== 'ended') return;

    const totalSurvived = clusters.reduce((sum, c) => sum + (c.status !== 'dead' ? c.eggs : 0), 0);
    const survivalRate = totalSurvived / TOTAL_EGGS;
    const survivalPct = Math.round(survivalRate * 100);

    const avgOxygenation = clusters
      .filter(c => c.status !== 'dead')
      .reduce((sum, c, _, arr) => sum + c.oxygenation / arr.length, 0);

    const fullClusterLoss = clusters.filter(c => c.eggs === 0).length;

    const metrics: { label: string; value: string }[] = [
      { label: 'Eggs Survived', value: `${totalSurvived}/${TOTAL_EGGS} (${survivalPct}%)` },
      { label: 'Clusters Lost', value: `${fullClusterLoss}/${CLUSTER_COUNT}` },
      { label: 'Predators Handled', value: `${predatorsHandled}` },
      { label: 'Correct Predator IDs', value: `${correctPredatorIDs}` },
      { label: 'Infections Stopped', value: `${infectionsStopped}` },
      { label: 'Infection Spread', value: `${infectionsSpread}` },
      { label: 'Oxygenation Actions', value: `${oxygenActions}` },
      { label: 'Avg Oxygenation', value: `${Math.round(avgOxygenation)}%` },
      { label: 'Temp Corrections', value: `${tempActions}` },
      { label: 'Senescence Level', value: `${Math.round(senescenceLevel * 100)}%` },
    ];

    if (survivalRate < PASS_THRESHOLD) {
      onFail(
        `Only ${totalSurvived} of ${TOTAL_EGGS} eggs survived (${survivalPct}%). Needed ${Math.ceil(TOTAL_EGGS * PASS_THRESHOLD)}.`,
        'Cuttlefish parents tend their eggs for weeks, fanning them for oxygen, removing parasites, and defending against predators. In their final life stage, senescence degrades their bodies even as they protect the next generation. This sacrifice ensures species survival.',
      );
      return;
    }

    // Star calculation
    let stars = 1;
    if (survivalRate >= 0.60 && fullClusterLoss === 0) stars = 2;
    if (survivalRate >= 0.70 && correctPredatorIDs >= predatorsHandled * 0.8 && infectionsSpread <= 2) stars = 3;
    if (survivalRate >= 0.80 && infectionsSpread === 0 && avgOxygenation >= 70) stars = 4;
    if (survivalRate >= 0.85 && infectionsSpread === 0 && avgOxygenation >= 70 && correctPredatorIDs === predatorsHandled && fullClusterLoss === 0) stars = 5;

    onComplete(stars, metrics);
  }, [gameState, clusters, predatorsHandled, correctPredatorIDs,
    infectionsStopped, infectionsSpread, oxygenActions, tempActions,
    senescenceLevel, onComplete, onFail]);

  /* ---- Event handling with senescence lag --------------------------- */

  const handleAction = useCallback((action: () => void) => {
    const lag = inputLag;
    if (lag > 10) {
      setTimeout(action, lag);
    } else {
      action();
    }
  }, [inputLag]);

  const handleClusterTap = useCallback((clusterId: number) => {
    handleAction(() => {
      sfxTap();
      setSelectedCluster(clusterId);
    });
  }, [handleAction]);

  const handleOxygenate = useCallback((clusterId: number) => {
    handleAction(() => {
      sfxTap();
      setClusters(prev => prev.map(c =>
        c.id === clusterId ? { ...c, oxygenation: Math.min(100, c.oxygenation + 25), status: c.oxygenation + 25 >= 30 && c.status === 'low-oxygen' ? 'healthy' : c.status } : c
      ));
      setOxygenActions(prev => prev + 1);
      showFeedback('Fanning eggs... +O2');
    });
  }, [handleAction]);

  const handleTempCorrect = useCallback((clusterId: number) => {
    handleAction(() => {
      sfxTap();
      setClusters(prev => prev.map(c =>
        c.id === clusterId ? { ...c, temperature: 0 } : c
      ));
      setTempActions(prev => prev + 1);
      showFeedback('Temperature corrected');

      // Also resolve any active temperature events for this cluster
      setEvents(prev => prev.map(ev =>
        ev.type === 'temperature' && ev.clusterId === clusterId && !ev.resolved
          ? { ...ev, resolved: true } : ev
      ));
    });
  }, [handleAction]);

  const handleTreatInfection = useCallback((clusterId: number) => {
    handleAction(() => {
      sfxCorrect();
      setClusters(prev => prev.map(c =>
        c.id === clusterId && c.status === 'infected' ? { ...c, status: 'healthy' } : c
      ));
      setInfectionsStopped(prev => prev + 1);
      showFeedback('Infection treated!');

      setEvents(prev => prev.map(ev =>
        ev.type === 'infection' && ev.clusterId === clusterId && !ev.resolved
          ? { ...ev, resolved: true } : ev
      ));
    });
  }, [handleAction]);

  const handlePredatorResponse = useCallback((eventId: number, predator: PredatorType, action: string) => {
    handleAction(() => {
      const correctAction = PREDATOR_ACTIONS[predator];
      const isCorrect = action === correctAction;

      if (isCorrect) {
        sfxCorrect();
        setCorrectPredatorIDs(prev => prev + 1);
        showFeedback(`${PREDATOR_INFO[predator].name} repelled!`);
      } else {
        sfxWrong();
        showFeedback('Wrong response! Partial effect.');
        // Wrong response still resolves but with reduced effect
        setClusters(prev => prev.map(c => {
          const ev = events.find(e => e.id === eventId);
          if (ev && c.id === ev.clusterId) {
            return { ...c, eggs: Math.max(0, c.eggs - 2) };
          }
          return c;
        }));
      }

      setPredatorsHandled(prev => prev + 1);

      setEvents(prev => prev.map(ev =>
        ev.id === eventId ? { ...ev, resolved: true } : ev
      ));
    });
  }, [handleAction, events]);

  const showFeedback = useCallback((msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 1200);
  }, []);

  /* ---- Computed values ---------------------------------------------- */

  const totalSurviving = useMemo(() =>
    clusters.reduce((sum, c) => sum + (c.status !== 'dead' ? c.eggs : 0), 0),
    [clusters],
  );

  const avgOxy = useMemo(() => {
    const alive = clusters.filter(c => c.status !== 'dead');
    if (alive.length === 0) return 0;
    return alive.reduce((sum, c) => sum + c.oxygenation, 0) / alive.length;
  }, [clusters]);

  const timeRemaining = Math.max(0, GAME_DURATION_MS - elapsed);
  const timeProgress = elapsed / GAME_DURATION_MS;

  // Random offset for senescence visual jitter
  const jitterX = useMemo(() => {
    if (offsetPx < 1) return 0;
    return (Math.sin(elapsed * 0.01) * offsetPx);
  }, [offsetPx, elapsed]);

  const jitterY = useMemo(() => {
    if (offsetPx < 1) return 0;
    return (Math.cos(elapsed * 0.013) * offsetPx * 0.7);
  }, [offsetPx, elapsed]);

  // Active events for selected cluster
  const selectedClusterEvents = useMemo(() =>
    activeEvents.filter(ev => ev.clusterId === selectedCluster && !ev.resolved),
    [activeEvents, selectedCluster],
  );

  /* ---- Pause overlay ------------------------------------------------ */

  if (paused && gameState === 'playing') {
    return (
      <div className="fixed inset-0 z-50 bg-bg-dark flex flex-col items-center justify-center px-6">
        <h2 className="font-pixel text-sm text-rarity-legendary mb-6">PAUSED</h2>
        <div className="card mb-6 max-w-sm text-left">
          <h3 className="font-pixel text-[9px] text-border-active mb-3">BRIEFING RECAP</h3>
          <p className="text-text-secondary text-xs leading-relaxed mb-2">
            Tend your 300+ eggs through their development. Fan them for oxygen, correct temperatures,
            treat infections, and repel predators (wrasse, crab, starfish, moray eel, octopus).
          </p>
          <p className="text-warning text-xs leading-relaxed">
            Warning: Your body is aging. Controls will become sluggish, vision will blur,
            and inputs will drift. This is senescence — fight through it.
          </p>
        </div>
        <button onClick={() => { sfxTap(); setPaused(false); }} className="btn btn-primary text-[10px]">
          Resume
        </button>
      </div>
    );
  }

  /* ---- Ready screen ------------------------------------------------- */

  if (gameState === 'ready') {
    return (
      <div className="fixed inset-0 z-30 bg-bg-dark flex flex-col items-center justify-center px-6 game-viewport">
        <UnderwaterBg brightness={0.35} />
        <h2 className="font-pixel text-sm text-rarity-legendary mb-4">TEND THE EGGS</h2>
        <p className="font-pixel text-[9px] text-text-muted mb-2">FINAL EXAM</p>

        <div className="card mb-6 max-w-sm text-left">
          <p className="text-text-secondary text-xs leading-relaxed mb-3">
            Protect {TOTAL_EGGS} eggs across {CLUSTER_COUNT} clusters for {GAME_DURATION_MS / 1000} seconds.
          </p>
          <p className="text-text-secondary text-xs leading-relaxed mb-3">
            Tap clusters to select them. Manage oxygenation, temperature, infections, and predators.
          </p>
          <div className="border-t-2 border-border-subtle pt-3 mt-3">
            <p className="text-warning text-xs leading-relaxed">
              {'\u{26A0}\uFE0F'} Senescence: Your body degrades over time. Controls become laggy, vision blurs,
              and tap positions drift. Survive through it.
            </p>
          </div>
          <div className="border-t-2 border-border-subtle pt-3 mt-3">
            <p className="text-text-muted text-xs">
              Pass: {Math.ceil(TOTAL_EGGS * PASS_THRESHOLD)}+ eggs ({Math.round(PASS_THRESHOLD * 100)}%)
            </p>
          </div>
        </div>

        {attemptNumber > 1 && (
          <p className="font-pixel text-[7px] text-text-muted mb-4">Attempt #{attemptNumber}</p>
        )}

        <button onClick={startGame} className="btn btn-primary text-[10px] px-8">
          Begin Tending
        </button>
      </div>
    );
  }

  /* ---- Main game view ----------------------------------------------- */

  const selectedClusterData = selectedCluster !== null ? clusters.find(c => c.id === selectedCluster) : null;

  return (
    <div
      className="fixed inset-0 z-30 bg-bg-dark flex flex-col game-viewport"
      style={{
        filter: `blur(${blurPx}px)`,
        transition: 'filter 1s linear',
      }}
    >
      <UnderwaterBg brightness={0.35} />
      {/* Top HUD */}
      <div className="flex items-center justify-between p-2 border-b-2 border-border-subtle shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className="font-pixel text-[6px] text-text-muted block">EGGS</span>
            <span className="font-pixel text-[8px]" style={{
              color: totalSurviving / TOTAL_EGGS > 0.6 ? 'var(--success)' : totalSurviving / TOTAL_EGGS > 0.4 ? 'var(--warning)' : 'var(--danger)',
            }}>
              {totalSurviving}/{TOTAL_EGGS}
            </span>
          </div>
          <div className="text-center">
            <span className="font-pixel text-[6px] text-text-muted block">O2</span>
            <span className="font-pixel text-[8px]" style={{
              color: avgOxy > 60 ? 'var(--success)' : avgOxy > 30 ? 'var(--warning)' : 'var(--danger)',
            }}>
              {Math.round(avgOxy)}%
            </span>
          </div>
          <div className="text-center">
            <span className="font-pixel text-[6px] text-text-muted block">TIME</span>
            <span className="font-pixel text-[8px]" style={{
              color: timeRemaining > 30000 ? 'var(--text-muted)' : timeRemaining > 10000 ? 'var(--warning)' : 'var(--danger)',
            }}>
              {Math.ceil(timeRemaining / 1000)}s
            </span>
          </div>
        </div>
        <button onClick={() => { sfxTap(); setPaused(true); }} className="btn text-[7px] py-1 px-3" style={{ minHeight: 36, minWidth: 36 }}>
          II
        </button>
      </div>

      {/* Senescence bar */}
      <div className="px-2 py-1 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[5px] text-text-muted shrink-0">BODY</span>
          <div className="flex-1 h-1.5 bg-bg-surface rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(1 - senescenceLevel) * 100}%`,
                background: senescenceLevel < 0.5 ? 'var(--success)' : senescenceLevel < 0.75 ? 'var(--warning)' : 'var(--danger)',
                transition: 'width 0.5s linear, background 0.5s',
              }}
            />
          </div>
        </div>
        {senescenceMsg && (
          <p className="font-pixel text-[6px] text-center mt-0.5" style={{
            color: senescenceLevel < 0.5 ? 'var(--warning)' : 'var(--danger)',
            animation: 'pulse 2s infinite',
          }}>
            {senescenceMsg}
          </p>
        )}
      </div>

      {/* Time progress bar */}
      <div className="px-2 shrink-0">
        <div className="w-full h-1 bg-bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-border-active rounded-full"
            style={{ width: `${timeProgress * 100}%`, transition: 'width 0.1s linear' }}
          />
        </div>
      </div>

      {/* Egg field — the main game area */}
      <div
        className="flex-1 relative overflow-hidden mx-2 my-1 rounded-card border-2 border-border-subtle"
        style={{
          background: 'linear-gradient(180deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)',
          transform: `translate(${jitterX}px, ${jitterY}px)`,
          transition: 'transform 0.1s linear',
        }}
      >
        {/* Water particles (subtle animation) */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(1px 1px at 20% 30%, #88aadd, transparent), radial-gradient(1px 1px at 80% 70%, #88aadd, transparent), radial-gradient(1px 1px at 50% 50%, #88aadd, transparent)',
          animation: `pulse ${4 + senescenceLevel * 2}s infinite`,
        }} />

        {/* Egg clusters */}
        {clusters.map(cluster => {
          const hasActiveEvent = activeEvents.some(ev => ev.clusterId === cluster.id && !ev.resolved);
          const isSelected = selectedCluster === cluster.id;
          const isDead = cluster.status === 'dead';

          let bgColor = '#3B6D1144';
          if (cluster.status === 'infected') bgColor = '#A32D2D66';
          else if (cluster.status === 'low-oxygen') bgColor = '#BA751766';
          else if (isDead) bgColor = '#44446644';

          let borderColor = 'transparent';
          if (isSelected) borderColor = '#EF9F27';
          else if (hasActiveEvent) borderColor = '#A32D2D';

          return (
            <button
              key={cluster.id}
              onClick={() => !isDead && handleClusterTap(cluster.id)}
              disabled={isDead}
              className="absolute flex flex-col items-center justify-center transition-all duration-200"
              style={{
                left: `${cluster.x}%`,
                top: `${cluster.y}%`,
                transform: 'translate(-50%, -50%)',
                width: 48,
                height: 48,
                minWidth: 44,
                minHeight: 44,
                borderRadius: '50%',
                background: bgColor,
                border: `2px solid ${borderColor}`,
                boxShadow: hasActiveEvent ? `0 0 8px ${borderColor}88` : 'none',
                opacity: isDead ? 0.3 : 1,
                animation: hasActiveEvent && !isDead ? 'pulse 0.6s infinite' : undefined,
              }}
            >
              <span className="text-[10px]">
                {isDead ? '\u{1F480}' : cluster.status === 'infected' ? '\u{1F9A0}' : cluster.status === 'low-oxygen' ? '\u{1F4A8}' : '\u{1F95A}'}
              </span>
              <span className="font-pixel text-[5px] text-text-primary">{cluster.eggs}</span>

              {/* Active event indicator */}
              {hasActiveEvent && !isDead && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger flex items-center justify-center" style={{ animation: 'pulse 0.5s infinite' }}>
                  <span className="text-[8px]">!</span>
                </div>
              )}
            </button>
          );
        })}

        {/* Predator visuals on active events */}
        {activeEvents.filter(ev => ev.type === 'predator' && !ev.resolved).map(ev => {
          const cluster = clusters.find(c => c.id === ev.clusterId);
          if (!cluster) return null;
          const predInfo = PREDATOR_INFO[ev.predator!];
          return (
            <div
              key={`pred-${ev.id}`}
              className="absolute pointer-events-none"
              style={{
                left: `${cluster.x + 5}%`,
                top: `${cluster.y - 5}%`,
                transform: 'translate(-50%, -50%)',
                animation: 'pulse 0.8s infinite',
              }}
            >
              <span className="text-xl">{predInfo.icon}</span>
            </div>
          );
        })}

        {/* Action feedback toast */}
        {actionFeedback && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-btn font-pixel text-[7px] text-text-primary z-20"
            style={{
              background: 'rgba(83,74,183,0.9)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {actionFeedback}
          </div>
        )}
      </div>

      {/* Bottom action panel */}
      <div className="shrink-0 border-t-2 border-border-subtle bg-bg-surface" style={{ minHeight: 120 }}>
        {selectedClusterData && selectedClusterData.status !== 'dead' ? (
          <div className="p-2">
            {/* Cluster info */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[7px] text-text-primary">
                Cluster #{selectedClusterData.id + 1}
                {' '}{selectedClusterData.status === 'infected' && '\u{1F9A0}'}
                {selectedClusterData.status === 'low-oxygen' && '\u{1F4A8}'}
              </span>
              <div className="flex gap-3">
                <span className="font-pixel text-[6px] text-text-muted">
                  Eggs: {selectedClusterData.eggs}
                </span>
                <span className="font-pixel text-[6px]" style={{
                  color: selectedClusterData.oxygenation > 60 ? 'var(--success)' : selectedClusterData.oxygenation > 30 ? 'var(--warning)' : 'var(--danger)',
                }}>
                  O2: {Math.round(selectedClusterData.oxygenation)}%
                </span>
                <span className="font-pixel text-[6px]" style={{
                  color: Math.abs(selectedClusterData.temperature) < 2 ? 'var(--success)' : 'var(--danger)',
                }}>
                  Temp: {selectedClusterData.temperature > 0 ? '+' : ''}{selectedClusterData.temperature.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Active events for this cluster */}
            {selectedClusterEvents.length > 0 ? (
              <div className="space-y-1 mb-2">
                {selectedClusterEvents.map(ev => {
                  if (ev.type === 'predator' && ev.predator) {
                    const predInfo = PREDATOR_INFO[ev.predator];
                    const remaining = Math.max(0, ev.expiresMs - elapsed);
                    return (
                      <div key={ev.id} className="p-1 rounded-btn" style={{ background: 'rgba(163,45,45,0.2)', border: '1px solid var(--danger)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{predInfo.icon}</span>
                          <span className="font-pixel text-[7px] text-danger flex-1">{predInfo.name} attacking!</span>
                          <span className="font-pixel text-[6px] text-text-muted">{(remaining / 1000).toFixed(1)}s</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {(['fan', 'ink', 'peel', 'flash', 'jet'] as const).map(action => (
                            <button
                              key={action}
                              onClick={() => handlePredatorResponse(ev.id, ev.predator!, action)}
                              className="btn text-[6px] py-1 px-1"
                              style={{ minHeight: 36, minWidth: 36 }}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (ev.type === 'infection') {
                    return (
                      <button
                        key={ev.id}
                        onClick={() => handleTreatInfection(ev.clusterId)}
                        className="btn w-full text-[8px] py-2"
                        style={{ borderColor: 'var(--danger)', background: 'rgba(163,45,45,0.2)', minHeight: 44 }}
                      >
                        {'\u{1F9A0}'} Treat Infection
                      </button>
                    );
                  }

                  if (ev.type === 'temperature') {
                    return (
                      <button
                        key={ev.id}
                        onClick={() => handleTempCorrect(ev.clusterId)}
                        className="btn w-full text-[8px] py-2"
                        style={{ borderColor: 'var(--warning)', background: 'rgba(186,117,23,0.2)', minHeight: 44 }}
                      >
                        {'\u{1F321}\uFE0F'} Correct Temperature
                      </button>
                    );
                  }

                  if (ev.type === 'oxygen-drop') {
                    return (
                      <button
                        key={ev.id}
                        onClick={() => handleOxygenate(ev.clusterId)}
                        className="btn w-full text-[8px] py-2"
                        style={{ borderColor: 'var(--rarity-rare)', background: 'rgba(55,138,221,0.2)', minHeight: 44 }}
                      >
                        {'\u{1F4A8}'} Oxygenate
                      </button>
                    );
                  }

                  return null;
                })}
              </div>
            ) : (
              /* Default actions when no events */
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => handleOxygenate(selectedClusterData.id)}
                  className="btn text-[7px] py-2"
                  style={{ minHeight: 44 }}
                >
                  {'\u{1F4A8}'} Fan (O2)
                </button>
                <button
                  onClick={() => handleTempCorrect(selectedClusterData.id)}
                  className="btn text-[7px] py-2"
                  style={{ minHeight: 44 }}
                >
                  {'\u{1F321}\uFE0F'} Temp
                </button>
                {selectedClusterData.status === 'infected' && (
                  <button
                    onClick={() => handleTreatInfection(selectedClusterData.id)}
                    className="btn text-[7px] py-2 col-span-2"
                    style={{ borderColor: 'var(--danger)', minHeight: 44 }}
                  >
                    {'\u{1F9A0}'} Treat Infection
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="font-pixel text-[8px] text-text-muted">
              {selectedClusterData?.status === 'dead' ? 'This cluster is lost.' : 'Tap an egg cluster to tend it'}
            </p>
            {activeEvents.length > 0 && (
              <p className="font-pixel text-[7px] text-danger mt-2 animate-pulse">
                {activeEvents.length} event{activeEvents.length !== 1 ? 's' : ''} need attention!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
