import type { SceneProps } from '@/types/game';

export type { SceneProps };

/* ------------------------------------------------------------------ */
/*  Habitat attribute types (scoring only — never shown to player)     */
/* ------------------------------------------------------------------ */

export type Substrate = 'rough rock' | 'smooth rock' | 'coral' | 'sand' | 'kelp';
export type WaterFlow = 'stagnant' | 'gentle' | 'moderate' | 'strong';
export type Light = 'dark' | 'dim' | 'moderate' | 'bright';
export type PredatorDistance = 'near' | 'medium' | 'far';
export type NestProximity = 'crowded' | 'moderate' | 'isolated';

export interface HabitatOption {
  name: string;
  emoji: string;
  /** Vivid prose embedding all 5 attributes naturally — the only thing the player sees */
  prose: string;
  /* Hidden scoring fields */
  substrate: Substrate;
  waterFlow: WaterFlow;
  light: Light;
  predatorDistance: PredatorDistance;
  nestProximity: NestProximity;
}

export interface HabitatQuestion {
  id: number;
  /** Exploration-flavored narration shown above the two choices */
  prompt: string;
  optionA: HabitatOption;
  optionB: HabitatOption;
  correctAnswer: 'A' | 'B';
  explanation: string;
}

/* ------------------------------------------------------------------ */
/*  Scoring helpers                                                    */
/* ------------------------------------------------------------------ */

export function scoreSubstrate(s: Substrate): number { return s === 'rough rock' ? 1 : 0; }
export function scoreWaterFlow(w: WaterFlow): number { return w === 'moderate' ? 1 : 0; }
export function scoreLight(l: Light): number { return l === 'moderate' ? 1 : 0; }
export function scorePredatorDistance(p: PredatorDistance): number { return p === 'far' ? 1 : 0; }
export function scoreNestProximity(n: NestProximity): number { return n === 'moderate' ? 1 : 0; }

export function totalSiteScore(o: HabitatOption): number {
  return scoreSubstrate(o.substrate) + scoreWaterFlow(o.waterFlow) +
    scoreLight(o.light) + scorePredatorDistance(o.predatorDistance) +
    scoreNestProximity(o.nestProximity);
}

export function starsFromCorrect(correct: number, total: number): number {
  const pct = correct / total;
  if (pct >= 1.0) return 5;
  if (pct >= 0.8) return 4;
  if (pct >= 0.6) return 3;
  if (pct >= 0.4) return 2;
  if (pct >= 0.2) return 1;
  return 0;
}

export function labelForStars(stars: number): string {
  if (stars === 5) return 'Perfect';
  if (stars === 4) return 'Excellent';
  if (stars === 3) return 'Good';
  if (stars === 2) return 'Passable';
  if (stars === 1) return 'Poor';
  return 'Failed';
}

/* ------------------------------------------------------------------ */
/*  Question pool (15 questions, 10 selected per game)                 */
/* ------------------------------------------------------------------ */

