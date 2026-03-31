// Biology fact cards — triggered on first mechanic use or wrong decisions.
// These go DEEPER than pre-level briefings, adding detail, context, and wonder.
// Minimal overlap with briefing content.

export interface FactCard {
  id: string;
  term: string;           // bold term at top
  explanation: string;    // rich scientific explanation
  triggerMechanic: string; // what triggers this card
  sceneId: string;        // which scene it can appear in
}

export const FACT_CARDS: FactCard[] = [
  // ─────────────────────────────────────────────
  // Stage 1 — Egg
  // ─────────────────────────────────────────────

  // Scene: egg_habitat (Pick a Habitat)
  {
    id: 'fc_egg_ink_coating',
    term: 'Ink-Stained Eggs',
    explanation:
      'Female cuttlefish coat each egg in ink as they lay it, turning translucent capsules into dark, camouflaged orbs that blend with the rocky reef. This ink layer is not just cosmetic — it contains melanin and antimicrobial compounds that may help protect the developing embryo from bacterial and fungal infection. Each egg is individually placed and inked, a process that can take hours for a clutch of 200+.',
    triggerMechanic: 'first_habitat_selection',
    sceneId: 'egg_habitat',
  },
  {
    id: 'fc_egg_substrate_adhesion',
    term: 'Egg Adhesive',
    explanation:
      'The female secretes a protein-based glue from her nidamental glands that bonds each egg stalk to rough substrate. This adhesive is remarkably strong — it resists currents, wave surge, and the tugging of small predators. On smooth surfaces, the glue fails to form a mechanical bond and eggs drift loose within hours. The nidamental glands are among the largest organs in a female cuttlefish\'s body, reflecting just how critical egg attachment is to reproductive success.',
    triggerMechanic: 'wrong_substrate_choice',
    sceneId: 'egg_habitat',
  },
  {
    id: 'fc_water_flow_embryo',
    term: 'Oxygen Diffusion',
    explanation:
      'Cuttlefish embryos breathe through their egg casing — dissolved oxygen passes through the permeable outer membrane and reaches the developing animal inside. In stagnant water, a boundary layer of oxygen-depleted water builds up around the egg surface, suffocating the embryo even when surrounding water is oxygen-rich. Gentle current constantly refreshes this boundary layer. Too much current, though, and the mechanical stress can tear eggs from their anchor points or damage the delicate casing.',
    triggerMechanic: 'wrong_flow_choice',
    sceneId: 'egg_habitat',
  },
  {
    id: 'fc_egg_cannibalism',
    term: 'Cuttlefish Cannibalism',
    explanation:
      'Cuttlefish are not above eating their own kind — or each other\'s eggs. Nesting too close to another cuttlefish clutch is dangerous because newly hatched cuttlefish from an adjacent nest may prey on your still-developing eggs. Even adult cuttlefish passing through have been observed consuming unguarded egg clusters. Spacing between nests is a genuine survival factor in wild populations.',
    triggerMechanic: 'wrong_proximity_choice',
    sceneId: 'egg_habitat',
  },

  // Scene: egg_tend (Tend the Egg)
  {
    id: 'fc_fanning_behavior',
    term: 'Maternal Fanning',
    explanation:
      'In many cuttlefish species, the female stays near her clutch and fans water across the eggs using gentle jets from her siphon. This behavior maintains dissolved oxygen levels around the egg mass and prevents sediment from settling on the egg casings. Fanning intensity must be carefully modulated — research on Sepia officinalis shows that embryos in well-fanned clutches develop up to 15% faster than those in stagnant conditions, but excessive current causes physical damage to egg stalks.',
    triggerMechanic: 'first_fanning_action',
    sceneId: 'egg_tend',
  },
  {
    id: 'fc_egg_infection',
    term: 'Fungal Infection',
    explanation:
      'The ocean is teeming with opportunistic fungi, and cuttlefish eggs are nutritious targets. Infection typically starts as a subtle color shift — a healthy dark egg develops pale or greenish patches where fungal hyphae penetrate the outer casing. Once inside, the fungus consumes the yolk and can spread through physical contact to adjacent eggs. In wild populations, fungal infection is one of the leading causes of clutch loss. The mother\'s ink coating provides some antifungal protection, but it is not impenetrable.',
    triggerMechanic: 'first_infection_spotted',
    sceneId: 'egg_tend',
  },
  {
    id: 'fc_wrasse_predator',
    term: 'Wrasse Egg Predation',
    explanation:
      'Wrasses are fast, agile reef fish with excellent color vision and powerful jaws relative to their size. They specialize in plucking individual eggs from clutches, darting in and out before a guarding parent can respond. A single wrasse can consume dozens of eggs in minutes if uncontested. Cuttlefish defend against wrasses primarily with ink clouds — the sudden visual obstruction triggers the wrasse\'s escape reflex, buying time. Physical confrontation with wrasses is rarely effective because of their speed.',
    triggerMechanic: 'first_wrasse_encounter',
    sceneId: 'egg_tend',
  },
  {
    id: 'fc_crab_predator',
    term: 'Crab Egg Predation',
    explanation:
      'Crabs approach egg clutches slowly and methodically, using their chelipeds (claws) to scrape entire clusters from the substrate at once. Unlike wrasses that take single eggs, a crab can destroy dozens in a single grasp. Ink clouds are ineffective against crabs — they navigate primarily by chemoreception (smell), not vision. Instead, cuttlefish physically push crabs away using water jets from their siphon and direct body contact. This is one of the few situations where a cuttlefish uses brute force over deception.',
    triggerMechanic: 'first_crab_encounter',
    sceneId: 'egg_tend',
  },
  {
    id: 'fc_starfish_predator',
    term: 'Starfish — The Silent Threat',
    explanation:
      'Starfish are among the most dangerous egg predators precisely because they are so easy to overlook. They move imperceptibly slowly — often less than a centimeter per minute — and their textured, mottled surfaces blend perfectly with rocky substrate. A starfish can evert its stomach directly onto an egg cluster and digest dozens of eggs externally without any visible commotion. By the time a guarding cuttlefish notices, the damage is done. Vigilance and pattern recognition are the only defenses.',
    triggerMechanic: 'first_starfish_encounter',
    sceneId: 'egg_tend',
  },
  {
    id: 'fc_thermal_development',
    term: 'Temperature-Dependent Development',
    explanation:
      'Cuttlefish embryos are ectothermic — their development speed is directly controlled by ambient water temperature. Warmer water accelerates cell division and growth, while cooler water slows it. This is not simply faster-is-better: overly warm temperatures can cause developmental abnormalities, while cooler temperatures produce hatchlings that are slightly larger and more robust. In the wild, mothers position eggs in thermal gradients, and the resulting hatchlings emerge at staggered times — a natural bet-hedging strategy against unpredictable conditions.',
    triggerMechanic: 'first_temperature_reposition',
    sceneId: 'egg_tend',
  },

  // ─────────────────────────────────────────────
  // Stage 2 — Hatchling
  // ─────────────────────────────────────────────

  // Scene: hatchling_hunt (First Hunt)
  {
    id: 'fc_tentacle_strike',
    term: 'Tentacular Strike',
    explanation:
      'A cuttlefish\'s two hunting tentacles are kept retracted in specialized pouches beneath the eyes — invisible until the moment of attack. The strike itself is ballistic: once launched, the tentacles extend to full length in approximately 15 milliseconds, driven by a muscular hydrostat system (similar to how your tongue works, but far faster). The tentacle clubs at the tips are covered in suckers armed with serrated rings of chitin that grip prey on contact. Once committed, the trajectory cannot be corrected — aim must be perfect before launch.',
    triggerMechanic: 'first_tentacle_strike',
    sceneId: 'hatchling_hunt',
  },
  {
    id: 'fc_wrong_species',
    term: 'Prey Identification',
    explanation:
      'The reef is alive with tiny crustaceans, but not all of them are worth the energy of a strike. Copepods, amphipods, and isopods all share the general "small translucent shrimp-like" body plan, but mysid shrimp — a hatchling cuttlefish\'s primary prey — are distinguishable by their forked tail fan (uropods) and characteristic lateral swimming motion. Striking at the wrong species wastes precious energy from a body that hatched with only a small yolk reserve. In the wild, hatchlings that fail to learn prey identification within 48 hours of yolk depletion simply starve.',
    triggerMechanic: 'first_wrong_species',
    sceneId: 'hatchling_hunt',
  },
  {
    id: 'fc_approach_angle',
    term: 'Ambush Geometry',
    explanation:
      'Cuttlefish hunt from below — this is not optional. Approaching prey from above or the side silhouettes the cuttlefish against surface light, triggering the prey\'s escape reflex. Attacking from below keeps the cuttlefish dark against the dark seafloor. Additionally, the cuttlefish\'s binocular vision zone is oriented forward and slightly downward, giving maximum stereoscopic depth perception when looking up at prey from below. This geometry is hardwired into cuttlefish hunting behavior from the very first hunt after hatching.',
    triggerMechanic: 'wrong_approach_angle',
    sceneId: 'hatchling_hunt',
  },
  {
    id: 'fc_stereoscopic_vision',
    term: 'Stereoscopic Vision',
    explanation:
      'Cuttlefish are the only cephalopods with true forward-facing binocular vision — their W-shaped pupils create overlapping visual fields that allow stereoscopic depth perception. This is critical for hunting: the tentacular strike must be precisely calibrated for distance, and a miscalculation of even a few millimeters means a total miss. Research has shown that cuttlefish bob their heads before striking — a behavior called "peering" — to enhance depth perception through motion parallax, essentially double-checking the range before committing.',
    triggerMechanic: 'strike_out_of_range',
    sceneId: 'hatchling_hunt',
  },
  {
    id: 'fc_hatchling_predation',
    term: 'Hatchling Mortality',
    explanation:
      'Life as a newly hatched cuttlefish is brutally dangerous. Studies estimate that over 90% of hatchlings are eaten within their first few weeks — by wrasse, blennies, crabs, and even other cephalopods. Hatchlings are only 8–12 mm long and have no parental protection whatsoever. Their primary survival strategy is hiding: dashing into kelp forests, seagrass beds, and rock crevices where their tiny size and camouflage make them nearly impossible to find. This creates a fundamental dilemma — a hatchling hiding in cover is safe but cannot hunt, and one that ventures out to feed risks being spotted. Learning to dash between cover and hunt in the gaps between predator patrols is a critical survival skill.',
    triggerMechanic: 'first_predator_hit',
    sceneId: 'hatchling_hunt',
  },

  // Scene: hatchling_camouflage (Camouflage)
  {
    id: 'fc_chromatophores',
    term: 'Chromatophores!',
    explanation:
      'These tiny pigment sacs in your skin can expand from a barely visible dot to the size of a small coin, all in under a second. Each chromatophore is a single cell containing elastic pigment granules, surrounded by a ring of radial muscles controlled by individual nerve fibers directly from the brain. Your brain controls thousands of them simultaneously — and unlike chameleons, you don\'t match your background by consciously seeing the color. Your skin cells contain opsins (light-sensitive proteins) that detect light independently of your eyes, effectively giving your skin its own rudimentary form of vision.',
    triggerMechanic: 'first_chromatophore_adjustment',
    sceneId: 'hatchling_camouflage',
  },
  {
    id: 'fc_three_layer_skin',
    term: 'Three-Layer Skin System',
    explanation:
      'Cuttlefish skin is an engineering marvel with three distinct optical layers. The outermost chromatophores produce browns, reds, yellows, oranges, and black through pigment expansion. Beneath them, iridophores contain stacks of protein platelets that reflect light through thin-film interference — producing vivid blues, greens, and iridescent metallic sheens that no pigment could create. Deepest are leucophores, broadband reflectors that scatter all wavelengths equally to produce brilliant white. Combined, these three layers can produce virtually any color or pattern in the visible spectrum.',
    triggerMechanic: 'first_pattern_change',
    sceneId: 'hatchling_camouflage',
  },
  {
    id: 'fc_papillae',
    term: 'Skin Papillae',
    explanation:
      'Color matching alone is not enough — a smooth cuttlefish on a bumpy rock is still visible. Cuttlefish can erect hundreds of muscular projections called papillae across their skin, transforming their body from a smooth torpedo into a textured, irregular surface that mimics coral, rock, or algae in three dimensions. These papillae are controlled by a separate muscular system from the chromatophores and can be held in position for extended periods. The combination of color, pattern, AND texture matching is what makes cuttlefish camouflage the most sophisticated in the animal kingdom.',
    triggerMechanic: 'first_texture_toggle',
    sceneId: 'hatchling_camouflage',
  },
  {
    id: 'fc_predator_detection',
    term: 'Detection & Visual Predators',
    explanation:
      'Most reef predators that hunt cuttlefish are visual hunters — they search for shape, movement, and contrast against the background. A match score below roughly 70% means the predator\'s visual processing system can distinguish the cuttlefish outline from the substrate. Interestingly, cuttlefish seem to "know" their own match quality — research shows they remain motionless when well-camouflaged but will attempt to flee when they sense their disguise is inadequate. Their decision threshold for fight-or-flight appears to correlate with how well their current pattern matches the background.',
    triggerMechanic: 'first_detection_by_predator',
    sceneId: 'hatchling_camouflage',
  },

  // Scene: hatchling_ink (Ink and Hide)
  {
    id: 'fc_ink_deployment',
    term: 'Ink Cloud Mechanics',
    explanation:
      'Cuttlefish ink is produced in the ink sac and expelled through the siphon along with a burst of mucus that holds the cloud together. The ink is primarily melanin — the same pigment in human skin — suspended in a viscous mucus matrix. A full cloud creates a large visual screen but disperses within seconds as currents break it apart. The ink also contains tyrosinase, an enzyme that can irritate a predator\'s gills and chemoreceptors, adding a chemical deterrent to the visual smokescreen. Ink supply is limited — a cuttlefish carries roughly 5-6 deployable doses at full capacity.',
    triggerMechanic: 'first_ink_deployment',
    sceneId: 'hatchling_ink',
  },
  {
    id: 'fc_pseudomorph',
    term: 'Pseudomorph Decoy',
    explanation:
      'The pseudomorph is perhaps the most remarkable use of ink in the animal kingdom. Instead of dispersing a cloud, the cuttlefish shapes its ink release into a dark, body-sized blob — a physical decoy that hangs in the water column while the cuttlefish jets away and simultaneously blanches to near-white. The predator attacks the dark "cuttlefish" (the ink blob) while the real cuttlefish, now pale and moving in a different direction, escapes undetected. This requires precise ink volume control, simultaneous color change, and a directional escape jet — a coordinated three-system response executed in under a second.',
    triggerMechanic: 'first_pseudomorph_use',
    sceneId: 'hatchling_ink',
  },
  {
    id: 'fc_jet_propulsion',
    term: 'Jet Propulsion & the Siphon',
    explanation:
      'Cuttlefish move by drawing water into their mantle cavity, then forcefully expelling it through a muscular nozzle called the siphon. The siphon is directional — it can point in nearly any direction, giving the cuttlefish full 360-degree thrust control. Critically, the most powerful escape jet fires water forward, propelling the cuttlefish backward — and fast. Escape velocities can exceed 10 body lengths per second. This means a fleeing cuttlefish is moving tail-first, navigating entirely by looking backward over its mantle. The inverted control scheme in this game mirrors this biological reality.',
    triggerMechanic: 'first_jet_escape',
    sceneId: 'hatchling_ink',
  },
  {
    id: 'fc_wrong_ink_type',
    term: 'Tactical Ink Selection',
    explanation:
      'Using the wrong ink type at the wrong moment wastes your limited supply. A full cloud at close range obscures vision but doesn\'t deceive — the predator knows you\'re right behind it. A directed jet at long range dissipates before reaching the predator\'s face. A pseudomorph against a predator that hunts by smell (rare in reef fish, common in sharks) simply doesn\'t work — the decoy has no scent profile. Wild cuttlefish appear to assess predator species, distance, and approach angle before selecting their ink strategy, suggesting genuine tactical decision-making rather than reflexive panic.',
    triggerMechanic: 'wrong_ink_type_selected',
    sceneId: 'hatchling_ink',
  },

  // ─────────────────────────────────────────────
  // Stage 3 — Juvenile
  // ─────────────────────────────────────────────

  // Scene: juvenile_hunting (Advanced Hunting)
  {
    id: 'fc_passing_cloud',
    term: 'Passing Cloud Display',
    explanation:
      'The passing cloud is one of the most mesmerizing behaviors in the animal kingdom. Dark bands of chromatophore activation travel in waves across the cuttlefish\'s body — like shadows of clouds moving across a landscape. This display is used specifically during hunting: the rhythmic, traveling pattern appears to hypnotize prey, causing crabs and shrimp to freeze in place. The neural mechanism is not fully understood, but researchers believe the moving contrast disrupts the prey\'s optomotor response — the visual reflex that helps animals track motion and maintain orientation. Break the rhythm, and the spell shatters instantly.',
    triggerMechanic: 'first_passing_cloud_use',
    sceneId: 'juvenile_hunting',
  },
  {
    id: 'fc_stalk_posture',
    term: 'Flattened Stalk Posture',
    explanation:
      'When stalking prey across open ground, cuttlefish compress their bodies against the seafloor, tucking their arms beneath them and flattening their mantles until they resemble a slightly raised patch of substrate. This reduces their visual profile from every angle and minimizes the shadow they cast — a critical giveaway on a sunlit sandy bottom. The posture requires sustained muscular effort and limits mobility, making it a genuine trade-off between concealment and speed. Breaking posture — even briefly — raises the body profile enough to trigger a prey\'s escape response at close range.',
    triggerMechanic: 'first_posture_break',
    sceneId: 'juvenile_hunting',
  },
  {
    id: 'fc_detection_meter',
    term: 'Prey Awareness Thresholds',
    explanation:
      'Crabs have compound eyes with wide visual fields but relatively low resolution. They detect predators primarily through motion contrast — a moving object against a static background. Below a certain movement speed and contrast threshold, the crab\'s visual system simply doesn\'t register the approaching cuttlefish as distinct from the environment. This detection threshold is not binary; it\'s cumulative. Small movements build "suspicion" in the prey\'s nervous system. A cuttlefish that moves slowly and matches its background can approach to within striking distance while remaining below the crab\'s detection threshold the entire time.',
    triggerMechanic: 'detection_meter_spike',
    sceneId: 'juvenile_hunting',
  },

  // Scene: juvenile_territory (Territory and Ecosystem)
  {
    id: 'fc_ecosystem_cascade',
    term: 'Trophic Cascades',
    explanation:
      'Removing a single species from a reef can trigger chain reactions that transform the entire ecosystem. This is a trophic cascade — when the loss of a predator allows its prey to proliferate, which then overconsumes the next level down. In cuttlefish habitats, removing a mid-level predator like a small shark can cause octopus populations to explode. Octopuses compete directly with cuttlefish for crustacean prey and den sites. The lesson: in an interconnected reef, every feeding relationship is a thread in a web, and pulling one thread can unravel others you didn\'t expect.',
    triggerMechanic: 'first_ecosystem_decision',
    sceneId: 'juvenile_territory',
  },
  {
    id: 'fc_overhunting',
    term: 'Prey Population Dynamics',
    explanation:
      'A reef patch contains a finite population of prey animals that reproduce at a specific rate. Overhunting — taking prey faster than they can reproduce — causes a population crash that can take months to recover. Cuttlefish in the wild naturally limit their hunting to sustainable levels, not through conscious conservation but through behavioral patterns: they patrol a territory in circuits, giving each patch time to recover before returning. This rotational hunting strategy is an example of optimal foraging theory — balancing energy intake against long-term resource availability.',
    triggerMechanic: 'prey_population_crash',
    sceneId: 'juvenile_territory',
  },
  {
    id: 'fc_territory_competition',
    term: 'Intraspecific Competition',
    explanation:
      'When two cuttlefish share a territory, they are competing for the same limited resources: prey, shelter, and eventually mates. Tolerating a competitor means splitting resources but also reduces individual predation risk (the "dilution effect" — predators have two targets instead of one). Fighting to exclude a rival risks injury — and in cuttlefish, even minor skin damage compromises the chromatophore system, degrading camouflage ability. Wild cuttlefish negotiate territory boundaries through display rituals rather than physical combat, with the loser departing voluntarily most of the time.',
    triggerMechanic: 'first_competitor_encounter',
    sceneId: 'juvenile_territory',
  },

  // Scene: juvenile_mate (Attract a Mate)
  {
    id: 'fc_split_display',
    term: 'Split Display',
    explanation:
      'One of the most extraordinary feats of neural control in the animal kingdom: cuttlefish can display completely different color patterns on each side of their body simultaneously. During courtship, males show aggressive zebra-stripe patterns on the side facing a rival while displaying gentle, pulsing courtship patterns on the side facing the female — at the same time. This requires independent bilateral control of thousands of chromatophores, as if each half of the brain is running a different program. No other animal is known to produce two simultaneous, independent visual signals from the same body.',
    triggerMechanic: 'first_split_display',
    sceneId: 'juvenile_mate',
  },
  {
    id: 'fc_pattern_memory',
    term: 'Female Mate Choice',
    explanation:
      'Female cuttlefish are discerning — they evaluate potential mates based on the quality, accuracy, and complexity of their color displays. When a female flashes a preference pattern, she is essentially setting a test: can this male perceive, remember, and reproduce a complex visual signal? Display quality correlates with neural health, body condition, and genetic fitness. Males that produce imprecise or delayed copies signal poor condition. In laboratory studies, females consistently chose males with higher display fidelity, suggesting that pattern replication is a genuine honest signal of fitness.',
    triggerMechanic: 'first_pattern_memory_error',
    sceneId: 'juvenile_mate',
  },
  {
    id: 'fc_rival_signals',
    term: 'Aggressive Color Signals',
    explanation:
      'Cuttlefish communicate aggression through a specific visual vocabulary. A darkened mantle signals elevated arousal — the chromatophores are maximally expanded, flooding the skin with pigment. Raised arms expose the lighter ventral surfaces, making the animal appear larger. Flattened body posture combined with intense zebra banding is the highest escalation short of physical contact. These signals are graded — a cuttlefish can distinguish between a bluff (partial darkening, arms not fully raised) and genuine escalation (full dark mantle, raised arms, forward lean) and respond proportionally.',
    triggerMechanic: 'first_rival_signal_misread',
    sceneId: 'juvenile_mate',
  },

  // ─────────────────────────────────────────────
  // Stage 4 — Adult
  // ─────────────────────────────────────────────

  // Scene: adult_rival (Rival Mating Tactics)
  {
    id: 'fc_sneaker_tactic',
    term: 'Sneaker Male Strategy',
    explanation:
      'Smaller male cuttlefish have evolved a remarkable alternative mating strategy: they disguise themselves as females. By suppressing their normally vivid male coloration and adopting the mottled brown patterns of a female, sneaker males can approach a guarded female right under the dominant male\'s guard. This is not simple mimicry — it requires suppressing involuntary aggressive chromatophore responses that would break the disguise. Research on Sepia apama (giant Australian cuttlefish) showed sneaker males achieved successful mating in roughly 40% of attempts — a biologically significant success rate for an alternative strategy.',
    triggerMechanic: 'first_sneaker_tactic_use',
    sceneId: 'adult_rival',
  },
  {
    id: 'fc_aggressive_display_combat',
    term: 'Ritualized Combat',
    explanation:
      'When two male cuttlefish escalate beyond display to physical confrontation, the fight follows a ritualized sequence. Both animals darken maximally, extend their arms forward, and attempt to grapple — locking arms and pushing. Biting is rare but can occur. The contest is usually decided by size, display intensity, and stamina rather than injury. The loser blanches pale (a universal submission signal in cephalopods) and jets away. Crucially, the winner rarely pursues — the ritual is about establishing dominance, not causing harm. Injuries compromise camouflage and are potentially fatal in an animal with no immune memory.',
    triggerMechanic: 'first_aggressive_display_use',
    sceneId: 'adult_rival',
  },
  {
    id: 'fc_chromatophore_stress_flash',
    term: 'Involuntary Chromatophore Flash',
    explanation:
      'Under stress, cuttlefish chromatophores can fire involuntarily — brief, bright flashes of color that the animal does not consciously control. For a sneaker male disguised as a female, this is catastrophic: a single flash of male-pattern coloration exposes the deception instantly. The dominant male recognizes the flash as male signaling and attacks. Successful sneaker males must maintain such complete neural suppression of their stress response that even the sight of a rival approaching does not trigger an involuntary chromatophore expansion. This level of self-control is neurologically extraordinary.',
    triggerMechanic: 'sneaker_chromatophore_flash',
    sceneId: 'adult_rival',
  },
  {
    id: 'fc_retreat_fatigue',
    term: 'Display Fatigue',
    explanation:
      'Maintaining an intense aggressive display is metabolically expensive. Each expanded chromatophore requires sustained muscular contraction of the radial muscles surrounding it. A full-body dark display engages thousands of these muscles simultaneously. After several minutes of intense display, a male\'s patterns begin to fade — chromatophore muscles fatigue and individual cells start to relax, creating a patchy, inconsistent display. An observant rival can read these fatigue signals and time a re-approach for the moment when the dominant male\'s display intensity drops below the threshold that signals genuine threat.',
    triggerMechanic: 'first_retreat_tactic_use',
    sceneId: 'adult_rival',
  },

  // Scene: adult_nest (Build the Egg Nest)
  {
    id: 'fc_seasonal_dead_zone',
    term: 'Seasonal Temperature Shifts',
    explanation:
      'Ocean temperatures on a reef are not static — they follow seasonal patterns driven by current shifts, upwelling events, and solar angle changes. A site that seems thermally ideal today may become lethally cold or warm within weeks as seasonal currents shift. Cuttlefish egg development takes 30-90 days depending on species and temperature, meaning the thermal conditions at the time of laying are not the conditions the eggs will experience throughout development. Experienced cuttlefish (in this game, experienced players) must account for where temperature is going, not just where it is.',
    triggerMechanic: 'wrong_seasonal_choice',
    sceneId: 'adult_nest',
  },
  {
    id: 'fc_cleaning_station',
    term: 'Cleaning Stations',
    explanation:
      'Certain spots on the reef serve as "cleaning stations" where small fish and shrimp remove parasites from larger animals. For a cuttlefish guarding a nest for weeks, proximity to a cleaning station is a genuine survival advantage — parasite load accumulates rapidly on a sedentary animal, and the stress of parasitic infection diverts energy from egg defense. Cleaning station locations are stable over years, established by specific cleaner species like cleaner wrasses (Labroides dimidiatus) that defend their service territory. A nest near a cleaning station means healthier eggs and a healthier guardian.',
    triggerMechanic: 'missed_cleaning_station',
    sceneId: 'adult_nest',
  },
  {
    id: 'fc_depth_selection',
    term: 'Depth & Pressure',
    explanation:
      'Different cuttlefish species lay eggs within specific depth ranges — too shallow and wave action, temperature swings, and UV exposure threaten the clutch; too deep and reduced light slows embryonic development, oxygen levels may be lower, and the guarding parent expends more energy maintaining buoyancy. The cuttlebone — the internal shell that controls buoyancy — has a maximum pressure tolerance. Below a species-specific depth, the cuttlebone chambers can crack under hydrostatic pressure, compromising the animal\'s ability to regulate depth. Nest site depth is a non-negotiable constraint.',
    triggerMechanic: 'wrong_depth_choice',
    sceneId: 'adult_nest',
  },

  // Scene: adult_tend (Tend the Eggs — Final Exam)
  {
    id: 'fc_senescence',
    term: 'Senescence',
    explanation:
      'Cuttlefish are semelparous — they reproduce once and die. After mating and egg-laying, the adult cuttlefish\'s body begins a rapid, irreversible decline called senescence. The optic glands (analogous to a mammal\'s pituitary) flood the body with hormones that shut down feeding, suppress the immune system, and begin breaking down muscle tissue. The animal literally cannibalizes itself to fuel its final weeks of egg guarding. Vision clouds, reaction times slow, and chromatophore control becomes erratic. This is not aging in the human sense — it is a programmed biological self-destruct sequence triggered by reproduction.',
    triggerMechanic: 'first_senescence_effect',
    sceneId: 'adult_tend',
  },
  {
    id: 'fc_optic_gland',
    term: 'The Optic Gland',
    explanation:
      'The optic gland is a small endocrine organ located between the eyes that acts as a death switch. In laboratory experiments, removing the optic glands from a post-reproductive cuttlefish halts senescence — the animal resumes feeding, regains muscle mass, and can live months beyond its normal lifespan. But it never reproduces again. The optic gland appears to enforce a biological trade-off hardcoded by evolution: all energy is either directed toward reproduction and death, or toward survival without offspring. There is no middle path. This discovery, first made in octopuses by Jerome Wodinsky in 1977, remains one of the most striking demonstrations of programmed death in any animal.',
    triggerMechanic: 'senescence_vision_blur',
    sceneId: 'adult_tend',
  },
  {
    id: 'fc_input_degradation',
    term: 'Neuromuscular Decline',
    explanation:
      'As senescence progresses, the cuttlefish\'s nervous system begins to degrade. Synaptic connections weaken, neurotransmitter production drops, and the precise motor control that once allowed millisecond-accurate tentacle strikes and instantaneous chromatophore changes becomes sluggish and imprecise. In the game, this manifests as increasing input lag and offset — your taps registering slightly off-target, your responses arriving a fraction of a second late. This is not a game glitch; it is the most honest simulation of a dying animal\'s experience this game can offer. Your brain still knows what to do. Your body can no longer keep up.',
    triggerMechanic: 'senescence_input_lag',
    sceneId: 'adult_tend',
  },
  {
    id: 'fc_semelparous_reproduction',
    term: 'Semelparous Reproduction',
    explanation:
      'Most animals reproduce multiple times across their lives (iteroparity). Cuttlefish take the opposite strategy: they invest everything into a single reproductive event and die (semelparity). This is not a flaw — it is an evolutionary strategy. By channeling 100% of their metabolic resources into one massive clutch of eggs and one intensive period of parental care, cuttlefish maximize the number of offspring that survive from that single event. Salmon, many spiders, and annual plants use the same strategy. The cost is absolute, but the math of natural selection says: if one all-in bet produces more surviving offspring than many smaller bets, all-in wins.',
    triggerMechanic: 'final_egg_hatch_begins',
    sceneId: 'adult_tend',
  },
  {
    id: 'fc_legacy_hatchlings',
    term: 'The Next Generation',
    explanation:
      'Cuttlefish hatchlings emerge fully formed and completely independent — there is no parental care after hatching. Each tiny cuttlefish, barely a centimeter long, already possesses functional chromatophores, a working ink sac, binocular vision, and the neural circuitry for hunting and camouflage. They have never seen their parents and never will. Everything they need to survive is encoded in their genome and their yolk-fueled first days of development. Within hours of hatching, they begin hunting. Within days, they are camouflaging. The cycle that took your cuttlefish a lifetime to complete — they are beginning it fresh, right now, with everything they need.',
    triggerMechanic: 'eggs_successfully_hatched',
    sceneId: 'adult_tend',
  },
];
