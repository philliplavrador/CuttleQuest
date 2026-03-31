'use client';

import React, { useState, useCallback, useMemo } from 'react';
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

type Substrate = 'rough rock' | 'smooth rock' | 'coral' | 'sand' | 'kelp' | 'shell bed';
type WaterFlow = 'stagnant' | 'gentle' | 'moderate' | 'strong' | 'variable';
type Light = 'dark' | 'dim' | 'moderate' | 'bright';
type PredatorDistance = 'near' | 'medium' | 'far';
type NestProximity = 'crowded' | 'moderate' | 'isolated';
type SeasonalTemp = 'stable' | 'warming' | 'cooling' | 'deadZone';
type FoodNearby = 'scarce' | 'moderate' | 'abundant';
type Depth = 'shallow' | 'mid' | 'deep';
type CleaningStation = 'near' | 'far';
type SubstrateAngle = 'flat' | 'slight' | 'optimal' | 'steep';

interface NestSite {
  id: number;
  name: string;
  description: string;
  substrate: Substrate;
  waterFlow: WaterFlow;
  light: Light;
  predatorDistance: PredatorDistance;
  nestProximity: NestProximity;
  seasonalTemp: SeasonalTemp;
  foodNearby: FoodNearby;
  depth: Depth;
  cleaningStation: CleaningStation;
  substrateAngle: SubstrateAngle;
  accentColor: string;
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

const SUBSTRATE_ICON: Record<Substrate, string> = {
  'rough rock': '\u{1FAA8}',
  'smooth rock': '\u{1F48E}',
  coral: '\u{1F9CA}',
  sand: '\u{1F3D6}\uFE0F',
  kelp: '\u{1FAB4}',
  'shell bed': '\u{1F41A}',
};

const WATERFLOW_ICON: Record<WaterFlow, string> = {
  stagnant: '\u{1F6AB}',
  gentle: '\u{1F30A}',
  moderate: '\u{1F30A}\u{1F30A}',
  strong: '\u{1F32A}\uFE0F',
  variable: '\u{1F300}',
};

const LIGHT_ICON: Record<Light, string> = {
  dark: '\u{1F311}',
  dim: '\u{1F319}',
  moderate: '\u{26C5}',
  bright: '\u{2600}\uFE0F',
};

const PREDATOR_ICON: Record<PredatorDistance, string> = {
  near: '\u{1F6A8}',
  medium: '\u{26A0}\uFE0F',
  far: '\u{1F6E1}\uFE0F',
};

const NEST_ICON: Record<NestProximity, string> = {
  crowded: '\u{1F4E6}\u{1F4E6}',
  moderate: '\u{1F4E6}',
  isolated: '\u{1F3DD}\uFE0F',
};

const TEMP_ICON: Record<SeasonalTemp, string> = {
  stable: '\u{2705}',
  warming: '\u{1F321}\uFE0F',
  cooling: '\u{2744}\uFE0F',
  deadZone: '\u{2620}\uFE0F',
};

const FOOD_ICON: Record<FoodNearby, string> = {
  scarce: '\u{1F6AB}',
  moderate: '\u{1F990}',
  abundant: '\u{1F990}\u{1F990}',
};

const DEPTH_ICON: Record<Depth, string> = {
  shallow: '\u{1F3CA}',
  mid: '\u{1F30A}',
  deep: '\u{1F9BF}',
};

const CLEANING_ICON: Record<CleaningStation, string> = {
  near: '\u{2728}',
  far: '\u{274C}',
};

const ANGLE_ICON: Record<SubstrateAngle, string> = {
  flat: '\u{2796}',
  slight: '\u{2197}\uFE0F',
  optimal: '\u{2705}',
  steep: '\u{2B06}\uFE0F',
};

/* ------------------------------------------------------------------ */
/*  Scoring — each factor scored individually                          */
/* ------------------------------------------------------------------ */

function scoreSubstrate(s: Substrate): number { return s === 'rough rock' ? 1 : 0; }
function scoreWaterFlow(w: WaterFlow): number { return w === 'moderate' ? 1 : 0; }
function scoreLight(l: Light): number { return l === 'moderate' ? 1 : 0; }
function scorePredatorDistance(p: PredatorDistance): number { return p === 'far' ? 1 : 0; }
function scoreNestProximity(n: NestProximity): number { return n === 'moderate' ? 1 : 0; }
function scoreSeasonalTemp(t: SeasonalTemp): number { return t === 'stable' ? 1 : t === 'deadZone' ? -10 : 0; }
function scoreFoodNearby(f: FoodNearby): number { return f === 'abundant' ? 1 : 0; }
function scoreDepth(d: Depth): number { return d === 'mid' ? 1 : 0; }
function scoreCleaningStation(c: CleaningStation): number { return c === 'near' ? 1 : 0; }
function scoreSubstrateAngle(a: SubstrateAngle): number { return a === 'optimal' ? 1 : 0; }

function isDeadZone(site: NestSite): boolean {
  return site.seasonalTemp === 'deadZone';
}

function totalScore(site: NestSite): number {
  if (isDeadZone(site)) return -1; // instant fail
  return (
    scoreSubstrate(site.substrate) +
    scoreWaterFlow(site.waterFlow) +
    scoreLight(site.light) +
    scorePredatorDistance(site.predatorDistance) +
    scoreNestProximity(site.nestProximity) +
    Math.max(0, scoreSeasonalTemp(site.seasonalTemp)) +
    scoreFoodNearby(site.foodNearby) +
    scoreDepth(site.depth) +
    scoreCleaningStation(site.cleaningStation) +
    scoreSubstrateAngle(site.substrateAngle)
  );
}

function starsFromScore(score: number, isFirstPick: boolean): number {
  // 10 factors total, max score = 10
  if (score === 10 && isFirstPick) return 5;
  if (score >= 8) return 4;
  if (score >= 6) return 3;
  if (score >= 4) return 2;
  return 1;
}

function labelForScore(score: number): string {
  if (score >= 10) return 'Perfect';
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Passable';
  return 'Poor';
}

type FactorRating = 'good' | 'ok' | 'bad';

function rateSubstrate(s: Substrate): FactorRating { return s === 'rough rock' ? 'good' : s === 'coral' || s === 'shell bed' ? 'ok' : 'bad'; }
function rateWaterFlow(w: WaterFlow): FactorRating { return w === 'moderate' ? 'good' : w === 'gentle' || w === 'variable' ? 'ok' : 'bad'; }
function rateLight(l: Light): FactorRating { return l === 'moderate' ? 'good' : l === 'dim' ? 'ok' : 'bad'; }
function ratePredatorDistance(p: PredatorDistance): FactorRating { return p === 'far' ? 'good' : p === 'medium' ? 'ok' : 'bad'; }
function rateNestProximity(n: NestProximity): FactorRating { return n === 'moderate' ? 'good' : 'bad'; }
function rateSeasonalTemp(t: SeasonalTemp): FactorRating { return t === 'stable' ? 'good' : t === 'deadZone' ? 'bad' : 'ok'; }
function rateFoodNearby(f: FoodNearby): FactorRating { return f === 'abundant' ? 'good' : f === 'moderate' ? 'ok' : 'bad'; }
function rateDepth(d: Depth): FactorRating { return d === 'mid' ? 'good' : 'ok'; }
function rateCleaningStation(c: CleaningStation): FactorRating { return c === 'near' ? 'good' : 'bad'; }
function rateSubstrateAngle(a: SubstrateAngle): FactorRating { return a === 'optimal' ? 'good' : a === 'slight' ? 'ok' : 'bad'; }

const RATING_COLORS: Record<FactorRating, string> = {
  good: '#3B6D11',
  ok: '#BA7517',
  bad: '#A32D2D',
};

const RATING_BG: Record<FactorRating, string> = {
  good: 'rgba(59,109,17,0.15)',
  ok: 'rgba(186,117,23,0.15)',
  bad: 'rgba(163,45,45,0.15)',
};

/* ------------------------------------------------------------------ */
/*  Site data — 12 sites with varied attributes                        */
/* ------------------------------------------------------------------ */

const ALL_SITES: NestSite[] = [
  {
    id: 1,
    name: 'Craggy Overhang',
    description: 'A rough rock shelf with moderate flow and balanced light. Clean water from a nearby station.',
    substrate: 'rough rock', waterFlow: 'moderate', light: 'moderate',
    predatorDistance: 'far', nestProximity: 'moderate', seasonalTemp: 'stable',
    foodNearby: 'abundant', depth: 'mid', cleaningStation: 'near', substrateAngle: 'optimal',
    accentColor: '#7c6f5b',
  },
  {
    id: 2,
    name: 'Sandy Clearing',
    description: 'A wide, bright patch of open sand between coral mounds. Strong current sweeps across.',
    substrate: 'sand', waterFlow: 'strong', light: 'bright',
    predatorDistance: 'near', nestProximity: 'isolated', seasonalTemp: 'warming',
    foodNearby: 'scarce', depth: 'shallow', cleaningStation: 'far', substrateAngle: 'flat',
    accentColor: '#c2a95e',
  },
  {
    id: 3,
    name: 'Kelp Forest Floor',
    description: 'Dense kelp canopy overhead. Gentle current but crowded with other nests.',
    substrate: 'kelp', waterFlow: 'gentle', light: 'dark',
    predatorDistance: 'medium', nestProximity: 'crowded', seasonalTemp: 'cooling',
    foodNearby: 'moderate', depth: 'mid', cleaningStation: 'far', substrateAngle: 'flat',
    accentColor: '#3b7a3b',
  },
  {
    id: 4,
    name: 'Coral Shelf',
    description: 'A broad coral ledge with moderate light and gentle flow. Predators patrol nearby.',
    substrate: 'coral', waterFlow: 'gentle', light: 'moderate',
    predatorDistance: 'near', nestProximity: 'moderate', seasonalTemp: 'stable',
    foodNearby: 'moderate', depth: 'shallow', cleaningStation: 'near', substrateAngle: 'slight',
    accentColor: '#c75d8f',
  },
  {
    id: 5,
    name: 'Polished Boulder',
    description: 'A smooth, rounded boulder in stagnant backwater. Dim lighting and far from predators.',
    substrate: 'smooth rock', waterFlow: 'stagnant', light: 'dim',
    predatorDistance: 'far', nestProximity: 'isolated', seasonalTemp: 'stable',
    foodNearby: 'scarce', depth: 'deep', cleaningStation: 'far', substrateAngle: 'steep',
    accentColor: '#6a6a8a',
  },
  {
    id: 6,
    name: 'Reef Crevice',
    description: 'A narrow crack in rough rock. Strong current. Other nests crowd the walls.',
    substrate: 'rough rock', waterFlow: 'strong', light: 'dark',
    predatorDistance: 'far', nestProximity: 'crowded', seasonalTemp: 'cooling',
    foodNearby: 'moderate', depth: 'mid', cleaningStation: 'near', substrateAngle: 'steep',
    accentColor: '#555577',
  },
  {
    id: 7,
    name: 'Sunlit Ledge',
    description: 'Bright coral platform near the surface. Moderate current. Predators visible.',
    substrate: 'coral', waterFlow: 'moderate', light: 'bright',
    predatorDistance: 'near', nestProximity: 'moderate', seasonalTemp: 'warming',
    foodNearby: 'abundant', depth: 'shallow', cleaningStation: 'near', substrateAngle: 'optimal',
    accentColor: '#d49933',
  },
  {
    id: 8,
    name: 'Deep Alcove',
    description: 'A hidden alcove of rough rock with moderate flow and dim light.',
    substrate: 'rough rock', waterFlow: 'moderate', light: 'dim',
    predatorDistance: 'medium', nestProximity: 'moderate', seasonalTemp: 'stable',
    foodNearby: 'moderate', depth: 'deep', cleaningStation: 'far', substrateAngle: 'slight',
    accentColor: '#4a5a6a',
  },
  {
    id: 9,
    name: 'Shell Graveyard',
    description: 'A bed of old shells with variable currents. A dead zone with no oxygen flow.',
    substrate: 'shell bed', waterFlow: 'variable', light: 'dim',
    predatorDistance: 'far', nestProximity: 'isolated', seasonalTemp: 'deadZone',
    foodNearby: 'scarce', depth: 'deep', cleaningStation: 'far', substrateAngle: 'flat',
    accentColor: '#8a7766',
  },
  {
    id: 10,
    name: 'Tidal Channel',
    description: 'A rough rock channel with strong, variable flow. Moderate light. Cleaning fish nearby.',
    substrate: 'rough rock', waterFlow: 'variable', light: 'moderate',
    predatorDistance: 'medium', nestProximity: 'moderate', seasonalTemp: 'stable',
    foodNearby: 'abundant', depth: 'mid', cleaningStation: 'near', substrateAngle: 'optimal',
    accentColor: '#5588AA',
  },
  {
    id: 11,
    name: 'Volcanic Vent',
    description: 'Warm water from a volcanic vent. Sand substrate, stagnant pockets. Dead zone temperatures.',
    substrate: 'sand', waterFlow: 'stagnant', light: 'dark',
    predatorDistance: 'far', nestProximity: 'isolated', seasonalTemp: 'deadZone',
    foodNearby: 'scarce', depth: 'deep', cleaningStation: 'far', substrateAngle: 'steep',
    accentColor: '#994433',
  },
  {
    id: 12,
    name: 'Staghorn Thicket',
    description: 'A coral forest with moderate light and gentle flow. Moderate food nearby.',
    substrate: 'coral', waterFlow: 'gentle', light: 'moderate',
    predatorDistance: 'medium', nestProximity: 'crowded', seasonalTemp: 'warming',
    foodNearby: 'moderate', depth: 'mid', cleaningStation: 'near', substrateAngle: 'slight',
    accentColor: '#AA7755',
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function NestTutorial({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: 'Build Your Egg Nest',
      body: "It's time to lay your eggs — up to 300 of them! But first you need to find the perfect spot.\n\nExamine each potential nest site and pick the best one. Your eggs' survival depends on it!",
    },
    {
      title: 'What to Look For',
      body: "Each site has 10 environmental factors. The key ones:\n\n  🪨  Substrate — rough rock is best for egg attachment\n  🌊  Water flow — moderate keeps eggs oxygenated\n  💡  Light — moderate prevents algae or bleaching\n  🦈  Predators — farther away is safer\n  🌡️  Temperature — stable temps are critical",
    },
    {
      title: 'Watch for Dead Zones',
      body: "Some sites have extreme conditions (toxic, zero-oxygen, etc.) that will kill eggs instantly.\n\nTap each site to inspect all its details. Green indicators are good, red are bad. Pick the site with the highest overall score!",
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
              width: 24, background: i <= step ? '#ab7cff' : 'rgba(255,255,255,0.1)',
            }} />
          ))}
        </div>
        <h2 className="font-pixel text-sm text-purple-300 mb-3 text-center">{s.title}</h2>
        <p className="text-xs text-text-secondary whitespace-pre-line leading-relaxed text-center">{s.body}</p>
        <button onClick={() => step < steps.length - 1 ? setStep(step + 1) : onDone()}
          className="w-full py-3.5 rounded-xl font-pixel text-[10px] text-white mt-6 active:scale-95 transition-all"
          style={{
            background: step === steps.length - 1 ? 'linear-gradient(135deg, #66bb6a, #4caf50)' : 'linear-gradient(135deg, #7c5cbf, #ab7cff)',
            border: `2px solid ${step === steps.length - 1 ? 'rgba(102,187,106,0.5)' : 'rgba(171,124,255,0.5)'}`,
          }}>
          {step === steps.length - 1 ? 'Start Searching!' : 'Next'}
        </button>
      </div>
    </div>
  );
}