export const QUESTION_POOL: HabitatQuestion[] = [
  // ── EASY: Single-factor focus (Q1-5) ──────────────────────────────

  {
    id: 1,
    prompt: 'You drift between two ledges. Where would you anchor your eggs?',
    optionA: {
      name: 'North Ledge', emoji: '📍',
      prose: 'A weathered rock ledge, its surface pitted and ridged by years of erosion. Steady current sweeps past, carrying filtered light from above. A few wrasse patrol the reef edge some distance away. Several other egg clusters dot the area, spaced comfortably apart.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'moderate',
      predatorDistance: 'medium', nestProximity: 'moderate',
    },
    optionB: {
      name: 'South Shelf', emoji: '📍',
      prose: 'A wide, flat stretch of fine white sand stretches between two coral mounds. The same steady current passes through, and the light is soft and even. No predators nearby, and no other nests in sight \u2014 just smooth, featureless ground.',
      substrate: 'sand', waterFlow: 'moderate', light: 'moderate',
      predatorDistance: 'medium', nestProximity: 'moderate',
    },
    correctAnswer: 'A',
    explanation: 'Eggs attach with tiny protein stalks that grip rough surfaces. Sand offers no hold \u2014 they\'d wash away with the first current.',
  },
  {
    id: 2,
    prompt: 'Two rocky spots \u2014 but the water feels very different at each.',
    optionA: {
      name: 'East Ridge', emoji: '📍',
      prose: 'A rough rock shelf where a steady, moderate current flows past without pause. Fresh water constantly cycles through, carrying tiny particles in the light. Far from the busy reef, with a comfortable gap to the nearest nest.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'moderate',
      predatorDistance: 'far', nestProximity: 'moderate',
    },
    optionB: {
      name: 'West Cove', emoji: '📍',
      prose: 'A quiet pocket of rough rock tucked behind a coral wall. The water here is perfectly still \u2014 not a ripple, not a current. Filtered light reaches the surface, and no predators venture into this dead-end. A comfortable gap separates you from the nearest nest.',
      substrate: 'rough rock', waterFlow: 'stagnant', light: 'moderate',
      predatorDistance: 'far', nestProximity: 'moderate',
    },
    correctAnswer: 'A',
    explanation: 'Embryos breathe through their egg capsules. Stagnant water creates a suffocation zone \u2014 eggs need flowing water to deliver oxygen.',
  },
  {
    id: 3,
    prompt: 'You sense two rocky overhangs ahead. One feels exposed, the other hidden.',
    optionA: {
      name: 'Outer Wall', emoji: '📍',
      prose: 'Rough rock on the main reef face, bathed in even light with a steady current. But a wrasse darts past, then a crab scuttles along the edge. Another fish circles back for a second look. Other nests are spaced out nearby.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'moderate',
      predatorDistance: 'near', nestProximity: 'moderate',
    },
    optionB: {
      name: 'Inner Reef', emoji: '📍',
      prose: 'Rough rock tucked behind a tall coral wall where few creatures venture. The same steady current and soft light reach this spot, but the reef\'s hunters don\'t. A handful of other nests sit at a comfortable distance.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'moderate',
      predatorDistance: 'far', nestProximity: 'moderate',
    },
    correctAnswer: 'B',
    explanation: 'Wrasses, crabs, and even other cuttlefish eat unguarded eggs. Distance from predators is critical for survival.',
  },
  {
    id: 4,
    prompt: 'Two sheltered spots \u2014 one drenched in sunlight, the other shaded.',
    optionA: {
      name: 'Site Alpha', emoji: '📍',
      prose: 'A rough rock platform near the surface, blazing with direct sunlight. Every detail is sharply visible. Steady current and safe distance from predators. Other nests spaced out evenly. But the brightness feels intense.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'bright',
      predatorDistance: 'far', nestProximity: 'moderate',
    },
    optionB: {
      name: 'Site Beta', emoji: '📍',
      prose: 'Rough rock beneath a natural overhang that filters the light into a soft, even glow. Steady current passes through. Safe from predators behind the overhang, with a comfortable gap to the nearest nest.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'moderate',
      predatorDistance: 'far', nestProximity: 'moderate',
    },
    correctAnswer: 'B',
    explanation: 'Moderate light supports development without excessive algae growth or attracting visual predators. Too bright is risky.',
  },
  {
    id: 5,
    prompt: 'Both rocks look good, but one area is packed with other nests.',
    optionA: {
      name: 'The Overhang', emoji: '📍',
      prose: 'Rough rock with the same steady current and filtered light, equally far from predators. A few other nests sit nearby, but there\'s plenty of room. Your eggs would have space to breathe.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'moderate',
      predatorDistance: 'far', nestProximity: 'moderate',
    },
    optionB: {
      name: 'The Passage', emoji: '📍',
      prose: 'Rough rock with steady current and filtered light, far from any predator. But egg clusters cling to every surface \u2014 dozens of them, packed tight. You\'d have to squeeze your eggs between someone else\'s clutch.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'moderate',
      predatorDistance: 'far', nestProximity: 'crowded',
    },
    correctAnswer: 'A',
    explanation: 'Crowded nests compete for oxygen, and newly-hatched cuttlefish will cannibalize neighboring eggs. Moderate spacing is safest.',
  },

  // ── MEDIUM: Tradeoff questions (Q6-10) ────────────────────────────

  {
    id: 6,
    prompt: 'The current pulls you toward two very different overhangs...',
    optionA: {
      name: 'Deep Nook', emoji: '📍',
      prose: 'Rough, pitted rock inside a narrow tunnel. The walls are perfect for gripping \u2014 but the current rips through like a jet, bending the kelp flat. Dim light filters in from both ends. Far from predators, with room from other nests.',
      substrate: 'rough rock', waterFlow: 'strong', light: 'dim',
      predatorDistance: 'far', nestProximity: 'moderate',
    },
    optionB: {
      name: 'Far Point', emoji: '📍',
      prose: 'A broad coral platform where the water flows gently past. Soft, even light. The coral surface is bumpy but brittle \u2014 not quite rock. A wrasse passed by earlier, but it didn\'t linger. Other nests are spaced comfortably.',
      substrate: 'coral', waterFlow: 'gentle', light: 'moderate',
      predatorDistance: 'medium', nestProximity: 'moderate',
    },
    correctAnswer: 'B',
    explanation: 'Strong current tears eggs loose even from rough rock. Coral with gentle flow is a better compromise \u2014 the eggs can hold on.',
  },
  {
    id: 7,
    prompt: 'One spot is perfectly safe but the ground worries you...',
    optionA: {
      name: 'Mid Channel', emoji: '📍',
      prose: 'Rough, craggy rock with deep ridges perfect for anchoring. Steady flow and filtered light. Other nests spaced out nearby. But this wall sits on the reef edge \u2014 you can see fish patrolling just beyond the drop-off.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'moderate',
      predatorDistance: 'near', nestProximity: 'moderate',
    },
    optionB: {
      name: 'The Arch', emoji: '📍',
      prose: 'Soft, fine sand far from any predator. The water flows at a steady pace, light is gentle and even, and other nests are spaced well apart. Everything is ideal \u2014 except there\'s nothing but smooth sand to anchor to.',
      substrate: 'sand', waterFlow: 'moderate', light: 'moderate',
      predatorDistance: 'far', nestProximity: 'moderate',
    },
    correctAnswer: 'A',
    explanation: 'Without grip, eggs can\'t attach at all \u2014 they\'re lost immediately. Some predator risk beats losing every egg.',
  },
  {
    id: 8,
    prompt: 'You discover two nooks \u2014 one eerily still, the other buzzing with life.',
    optionA: {
      name: 'The Gap', emoji: '📍',
      prose: 'Rough rock walls in a deep pocket where the water sits perfectly motionless. Not a ripple, not a current. Dim light seeps in from above. No predators have passed this way in ages. Room from the nearest nest. But the stillness is unsettling.',
      substrate: 'rough rock', waterFlow: 'stagnant', light: 'dim',
      predatorDistance: 'far', nestProximity: 'moderate',
    },
    optionB: {
      name: 'Coral Flat', emoji: '📍',
      prose: 'A rough rock shelf on the active reef where moderate current brings constant fresh water. Even, filtered light. Other nests spaced apart. But the reef is alive \u2014 you spot a wrasse darting past, a crab picking at algae nearby.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'moderate',
      predatorDistance: 'near', nestProximity: 'moderate',
    },
    correctAnswer: 'B',
    explanation: 'Without water flow, embryos suffocate \u2014 it\'s a death sentence. Predator risk is survivable; no oxygen isn\'t.',
  },
  {
    id: 9,
    prompt: 'Two dark spots beckon. One is silent, the other whispers with current.',
    optionA: {
      name: 'Stone Run', emoji: '📍',
      prose: 'A narrow crevice where dim light filters through cracks above. You can feel a steady, moderate current threading through the gap. The rough walls offer solid grip. A few other nests cling to the walls at a comfortable distance. Something moved out past the entrance, but it didn\'t come in.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'dim',
      predatorDistance: 'medium', nestProximity: 'moderate',
    },
    optionB: {
      name: 'Tide Pool', emoji: '📍',
      prose: 'Pitch black inside a deep cave, the rough walls untouched by light. The water is perfectly still \u2014 trapped and lifeless. No predator has ever hunted here. You\'d be the only nest for a long distance.',
      substrate: 'rough rock', waterFlow: 'stagnant', light: 'dark',
      predatorDistance: 'far', nestProximity: 'isolated',
    },
    correctAnswer: 'A',
    explanation: 'The cave has zero flow and total darkness. Eggs need water circulation for oxygen and at least some light for healthy development.',
  },
  {
    id: 10,
    prompt: 'A smooth boulder or a jagged outcrop \u2014 safety vs grip.',
    optionA: {
      name: 'The Grotto', emoji: '📍',
      prose: 'A perfectly smooth, wave-polished boulder. Your tentacles slide right off the glassy surface. Gentle current, even light, far from any predator, good spacing from other nests. Everything is ideal \u2014 if only you could hold on.',
      substrate: 'smooth rock', waterFlow: 'gentle', light: 'moderate',
      predatorDistance: 'far', nestProximity: 'moderate',
    },
    optionB: {
      name: 'The Narrows', emoji: '📍',
      prose: 'Sharp, textured rock covered in ridges and pits. Steady current flows past and the light is soft and filtered. It\'s a bit more exposed \u2014 something swam past earlier \u2014 and a cluster of other nests sits a little too close for comfort.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'moderate',
      predatorDistance: 'medium', nestProximity: 'crowded',
    },
    correctAnswer: 'B',
    explanation: 'Smooth surfaces can\'t hold eggs \u2014 the protein-based glue needs texture to bond. Grip is non-negotiable.',
  },

  // ── HARD: Multi-attribute close calls (Q11-15) ────────────────────

  {
    id: 11,
    prompt: 'The kelp forest or the open rock? Each has its appeal...',
    optionA: {
      name: 'Anchor Rock', emoji: '📍',
      prose: 'Open, pitted rock beneath a natural shelf that filters sunlight into a soft glow. A steady current sweeps through carrying fresh water. The reef\'s hunters stay on the other side of the formation. A handful of other nests sit at a comfortable distance.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'moderate',
      predatorDistance: 'far', nestProximity: 'moderate',
    },
    optionB: {
      name: 'Drift Point', emoji: '📍',
      prose: 'Dense kelp stalks sway overhead, blocking nearly all light. The water barely moves between the thick fronds. Dozens of egg clusters already hang from every stalk \u2014 this is clearly a popular spot. You\'d attach your eggs to the kelp itself, hoping it holds.',
      substrate: 'kelp', waterFlow: 'gentle', light: 'dark',
      predatorDistance: 'medium', nestProximity: 'crowded',
    },
    correctAnswer: 'A',
    explanation: 'Kelp substrate is unstable \u2014 it sways, rots, and breaks. The rocky overhang has the ideal combination of grip, flow, light, and safety.',
  },
  {
    id: 12,
    prompt: 'Both spots have rough, grippy rock. But the conditions differ...',
    optionA: {
      name: 'The Basin', emoji: '📍',
      prose: 'Rough, pitted rock on an exposed crag where current blasts through with real force. It\'s pitch dark in the shadow of the overhang above. No predators brave this turbulent spot, but dozens of nests crowd the sheltered pockets \u2014 others had the same idea.',
      substrate: 'rough rock', waterFlow: 'strong', light: 'dark',
      predatorDistance: 'far', nestProximity: 'crowded',
    },
    optionB: {
      name: 'Edge Rock', emoji: '📍',
      prose: 'Rough rock on a broad, calm shelf. Moderate current glides past, and filtered light dapples the surface. Something swam by in the distance earlier, but didn\'t approach. A few other nests sit nearby with comfortable room between them.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'moderate',
      predatorDistance: 'medium', nestProximity: 'moderate',
    },
    correctAnswer: 'B',
    explanation: 'Strong current rips eggs away even from rough rock, and total darkness stunts development. The calmer spot has far better conditions overall.',
  },
  {
    id: 13,
    prompt: 'Warm shallows or cool depths \u2014 your instincts pull both ways.',
    optionA: {
      name: 'Low Shelf', emoji: '📍',
      prose: 'Rough rock deeper down where the water is cooler and dimmer. A steady, moderate current threads through a gap in the reef. No predators patrol this far from the sunlit zone. A few other nests nearby, but there\'s room.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'dim',
      predatorDistance: 'far', nestProximity: 'moderate',
    },
    optionB: {
      name: 'High Crest', emoji: '📍',
      prose: 'Rough rock in warm, bright water near the surface. A gentle current drifts past lazily. The warmth feels inviting, but shadows of fish flicker overhead \u2014 hunters circling. You\'d be the only nest in this patch.',
      substrate: 'rough rock', waterFlow: 'gentle', light: 'bright',
      predatorDistance: 'near', nestProximity: 'isolated',
    },
    correctAnswer: 'A',
    explanation: 'Warm water speeds growth but raises fungus risk, and bright light attracts predators. The deeper spot has far better overall conditions.',
  },
  {
    id: 14,
    prompt: 'A close call. Both feel promising \u2014 read carefully.',
    optionA: {
      name: 'The Hollow', emoji: '📍',
      prose: 'Rough, ridged rock with steady current flowing past. Safe and tucked away from the reef\'s predators. But the overhang blocks most of the light, leaving it quite dim. And you notice other nests packed in tight \u2014 barely any room between clutches.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'dim',
      predatorDistance: 'far', nestProximity: 'crowded',
    },
    optionB: {
      name: 'Near Shore', emoji: '📍',
      prose: 'Rough rock on an open terrace with steady current and soft, even light filtering down. Other nests are spaced comfortably apart. The one downside \u2014 it\'s closer to the active reef, and something passed by a few minutes ago.',
      substrate: 'rough rock', waterFlow: 'moderate', light: 'moderate',
      predatorDistance: 'medium', nestProximity: 'moderate',
    },
    correctAnswer: 'B',
    explanation: 'Both have rough rock and good flow. But the open spot has moderate light AND spacing \u2014 4 optimal factors vs 3.',
  },
  {
    id: 15,
    prompt: 'Neither spot looks great. Pick the least bad option.',
    optionA: {
      name: 'Shallow Bend', emoji: '📍',
      prose: 'Rough, craggy rock in a deep depression where fierce current churns through. It\'s pitch dark at the bottom. No predators dare the turbulence, but dozens of other nests already crowd the walls \u2014 every crack is taken.',
      substrate: 'rough rock', waterFlow: 'strong', light: 'dark',
      predatorDistance: 'far', nestProximity: 'crowded',
    },
    optionB: {
      name: 'Open Water', emoji: '📍',
      prose: 'Wave-polished rock, impossibly smooth and glossy. The water is completely still \u2014 trapped in a shallow depression. Blinding sunlight reflects off the surface. At least nothing hunts here. You\'d be the only nest for a long distance.',
      substrate: 'smooth rock', waterFlow: 'stagnant', light: 'bright',
      predatorDistance: 'far', nestProximity: 'isolated',
    },
    correctAnswer: 'A',
    explanation: 'Neither is great. But at least eggs can attach to rough rock. Smooth rock means eggs can\'t stick at all \u2014 that\'s an instant loss.',
  },
];

