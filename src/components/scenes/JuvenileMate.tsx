'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { sfxTap, sfxCorrect, sfxWrong } from '@/lib/audio';
import { UnderwaterBg } from '@/components/sprites';

/* ─── types ─── */

interface JuvenileMateProps {
  onComplete: (stars: number, metrics: { label: string; value: string }[]) => void;
  onFail: (reason: string, explanation: string) => void;
  attemptNumber: number;
}

type Phase = 'split' | 'simon' | 'rival' | 'done';

/* ─── constants ─── */

const SPLIT_DURATION = 15000; // 15 seconds
const DROP_THRESHOLD = 2000; // ms before meter drops fast
const METER_DROP_RATE = 8; // per tick when dropped
const METER_TICK = 100; // ms

/* Simon Says pad colors */
const PAD_COLORS = ['#c75050', '#3b7a3b', '#378ADD', '#EF9F27', '#7F77DD', '#c4956a'];
const PAD_COUNT = 6;

/* Split display patterns */
const AGGRESSIVE_PATTERNS = ['Zebra Bands', 'Dark Flush', 'Intense Eyes'];
const COURTSHIP_PATTERNS = ['Gentle Pulse', 'Pastel Shimmer', 'Soft Glow'];
const AGGRESSIVE_CYCLE = [0, 1, 2]; // must cycle in this order
const COURTSHIP_CYCLE = [0, 1, 2];

/* Rival signals */
interface RivalEvent {
  description: string;
  signalColor: string;
  signalName: string;
  correctResponse: number; // index of correct button
  options: [string, string];
  explanation: string;
}

const RIVAL_EVENTS: RivalEvent[] = [
  {
    description: 'The rival flashes dark zebra stripes rapidly.',
    signalColor: '#2a1508',
    signalName: 'Aggressive Threat',
    correctResponse: 0,
    options: ['Counter with Intense Display', 'Back Down'],
    explanation:
      'Dark rapid striping is an escalation signal. Matching intensity shows dominance without physical confrontation.',
  },
  {
    description: 'The rival shows pale, muted coloring.',
    signalColor: '#d4c8b0',
    signalName: 'Submissive Signal',
    correctResponse: 1,
    options: ['Attack While Weak', 'Hold Position'],
    explanation:
      'Pale coloring signals retreat. Attacking a retreating rival wastes energy and risks injury. Holding position affirms dominance.',
  },
  {
    description: 'The rival splits its display - aggressive toward you, courtship toward the female.',
    signalColor: '#7F77DD',
    signalName: 'Sneaker Tactic',
    correctResponse: 0,
    options: ['Intercept with Full Display', 'Ignore'],
    explanation:
      'Split-display "sneaker" males try to court while appearing non-threatening. Interception with a full display exposes the deception.',
  },
];

/* Simon Says round config */
const ROUND_LENGTHS = [3, 4, 5, 6];
const ROUND_TIMERS: (number | null)[] = [null, null, 8, 6]; // null = no timer

/* ─── tutorial ─── */

function MateTutorial({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: 'Courtship Display',
      body: "Male cuttlefish perform one of nature's most remarkable tricks: a SPLIT DISPLAY.\n\nYou'll show aggressive patterns on one side to scare off a rival, while simultaneously showing gentle courtship patterns on the other side to attract the female.\n\nYou must manage BOTH sides at once!",
    },
    {
      title: 'Phase 1: Split Display',
      body: "The screen is split in two:\n\n  LEFT = Aggressive side (toward rival)\n  RIGHT = Courtship side (toward female)\n\nEach side has 3 patterns to cycle through IN ORDER. Tap the highlighted pattern on each side before the meter drops!\n\nIf either meter hits zero, you fail. Keep alternating between sides!",
    },
    {
      title: 'Phase 2: Pattern Memory',
      body: "Next, you must prove your genetic fitness through pattern complexity.\n\nWatch a sequence of colored flashes, then repeat it back by tapping the matching pads. Each round gets longer and adds a time limit.\n\nCuttlefish females prefer males with the most complex displays!",
    },
    {
      title: 'Phase 3: Rival Signals',
      body: "A rival male approaches! Read his body language and respond correctly:\n\n  • Dark rapid stripes = Escalation threat\n  • Pale muted colors = Submission\n  • Split display = Sneaker tactic\n\nChoose the right response to each signal. Wrong reads waste energy or let the rival steal your mate!\n\nGood luck!",
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
          {step === steps.length - 1 ? 'Begin Courtship!' : 'Next'}
        </button>
      </div>
    </div>
  );
}

