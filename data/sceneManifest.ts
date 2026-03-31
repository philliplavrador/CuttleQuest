// Scene Manifest — Single source of truth for all scene configuration.
// When adding a new scene, append one entry to SCENE_MANIFEST below.
// Do NOT edit play/page.tsx or playerProfile.ts — they import from here.

export interface SceneManifestEntry {
  id: string;
  stageId: string;
  title: string;
  subtitle: string;
  label: string; // Short display label (shown in scene select UI)
  order: number; // Numeric ordering (use gaps: 10, 20, 30... for future insertions)
  type: 'decision' | 'reflex' | 'hybrid' | 'narrative';
  hasTimer: boolean;
  dropEligible: boolean;
  nextScene: string | null;
  starCriteria: string[];
  failCondition: string;
  failFeedbackTemplate: string;
  codexEntry?: { id: string; title: string };
  customProps?: boolean; // If true, scene uses non-standard props (e.g. EggHatch)
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  scenes: string[];
}

export const SCENE_MANIFEST: SceneManifestEntry[] = [
  // ── Stage 1: Egg ──────────────────────────────────────────────────────

  {
    id: 'egg_habitat',
    stageId: 'egg',
    title: 'Choosing the Nursery',
    subtitle: 'Compare habitats and pick the best spot for eggs across 10 head-to-head matchups.',
    label: 'Pick a Habitat',
    order: 10,
    type: 'decision',
    hasTimer: false,
    dropEligible: true,
    nextScene: 'egg_tend',
    starCriteria: [
      'Answer at least 2 habitat comparisons correctly.',
      'Answer at least 4 habitat comparisons correctly.',
      'Answer at least 6 habitat comparisons correctly.',
      'Answer at least 8 habitat comparisons correctly.',
      'Answer all 10 habitat comparisons correctly.',
    ],
    failCondition: 'Fewer than 2 correct answers — the eggs didn\'t survive due to poor habitat choices.',
    failFeedbackTemplate: 'You chose poorly on most habitat comparisons. {{reason}}',
    codexEntry: { id: 'codex_egg_anatomy', title: 'Egg Anatomy' },
  },

  {
    id: 'egg_tend',
    stageId: 'egg',
    title: 'Tending the Clutch',
    subtitle: 'Maintain up to 200 grape-like egg capsules over a 30-day incubation, managing oxygenation, temperature, predators, and fungal infection.',
    label: 'Tend the Egg',
    order: 20,
    type: 'hybrid',
    hasTimer: true,
    dropEligible: true,
    nextScene: 'egg_hatch',
    starCriteria: [
      'At least 20% of eggs survive to hatching by performing minimal oxygenation passes.',
      'Maintain oxygenation rhythm and keep ambient temperature within viable range (13–22 °C), achieving 40% hatch rate.',
      'Actively jet water across egg capsules to prevent fungal colonization while fending off at least half of predator intrusions, achieving 60% hatch rate.',
      'Balance all four threats — hypoxia, thermal drift, predation, and Lagenidium fungal infection — to achieve 80% hatch rate.',
      'Achieve 95%+ hatch rate: execute consistent mantle-pumping oxygenation, intercept every predator, remove infected capsules before the fungus spreads, and buffer temperature by adjusting clutch depth.',
    ],
    failCondition: 'Fewer than 10% of eggs remain viable — the clutch is functionally lost to a combination of oxygen deprivation, thermal shock, predation, or systemic fungal infection.',
    failFeedbackTemplate: 'By day {{day}}, only {{remaining}} of 200 eggs were still viable. Primary cause of loss: {{cause}}. In the wild, Sepia officinalis mothers cease feeding during brooding and cannot restart — every lost egg is irreplaceable.',
    codexEntry: { id: 'codex_egg_ink', title: 'Egg Color & Ink Camouflage' },
  },

  {
    id: 'egg_hatch',
    stageId: 'egg',
    title: 'Breaking Free',
    subtitle: 'Dissolve through the egg membrane while predators patrol nearby. Time your taps to the heartbeat, freeze when watched, and jet to safety once free.',
    label: 'Hatch',
    order: 30,
    type: 'reflex',
    hasTimer: true,
    dropEligible: true,
    nextScene: 'hatchling_hunt',
    starCriteria: [
      'Hatch and reach seagrass cover regardless of freezes or rhythm accuracy.',
      'Hatch with no more than 4 freezes and reach cover.',
      'Hatch with no more than 2 freezes, 50%+ rhythm accuracy, and escape to cover.',
      'Hatch with at most 1 freeze, 70%+ rhythm accuracy, and escape within 3 seconds.',
      'Zero freezes, 85%+ rhythm accuracy, and escape to cover within 2 seconds.',
    ],
    failCondition: 'Five or more freezes attract a predator strike, or the hatchling fails to escape within 4 seconds of emerging.',
    failFeedbackTemplate: 'The hatchling was detected after {{freezes}} freeze(s). {{cause}}. Cuttlefish embryos can sense predator shadows through the egg wall and freeze to avoid detection — but too much movement gives them away.',
    customProps: true,
  },

  // ── Stage 2: Hatchling ────────────────────────────────────────────────

  {
    id: 'hatchling_hunt',
    stageId: 'hatchling',
    title: 'First Hunt',
    subtitle: 'Capture 3 mysid shrimp using your tentacle strike while dodging predators — your yolk reserve is limited, so hunt fast and stay alive.',
    label: 'First Hunt',
    order: 40,
    type: 'reflex',
    hasTimer: true,
    dropEligible: true,
    nextScene: 'hatchling_camouflage',
    starCriteria: [
      'Capture at least 1 mysid shrimp before yolk energy is depleted.',
      'Capture all 3 mysid shrimp, regardless of strike accuracy or energy remaining.',
      'Capture all 3 mysid shrimp with at least 50% tentacle-strike accuracy (3 of 6 or fewer attempts).',
      'Capture all 3 mysid shrimp with 75%+ accuracy and at least 25% yolk energy remaining.',
      'Capture all 3 mysid shrimp on consecutive first strikes (100% accuracy), each within the optimal 30 ms ballistic tentacle-shot window, finishing with over 50% yolk energy.',
    ],
    failCondition: 'Yolk energy reaches zero before capturing enough prey — whether from missed strikes or predator attacks.',
    failFeedbackTemplate: 'Your hatchling captured {{caught}}/3 mysid shrimp before running out of energy. Hatchling Sepia must learn to hunt immediately while avoiding predators — there is no parental protection.',
    codexEntry: { id: 'codex_vision', title: 'W-Shaped Pupils & Vision' },
  },

  {
    id: 'hatchling_camouflage',
    stageId: 'hatchling',
    title: 'Vanishing Act',
    subtitle: 'Match your skin to the substrate using three chromatophore layers — yellow, red, and brown — to avoid detection by a patrolling predator.',
    label: 'Camouflage',
    order: 50,
    type: 'reflex',
    hasTimer: true,
    dropEligible: true,
    nextScene: 'hatchling_ink',
    starCriteria: [
      'Activate at least one chromatophore layer before the predator completes its patrol pass.',
      'Match two of three chromatophore layers (e.g., correct yellow and brown but mismatched red) within the time limit.',
      'Match all three chromatophore layers to the substrate pattern, achieving a passing camouflage score.',
      'Match all three layers with fine-grained papillae texture adjustments, reducing detection probability below 10%.',
      'Achieve pixel-perfect chromatophore alignment across all three layers, engage papillae for 3D skin texture, and hold posture stillness — predator detection probability drops to 0%.',
    ],
    failCondition: 'The predator (a juvenile reef fish) detects movement or colour mismatch and strikes — the hatchling is consumed.',
    failFeedbackTemplate: 'Your camouflage scored {{score}}% substrate match, but the {{predator}} detected you at {{distance}} cm. Cuttlefish chromatophores are neurally controlled and can change in under 200 ms — speed and precision are both essential.',
    codexEntry: { id: 'codex_chromatophores', title: 'Chromatophore Deep Dive' },
  },

  {
    id: 'hatchling_ink',
    stageId: 'hatchling',
    title: 'Ink and Escape',
    subtitle: 'Deploy ink pseudomorphs and use jet propulsion with inverted directional controls to evade a pursuing predator.',
    label: 'Ink and Hide',
    order: 60,
    type: 'reflex',
    hasTimer: true,
    dropEligible: true,
    nextScene: 'juvenile_hunting',
    starCriteria: [
      'Release at least one ink cloud and survive the encounter by any escape route.',
      'Deploy a mucus-bound ink pseudomorph (decoy body) that briefly misdirects the predator, buying escape time.',
      'Combine a pseudomorph deployment with a correctly aimed backward jet escape (remembering inverted funnel controls).',
      'Execute a multi-step escape: blanch body white, release dark pseudomorph as a decoy double, then jet away using erratic zig-zag evasion.',
      'Perform the full defensive sequence flawlessly: deploy two pseudomorphs at staggered intervals, execute blanch-and-jet, use funnel steering to navigate around obstacles, and reach safe cover without any predator contact.',
    ],
    failCondition: 'The predator closes within strike range and the hatchling fails to break line-of-sight — the escape attempt fails.',
    failFeedbackTemplate: 'You deployed {{inkCount}} ink releases but the {{predator}} maintained visual contact. Jet direction error: {{dirError}}°. Real cuttlefish funnel-jet steering is opposite to intuitive direction — the funnel points toward where you came from, not where you are going.',
    codexEntry: { id: 'codex_sepia', title: 'Sepia Ink History' },
  },

  // ── Stage 3: Juvenile ─────────────────────────────────────────────────

  {
    id: 'juvenile_hunting',
    stageId: 'juvenile',
    title: 'The Hypnotic Predator',
    subtitle: "Stalk, mesmerize, and strike a shore crab using the cuttlefish's full hunting repertoire: stealth approach, passing cloud display, and ballistic tentacle strike.",
    label: 'Advanced Hunting',
    order: 70,
    type: 'hybrid',
    hasTimer: true,
    dropEligible: true,
    nextScene: 'juvenile_territory',
    starCriteria: [
      'Successfully capture the crab by any method, even if the approach alerts it first.',
      'Complete the stalk phase without alerting the crab, then capture it with an unassisted strike.',
      'Execute the passing cloud display (rhythmic dark bands travelling across the mantle) to momentarily freeze the crab before striking.',
      'Stalk at optimal distance (4–6 cm), deploy passing cloud hypnosis for 2+ seconds of prey immobility, then land the tentacle strike on the first attempt.',
      'Perform a flawless hunt: approach from downflow to avoid chemical detection, match substrate during stalk, sustain passing cloud for 3+ seconds, strike within the 20 ms ballistic window, and secure the crab with both tentacle clubs simultaneously.',
    ],
    failCondition: 'The crab detects the approach (visual or chemical cue) and retreats into a crevice before a strike can be attempted.',
    failFeedbackTemplate: 'The {{crabSpecies}} detected your approach at {{distance}} cm. Detection cue: {{cue}}. Cuttlefish in the wild succeed on roughly 60% of hunts — positioning and timing of the passing cloud display are critical.',
    codexEntry: { id: 'codex_passing_cloud', title: 'Passing Cloud Display' },
  },

  {
    id: 'juvenile_territory',
    stageId: 'juvenile',
    title: 'Holding Ground',
    subtitle: "Manage your territory's resources — food density, shelter quality, and competitor pressure — through a series of ecological decisions.",
    label: 'Territory & Ecosystem',
    order: 80,
    type: 'decision',
    hasTimer: false,
    dropEligible: true,
    nextScene: 'juvenile_mate',
    starCriteria: [
      'Survive the territorial period without being displaced by a rival or starving.',
      'Maintain positive energy balance while retaining at least 50% of original territory.',
      'Balance food intake, shelter maintenance, and low-level aggressive displays to hold full territory for the season.',
      'Expand territory by 25% through strategic confrontations, while sustaining the local prey population via selective foraging.',
      'Achieve ecological equilibrium: grow territory optimally without over-hunting prey stocks, deter rivals through minimal-energy displays, maintain shelter integrity, and leave a sustainable ecosystem in your wake.',
    ],
    failCondition: 'Energy reserves hit zero (starvation) or a dominant rival displaces the juvenile entirely from the territory.',
    failFeedbackTemplate: 'After {{days}} days, territory status: {{status}}. Energy reserve: {{energy}}%. Cuttlefish are solitary and must balance aggression against energy cost — losing a territory means starting over in marginal habitat.',
    codexEntry: { id: 'codex_evolution', title: 'Cephalopod Evolution' },
  },

  {
    id: 'juvenile_mate',
    stageId: 'juvenile',
    title: 'The Courtship Display',
    subtitle: "Perform a split-body chromatic display to simultaneously court a female and warn a rival, while matching the female's signalling pattern in a call-and-response sequence.",
    label: 'Attract a Mate',
    order: 90,
    type: 'hybrid',
    hasTimer: true,
    dropEligible: true,
    nextScene: 'adult_rival',
    starCriteria: [
      'Successfully display courtship colours on at least one side of the body without being driven off by the rival.',
      'Maintain a split display — courtship zebra pattern facing the female, aggressive dark flush facing the rival — for at least 5 seconds.',
      'Sustain the split display while correctly responding to 3 of 5 female signal-response rounds (simon-says colour matching).',
      'Complete all 5 signal-response rounds with the female while reading and countering the rival\'s escalation patterns.',
      'Execute a perfect courtship: flawless split display throughout, 5/5 signal-response matches, successfully read and de-escalate the rival using postural and chromatic bluffs, and secure mating acceptance from the female.',
    ],
    failCondition: 'The rival male physically displaces the player before courtship is accepted, or the female rejects the display after too many mismatched signals.',
    failFeedbackTemplate: 'Courtship outcome: {{outcome}}. Split display stability: {{stability}}%. Signal-response accuracy: {{accuracy}}/5. Male Sepia can display different patterns on each side of their body — a feat unmatched in the animal kingdom.',
    codexEntry: { id: 'codex_color_comm', title: 'Color Communication' },
  },

  // ── Stage 4: Adult ────────────────────────────────────────────────────

  {
    id: 'adult_rival',
    stageId: 'adult',
    title: 'Mating Tactics',
    subtitle: 'Choose and execute one of three real cuttlefish mating strategies — aggressive dominance, sneaker male mimicry, or strategic retreat — each with distinct risk and reward.',
    label: 'Rival Mating Tactics',
    order: 100,
    type: 'decision',
    hasTimer: true,
    dropEligible: true,
    nextScene: 'adult_nest',
    starCriteria: [
      'Successfully mate using any of the three tactic paths, regardless of efficiency.',
      'Execute the chosen tactic with at least 50% mechanical proficiency (display timing, disguise accuracy, or retreat positioning).',
      'Adapt tactic mid-encounter based on the rival\'s behaviour — escalate, switch to sneaker, or retreat as conditions change.',
      'Achieve mating success on the first attempt of the chosen tactic with high proficiency and minimal energy expenditure.',
      'Master all three tactics in a single encounter: read the rival\'s size and aggression to select the optimal strategy, execute it flawlessly, and secure sperm placement in the female\'s buccal membrane pouch before the rival can intervene.',
    ],
    failCondition: 'The rival male successfully guards the female for the entire encounter window, or the sneaker disguise is detected and the player is attacked.',
    failFeedbackTemplate: 'Tactic chosen: {{tactic}}. Outcome: {{outcome}}. In Sepia apama aggregations, up to 40% of matings are achieved by small sneaker males who mimic female colouration to bypass guarding males — brute force is not the only path.',
    codexEntry: { id: 'codex_sneaker', title: 'Sneaker Male Biology' },
  },

  {
    id: 'adult_nest',
    stageId: 'adult',
    title: 'The Perfect Nursery',
    subtitle: 'Evaluate over 10 environmental factors to select the ideal egg-laying site as an experienced adult — the advanced version of your first habitat choice.',
    label: 'Build the Egg Nest',
    order: 110,
    type: 'decision',
    hasTimer: false,
    dropEligible: true,
    nextScene: 'adult_tend',
    starCriteria: [
      'Select a site that satisfies the 3 minimum requirements: substrate attachment, water flow, and temperature range (13–22 °C).',
      'Additionally account for predator density, light exposure, and proximity to seagrass or rocky shelter.',
      'Factor in salinity stability (32–36 ppt), dissolved oxygen levels, and seasonal current patterns that affect long-term incubation.',
      'Evaluate microhabitat features: substrate rugosity for egg-strand anchoring, neighbouring egg-cluster density (disease risk), and tidal exposure cycles.',
      'Integrate all 10+ factors — temperature, flow, oxygen, salinity, predation, light, shelter, substrate texture, disease proximity, tidal cycle, seasonal storm risk, and anthropogenic disturbance — to identify the single optimal site that maximizes 30-day hatch success.',
    ],
    failCondition: 'The selected site fails catastrophically within the first week — egg strands detach, temperature spikes beyond lethal threshold, or a storm surge destroys the clutch.',
    failFeedbackTemplate: 'Site evaluation missed {{missed}} critical factors. Failure cause: {{cause}}. As an experienced adult, your single reproductive investment demands perfection — Sepia females die shortly after egg-laying and cannot relocate a clutch.',
    codexEntry: { id: 'codex_cuttlebone', title: 'Cuttlebone & Buoyancy' },
  },

  {
    id: 'adult_tend',
    stageId: 'adult',
    title: 'The Final Watch',
    subtitle: 'Guard and tend your egg clutch one last time as senescence progressively degrades your chromatophores, reaction speed, and jet propulsion — the ultimate test of everything you have learned.',
    label: 'Tend the Eggs — Final Exam',
    order: 120,
    type: 'hybrid',
    hasTimer: true,
    dropEligible: true,
    nextScene: null,
    starCriteria: [
      'Keep at least 20% of the clutch alive through the 30-day incubation despite worsening senescence effects.',
      'Maintain 40% clutch survival while managing increasingly delayed reaction times and fading chromatophore control.',
      'Achieve 60% clutch survival by compensating for motor degradation — predicting threats earlier, pre-positioning defensively, and rationing diminishing energy.',
      'Reach 80% clutch survival by mastering degraded controls: anticipate predator timing despite slowed reflexes, maintain oxygenation with weakened mantle pumping, and manage infection with limited mobility.',
      'Achieve 95%+ clutch survival through the entire senescence arc: flawlessly adapt to every stage of physiological decline, protect every egg, and witness the full hatching — completing the cuttlefish life cycle.',
    ],
    failCondition: 'Senescence advances to terminal stage before incubation completes and fewer than 10% of eggs remain — the mother perishes and the clutch is lost.',
    failFeedbackTemplate: 'Day {{day}} of 30. Clutch survival: {{survival}}%. Motor function: {{motor}}%. Senescence is irreversible in cephalopods — programmed cellular death begins immediately after mating. Your final act as a parent is measured by what survives you.',
    codexEntry: { id: 'codex_senescence', title: 'Lifespan & Senescence' },
  },
];