/* ------------------------------------------------------------------ */
/*  "Spot the Danger" helpers                                          */
/* ------------------------------------------------------------------ */

export type DangerCategory = 'ground' | 'environment' | 'creature';

export interface DangerTarget {
  category: DangerCategory;
  attribute: string;
  value: string;
  label: string;
  hint: string;
}

const DANGER_DEFS: {
  attribute: string;
  good: string;
  bad: { value: string; severity: number; category: DangerCategory; label: string; hint: string }[];
}[] = [
  {
    attribute: 'substrate',
    good: 'rough rock',
    bad: [
      { value: 'sand', severity: 3, category: 'ground', label: 'Sandy bottom — eggs slide right off!', hint: 'Look at what the eggs would attach to...' },
      { value: 'smooth rock', severity: 3, category: 'ground', label: 'Smooth rock — nothing to grip!', hint: 'Look at the surface texture...' },
      { value: 'kelp', severity: 2, category: 'ground', label: 'Kelp substrate — it sways and rots!', hint: 'Look at what the eggs would cling to...' },
      { value: 'coral', severity: 1, category: 'ground', label: 'Brittle coral — it can snap!', hint: 'Look at the surface below...' },
    ],
  },
  {
    attribute: 'waterFlow',
    good: 'moderate',
    bad: [
      { value: 'stagnant', severity: 3, category: 'environment', label: 'Dead still water — no oxygen!', hint: 'Notice how the water is moving...' },
      { value: 'strong', severity: 2, category: 'environment', label: 'Raging current — eggs torn loose!', hint: 'Feel the water flow...' },
      { value: 'gentle', severity: 1, category: 'environment', label: 'Barely any current — low oxygen.', hint: 'Watch the water movement...' },
    ],
  },
  {
    attribute: 'light',
    good: 'moderate',
    bad: [
      { value: 'dark', severity: 3, category: 'environment', label: 'Total darkness — stunts growth!', hint: 'Look at how much light reaches here...' },
      { value: 'bright', severity: 2, category: 'environment', label: 'Blinding light — attracts hunters!', hint: 'Notice the brightness level...' },
      { value: 'dim', severity: 1, category: 'environment', label: 'Too dim — slows development.', hint: 'Check the lighting conditions...' },
    ],
  },
  {
    attribute: 'predatorDistance',
    good: 'far',
    bad: [
      { value: 'near', severity: 3, category: 'creature', label: 'Predators right here — eggs in danger!', hint: 'Look for anything lurking nearby...' },
      { value: 'medium', severity: 1, category: 'creature', label: 'Predators not far off.', hint: 'Scan for movement at the edges...' },
    ],
  },
  {
    attribute: 'nestProximity',
    good: 'moderate',
    bad: [
      { value: 'crowded', severity: 2, category: 'creature', label: 'Too crowded — eggs compete for oxygen!', hint: 'Look at how packed the area is...' },
      { value: 'isolated', severity: 1, category: 'creature', label: 'Totally isolated — no safety in numbers.', hint: 'Notice how empty the area is...' },
    ],
  },
];