/* ─── component ─── */

export default function JuvenileMate({ onComplete, onFail, attemptNumber }: JuvenileMateProps) {
  const [showTutorial, setShowTutorial] = useState(attemptNumber === 1);
  const [phase, setPhase] = useState<Phase>('split');
  const [paused, setPaused] = useState(false);

  /* ─── Split Display state ─── */
  const [splitTimeLeft, setSplitTimeLeft] = useState(SPLIT_DURATION);
  const [rivalMeter, setRivalMeter] = useState(50);
  const [femaleMeter, setFemaleMeter] = useState(50);
  const [aggressiveCycleIdx, setAggressiveCycleIdx] = useState(0);
  const [courtshipCycleIdx, setCourtshipCycleIdx] = useState(0);
  const [lastAggressiveTap, setLastAggressiveTap] = useState(Date.now());
  const [lastCourtshipTap, setLastCourtshipTap] = useState(Date.now());
  const [splitDrops, setSplitDrops] = useState(0); // count of drops >1s
  const [longestDrop, setLongestDrop] = useState(0); // ms of longest drop
  const splitStartRef = useRef(Date.now());

  /* ─── Simon Says state ─── */
  const [simonRound, setSimonRound] = useState(0); // 0-3 for rounds 1-4
  const [simonSequence, setSimonSequence] = useState<number[]>([]);
  const [simonPlayerInput, setSimonPlayerInput] = useState<number[]>([]);
  const [simonPlaying, setSimonPlaying] = useState(false); // true while showing sequence
  const [simonActiveIdx, setSimonActiveIdx] = useState(-1); // which pad is lit during playback
  const [simonErrors, setSimonErrors] = useState(0);
  const [simonTimer, setSimonTimer] = useState<number | null>(null); // seconds left for timed rounds
  const [simonShowFact, setSimonShowFact] = useState(false); // show fact card on first error
  const [simonFactShown, setSimonFactShown] = useState(false);

  /* ─── Rival Response state ─── */
  const [rivalEventIdx, setRivalEventIdx] = useState(0);
  const [rivalChosen, setRivalChosen] = useState<number | null>(null);
  const [rivalCorrectCount, setRivalCorrectCount] = useState(0);
  const [rivalNote, setRivalNote] = useState<string | null>(null);

  /* ─── tracking ─── */
  const [splitFlawless, setSplitFlawless] = useState(true);

  /* ════════════════════════════
     SPLIT DISPLAY PHASE
     ════════════════════════════ */

  /* Split timer + meter decay */
  useEffect(() => {
    if (phase !== 'split' || paused) return;
    splitStartRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      setSplitTimeLeft((prev) => {
        const next = prev - METER_TICK;
        if (next <= 0) {
          setPhase('simon');
          return 0;
        }
        return next;
      });

      /* check aggressive side drop */
      const agDrop = now - lastAggressiveTap;
      if (agDrop > DROP_THRESHOLD) {
        setRivalMeter((prev) => Math.max(0, prev - METER_DROP_RATE));
        setSplitFlawless(false);
      } else {
        setRivalMeter((prev) => Math.min(100, prev + 0.5));
      }
      if (agDrop > 1000) {
        setLongestDrop((prev) => Math.max(prev, agDrop));
      }

      /* check courtship side drop */
      const ctDrop = now - lastCourtshipTap;
      if (ctDrop > DROP_THRESHOLD) {
        setFemaleMeter((prev) => Math.max(0, prev - METER_DROP_RATE));
        setSplitFlawless(false);
      } else {
        setFemaleMeter((prev) => Math.min(100, prev + 0.5));
      }
      if (ctDrop > 1000) {
        setLongestDrop((prev) => Math.max(prev, ctDrop));
      }

      /* fail check */
      setRivalMeter((rm) => {
        if (rm <= 0) {
          onFail(
            'Your aggressive display collapsed! The rival moved in.',
            'Male cuttlefish must maintain a threatening display toward rivals while simultaneously courting the female. Dropping one side for too long lets the rival dominate.',
          );
        }
        return rm;
      });
      setFemaleMeter((fm) => {
        if (fm <= 0) {
          onFail(
            'The female lost interest and swam away.',
            'During courtship, male cuttlefish show remarkably split displays - one half threatening rivals, the other half charming the female. Both must be maintained simultaneously.',
          );
        }
        return fm;
      });
    }, METER_TICK);

    return () => clearInterval(interval);
  }, [phase, paused, lastAggressiveTap, lastCourtshipTap, onFail]);

  /* Track drops >1s */
  useEffect(() => {
    if (phase !== 'split') return;
    const now = Date.now();
    const agDrop = now - lastAggressiveTap;
    const ctDrop = now - lastCourtshipTap;
    if (agDrop > 1000 || ctDrop > 1000) {
      setSplitDrops((prev) => prev + 1);
    }
  }, [rivalMeter, femaleMeter]); // triggered by meter updates

  const handleAggressiveTap = useCallback(
    (patternIdx: number) => {
      if (phase !== 'split' || paused) return;
      const expected = AGGRESSIVE_CYCLE[aggressiveCycleIdx];
      if (patternIdx !== expected) {
        sfxWrong();
        setRivalMeter((prev) => Math.max(0, prev - 5));
        return;
      }
      sfxTap();
      setLastAggressiveTap(Date.now());
      setRivalMeter((prev) => Math.min(100, prev + 8));
      setAggressiveCycleIdx((prev) => (prev + 1) % AGGRESSIVE_CYCLE.length);
    },
    [phase, paused, aggressiveCycleIdx],
  );

  const handleCourtshipTap = useCallback(
    (patternIdx: number) => {
      if (phase !== 'split' || paused) return;
      const expected = COURTSHIP_CYCLE[courtshipCycleIdx];
      if (patternIdx !== expected) {
        sfxWrong();
        setFemaleMeter((prev) => Math.max(0, prev - 5));
        return;
      }
      sfxTap();
      setLastCourtshipTap(Date.now());
      setFemaleMeter((prev) => Math.min(100, prev + 8));
      setCourtshipCycleIdx((prev) => (prev + 1) % COURTSHIP_CYCLE.length);
    },
    [phase, paused, courtshipCycleIdx],
  );

  /* ════════════════════════════
     SIMON SAYS PHASE
     ════════════════════════════ */

  /* Generate sequence for current round */
  useEffect(() => {
    if (phase !== 'simon' || paused) return;
    const len = ROUND_LENGTHS[simonRound];
    const seq: number[] = [];
    for (let i = 0; i < len; i++) {
      seq.push(Math.floor(Math.random() * PAD_COUNT));
    }
    setSimonSequence(seq);
    setSimonPlayerInput([]);
    setSimonPlaying(true);
    setSimonActiveIdx(-1);
  }, [phase, simonRound, paused]);

  /* Play sequence animation */
  useEffect(() => {
    if (!simonPlaying || phase !== 'simon' || paused) return;
    let idx = 0;
    const playNext = () => {
      if (idx >= simonSequence.length) {
        setSimonPlaying(false);
        setSimonActiveIdx(-1);
        /* start timer if applicable */
        const timer = ROUND_TIMERS[simonRound];
        if (timer !== null) {
          setSimonTimer(timer);
        }
        return;
      }
      setSimonActiveIdx(simonSequence[idx]);
      idx++;
      setTimeout(() => {
        setSimonActiveIdx(-1);
        setTimeout(playNext, 200);
      }, 500);
    };
    const startDelay = setTimeout(playNext, 600);
    return () => clearTimeout(startDelay);
  }, [simonPlaying, simonSequence, simonRound, phase, paused]);

  /* Timer countdown for timed rounds */
  useEffect(() => {
    if (simonTimer === null || simonPlaying || phase !== 'simon' || paused) return;
    if (simonTimer <= 0) {
      /* time's up = error */
      sfxWrong();
      setSimonErrors((prev) => prev + 1);
      if (!simonFactShown) {
        setSimonShowFact(true);
        setSimonFactShown(true);
      } else {
        /* retry same round */
        setSimonPlayerInput([]);
        setSimonPlaying(true);
        setSimonTimer(null);
      }
      return;
    }
    const interval = setInterval(() => {
      setSimonTimer((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [simonTimer, simonPlaying, phase, paused, simonFactShown]);

  /* Handle pad tap */
  const handleSimonTap = useCallback(
    (padIdx: number) => {
      if (phase !== 'simon' || simonPlaying || paused || simonShowFact) return;
      sfxTap();

      const nextInput = [...simonPlayerInput, padIdx];
      const expectedIdx = nextInput.length - 1;

      if (simonSequence[expectedIdx] !== padIdx) {
        /* wrong pad */
        sfxWrong();
        setSimonErrors((prev) => prev + 1);
        if (!simonFactShown) {
          setSimonShowFact(true);
          setSimonFactShown(true);
        } else {
          /* retry same round */
          setSimonPlayerInput([]);
          setSimonPlaying(true);
          setSimonTimer(null);
        }
        return;
      }

      setSimonPlayerInput(nextInput);

      if (nextInput.length === simonSequence.length) {
        /* round complete */
        sfxCorrect();
        setSimonTimer(null);

        if (simonRound + 1 >= ROUND_LENGTHS.length) {
          /* all rounds done -> rival phase */
          setTimeout(() => setPhase('rival'), 600);
        } else {
          setTimeout(() => setSimonRound((r) => r + 1), 800);
        }
      }
    },
    [phase, simonPlaying, paused, simonPlayerInput, simonSequence, simonRound, simonShowFact, simonFactShown],
  );

  const handleDismissFact = useCallback(() => {
    setSimonShowFact(false);
    setSimonPlayerInput([]);
    setSimonPlaying(true);
    setSimonTimer(null);
  }, []);

  /* ════════════════════════════
     RIVAL RESPONSE PHASE
     ════════════════════════════ */

  const currentRivalEvent = rivalEventIdx < RIVAL_EVENTS.length ? RIVAL_EVENTS[rivalEventIdx] : null;

  const handleRivalChoice = useCallback(
    (choiceIdx: number) => {
      if (!currentRivalEvent || rivalChosen !== null) return;
      sfxTap();
      setRivalChosen(choiceIdx);

      const correct = choiceIdx === currentRivalEvent.correctResponse;
      if (correct) {
        sfxCorrect();
        setRivalCorrectCount((c) => c + 1);
        setRivalNote('Correct! ' + currentRivalEvent.explanation);
      } else {
        sfxWrong();
        setRivalNote('Wrong. ' + currentRivalEvent.explanation);
      }
    },
    [currentRivalEvent, rivalChosen],
  );

  const handleRivalNext = useCallback(() => {
    sfxTap();
    setRivalChosen(null);
    setRivalNote(null);

    if (rivalEventIdx + 1 >= RIVAL_EVENTS.length) {
      setPhase('done');
    } else {
      setRivalEventIdx((i) => i + 1);
    }
  }, [rivalEventIdx]);

  /* ════════════════════════════
     COMPLETION
     ════════════════════════════ */

  useEffect(() => {
    if (phase !== 'done') return;

    const noDropsOver1s = longestDrop <= 1000;
    const perfectSplit = splitFlawless;
    const allRivalCorrect = rivalCorrectCount === RIVAL_EVENTS.length;

    /* check if we had counter-display on escalation (rival event 0 = escalation, correct = counter) */
    /* This is tracked by rivalCorrectCount covering event 0 */

    let stars = 1; // attracted mate
    if (splitDrops <= 5 && simonErrors <= 2) stars = 2;
    if (noDropsOver1s && simonErrors <= 1 && allRivalCorrect) stars = 3;
    if (perfectSplit && simonErrors === 0 && simonRound >= 2 && allRivalCorrect) stars = 4;
    if (perfectSplit && simonErrors === 0 && allRivalCorrect) stars = 5;

    const metrics = [
      { label: 'Split Display', value: perfectSplit ? 'Flawless' : `${splitDrops} drops` },
      { label: 'Rival Meter (end)', value: `${Math.round(rivalMeter)}%` },
      { label: 'Female Interest (end)', value: `${Math.round(femaleMeter)}%` },
      { label: 'Pattern Errors', value: `${simonErrors}` },
      { label: 'Simon Rounds Cleared', value: `${simonRound + 1}/${ROUND_LENGTHS.length}` },
      { label: 'Rival Reads', value: `${rivalCorrectCount}/${RIVAL_EVENTS.length}` },
    ];

    const timer = setTimeout(() => onComplete(stars, metrics), 800);
    return () => clearTimeout(timer);
  }, [
    phase,
    splitFlawless,
    splitDrops,
    longestDrop,
    rivalMeter,
    femaleMeter,
    simonErrors,
    simonRound,
    rivalCorrectCount,
    onComplete,
  ]);

  /* ─── render ─── */

  if (showTutorial) {
    return <MateTutorial onDone={() => setShowTutorial(false)} />;
  }

  return (
    <div className="fixed inset-0 z-30 bg-bg-dark flex flex-col game-viewport select-none">
      <UnderwaterBg brightness={0.35} />
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-border-subtle bg-bg-surface">
        <span className="font-pixel text-[8px] text-rarity-legendary">COURTSHIP</span>
        <span className="font-pixel text-[7px] text-text-muted uppercase">
          {phase === 'split'
            ? 'Split Display'
            : phase === 'simon'
              ? `Pattern R${simonRound + 1}`
              : phase === 'rival'
                ? 'Rival'
                : 'Done'}
        </span>
        <button
          onClick={() => { sfxTap(); setPaused((p) => !p); }}
          className="btn text-[7px] py-1 px-3"
          style={{ minHeight: 44, minWidth: 44 }}
        >
          {paused ? 'Play' : 'Pause'}
        </button>
      </div>

      {/* Pause overlay */}
      {paused && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <p className="font-pixel text-sm text-text-primary">PAUSED</p>
        </div>
      )}

      {/* ════════════════════════
           SPLIT DISPLAY PHASE
         ════════════════════════ */}
      {phase === 'split' && (
        <div className="flex-1 flex flex-col">
          {/* Meters */}
          <div className="px-3 py-2 bg-bg-surface border-b border-border-subtle">
            {/* Rival meter */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-pixel text-[6px] text-text-muted w-14">RIVAL</span>
              <div className="flex-1 h-2.5 rounded bg-bg-dark border border-border-subtle overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-200"
                  style={{
                    width: `${rivalMeter}%`,
                    backgroundColor: rivalMeter < 30 ? 'var(--danger)' : 'var(--warning)',
                  }}
                />
              </div>
              <span className="font-pixel text-[6px] text-text-primary w-8 text-right">
                {Math.round(rivalMeter)}
              </span>
            </div>
            {/* Female meter */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-pixel text-[6px] text-text-muted w-14">FEMALE</span>
              <div className="flex-1 h-2.5 rounded bg-bg-dark border border-border-subtle overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-200"
                  style={{
                    width: `${femaleMeter}%`,
                    backgroundColor: femaleMeter < 30 ? 'var(--danger)' : 'var(--rarity-epic)',
                  }}
                />
              </div>
              <span className="font-pixel text-[6px] text-text-primary w-8 text-right">
                {Math.round(femaleMeter)}
              </span>
            </div>
            {/* Timer */}
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[6px] text-text-muted w-14">TIME</span>
              <div className="flex-1 h-2 rounded bg-bg-dark border border-border-subtle overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-200"
                  style={{
                    width: `${(splitTimeLeft / SPLIT_DURATION) * 100}%`,
                    backgroundColor: 'var(--border-active)',
                  }}
                />
              </div>
              <span className="font-pixel text-[6px] text-text-primary w-8 text-right">
                {Math.ceil(splitTimeLeft / 1000)}s
              </span>
            </div>
          </div>

          {/* Split display area */}
          <div className="flex-1 flex">
            {/* Left half - Aggressive */}
            <div
              className="w-1/2 flex flex-col items-center justify-center gap-3 p-3"
              style={{
                borderRight: '2px solid var(--border-subtle)',
                backgroundColor: 'rgba(163, 45, 45, 0.05)',
              }}
            >
              <p className="font-pixel text-[7px] text-danger mb-1">AGGRESSIVE</p>
              <p className="font-pixel text-[5px] text-text-muted mb-2">
                Next: {AGGRESSIVE_PATTERNS[AGGRESSIVE_CYCLE[aggressiveCycleIdx]]}
              </p>
              {AGGRESSIVE_PATTERNS.map((pattern, idx) => {
                const isNext = AGGRESSIVE_CYCLE[aggressiveCycleIdx] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAggressiveTap(idx)}
                    className="btn w-full text-[7px] py-3"
                    style={{
                      minHeight: 48,
                      borderColor: isNext ? 'var(--danger)' : 'var(--border-subtle)',
                      backgroundColor: isNext ? 'rgba(163, 45, 45, 0.2)' : 'var(--bg-surface)',
                      animation: isNext ? 'pulse 1s infinite' : undefined,
                    }}
                  >
                    {pattern}
                  </button>
                );
              })}
            </div>

            {/* Right half - Courtship */}
            <div
              className="w-1/2 flex flex-col items-center justify-center gap-3 p-3"
              style={{
                backgroundColor: 'rgba(127, 119, 221, 0.05)',
              }}
            >
              <p className="font-pixel text-[7px] text-rarity-epic mb-1">COURTSHIP</p>
              <p className="font-pixel text-[5px] text-text-muted mb-2">
                Next: {COURTSHIP_PATTERNS[COURTSHIP_CYCLE[courtshipCycleIdx]]}
              </p>
              {COURTSHIP_PATTERNS.map((pattern, idx) => {
                const isNext = COURTSHIP_CYCLE[courtshipCycleIdx] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleCourtshipTap(idx)}
                    className="btn w-full text-[7px] py-3"
                    style={{
                      minHeight: 48,
                      borderColor: isNext ? 'var(--rarity-epic)' : 'var(--border-subtle)',
                      backgroundColor: isNext ? 'rgba(127, 119, 221, 0.2)' : 'var(--bg-surface)',
                      animation: isNext ? 'pulse 1s infinite' : undefined,
                    }}
                  >
                    {pattern}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual: cuttlefish split display */}
          <div className="h-16 flex items-center justify-center bg-bg-surface border-t border-border-subtle">
            <div className="relative w-32 h-10">
              {/* Left half (aggressive) */}
              <div
                className="absolute left-0 top-0 w-1/2 h-full rounded-l-full"
                style={{
                  backgroundColor: rivalMeter > 40 ? '#2a1508' : '#6b4030',
                  transition: 'background-color 0.3s',
                }}
              />
              {/* Right half (courtship) */}
              <div
                className="absolute right-0 top-0 w-1/2 h-full rounded-r-full"
                style={{
                  backgroundColor: femaleMeter > 40 ? '#b8a0d0' : '#6b5a8a',
                  transition: 'background-color 0.3s',
                }}
              />
              {/* Center divider */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-text-primary opacity-30" />
              {/* Eyes */}
              <div
                className="absolute rounded-full"
                style={{ width: 4, height: 4, backgroundColor: '#e0d8ff', left: '25%', top: '35%' }}
              />
              <div
                className="absolute rounded-full"
                style={{ width: 4, height: 4, backgroundColor: '#e0d8ff', left: '68%', top: '35%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════
           SIMON SAYS PHASE
         ════════════════════════ */}
      {phase === 'simon' && (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {/* Round info */}
          <p className="font-pixel text-[9px] text-text-secondary mb-2">
            Pattern Memory - Round {simonRound + 1}/{ROUND_LENGTHS.length}
          </p>
          <p className="font-pixel text-[7px] text-text-muted mb-1">
            Sequence: {ROUND_LENGTHS[simonRound]} colors
            {ROUND_TIMERS[simonRound] !== null && ` | Timer: ${ROUND_TIMERS[simonRound]}s`}
          </p>

          {/* Timer bar for timed rounds */}
          {simonTimer !== null && !simonPlaying && (
            <div className="w-64 h-3 rounded bg-bg-dark border border-border-subtle overflow-hidden mb-4">
              <div
                className="h-full rounded transition-all duration-1000"
                style={{
                  width: `${(simonTimer / (ROUND_TIMERS[simonRound] || 1)) * 100}%`,
                  backgroundColor: simonTimer <= 2 ? 'var(--danger)' : 'var(--warning)',
                }}
              />
            </div>
          )}

          {/* Status */}
          <p className="font-pixel text-[7px] text-text-muted mb-4">
            {simonPlaying
              ? 'Watch the sequence...'
              : `Your turn: ${simonPlayerInput.length}/${simonSequence.length}`}
          </p>

          {/* Display area - shows active pattern */}
          <div
            className="w-24 h-24 rounded-lg border-2 border-border-subtle mb-6 flex items-center justify-center"
            style={{
              backgroundColor:
                simonActiveIdx >= 0 ? PAD_COLORS[simonActiveIdx] : 'var(--bg-surface)',
              transition: 'background-color 0.15s',
              boxShadow:
                simonActiveIdx >= 0
                  ? `0 0 20px ${PAD_COLORS[simonActiveIdx]}80`
                  : 'none',
            }}
          >
            {simonPlaying && simonActiveIdx >= 0 && (
              <span className="font-pixel text-white text-lg" style={{ animation: 'pulse 0.3s' }}>
                !
              </span>
            )}
          </div>

          {/* Pads in semicircle layout */}
          <div className="relative w-72 h-40 mb-4">
            {Array.from({ length: PAD_COUNT }).map((_, i) => {
              /* Semicircle positions */
              const angle = Math.PI - (Math.PI * (i + 0.5)) / PAD_COUNT;
              const radius = 110;
              const cx = 144 + Math.cos(angle) * radius - 28;
              const cy = 130 - Math.sin(angle) * radius;
              const isLitInPlayback = simonPlaying && simonActiveIdx === i;
              const justTapped =
                !simonPlaying &&
                simonPlayerInput.length > 0 &&
                simonPlayerInput[simonPlayerInput.length - 1] === i;

              return (
                <button
                  key={i}
                  onClick={() => handleSimonTap(i)}
                  disabled={simonPlaying || simonShowFact}
                  className="absolute rounded-full border-2 transition-all duration-150"
                  style={{
                    left: cx,
                    top: cy,
                    width: 56,
                    height: 56,
                    minWidth: 56,
                    minHeight: 56,
                    backgroundColor: isLitInPlayback || justTapped ? PAD_COLORS[i] : PAD_COLORS[i] + '40',
                    borderColor: PAD_COLORS[i],
                    boxShadow:
                      isLitInPlayback
                        ? `0 0 16px ${PAD_COLORS[i]}`
                        : justTapped
                          ? `0 0 8px ${PAD_COLORS[i]}`
                          : 'none',
                    opacity: simonPlaying && !isLitInPlayback ? 0.4 : 1,
                    cursor: simonPlaying ? 'not-allowed' : 'pointer',
                  }}
                />
              );
            })}
          </div>

          {/* Errors counter */}
          <p className="font-pixel text-[6px] text-text-muted">
            Errors: {simonErrors}
          </p>

          {/* Fact card overlay (first error) */}
          {simonShowFact && (
            <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4">
              <div
                className="card max-w-md w-full border-border-active"
                style={{ animation: 'slideUp 0.4s ease-out' }}
              >
                <h3 className="font-pixel text-[9px] text-rarity-legendary mb-3 leading-relaxed">
                  Chromatophore Patterns
                </h3>
                <p className="text-text-secondary font-body text-sm leading-relaxed mb-4">
                  Cuttlefish create complex color patterns using millions of chromatophores - pigment cells
                  controlled by muscles. During courtship, males produce intricate displays that must be precisely
                  sequenced. The female evaluates pattern complexity as a sign of genetic fitness.
                </p>
                <button
                  onClick={handleDismissFact}
                  className="btn btn-primary w-full text-[10px]"
                  style={{ minHeight: 48 }}
                >
                  Got it - Retry Round
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════
           RIVAL RESPONSE PHASE
         ════════════════════════ */}
      {phase === 'rival' && currentRivalEvent && (
        <div className="flex-1 flex flex-col px-4 py-4 overflow-y-auto">
          <p className="font-pixel text-[9px] text-text-secondary mb-2 text-center">
            Rival Challenge {rivalEventIdx + 1}/{RIVAL_EVENTS.length}
          </p>

          {/* Rival visual */}
          <div className="flex justify-center mb-4">
            <div
              className="w-28 h-16 rounded-lg border-2 border-border-subtle flex items-center justify-center"
              style={{
                backgroundColor: currentRivalEvent.signalColor,
                transition: 'background-color 0.5s',
                animation: 'pulse 1.5s infinite',
              }}
            >
              <p className="font-pixel text-[6px] text-white drop-shadow-md text-center px-2">
                {currentRivalEvent.signalName}
              </p>
            </div>
          </div>

          {/* Event description */}
          <div className="card mb-4">
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              {currentRivalEvent.description}
            </p>
          </div>

          {/* Choice buttons */}
          {rivalChosen === null ? (
            <div className="flex flex-col gap-3">
              {currentRivalEvent.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRivalChoice(idx)}
                  className="btn w-full text-[8px] py-3"
                  style={{ minHeight: 52 }}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <div
                className="p-3 rounded-lg border-2 mb-3"
                style={{
                  borderColor:
                    rivalChosen === currentRivalEvent.correctResponse
                      ? 'var(--success)'
                      : 'var(--danger)',
                  backgroundColor: 'var(--bg-dark)',
                }}
              >
                <p
                  className="font-pixel text-[8px] mb-1"
                  style={{
                    color:
                      rivalChosen === currentRivalEvent.correctResponse
                        ? 'var(--success)'
                        : 'var(--danger)',
                  }}
                >
                  {rivalChosen === currentRivalEvent.correctResponse ? 'Correct!' : 'Wrong!'}
                </p>
                <p className="text-text-secondary text-xs leading-relaxed">{rivalNote}</p>
              </div>

              <button
                onClick={handleRivalNext}
                className="btn btn-primary w-full text-[9px]"
                style={{ minHeight: 48 }}
              >
                {rivalEventIdx + 1 >= RIVAL_EVENTS.length ? 'See Results' : 'Next Signal'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════
           DONE PHASE
         ════════════════════════ */}
      {phase === 'done' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center" style={{ animation: 'slam 0.4s ease-out' }}>
            <p className="font-pixel text-sm text-rarity-epic mb-2">MATE ATTRACTED!</p>
            <p className="font-pixel text-[7px] text-text-secondary">
              Your courtship display was successful.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