export const STAGES: Stage[] = [
  { id: 'egg', name: 'Egg', order: 1, scenes: ['egg_habitat', 'egg_tend', 'egg_hatch'] },
  { id: 'hatchling', name: 'Hatchling', order: 2, scenes: ['hatchling_hunt', 'hatchling_camouflage', 'hatchling_ink'] },
  { id: 'juvenile', name: 'Juvenile', order: 3, scenes: ['juvenile_hunting', 'juvenile_territory', 'juvenile_mate'] },
  { id: 'adult', name: 'Adult', order: 4, scenes: ['adult_rival', 'adult_nest', 'adult_tend'] },
];

// ── Derived constants (computed once from manifest) ─────────────────────

export const SCENE_ORDER = SCENE_MANIFEST
  .sort((a, b) => a.order - b.order)
  .map(s => s.id);

export const SCENE_LABELS: Record<string, string> = Object.fromEntries(
  SCENE_MANIFEST.map(s => [s.id, s.label])
);

export const DROP_ELIGIBLE = SCENE_MANIFEST
  .filter(s => s.dropEligible)
  .map(s => s.id);

export const STAGE_SCENES: Record<string, string[]> = Object.fromEntries(
  STAGES.map(st => [st.id, st.scenes])
);

export const CODEX_MAP: Record<string, { id: string; title: string }> = Object.fromEntries(
  SCENE_MANIFEST
    .filter(s => s.codexEntry)
    .map(s => [s.id, s.codexEntry!])
);

export const STAGE_ORDER: Array<'egg' | 'hatchling' | 'juvenile' | 'adult'> = ['egg', 'hatchling', 'juvenile', 'adult'];

export function getManifestEntry(id: string): SceneManifestEntry | undefined {
  return SCENE_MANIFEST.find(s => s.id === id);
}