export function getWorstDanger(option: HabitatOption): DangerTarget {
  let worst: DangerTarget | null = null;
  let worstSeverity = -1;

  for (const def of DANGER_DEFS) {
    const val = option[def.attribute as keyof HabitatOption] as string;
    if (val === def.good) continue;
    const match = def.bad.find(b => b.value === val);
    if (match && match.severity > worstSeverity) {
      worstSeverity = match.severity;
      worst = {
        category: match.category,
        attribute: def.attribute,
        value: match.value,
        label: match.label,
        hint: match.hint,
      };
    }
  }

  // Fallback (shouldn't happen — the wrong option always has at least one bad attribute)
  return worst ?? {
    category: 'environment',
    attribute: 'waterFlow',
    value: 'stagnant',
    label: 'Something feels off here...',
    hint: 'Look more carefully...',
  };
}

/* ------------------------------------------------------------------ */
/*  Question selection                                                 */
/* ------------------------------------------------------------------ */

/** Pick 10 questions from the pool, shuffled by attempt seed */
export function selectQuestions(attemptNumber: number, count: number = 10): HabitatQuestion[] {
  const pool = [...QUESTION_POOL];
  const seed = attemptNumber * 7 + 3;
  for (let i = pool.length - 1; i > 0; i--) {
    const j = ((seed * (i + 1) * 13) % (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/* ------------------------------------------------------------------ */
/*  Legacy exports (keep for fact card triggers)                       */
/* ------------------------------------------------------------------ */

export interface HabitatSite {
  id: number;
  name: string;
  description: string;
  substrate: Substrate;
  waterFlow: WaterFlow;
  light: Light;
  predatorDistance: PredatorDistance;
  nestProximity: NestProximity;
  accentColor: string;
  mapX: number;
  mapY: number;
  emoji: string;
}
