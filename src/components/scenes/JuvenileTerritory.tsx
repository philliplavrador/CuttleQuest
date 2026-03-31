'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { sfxTap, sfxCorrect, sfxWrong } from '@/lib/audio';
import { UnderwaterBg } from '@/components/sprites';

/* ─── types ─── */

interface JuvenileTerritoryProps {
  onComplete: (stars: number, metrics: { label: string; value: string }[]) => void;
  onFail: (reason: string, explanation: string) => void;
  attemptNumber: number;
}

interface Resources {
  preyPopulation: number;
  predatorBalance: number;
  territoryControl: number;
  competitorThreat: number;
  health: number;
}

interface Choice {
  label: string;
  effect: Partial<Resources>;
  note: string; // short tooltip/explanation after picking
}

interface EventCard {
  title: string;
  description: string;
  choices: Choice[];
  /** optional cascading modifier key: if a previous resource is bad it modifies effect */
  cascadeCheck?: (resources: Resources) => Partial<Resources> | null;
}

/* ─── event data (10 rounds) ─── */

const EVENTS: EventCard[] = [
  {
    title: 'Competing Cuttlefish',
    description:
      'A rival cuttlefish has entered your territory. It eyes your hunting ground.',
    choices: [
      {
        label: 'Fight',
        effect: { health: -15, competitorThreat: -25 },
        note: 'You drove the rival off, but took injuries in the scuffle.',
      },
      {
        label: 'Tolerate',
        effect: { competitorThreat: +20, preyPopulation: -5 },
        note: 'You share the reef. The rival begins hunting your prey too.',
      },
      {
        label: 'Display',
        effect: { competitorThreat: -10, health: -3 },
        note: 'Your intimidation display partially worked. The rival is wary but lingers.',
      },
    ],
  },
  {
    title: 'Shrimp Population Boom',
    description:
      'Shrimp are abundant right now. How aggressively will you feed?',
    choices: [
      {
        label: 'Hunt Heavily',
        effect: { preyPopulation: -30, health: +10 },
        note: 'You gorged yourself but the shrimp population cratered.',
      },
      {
        label: 'Hunt Moderately',
        effect: { preyPopulation: -12, health: +6 },
        note: 'A balanced approach. You ate well and prey are still around.',
      },
      {
        label: 'Hunt Conservatively',
        effect: { preyPopulation: -3, health: +2 },
        note: 'You barely touched the bounty. Prey populations remain strong.',
      },
    ],
  },
  {
    title: 'Algal Bloom',
    description:
      'A thick algal bloom has reduced visibility in your territory to near zero.',
    choices: [
      {
        label: 'Stay in Territory',
        effect: { health: -8, territoryControl: +5 },
        note: 'You held your ground but struggled to hunt in the murk.',
      },
      {
        label: 'Move to Clearer Water',
        effect: { territoryControl: -20, health: +3 },
        note: 'You found better hunting grounds, but your territory is now undefended.',
      },
      {
        label: 'Wait It Out',
        effect: { health: -4, preyPopulation: +5 },
        note: 'You conserved energy. The bloom will pass and prey are sheltering too.',
      },
    ],
    cascadeCheck: (r) =>
      r.territoryControl < 50
        ? { territoryControl: -10 } // already weak territory gets weaker
        : null,
  },
  {
    title: 'Reef Shark Patrol',
    description:
      'A large reef shark is making slow passes through the area. You feel exposed.',
    choices: [
      {
        label: 'Hide',
        effect: { health: +2, preyPopulation: +3, predatorBalance: +5 },
        note: 'You hid safely. Missed some hunting time but stayed alive.',
      },
      {
        label: 'Camouflage & Continue',
        effect: { health: -5, predatorBalance: -5 },
        note: 'Risky but effective. You kept hunting while staying mostly hidden.',
      },
      {
        label: 'Flee to Different Zone',
        effect: { territoryControl: -15, health: +5 },
        note: 'You escaped but left your territory vulnerable.',
      },
    ],
    cascadeCheck: (r) =>
      r.health < 40
        ? { health: -10 } // low health makes shark encounter more dangerous
        : null,
  },
  {
    title: 'Octopus Competitor',
    description:
      'An octopus has set up in a nearby crevice and is competing for the same crabs you hunt.',
    choices: [
      {
        label: 'Chase It Off',
        effect: { competitorThreat: -15, health: -10, predatorBalance: -5 },
        note: 'You removed the octopus but it fought back, and the ecosystem lost a member.',
      },
      {
        label: 'Share Territory',
        effect: { competitorThreat: +10, preyPopulation: -8 },
        note: 'Two cephalopods hunting the same reef. Prey is stretched thin.',
      },
      {
        label: 'Switch Prey',
        effect: { preyPopulation: +5, competitorThreat: -5, health: -2 },
        note: 'You diversified your diet. Less competition, new food sources.',
      },
    ],
  },
  {
    title: 'Temperature Spike',
    description:
      'Water temperature has risen. Your usual prey is moving to cooler zones.',
    choices: [
      {
        label: 'Follow Prey',
        effect: { territoryControl: -18, preyPopulation: +10, health: -5 },
        note: 'You followed the food, but your territory is far behind.',
      },
      {
        label: 'Adapt Strategy',
        effect: { health: -3, preyPopulation: -5, predatorBalance: +5 },
        note: 'You found alternative food in warm water. Tougher, but you managed.',
      },
      {
        label: 'Wait for Normal',
        effect: { health: -10, preyPopulation: -8 },
        note: 'The heat persisted longer than expected. You grew hungry.',
      },
    ],
    cascadeCheck: (r) =>
      r.preyPopulation < 40
        ? { preyPopulation: -10, health: -5 } // already scarce prey gets worse
        : null,
  },
  {
    title: 'Fishing Net Spotted',
    description:
      'A commercial fishing net hangs from the surface. Prey fish are clustered in its shadow.',
    choices: [
      {
        label: 'Avoid Entirely',
        effect: { health: -3, preyPopulation: +5 },
        note: 'Safe but hungry. You lost a hunting opportunity.',
      },
      {
        label: 'Hunt in Shadow',
        effect: { health: -15, preyPopulation: -10 },
        note: 'You got tangled briefly. Escaped, but not without cost. The net also killed prey.',
      },
      {
        label: 'Warn Others',
        effect: { health: -5, predatorBalance: +8, competitorThreat: -5 },
        note: 'Your color displays alerted nearby animals. Costs energy but builds ecosystem health.',
      },
    ],
  },
  {
    title: 'Prey Species Declining',
    description:
      'Your primary prey species is noticeably less abundant. Shells and burrows sit empty.',
    choices: [
      {
        label: 'Switch to Alt Prey',
        effect: { preyPopulation: +12, health: -3, predatorBalance: +5 },
        note: 'New prey species are trickier to catch but available. Your old prey gets a break.',
      },
      {
        label: 'Reduce Consumption',
        effect: { health: -8, preyPopulation: +8 },
        note: 'You ate less. Hunger grows, but the prey population stabilizes.',
      },
      {
        label: 'Expand Territory',
        effect: { territoryControl: +10, competitorThreat: +12, preyPopulation: +5 },
        note: 'More ground, more food, but more rivals. Risky expansion.',
      },
    ],
    cascadeCheck: (r) =>
      r.preyPopulation < 30
        ? { preyPopulation: -15, health: -5 }
        : null,
  },
  {
    title: 'Storm Approaching',
    description:
      'Dark clouds gather. Currents are strengthening and visibility is dropping fast.',
    choices: [
      {
        label: 'Shelter in Reef',
        effect: { health: +5, territoryControl: +5 },
        note: 'Safe in the coral. You weathered the storm well.',
      },
      {
        label: 'Continue Hunting',
        effect: { health: -20, preyPopulation: -5 },
        note: 'The storm battered you. Risky and foolish.',
      },
      {
        label: 'Move Deeper',
        effect: { territoryControl: -10, health: +2, predatorBalance: +3 },
        note: 'You dove deep to ride it out. Territory left unguarded briefly.',
      },
    ],
    cascadeCheck: (r) =>
      r.health < 30
        ? { health: -15 } // weak cuttlefish struggles in storm
        : null,
  },
  {
    title: 'Predator Removed',
    description:
      'Fishermen caught a large predator that kept smaller fish in check. The food web may shift.',
    choices: [
      {
        label: 'Continue as Normal',
        effect: { predatorBalance: -15, preyPopulation: -8 },
        note: 'Without the predator, small fish overgraze, destabilizing the ecosystem.',
      },
      {
        label: 'Monitor Prey',
        effect: { predatorBalance: -5, preyPopulation: +3, health: -2 },
        note: 'You noticed changes early and adjusted your feeding patterns.',
      },
      {
        label: 'Reduce Hunting',
        effect: { predatorBalance: +5, preyPopulation: +10, health: -6 },
        note: 'You pulled back to help the ecosystem rebalance. Hungry but wise.',
      },
    ],
  },
];