export default function AdultNest({ onComplete, onFail, attemptNumber }: SceneProps) {
  const [showTutorial, setShowTutorial] = useState(attemptNumber === 1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [inspecting, setInspecting] = useState<NestSite | null>(null);
  const [committed, setCommitted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pickCount, setPickCount] = useState(0);

  // Shuffle sites per attempt
  const sites = useMemo(() => {
    const copy = [...ALL_SITES];
    const seed = attemptNumber * 7 + 3;
    for (let i = copy.length - 1; i > 0; i--) {
      const j = ((seed * (i + 1) * 13) % (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [attemptNumber]);

  /* ---- handlers ----------------------------------------------------- */

  const handleInspect = useCallback((site: NestSite) => {
    sfxTap();
    setInspecting(site);
    setSelectedId(site.id);
  }, []);

  const handleCloseInspect = useCallback(() => {
    sfxTap();
    setInspecting(null);
  }, []);

  const handleCommit = useCallback(() => {
    if (selectedId === null) return;
    sfxTap();
    setCommitted(true);
    const newPickCount = pickCount + 1;
    setPickCount(newPickCount);

    const site = sites.find(s => s.id === selectedId)!;

    // Dead zone = immediate fail
    if (isDeadZone(site)) {
      sfxWrong();
      onFail(
        `"${site.name}" is in a dead zone! The eggs cannot survive here.`,
        'Dead zones are areas of extremely low oxygen caused by thermal or chemical pollution. Cuttlefish eggs require consistent oxygen flow to develop. Sites near volcanic vents or stagnant basins with abnormal temperatures are lethal to developing embryos.',
      );
      return;
    }

    const score = totalScore(site);

    if (score <= 1) {
      sfxWrong();
      onFail(
        `The site "${site.name}" has too many problems for viable egg development.`,
        'Adult cuttlefish must evaluate many environmental factors when choosing a nest site: substrate texture for egg adhesion, water flow for oxygenation, light levels, predator proximity, nest spacing, temperature stability, food availability, depth, cleaning station access, and substrate angle for proper egg orientation.',
      );
      return;
    }

    sfxCorrect();

    const isFirstPick = newPickCount === 1;
    const stars = starsFromScore(score, isFirstPick);

    const metrics: { label: string; value: string }[] = [
      { label: 'Site chosen', value: site.name },
      { label: 'Substrate', value: `${site.substrate} ${scoreSubstrate(site.substrate) ? '(optimal)' : ''}` },
      { label: 'Water flow', value: `${site.waterFlow} ${scoreWaterFlow(site.waterFlow) ? '(optimal)' : ''}` },
      { label: 'Light', value: `${site.light} ${scoreLight(site.light) ? '(optimal)' : ''}` },
      { label: 'Predator distance', value: `${site.predatorDistance} ${scorePredatorDistance(site.predatorDistance) ? '(optimal)' : ''}` },
      { label: 'Nest proximity', value: `${site.nestProximity} ${scoreNestProximity(site.nestProximity) ? '(optimal)' : ''}` },
      { label: 'Seasonal temp', value: `${site.seasonalTemp} ${scoreSeasonalTemp(site.seasonalTemp) === 1 ? '(optimal)' : ''}` },
      { label: 'Food nearby', value: `${site.foodNearby} ${scoreFoodNearby(site.foodNearby) ? '(optimal)' : ''}` },
      { label: 'Depth', value: `${site.depth} ${scoreDepth(site.depth) ? '(optimal)' : ''}` },
      { label: 'Cleaning station', value: `${site.cleaningStation} ${scoreCleaningStation(site.cleaningStation) ? '(optimal)' : ''}` },
      { label: 'Substrate angle', value: `${site.substrateAngle} ${scoreSubstrateAngle(site.substrateAngle) ? '(optimal)' : ''}` },
      { label: 'Overall', value: `${labelForScore(score)} (${score}/10 optimal)` },
    ];

    onComplete(stars, metrics);
  }, [selectedId, sites, onComplete, onFail, pickCount]);

  /* ---- pause overlay ------------------------------------------------ */

  if (paused) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-dark flex flex-col items-center justify-center px-6">
        <h2 className="font-pixel text-sm text-rarity-legendary mb-6">PAUSED</h2>
        <div className="card mb-6 max-w-sm text-left">
          <h3 className="font-pixel text-[9px] text-border-active mb-3">BRIEFING RECAP</h3>
          <p className="text-text-secondary text-xs leading-relaxed">
            Choose the best nest site for your 300+ eggs. The optimal site has: rough rock substrate,
            moderate water flow, moderate light, far from predators, moderate nest spacing, stable temperature
            (avoid dead zones!), abundant food, mid depth, near a cleaning station, and optimal substrate angle.
          </p>
        </div>
        <button onClick={() => { sfxTap(); setPaused(false); }} className="btn btn-primary text-[10px]">
          Resume
        </button>
      </div>
    );
  }

  /* ---- inspect overlay ---------------------------------------------- */

  if (inspecting) {
    const site = inspecting;
    const factors: { label: string; icon: string; value: string; rating: FactorRating }[] = [
      { label: 'Substrate', icon: SUBSTRATE_ICON[site.substrate], value: site.substrate, rating: rateSubstrate(site.substrate) },
      { label: 'Water Flow', icon: WATERFLOW_ICON[site.waterFlow], value: site.waterFlow, rating: rateWaterFlow(site.waterFlow) },
      { label: 'Light', icon: LIGHT_ICON[site.light], value: site.light, rating: rateLight(site.light) },
      { label: 'Predator Dist.', icon: PREDATOR_ICON[site.predatorDistance], value: site.predatorDistance, rating: ratePredatorDistance(site.predatorDistance) },
      { label: 'Nest Proximity', icon: NEST_ICON[site.nestProximity], value: site.nestProximity, rating: rateNestProximity(site.nestProximity) },
      { label: 'Seasonal Temp', icon: TEMP_ICON[site.seasonalTemp], value: site.seasonalTemp, rating: rateSeasonalTemp(site.seasonalTemp) },
      { label: 'Food Nearby', icon: FOOD_ICON[site.foodNearby], value: site.foodNearby, rating: rateFoodNearby(site.foodNearby) },
      { label: 'Depth', icon: DEPTH_ICON[site.depth], value: site.depth, rating: rateDepth(site.depth) },
      { label: 'Cleaning Stn.', icon: CLEANING_ICON[site.cleaningStation], value: site.cleaningStation, rating: rateCleaningStation(site.cleaningStation) },
      { label: 'Substrate Angle', icon: ANGLE_ICON[site.substrateAngle], value: site.substrateAngle, rating: rateSubstrateAngle(site.substrateAngle) },
    ];

    const goodCount = factors.filter(f => f.rating === 'good').length;
    const badCount = factors.filter(f => f.rating === 'bad').length;

    return (
      <div className="fixed inset-0 z-40 bg-bg-dark flex flex-col">
        <UnderwaterBg brightness={0.35} />
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-border-subtle">
          <button onClick={handleCloseInspect} className="btn text-[8px] py-2 px-4">Back</button>
          <span className="font-pixel text-[10px] text-rarity-legendary">INSPECT</span>
          <button onClick={() => { sfxTap(); setPaused(true); }} className="btn text-[8px] py-2 px-4">Pause</button>
        </div>

        {/* Site visual */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Illustration area */}
          <div
            className="w-full h-32 rounded-card mb-4 flex items-center justify-center relative overflow-hidden"
            style={{
              background: `linear-gradient(180deg, ${site.accentColor}33 0%, var(--bg-surface) 100%)`,
              border: `2px solid ${site.accentColor}`,
            }}
          >
            <div className="absolute bottom-0 left-0 right-0 h-10" style={{ background: `${site.accentColor}44` }} />
            <div className="absolute bottom-2 left-4 w-8 h-10 rounded-t-full" style={{ background: `${site.accentColor}88` }} />
            <div className="absolute bottom-2 right-8 w-10 h-8 rounded-t-full" style={{ background: `${site.accentColor}77` }} />
            <span className="text-4xl z-10">{SUBSTRATE_ICON[site.substrate]}</span>
          </div>

          {/* Name & description */}
          <h2 className="font-pixel text-sm text-text-primary mb-2 leading-relaxed">{site.name}</h2>
          <p className="text-text-secondary text-sm mb-3 leading-relaxed">{site.description}</p>

          {/* Summary badges */}
          <div className="flex gap-2 mb-4">
            <span className="font-pixel text-[7px] px-2 py-1 rounded-btn" style={{ background: RATING_BG.good, color: RATING_COLORS.good }}>
              {goodCount} optimal
            </span>
            <span className="font-pixel text-[7px] px-2 py-1 rounded-btn" style={{ background: RATING_BG.bad, color: RATING_COLORS.bad }}>
              {badCount} poor
            </span>
          </div>

          {/* Dead zone warning */}
          {site.seasonalTemp === 'deadZone' && (
            <div className="p-3 mb-4 rounded-card border-2 border-danger" style={{ background: 'rgba(163,45,45,0.15)' }}>
              <span className="font-pixel text-[8px] text-danger block mb-1">{'\u{2620}\uFE0F'} DEAD ZONE WARNING</span>
              <p className="text-text-secondary text-[10px]">
                This site has lethal temperature conditions. Eggs cannot survive here.
              </p>
            </div>
          )}

          {/* Attribute grid */}
          <div className="space-y-2">
            {factors.map(f => (
              <div
                key={f.label}
                className="flex items-center gap-3 p-2 rounded-btn"
                style={{
                  background: RATING_BG[f.rating],
                  border: `1px solid ${RATING_COLORS[f.rating]}`,
                }}
              >
                <span className="text-lg shrink-0">{f.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-pixel text-[6px] text-text-muted block">{f.label}</span>
                  <span className="font-pixel text-[8px] text-text-primary capitalize">{f.value}</span>
                </div>
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: RATING_COLORS[f.rating] }}
                />
              </div>
            ))}
          </div>

          {/* Hint on retries */}
          {attemptNumber > 1 && (
            <div className="mt-4 p-3 border-2 border-border-active rounded-card bg-bg-surface">
              <span className="font-pixel text-[8px] text-border-active block mb-2">FIELD NOTES</span>
              <p className="text-text-muted text-xs italic">
                The ideal nest: rough rock, moderate flow, moderate light, far predators, moderate spacing,
                stable temp, abundant food, mid depth, near cleaning station, optimal angle.
                Avoid dead zones at all costs!
              </p>
            </div>
          )}
        </div>

        {/* Commit button */}
        <div className="p-4 border-t-2 border-border-subtle">
          <button
            onClick={handleCommit}
            className="btn btn-primary w-full text-[10px]"
            disabled={committed}
          >
            Choose This Site
          </button>
        </div>
      </div>
    );
  }

  /* ---- tutorial ----------------------------------------------------- */
  if (showTutorial) return <NestTutorial onDone={() => setShowTutorial(false)} />;

  /* ---- main scrollable view ----------------------------------------- */

  return (
    <div className="fixed inset-0 z-30 bg-bg-dark flex flex-col game-viewport">
      <UnderwaterBg brightness={0.35} />
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-border-subtle shrink-0">
        <span className="font-pixel text-[10px] text-rarity-legendary">BUILD THE NEST</span>
        <div className="flex items-center gap-2">
          {attemptNumber > 1 && (
            <span className="font-pixel text-[7px] text-text-muted">Attempt #{attemptNumber}</span>
          )}
          <button onClick={() => { sfxTap(); setPaused(true); }} className="btn text-[8px] py-2 px-4">Pause</button>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 py-3 shrink-0">
        <p className="text-text-secondary text-xs leading-relaxed">
          Survey {sites.length} sites and choose where to build your egg nest.
          Consider all 10 factors carefully. Tap a site to inspect it.
        </p>
      </div>

      {/* Scrollable site list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="space-y-3">
          {sites.map(site => {
            const factors: { icon: string; value: string; rating: FactorRating }[] = [
              { icon: SUBSTRATE_ICON[site.substrate], value: site.substrate, rating: rateSubstrate(site.substrate) },
              { icon: WATERFLOW_ICON[site.waterFlow], value: site.waterFlow, rating: rateWaterFlow(site.waterFlow) },
              { icon: LIGHT_ICON[site.light], value: site.light, rating: rateLight(site.light) },
              { icon: PREDATOR_ICON[site.predatorDistance], value: `pred: ${site.predatorDistance}`, rating: ratePredatorDistance(site.predatorDistance) },
              { icon: NEST_ICON[site.nestProximity], value: `nests: ${site.nestProximity}`, rating: rateNestProximity(site.nestProximity) },
              { icon: TEMP_ICON[site.seasonalTemp], value: site.seasonalTemp, rating: rateSeasonalTemp(site.seasonalTemp) },
              { icon: FOOD_ICON[site.foodNearby], value: `food: ${site.foodNearby}`, rating: rateFoodNearby(site.foodNearby) },
              { icon: DEPTH_ICON[site.depth], value: site.depth, rating: rateDepth(site.depth) },
              { icon: CLEANING_ICON[site.cleaningStation], value: `clean: ${site.cleaningStation}`, rating: rateCleaningStation(site.cleaningStation) },
              { icon: ANGLE_ICON[site.substrateAngle], value: `angle: ${site.substrateAngle}`, rating: rateSubstrateAngle(site.substrateAngle) },
            ];

            return (
              <button
                key={site.id}
                onClick={() => handleInspect(site)}
                className="w-full text-left card transition-all duration-200"
                style={{
                  borderColor: selectedId === site.id ? site.accentColor : 'var(--border-subtle)',
                  boxShadow: selectedId === site.id ? `0 0 12px ${site.accentColor}40` : 'none',
                }}
              >
                {/* Card header */}
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-btn flex items-center justify-center shrink-0"
                    style={{ background: `${site.accentColor}33` }}
                  >
                    <span className="text-lg">{SUBSTRATE_ICON[site.substrate]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-pixel text-[9px] text-text-primary leading-relaxed truncate">{site.name}</h3>
                    <p className="text-text-muted text-[10px] truncate">{site.description}</p>
                  </div>
                  <span className="text-text-muted text-lg shrink-0">&rsaquo;</span>
                </div>

                {/* Mini attribute badges with color indicators */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {factors.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-btn"
                      style={{
                        background: RATING_BG[f.rating],
                        color: RATING_COLORS[f.rating],
                        border: `1px solid ${RATING_COLORS[f.rating]}44`,
                      }}
                    >
                      <span className="text-[10px]">{f.icon}</span>
                      <span className="capitalize">{f.value}</span>
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