/* ─── resource config ─── */

const RESOURCE_LABELS: Record<keyof Resources, string> = {
  preyPopulation: 'Prey',
  predatorBalance: 'Ecosystem',
  territoryControl: 'Territory',
  competitorThreat: 'Rivals',
  health: 'Health',
};

const RESOURCE_COLORS: Record<keyof Resources, string> = {
  preyPopulation: 'var(--success)',
  predatorBalance: 'var(--rarity-rare)',
  territoryControl: 'var(--border-active)',
  competitorThreat: 'var(--warning)',
  health: 'var(--danger)',
};

/** For competitorThreat, lower is BETTER (inverted display) */
const isInverted = (key: keyof Resources) => key === 'competitorThreat';

/* ─── helpers ─── */

function clampResources(r: Resources): Resources {
  return {
    preyPopulation: Math.max(0, Math.min(150, r.preyPopulation)),
    predatorBalance: Math.max(0, Math.min(100, r.predatorBalance)),
    territoryControl: Math.max(0, Math.min(150, r.territoryControl)),
    competitorThreat: Math.max(0, Math.min(100, r.competitorThreat)),
    health: Math.max(0, Math.min(100, r.health)),
  };
}

function applyEffects(r: Resources, effects: Partial<Resources>): Resources {
  const next = { ...r };
  (Object.keys(effects) as (keyof Resources)[]).forEach((k) => {
    next[k] += effects[k]!;
  });
  return clampResources(next);
}

function isCriticalDead(r: Resources): string | null {
  if (r.health <= 0) return 'health';
  if (r.preyPopulation <= 0) return 'preyPopulation';
  if (r.predatorBalance <= 0) return 'predatorBalance';
  if (r.territoryControl <= 0) return 'territoryControl';
  if (r.competitorThreat >= 100) return 'competitorThreat';
  return null;
}

const FAIL_EXPLANATIONS: Record<string, string> = {
  health:
    'Your cuttlefish ran out of health. Injury, starvation, and reckless choices left you too weak to survive. In nature, cuttlefish must constantly balance risk and reward.',
  preyPopulation:
    'The prey population collapsed. Overhunting or ecosystem mismanagement depleted your food supply. Cuttlefish depend on healthy prey populations sustained by balanced ecosystems.',
  predatorBalance:
    'The ecosystem became unbalanced. Without predator-prey equilibrium, cascading effects destroyed the reef community. Every species plays a role in the ocean food web.',
  territoryControl:
    'You lost control of your territory entirely. Without a defended home range, you have no reliable hunting ground. Territory is essential for juvenile cuttlefish survival.',
  competitorThreat:
    'Competitors overwhelmed your territory. Too many rivals hunting the same resources made survival impossible. Managing competition is key to a cuttlefish\'s success.',
};

/* ─── optimal response indices (for star calc) ─── */
const OPTIMAL_CHOICES = [2, 1, 2, 0, 2, 1, 0, 0, 0, 2];

/* ─── component ─── */

export default function JuvenileTerritory({ onComplete, onFail, attemptNumber }: JuvenileTerritoryProps) {
  const [resources, setResources] = useState<Resources>({
    preyPopulation: 100,
    predatorBalance: 50,
    territoryControl: 100,
    competitorThreat: 30,
    health: 100,
  });
  const [round, setRound] = useState(0);
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [choiceNote, setChoiceNote] = useState<string | null>(null);
  const [resourceDeltas, setResourceDeltas] = useState<Partial<Resources>>({});
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [choiceHistory, setChoiceHistory] = useState<number[]>([]);
  const [cascadeWarning, setCascadeWarning] = useState<string | null>(null);
  const [minResources, setMinResources] = useState<Resources>({
    preyPopulation: 100,
    predatorBalance: 50,
    territoryControl: 100,
    competitorThreat: 30,
    health: 100,
  });

  const currentEvent = round < EVENTS.length ? EVENTS[round] : null;

  /* check fail after resource change */
  useEffect(() => {
    if (failed || finished) return;
    const deadResource = isCriticalDead(resources);
    if (deadResource) {
      setFailed(deadResource);
      sfxWrong();
    }
  }, [resources, failed, finished]);

  /* trigger onFail when failed is set */
  useEffect(() => {
    if (!failed) return;
    const timer = setTimeout(() => {
      const label = RESOURCE_LABELS[failed as keyof Resources];
      onFail(
        `${label} reached critical level!`,
        FAIL_EXPLANATIONS[failed] || 'Resource depletion caused mission failure.',
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [failed, onFail]);

  /* handle completion */
  useEffect(() => {
    if (!finished) return;

    const optimalCount = choiceHistory.reduce(
      (acc, choice, idx) => acc + (choice === OPTIMAL_CHOICES[idx] ? 1 : 0),
      0,
    );

    const allStable =
      resources.preyPopulation >= 50 &&
      resources.predatorBalance >= 30 &&
      resources.territoryControl >= 50 &&
      resources.competitorThreat <= 60 &&
      resources.health >= 40;

    const noCascade =
      minResources.preyPopulation > 20 &&
      minResources.predatorBalance > 15 &&
      minResources.territoryControl > 20 &&
      minResources.health > 20;

    let stars = 1; // survived
    if (allStable) stars = 2;
    if (allStable && noCascade) stars = 3;
    if (allStable && noCascade && optimalCount >= 7) stars = 4;
    if (allStable && noCascade && optimalCount >= 9) stars = 5;

    const metrics = [
      { label: 'Prey Population', value: `${resources.preyPopulation}` },
      { label: 'Ecosystem Balance', value: `${resources.predatorBalance}` },
      { label: 'Territory Control', value: `${resources.territoryControl}` },
      { label: 'Competitor Threat', value: `${resources.competitorThreat}` },
      { label: 'Health', value: `${resources.health}` },
      { label: 'Optimal Choices', value: `${optimalCount}/${EVENTS.length}` },
    ];

    const timer = setTimeout(() => onComplete(stars, metrics), 800);
    return () => clearTimeout(timer);
  }, [finished, resources, choiceHistory, minResources, onComplete]);

  /* ─── choose handler ─── */
  const handleChoice = useCallback(
    (choiceIdx: number) => {
      if (!currentEvent || chosenIndex !== null) return;
      sfxTap();

      const choice = currentEvent.choices[choiceIdx];
      let totalEffects = { ...choice.effect };

      /* cascade check */
      let cascadeMsg: string | null = null;
      if (currentEvent.cascadeCheck) {
        const extra = currentEvent.cascadeCheck(resources);
        if (extra) {
          cascadeMsg = 'Previous decisions made this worse!';
          (Object.keys(extra) as (keyof Resources)[]).forEach((k) => {
            totalEffects[k] = (totalEffects[k] || 0) + extra[k]!;
          });
        }
      }

      setCascadeWarning(cascadeMsg);
      setChosenIndex(choiceIdx);
      setChoiceNote(choice.note);
      setResourceDeltas(totalEffects);
      setChoiceHistory((prev) => [...prev, choiceIdx]);

      /* apply effects */
      setResources((prev) => {
        const next = applyEffects(prev, totalEffects);
        /* track minimums */
        setMinResources((mins) => ({
          preyPopulation: Math.min(mins.preyPopulation, next.preyPopulation),
          predatorBalance: Math.min(mins.predatorBalance, next.predatorBalance),
          territoryControl: Math.min(mins.territoryControl, next.territoryControl),
          competitorThreat: Math.max(mins.competitorThreat, next.competitorThreat), // inverted
          health: Math.min(mins.health, next.health),
        }));
        return next;
      });

      sfxCorrect();
    },
    [currentEvent, chosenIndex, resources],
  );

  /* ─── advance to next round ─── */
  const handleNextRound = useCallback(() => {
    sfxTap();
    setChosenIndex(null);
    setChoiceNote(null);
    setResourceDeltas({});
    setCascadeWarning(null);

    if (round + 1 >= EVENTS.length) {
      setFinished(true);
    } else {
      setRound((r) => r + 1);
    }
  }, [round]);

  /* ─── resource bar helper ─── */
  const renderBar = (key: keyof Resources) => {
    const val = resources[key];
    const inv = isInverted(key);
    const displayVal = inv ? 100 - val : val;
    const maxVal = key === 'preyPopulation' || key === 'territoryControl' ? 150 : 100;
    const pct = Math.max(0, Math.min(100, (val / maxVal) * 100));
    const delta = resourceDeltas[key];
    const barColor =
      (inv ? val > 70 : val < 30) ? 'var(--danger)' : RESOURCE_COLORS[key];

    return (
      <div key={key} className="flex items-center gap-2 mb-1">
        <span className="font-pixel text-[6px] text-text-muted w-16 truncate">
          {RESOURCE_LABELS[key]}
        </span>
        <div className="flex-1 h-2.5 rounded bg-bg-dark border border-border-subtle overflow-hidden relative">
          <div
            className="h-full rounded transition-all duration-500"
            style={{
              width: `${inv ? 100 - pct : pct}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
        <span className="font-pixel text-[6px] text-text-primary w-8 text-right">
          {Math.round(inv ? displayVal : val)}
        </span>
        {delta !== undefined && chosenIndex !== null && (
          <span
            className="font-pixel text-[6px] w-8"
            style={{
              color:
                (inv ? delta > 0 : delta < 0) ? 'var(--danger)' : 'var(--success)',
              animation: 'fadeIn 0.3s',
            }}
          >
            {(inv ? -delta : delta) > 0 ? '+' : ''}
            {inv ? -delta : delta}
          </span>
        )}
      </div>
    );
  };

  /* ─── render ─── */
  return (
    <div className="fixed inset-0 z-30 bg-bg-dark flex flex-col game-viewport select-none">
      <UnderwaterBg brightness={0.35} />
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-border-subtle bg-bg-surface">
        <span className="font-pixel text-[8px] text-rarity-legendary">TERRITORY</span>
        <span className="font-pixel text-[7px] text-text-muted">
          Round {round + 1}/{EVENTS.length}
        </span>
        <button
          onClick={() => { sfxTap(); setPaused((p) => !p); }}
          className="btn text-[7px] py-1 px-3"
          style={{ minHeight: 44, minWidth: 44 }}
        >
          {paused ? 'Play' : 'Pause'}
        </button>
      </div>

      {/* Resource bars */}
      <div className="px-3 py-2 bg-bg-surface border-b border-border-subtle">
        {(Object.keys(resources) as (keyof Resources)[]).map(renderBar)}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col">
        {/* Pause overlay */}
        {paused && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
            <p className="font-pixel text-sm text-text-primary">PAUSED</p>
          </div>
        )}

        {/* Territory map (decorative top-down view) */}
        <div
          className="w-full h-28 rounded-lg mb-4 relative overflow-hidden border border-border-subtle"
          style={{
            background: 'linear-gradient(180deg, #0a2a4a 0%, #0d1a3a 100%)',
          }}
        >
          {/* Reef elements */}
          <div
            className="absolute rounded-full"
            style={{
              width: 40,
              height: 25,
              backgroundColor: '#3b5a3b',
              left: '20%',
              top: '30%',
              opacity: 0.7,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 30,
              height: 20,
              backgroundColor: '#5a3b3b',
              left: '60%',
              top: '50%',
              opacity: 0.6,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 50,
              height: 30,
              backgroundColor: '#3b4a5a',
              left: '35%',
              top: '15%',
              opacity: 0.5,
            }}
          />
          {/* Player territory indicator */}
          <div
            className="absolute rounded-full border-2 border-dashed"
            style={{
              width: `${Math.max(20, resources.territoryControl * 0.6)}%`,
              height: `${Math.max(20, resources.territoryControl * 0.6)}%`,
              borderColor: 'var(--border-active)',
              opacity: 0.5,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              transition: 'all 0.5s ease',
            }}
          />
          {/* Cuttlefish icon */}
          <div
            className="absolute"
            style={{
              left: '48%',
              top: '45%',
              width: 12,
              height: 8,
              backgroundColor: '#c4956a',
              borderRadius: '50%',
              border: '1px solid #5a4030',
            }}
          />
          {/* Competitor indicator */}
          {resources.competitorThreat > 40 && (
            <div
              className="absolute"
              style={{
                right: '15%',
                top: '25%',
                width: 10,
                height: 7,
                backgroundColor: '#a04040',
                borderRadius: '50%',
                border: '1px solid #702020',
                opacity: resources.competitorThreat / 100,
                animation: 'pulse 2s infinite',
              }}
            />
          )}
          {/* Round label */}
          <div className="absolute bottom-1 right-2">
            <span className="font-pixel text-[5px] text-text-muted opacity-50">
              Territory View
            </span>
          </div>
        </div>

        {/* Event card */}
        {currentEvent && !failed && !finished && (
          <div className="card mb-4" style={{ animation: 'fadeIn 0.4s' }}>
            <h3 className="font-pixel text-[10px] text-rarity-legendary mb-3 leading-relaxed">
              {currentEvent.title}
            </h3>
            <p className="text-text-secondary font-body text-sm leading-relaxed mb-4">
              {currentEvent.description}
            </p>

            {/* Choices */}
            {chosenIndex === null ? (
              <div className="flex flex-col gap-2">
                {currentEvent.choices.map((choice, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChoice(idx)}
                    className="btn w-full text-left text-[8px] py-3 px-4"
                    style={{ minHeight: 48 }}
                  >
                    <span className="text-text-primary">{choice.label}</span>
                    {/* Preview effects */}
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {(Object.entries(choice.effect) as [keyof Resources, number][]).map(
                        ([k, v]) => (
                          <span
                            key={k}
                            className="font-pixel text-[5px]"
                            style={{
                              color:
                                (isInverted(k) ? v > 0 : v < 0)
                                  ? 'var(--danger)'
                                  : 'var(--success)',
                            }}
                          >
                            {RESOURCE_LABELS[k]} {v > 0 ? '+' : ''}{isInverted(k) ? -v : v}
                          </span>
                        ),
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Choice result */
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <div className="p-3 rounded-lg border-2 border-border-active bg-bg-dark mb-3">
                  <p className="font-pixel text-[8px] text-border-active mb-1">
                    Chose: {currentEvent.choices[chosenIndex].label}
                  </p>
                  <p className="text-text-secondary text-xs leading-relaxed">
                    {choiceNote}
                  </p>
                </div>

                {cascadeWarning && (
                  <div
                    className="p-2 rounded border border-danger mb-3"
                    style={{ animation: 'shake 0.3s' }}
                  >
                    <p className="font-pixel text-[7px] text-danger">{cascadeWarning}</p>
                  </div>
                )}

                <button
                  onClick={handleNextRound}
                  className="btn btn-primary w-full text-[9px]"
                  style={{ minHeight: 48 }}
                >
                  {round + 1 >= EVENTS.length ? 'See Results' : 'Next Event'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Finished waiting state */}
        {finished && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ animation: 'fadeIn 0.5s' }}>
              <p className="font-pixel text-sm text-success mb-2">SURVIVED!</p>
              <p className="font-pixel text-[7px] text-text-secondary">
                You managed your territory through {EVENTS.length} events.
              </p>
            </div>
          </div>
        )}

        {/* Failed state */}
        {failed && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ animation: 'shake 0.3s' }}>
              <p className="font-pixel text-sm text-danger mb-2">COLLAPSE</p>
              <p className="font-pixel text-[7px] text-text-muted">
                {RESOURCE_LABELS[failed as keyof Resources]} reached critical level.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
