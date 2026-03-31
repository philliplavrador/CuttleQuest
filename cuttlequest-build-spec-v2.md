# CuttleQuest — Full Build Specification (v2)
### Prompt for Claude Opus via VSCode

You are building **CuttleQuest** — a cuttlefish life cycle simulator and educational web app. Read this entire document before writing a single line of code. Follow every specification precisely.

---

## 1. What You Are Building

CuttleQuest is a mobile-first web app where players live through the complete life cycle of a cuttlefish — from choosing a habitat for their egg, to hatching, hunting, camouflaging, attracting a mate, building a nest, and finally watching their own eggs hatch. The target audience is **college-age and adult players** — difficulty is tuned so that most levels cannot be cleared on the first attempt without studying the pre-level biology briefing. The game should be genuinely challenging and biology-dense. Err on the side of too hard rather than too easy.

**Biology is taught through two systems:**
1. **Pre-level briefings** — Multi-screen dossiers that front-load real biology before each scene. These are the player's survival manual — reading them carefully is the difference between passing and failing.
2. **Post-gameplay fact cards** — Triggered after the player first uses a mechanic or makes a wrong decision. These go deeper than the briefing, adding context and detail the player can now appreciate through experience.

The visual theme is retro/colorful, inspired by old Pokémon games: pixel font (Press Start 2P from Google Fonts), bold outlines, flat saturated colors, dark game-screen backgrounds.

---

## 2. Tech Stack

Choose the best stack for this project given these hard requirements:
- Google OAuth sign-in (optional for players — guest mode must work without it)
- Persistent player profiles stored in cloud (when signed in)
- Local session persistence via localStorage/cookies for guest players
- Web + mobile (mobile-first responsive design)
- Easy one-command deployment
- A clearly marked config file where the developer drops in Google Auth credentials

**Recommended:** Next.js 14 (App Router) + Firebase (Firestore + Firebase Auth). Deploy target: let the stack guide the best option (Vercel for Next.js, Firebase Hosting otherwise). Document the deploy command clearly in a README.

If you choose a different stack, justify it in a comment at the top of the main config file.

---

## 3. Credentials & Configuration

Create a file called `config/credentials.template.js` (and a `.gitignore` entry for `config/credentials.js`) with clearly marked placeholders:

```js
// ─────────────────────────────────────────────
// STEP 1: Copy this file to config/credentials.js
// STEP 2: Fill in your credentials below
// STEP 3: Never commit credentials.js to git
// ─────────────────────────────────────────────

export const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
```

---

## 4. Auth Flow

- On first launch, players enter as **guests** immediately — no sign-in prompt blocking the game.
- Guest progress is saved to **localStorage**: stage, completed scenes, unlocked cosmetics, equipped loadout, decision history.
- A persistent but unobtrusive **"Guest — Save?"** pill in the top-right corner of the home screen nudges sign-in.
- When a guest taps sign-in and authenticates with Google, their local progress **merges** into their Google account. If the Google account already has progress, show a dialog: "Keep guest progress or load your saved game?" — player chooses.
- Signed-in players sync to **Firestore** in real time. Progress is accessible across devices.
- The wardrobe share card generation should prompt sign-in with the message: "Sign in to save your outfit permanently" — but the card can still be generated as a guest.
- **Google OAuth is the only sign-in method.** No email/password.

---

## 5. Pre-Level Briefing System

Every core scene is preceded by a **3-4 screen tappable dossier** — styled like a field researcher's notebook crossed with a Pokédex entry. This is not flavor text; it is the player's survival manual. The briefing contains the real biology the player needs to understand to succeed.

### Briefing screen structure:

1. **"Mission Context"** — What's happening narratively. Where the cuttlefish is, what it's about to face, biological stakes. Written in proper scientific context. Example: *"You're a 3-week-old hatchling in the Indo-Pacific reef shallows. Your yolk sac is nearly depleted. You need to hunt within the next 48 hours or you'll starve."*

2. **"Biology Brief"** — The real science the player needs. Proper terminology, actual anatomy, real behavioral data. Not dumbed down. Example: *"Cuttlefish hunt using two specialized tentacles — distinct from their eight arms — that are kept retracted in pouches beneath the eyes. The strike takes approximately 15 milliseconds. Prey must be within one body-length distance. Cuttlefish judge distance using stereoscopic vision unique among cephalopods — they're the only ones with forward-facing, overlapping visual fields."*

3. **"Field Notes"** — Diagrams, labeled anatomy, behavioral patterns. Interactive where possible — tap to highlight parts of the cuttlefish body, swipe to see a strike sequence, etc. This is the study material.

4. **"Survival Odds" (optional)** — A brief hint at what the level demands without giving away the answer. Example: *"Shrimp in this region have evolved rapid escape responses. Your strike accuracy in the wild: roughly 3 in 10."*

### Briefing rules:
- Player can **re-read the briefing from the pause menu** mid-level. If they're stuck, the answer is in the briefing, not in a hint button.
- Briefing content is stored in a data file (`data/briefings.js`) separate from component code.
- Tone is **curious and scientific** — like a well-written nature documentary narrator. Not a textbook, not a children's show.
- Every fact must be **scientifically accurate**.

---

## 6. Game Structure — Life Cycle

The game is a linear narrative journey through 4 stages. Each stage contains core gameplay scenes. Beating all core scenes in a stage triggers the stage-up animation and unlocks the next stage. No quizzes gate progression — the gameplay itself is the test.

### Difficulty Philosophy

- **Reflex/action scenes** (hunting, fleeing, camouflage under threat) use time pressure because the biology justifies it — a real cuttlefish would be under pressure in these moments.
- **Decision/exploration scenes** (habitat selection, ecosystem management, mating tactics) have NO timers. Difficulty comes from complexity, tradeoffs, and needing to synthesize biology knowledge.
- **The game never adds a timer just for difficulty's sake** — urgency only appears when the biology justifies it.
- **Most levels should not be clearable on the first attempt.** Players who read the briefing and apply problem-solving should not get permanently stuck, but the game should feel stressful and demanding.

---

### Stage 1 — Egg

**No timers in this stage.** This is the player's introduction to the world. Pressure comes from complexity, not speed.

#### Scene 1: Pick a Habitat

**Pressure type:** Decision — no timer.

**Mechanics:** 6-8 habitat options presented as a detailed cross-section of a reef environment. Each location has multiple visible variables: substrate type, water flow indicators, light level, proximity to predator zones, nearby egg clusters from other species. The player evaluates all factors — not just "rocky reef good." A rocky area near a moray eel den is rocky but terrible. A kelp forest zone has great cover but poor water circulation.

The optimal spot requires balancing 4-5 factors covered in the briefing:
- Substrate grip for egg attachment
- Oxygen-rich water flow (not too strong, not stagnant)
- Moderate light for temperature stability
- Distance from benthic predators
- Not too close to other cuttlefish nests (cannibalism risk)

Wrong choices show specific biological consequences — eggs detach from smooth substrate, eggs suffocate in stagnant water, eggs get eaten because the player nested near a wrasse territory. Players can explore all sites freely, but the **choice must be correct on first commitment.**

**Star criteria:**
- ★ = Selected a viable habitat (eggs survive, even if suboptimal)
- ★★ = Correct substrate AND water flow
- ★★★ = Correct substrate, water flow, AND safe predator distance
- ★★★★ = All above AND optimal light/temperature AND avoided cannibalism proximity
- ★★★★★ = Optimal site selected on first commitment — no wrong picks. Player explored, studied, and nailed it first try.

#### Scene 2: Tend the Egg

**Pressure type:** Starts calm, then predator events add brief urgency.

**Mechanics:** Managing a clutch of ~200 eggs (historically accurate) across a 30-day compressed timeline. Multiple simultaneous systems:

- **Oxygenation** — Water flow stays in a specific band. Too low = eggs suffocate. Too high = eggs detach from substrate. Controlled by fanning intensity (hold + drag mechanic with a sweet spot).
- **Temperature** — Ambient temperature drifts based on time of day and current. Player can't control it directly but can reposition eggs between sun-exposed and shaded zones. Different temperature zones develop at different rates.
- **Predators** — Multiple predator types approach from different directions with different behaviors:
  - Wrasses dart in fast and grab single eggs → require ink cloud defense
  - Crabs approach slowly but take whole clusters → require physical pushing defense
  - Starfish are nearly invisible but devastating → player must spot them camouflaged against rock
  - Each requires a **different** defensive response
- **Infection** — Some eggs develop fungal infection (subtle color change). Player must identify and remove infected eggs before it spreads to the cluster. Miss one and a whole section is lost.

The 30-day timeline means things compound. Ignoring one system to manage another has cascading effects. Starts calm with mechanics introduced one at a time, then predator events begin. 2-3 predator events total, getting slightly faster.

**Star criteria:**
- ★ = 60%+ egg survival (120+ of 200)
- ★★ = 70%+ survival, no full-cluster infection losses
- ★★★ = 80%+ survival, no infection spread, correct predator ID on all encounters
- ★★★★ = 90%+ survival, zero infection spread, zero missed predators, oxygenation in optimal band 80%+ of time
- ★★★★★ = 95%+ survival, zero infection, zero predator damage, oxygenation optimal 95%+, correct thermal repositioning on every shift

#### Scene 3: Hatch

**No gameplay mechanics — narrative payoff scene.** The hatch count reflects the player's tending performance. 180/200 = massive hatching swarm. 120/200 = thinner hatching. Emotional stakes tied retroactively to Scene 2 performance. Tap to continue. Triggers the **Egg → Hatchling stage-up animation.**

**No cosmetic drop from this scene.** Stage 1 has 2 drop-eligible scenes.

---

### Stage 2 — Hatchling

**First real time pressure introduced**, always tied to a visible threat on screen — never an abstract countdown.

#### Scene 1: First Hunt

**Pressure type:** Reflex — prey is moving, strike timing matters.

**Mechanics:** Hunting mysid shrimp in a realistic reef environment with visual clutter (coral, algae, sand particles, other small organisms moving). Multiple things moving — not all are prey. Player must:

1. **Identify** correct prey species among distractors. The briefing teaches what mysid shrimp look like vs copepods vs amphipods. Hitting wrong species wastes energy.
2. **Position** — Drift closer using joystick-style drag, but movement disturbs water and prey may scatter. Must approach from below (cuttlefish ambush from beneath — covered in briefing).
3. **Range assessment** — No strike zone indicator. Player judges one body-length distance based on briefing knowledge. Strike too early = total miss. Strike too late = prey senses pressure wave.
4. **Strike timing** — Shrimp may pause or change direction. Must strike during a pause. Striking during active swimming = low hit probability.

Need 3 catches. ~8-10 energy (strike attempts) available. Each miss costs energy. Run out = restart.

**Star criteria:**
- ★ = Caught 3 shrimp (however sloppy)
- ★★ = Caught 3 shrimp with 6 or fewer attempts
- ★★★ = Caught 3 shrimp with 4 or fewer attempts, zero wrong-species strikes
- ★★★★ = 3 catches in 3 attempts, zero wrong-species, all approaches from below
- ★★★★★ = 3/3 perfect, zero wrong-species, all correct approach angle, all strikes during prey pause windows. A perfect hunt — every decision textbook-correct cuttlefish behavior.

#### Scene 2: Camouflage

**Pressure type:** Predator approach = implicit countdown. No number timer.

**Mechanics:** Complex reef background with mixed textures (sand, rock, coral, algae). A predator fish patrols. Player controls three chromatophore layers matching real biology:

1. **Base color** — 6 pigment options (brown, yellow, orange, red, dark brown, black) via chromatophore expansion sliders
2. **Pattern** — Uniform, mottled, or disruptive (high-contrast patches). Each works best on different backgrounds.
3. **Texture** — Smooth or papillate (raise bumps to mimic rocky/algae texture). Toggle control.

Must match all three layers to the specific reef patch. Predator does patrol sweeps — each closer. Poor match = detection (game shows percentage match score after each sweep). Three detections = eaten = restart. Between sweeps, player adjusts settings. Background changes as player is forced to new positions with different textures.

The briefing explains the three-layer chromatophore system (chromatophores for color, leucophores for white/reflective, iridophores for iridescence). Without reading it, the player is guessing with sliders.

**Star criteria:**
- ★ = Survived all sweeps (0-2 detections)
- ★★ = Survived with 1 or fewer detections, average match score 70%+
- ★★★ = Zero detections, average match score 80%+
- ★★★★ = Zero detections, average match score 90%+, correct texture toggle on every background type
- ★★★★★ = Zero detections, average match score 95%+, all three layers correctly set within first 3 seconds of each new position. Reading the background instantly and dialing in all systems near-simultaneously — the way a cuttlefish's brain does it reflexively.

#### Scene 3: Ink and Hide

**Pressure type:** Fast predator pursuit. Ink cloud dispersal = implicit timer.

**Mechanics:** A hunting fish (reef shark or large grouper) has locked on. Multi-step escape sequence, order and timing matter:

1. **Ink deployment** — Choose type based on predator distance and approach angle:
   - Full cloud (big but disperses fast)
   - Pseudomorph (a blob shaped like the player that acts as a decoy — real behavior, hardest to use correctly)
   - Directed jet (narrow stream at predator's face)
2. **Jet escape** — After inking, jet away using directional thrust. Controls are **inverted** — push the direction you want to flee FROM, not toward. Cuttlefish jet backwards (water through the siphon). Disorienting on purpose; teaches real locomotion.
3. **Find cover** — Multiple hiding spots available. Must pick one that conceals body size AND re-camouflage (carrying over skills from previous scene). Some spots too small, some occupied by territorial animals.

The predator doesn't give up after one ink cloud — may circle back. 3-4 exchanges per encounter. Limited ink supply — resource management matters.

**Star criteria:**
- ★ = Survived the encounter
- ★★ = Survived using 3 or fewer ink deployments
- ★★★ = Survived with 2 or fewer deployments, correct ink type each time, successful re-camouflage at hiding spot
- ★★★★ = Minimum possible ink, correct type every time, no navigation errors with inverted controls, hiding spot fully conceals body
- ★★★★★ = Optimal ink type every exchange, flawless inverted-control navigation, perfect camouflage at hiding spot on first attempt, AND successful pseudomorph decoy deployment. Zero wasted ink, zero wasted movement.

---

### Stage 3 — Juvenile

**Pressure is more nuanced** — patience, memory, multi-tasking, and strategic thinking.

#### Scene 1: Advanced Hunting

**Pressure type:** Hybrid — inverted pressure (patience) then timed strike window.

**Mechanics:** Hunting a crab on a sandy seafloor. Three phases:

1. **Stalk phase (patience is the mechanic):** Move across open ground toward prey. Simultaneously control:
   - Movement speed (too fast = detection meter fills)
   - Body color (continuously match substrate as it changes from sand to rubble to rock)
   - Body posture (cuttlefish flatten against the ground while stalking — posture toggle must stay engaged)
   - If any system fails, prey bolts. Detection meter has very little forgiveness.

2. **Hypnosis phase (biologically real):** Once close enough, activate the "passing cloud" display — traveling dark bands ripple across the body to mesmerize prey. Player maintains rhythm via tapping. Wrong rhythm = prey snaps out and runs. The briefing explains this is a documented hunting behavior.

3. **Strike phase:** ~1.5 second window after hypnosis. Miss = prey escapes, new prey is now alerted (harder).

**Star criteria:**
- ★ = Caught the prey
- ★★ = Detection meter never exceeded 50%, strike on first attempt
- ★★★ = Detection meter never exceeded 30%, color match 80%+, correct passing cloud rhythm full duration, strike on first attempt
- ★★★★ = Detection meter never exceeded 15%, color match 90%+, perfect rhythm (zero missed beats), strike in first half of window
- ★★★★★ = Detection meter never exceeded 5%, color match 95%+, perfect rhythm, strike within first 0.5 seconds, flat posture maintained entire stalk without break. The prey had zero awareness at any point — a ghost on the seafloor.

#### Scene 2: Territory and Ecosystem

**Pressure type:** Decision — no timer. Complexity is the difficulty lever.

**Mechanics:** Top-down view. Multi-round resource management across a simulated season. 8-10 events. Player manages territory considering:

- Prey population dynamics (overhunt → food runs out)
- Competing cuttlefish (tolerate = shared resources but mating competition; fight = injury risk but exclusive territory)
- Environmental events (algal bloom reduces visibility, temperature spike changes prey behavior, fishing nets at surface)
- Predator-prey chains (remove a predator → its prey overpopulates → eats YOUR food source)

Wrong decisions have **cascading consequences 3-4 events later**. Early events have clearer right answers; later ones involve tradeoffs with no perfect option. The game demands systems thinking, not individual choices.

**Star criteria:**
- ★ = Survived the season (territory not lost, didn't starve)
- ★★ = Positive prey population at end, territory maintained
- ★★★ = Thriving prey balance, no cascading failures, handled at least one environmental disruption correctly
- ★★★★ = Optimal prey population, correct response to all environmental events, managed competitor without territory loss or injury, maintained 2+ prey species diversity
- ★★★★★ = All species stable and diverse, zero cascading failures, optimal competitor strategy, correct response to every event, AND successfully predicted/preemptively adapted to at least one event (the game gives subtle visual/behavioral cues before disruptions — e.g. temperature shifts preceded by changing current patterns). Reading the environment before it happens is 5-star territory.

#### Scene 3: Attract a Mate

**Pressure type:** Untimed at first, then timer added on later rounds.

**Mechanics:** Three-phase courtship:

1. **Split display competition** — A rival male is also courting. Player performs the "split display" — simultaneously showing aggressive patterns toward the rival on one side of the body and courtship patterns toward the female on the other. Left/right split screen tap zones control each side independently. Aggressive display falters → rival advances. Courtship display falters → female loses interest.

2. **Pattern memory (Simon Says)** — The female flashes a preference pattern. Player replicates it:
   - Round 1: 3-color sequence, untimed
   - Round 2: 4-color sequence, untimed
   - Round 3: 5-color sequence, ~8 second timer
   - Round 4: 6-color sequence, ~6 second timer
   - Fail = mate loses interest, fact card, retry from same round

3. **Rival response reading** — Based on the player's display, the rival may escalate (physical confrontation), back down, or try to sneak past. Player reads color signal cues (covered in briefing) and responds correctly.

**Star criteria:**
- ★ = Successfully attracted the mate
- ★★ = Split display maintained without dropping either side for more than 2 seconds, pattern memory with 2 or fewer total errors
- ★★★ = Split display with no drops longer than 1 second, pattern memory with 1 or fewer errors, correctly read rival's initial signal
- ★★★★ = Flawless split display (zero drops), pattern memory zero errors through round 3 (timed), all rival signals read correctly
- ★★★★★ = Flawless split display entire duration, zero pattern errors through all rounds including hardest timed rounds, every rival signal correct, AND successfully executed a counter-display when rival escalates (complex combined pattern requiring both body halves in new configuration under time pressure). Rival submitted without physical confrontation.

---

### Stage 4 — Adult

**Mix of everything** — decision scenes with deep consequence, and the final callback scene that layers extreme pressure onto familiar mechanics.

#### Scene 1: Rival Mating Tactics

**Pressure type:** Decision — no timer. Weight comes from consequences and behavioral reading.

**Mechanics:** Multi-round encounter with a rival. Not a menu selection — the player reads behavioral cues and chooses responses in real time. The rival's behavior changes based on the player's choices. Three viable paths:

- **Aggressive display** — Risky. May escalate to physical fight. Requires perfect display sequence.
- **Sneaker tactic** — Disguise as female to slip past rival. Requires correct female coloration, female posture, AND suppressing aggressive chromatophore responses. A mini-camouflage challenge.
- **Tactical retreat + re-approach** — Back off, wait for rival to tire or lose focus, then approach mate from a different angle. Requires reading fatigue signals and timing re-approach.

Each path is biologically real. **All paths can reach 5 stars if executed perfectly.** Each requires understanding the biology of why that tactic works.

**Star criteria:**
- ★ = Successfully mated (any viable path)
- ★★ = Chosen path completed with no more than 1 incorrect behavioral read
- ★★★ = Zero incorrect reads, tactic executed cleanly (sneaker: color match 80%+; aggressive: display correct; retreat: timing correct)
- ★★★★ = Zero reads wrong, flawless execution (sneaker: 90%+ female color + correct posture + zero aggressive flashes; aggressive: perfect display + won contest; retreat: optimal timing + capitalized on rival fatigue)
- ★★★★★ = Absolute flawless execution of chosen path. Sneaker: 95%+ color, perfect posture, zero slips, passed within touching distance undetected, completed mating before rival realized. Aggressive: dominated display so completely rival submitted without physical contact, zero pattern errors. Retreat: read every fatigue signal perfectly, re-approached at optimal moment, mate secured with zero risk.

#### Scene 2: Build the Egg Nest

**Pressure type:** Decision — no timer. Full-circle knowledge test.

**Mechanics:** Detailed reef cross-section with 10+ potential sites, far more nuanced than Stage 1. Player evaluates:
- Substrate type and grip quality
- Water flow rate and direction
- Light level and temperature zone
- Seasonal temperature trajectory (some sites are in seasonal dead zones — temperature will crash in 2 weeks)
- Predator patrol patterns (knowledge from Stage 2-3)
- Proximity to other cuttlefish nests
- Nearby food sources (player will be guarding eggs for weeks and needs to eat)
- Depth selection for the species
- Proximity to cleaning stations (reduces parasite load)
- Substrate angle for optimal egg oxygenation

Tests whether the player absorbed Stage 1 lessons AND can synthesize predator/ecosystem knowledge from Stages 2-3. Correct choices trigger a satisfying "knowledge confirmed" animation. Wrong = gentle correction referencing earlier lessons.

**Star criteria:**
- ★ = Selected a viable site (eggs will survive)
- ★★ = Correct substrate and water flow, safe predator distance
- ★★★ = All above plus optimal temperature, avoided seasonal dead zones, correct nest spacing
- ★★★★ = All above plus favorable nearby prey, accounted for predator patrol patterns, correct depth
- ★★★★★ = Optimal site on first commitment, every factor accounted for including subtle ones (seasonal current shifts, cleaning station proximity, substrate angle for passive oxygenation). Full synthesis of knowledge from every previous stage.

#### Scene 3: Tend the Eggs — Final Exam

**Pressure type:** Heavy action. Senescence mechanic — controls physically degrade.

**This is the hardest scene in the game by design.**

**Mechanics:** Same core systems as Stage 1 tending (oxygenation, temperature, predators, infection) but:
- **300+ eggs** across a larger nest area
- **More predator species** — including ones learned about as threats in Stages 2-3
- **Senescence mechanic:** The player's cuttlefish is dying. This is biologically accurate — adult cuttlefish die shortly after reproducing. The game reflects this:
  - Response lag on inputs gradually increases as the level progresses
  - Visual acuity decreases (subtle blur effect intensifies)
  - Input precision degrades (taps register slightly offset from where the player tapped)
  - By the final third of the level, controls are noticeably sluggish
- The briefing makes the biology of senescence explicit: *"Adult cuttlefish dedicate their final energy entirely to protecting their eggs. Their bodies are already breaking down — muscles weakening, vision fading, brain function declining. This is your last act."*
- Calm intro phase is shorter before pressure ramps

Pass threshold is lower than Stage 1 (50% vs 60%) because the game acknowledges this is brutally hard. But high scores require the player to have so deeply internalized every mechanic from the entire game that they can execute on muscle memory even as the game takes their precision away.

**Star criteria:**
- ★ = 50%+ egg survival
- ★★ = 60%+ survival, no full-cluster losses
- ★★★ = 70%+ survival, correct predator ID on all types, managed infection despite degrading visuals
- ★★★★ = 80%+ survival, zero infection spread, oxygenation optimal 70%+, correct thermal repositioning on most shifts
- ★★★★★ = 85%+ survival under full senescence. Zero infection, zero missed predators, oxygenation optimal 80%+, correct thermal repositioning every shift. Most players will never 5-star this scene. That's the point.

#### Win Condition

Your eggs hatch. Full-screen animation of eggs cracking open, tiny hatchlings swimming out — mirroring the opening of the game. Text appears: *"The cycle continues."* Player returns to home screen with "Adult" stage badge and access to replay any scene for better scores and cosmetic drops.

---

## 7. Biology Fact Card System

Every time a player first encounters a biological mechanic or makes a wrong decision, a **fact card** slides up from the bottom of the screen. These go **deeper** than the pre-level briefing — adding detail, context, and wonder that the player can now appreciate through firsthand experience.

### Design requirements:
- **Trigger:** First use of a mechanic OR a wrong/suboptimal decision.
- **Never blocks gameplay more than once** — once a card has been shown for a mechanic, it never shows again for that player (track in player profile).
- **Layout:** Dark card, large bold term at top (Press Start 2P font), plain-language explanation below (readable body font), small pixel-art style illustration if relevant. "Got it" button to dismiss.
- **Tone:** Curious and enthusiastic, scientifically rich. Example: *"Chromatophores! — These tiny pigment sacs in your skin can expand to the size of a coin or shrink to a dot, all in under a second. Your brain controls thousands of them at once — and unlike chameleons, you don't match your background by seeing the color. Your skin cells sense light directly, independent of your eyes."*
- **Card data:** Store all fact card content in `data/factCards.js` so content is easy to edit without touching component code.
- **Relationship to briefings:** Briefings teach the biology you need to survive the level. Fact cards reward curiosity and failure with bonus knowledge. There should be minimal overlap — fact cards add new information, not repeat the briefing.

---

## 8. Cosmetic System

### Overview

Every completed scene run guarantees a cosmetic drop. Rarity is determined by the player's star rating — higher performance = better odds of rare items. Scenes are fully replayable for better scores and new drops.

### Rarity tiers
| Tier | Color Code | Items per Type | Total |
|------|-----------|----------------|-------|
| Common | Green (#639922) | 13 | 52 |
| Rare | Blue (#378ADD) | 9 | 36 |
| Epic | Purple (#7F77DD) | 5 | 20 |
| Legendary | Gold (#EF9F27) | 3 | 12 |
| **Total** | | **30 per type** | **120** |

### Cosmetic types (4 types, 30 items each)
- **Color palette** — Full-body color scheme. Common = simple flat colors. Legendary = intricate, animated, visually stunning.
- **Skin pattern** — Texture/pattern overlay. Common = basic. Legendary = complex animated patterns.
- **Fin style** — Lateral fin shape and animation.
- **Mantle shape** — Overall body silhouette variation.

Generate creative, cuttlefish-appropriate names for all 120 items. **The rarer the tier, the more intricate and visually appealing the cosmetic must be.** Legendary items should be jaw-droppingly detailed compared to Commons.

### 5-Star Drop Table

Cosmetic rarity is **score-based, not stage-locked.** Any scene can drop any tier. Star rating determines rarity odds.

| Stars | Common | Rare | Epic | Legendary |
|-------|--------|------|------|-----------|
| ★☆☆☆☆ | 80% | 17% | 3% | 0% |
| ★★☆☆☆ | 55% | 35% | 9% | 1% |
| ★★★☆☆ | 25% | 40% | 28% | 7% |
| ★★★★☆ | 10% | 25% | 42% | 23% |
| ★★★★★ | 5% | 10% | 30% | 55% |

Key rules:
- **Every completed run drops a cosmetic. Always. No empty runs.**
- **1-star can never drop Legendary.** Access to the Legendary table must be earned.
- **5-star = 55% Legendary chance.** Incredible but not guaranteed.
- **No duplicate drops.** Once the player owns an item, it's removed from the pool.
- **Shrinking pool re-roll:** If the rolled tier is fully collected, re-roll moves UP one tier. If also full, up again. All tiers complete = the player has everything (congrats). This means late-game players effectively get boosted rarity odds as lower tiers fill up.

### Replay drops
Scenes are fully replayable. Each replay triggers a fresh roll based on the **current run's star rating** (not the player's best-ever rating). Best star rating per scene is saved and displayed, but drops use the current attempt's score.

### Collection tab
- Grid view of all 120 items, grouped by rarity tier with colored section headers.
- **Unlocked items:** Full color with name and type label. Small "New" dot on recently unlocked items.
- **Locked items:** Darkened silhouette with "???" name. Cosmetic type visible but nothing else.
- **Filter buttons** at top: All / Common / Rare / Epic / Legendary.
- **Per-tier counters:** e.g. "7/52 Common", "1/12 Legendary".

---

## 9. Results Screen & Drop Reveal UX

The post-scene results screen is a sequential, animated flow. **First completion of any scene always plays the full unskippable sequence.** On replays, players can tap to skip after the star reveal.

### Flow (each step transitions into the next):

1. **"Scene Complete" banner** — Retro pixel text slams onto screen with impact SFX and brief screen shake.

2. **Star reveal** — 5 empty stars appear. Each fills left-to-right with a pause and ascending chime per star. Stars earned fill gold (#EF9F27); unearned stay dark (#2a2a4a). Hitting 4-5 stars triggers extra flash/shake effect. Previous best shown small underneath: "Previous best: ★★★"

3. **Performance summary** — Key metrics for the scene fade in below stars. Scene-specific numbers only (e.g. "Egg survival: 87%" or "Strike accuracy: 3/4" or "Match score: 91%"). Brief and clean — no lengthy breakdown.

4. **Drop reveal** — The centerpiece moment. A card/capsule appears face-down. All rarities look **identical** during the approach — same card back, same initial animation. The card flips:
   - **Common, Rare, and Epic:** Card flips cleanly. A **brief color flash** of the rarity color (green/blue/purple) appears mid-flip — fast enough to register subconsciously but too quick to read with certainty. Card lands face-up showing the item with its rarity border. Simple chime SFX. Small sparkle particles. ~2 seconds total. **All three tiers look and sound the same** — the reveal is the item itself, not the animation.
   - **Legendary:** Card flips with the same animation as other tiers — but during the flip, there's the **slightest, barely-noticeable gold flash** (dimmer and shorter than you'd expect — players should question whether they actually saw it). Then everything changes. **The card FREEZES mid-air.** Screen dims to black. A beat of silence. Then: the card SLAMS down face-up with a gold shockwave. Full chiptune fanfare (triumphant 4-5 note melody). Gold particle explosion fills the screen. Light rays emanate from the card. Screen shakes. Item name types out letter-by-letter in Press Start 2P font. The whole sequence takes ~5 seconds and should feel like time stopped.

5. **Codex unlock** (first completion only) — After the drop reveal settles, a book icon pulses in: **"New Codex Entry: [Title]"** with "View Now" / "Later" buttons.

6. **Action buttons** — Fade in at bottom: "Replay" / "Next Scene" / "Home"

### Key design principles:
- The Legendary reveal earns its drama by being **identical** to other drops right up until the freeze moment. The barely-perceptible gold flash trains players to scrutinize every flip.
- Common/Rare/Epic all sharing the same reveal keeps the focus on the item, not the packaging. Only Legendary breaks the pattern.
- First-completion sequences are unskippable to ensure every player experiences the full flow at least once per scene.
- On replays, tapping anywhere after step 2 (star reveal) skips to the drop reveal. The drop reveal itself always plays.

---

## 10. Fail States & Retry Logic

### Universal Rules

- **Soft restart:** On failure, the scene resets completely but the briefing is skippable on retry. Player retains knowledge of what went wrong.
- **Unlimited retries.** No lives, no cooldowns. Attempt count is tracked and visible as small subtle text during gameplay ("Attempt #3") and on the scene select screen (not prominent).
- **Failed runs do NOT award cosmetic drops.** You must clear the scene to get a drop.
- **Failure screen:** Always shows what went wrong + the biology behind the failure. A "Skip" button lets impatient players bypass the explanation and retry immediately. A "Retry" button appears after the explanation. A "Home" button is always available to leave.
- **Briefing re-offered:** Before each retry, the briefing is offered again (tappable to skip). Always accessible from pause menu mid-scene.
- **Attempt count** saved in player profile per scene. Displayed subtly — small text on scene select, not prominent.

### Per-Scene Fail Conditions & Feedback

**Stage 1 — Egg**

**Pick a Habitat**
- *Fail condition:* No hard fail. Picking a suboptimal site triggers a consequence screen showing what happens to your eggs (detach, suffocate, get eaten) with the biology behind why. Scene resets to let you pick again. Each wrong pick increments the attempt counter.
- *Example feedback:* "Your eggs detached from the smooth substrate within 48 hours. Cuttlefish eggs require rough, textured surfaces — the female secretes a glue-like adhesive that only bonds effectively to irregular rock."

**Tend the Egg**
- *Fail condition:* Egg survival drops below 60%. Can result from: unchecked infection spread, multiple missed predator attacks, sustained poor oxygenation, or compounding failures.
- *Feedback:* Identifies which system killed you. E.g. "Fungal infection spread to 3 clusters. Infected eggs change color subtly — catching them early is critical. Once infection reaches adjacent eggs, it spreads exponentially." Includes the specific predator/system that caused the most damage.

**Stage 2 — Hatchling**

**First Hunt**
- *Fail condition:* Energy bar depletes (~8-10 strike attempts used without catching 3 shrimp).
- *Feedback:* Breaks down mistakes — wrong species targeted, wrong approach angle, struck outside range, struck during prey movement. E.g. "You struck at a copepod — not your target prey. Mysid shrimp are distinguishable by their split tail fan and lateral swimming motion." Shows mini-diagram of correct prey ID if species misidentification was the main issue.

**Camouflage**
- *Fail condition:* 3 detections = eaten by predator.
- *Feedback:* Shows match score per round and identifies weakest layer. E.g. "Detection 2: Your color matched at 78%, but your texture was set to smooth on a papillate coral surface. Cuttlefish raise skin papillae to mimic the 3D texture of their surroundings — color alone isn't enough."

**Ink and Hide**
- *Fail condition:* Caught by predator (failed escape after depleting ink, wrong hiding spot, or navigation error during jet escape).
- *Feedback:* Identifies the critical mistake. E.g. "You deployed a full ink cloud at close range — at this distance, a pseudomorph decoy would have been more effective." OR "Your jet escape went right when you intended left — remember, cuttlefish jet backwards through their siphon. Controls mirror real locomotion."

**Stage 3 — Juvenile**

**Advanced Hunting**
- *Fail condition:* Detection meter fills (prey flees), OR missed strike window, OR lost hypnosis rhythm (prey snaps out).
- *Feedback:* Phase-specific. Stalk: "Your detection meter spiked at the rubble-to-rock transition — you didn't adjust your color quickly enough." Hypnosis: "Your passing cloud rhythm broke — the dark bands must travel at a consistent speed. Prey recover within milliseconds of a pattern break." Strike: "The strike window was 1.5 seconds. Cuttlefish tentacle strikes are ballistic — once committed, there's no course correction."

**Territory and Ecosystem**
- *Fail condition:* Territory lost (outcompeted) OR starvation (prey population crashed). Failure happens when conditions become unrecoverable.
- *Feedback:* Shows the full cascade chain as a visual timeline. E.g. "Round 3: You eliminated the reef shark. Round 5: Without its predator, the octopus population tripled. Round 7: Octopuses consumed your crustacean prey. Round 8: Starvation." Full scene restart since decisions are interconnected.

**Attract a Mate**
- *Fail condition:* Female loses interest (display dropped too long, too many pattern errors, or misread rival signal).
- *Feedback:* Phase-specific. Split display: "Your courtship side dropped for 3 seconds — the female interpreted this as disinterest." Pattern memory: "Round 3 error: the sequence was amber-crimson-white-azure-crimson. Female cuttlefish evaluate display precision as a fitness indicator." Rival read: "The rival's darkened mantle and raised arms signaled escalation, not bluff."

**Stage 4 — Adult**

**Rival Mating Tactics**
- *Fail condition:* Path-dependent. Aggressive: lost physical confrontation. Sneaker: detected by rival (chromatophore flash, posture break, or poor color match). Retreat: re-approached at wrong moment.
- *Feedback:* Path-specific. Sneaker: "Your chromatophores involuntarily flashed an aggressive pattern — a stress response. Successful sneaker males suppress this entirely. Your female color match was 73% — above 85% is needed." Aggressive: "The rival's display intensity exceeded yours. His mantle flush rate indicated genuine aggression, not bluff."

**Build the Egg Nest**
- *Fail condition:* Same as Pick a Habitat — wrong site triggers consequence screen. Each wrong pick = attempt +1.
- *Feedback:* More detailed than Stage 1 since the player should know better. E.g. "This site has excellent substrate and flow, but it's in a seasonal dead zone — in two weeks, water temperature will drop below viable embryo range. You learned about current patterns in Stage 3."

**Tend the Eggs (Final Exam)**
- *Fail condition:* Egg survival drops below 50% (lower threshold than Stage 1 due to senescence).
- *Feedback:* Acknowledges the difficulty with empathy. "Egg survival fell to 43%. The senescence degradation made the difference — your technique was sound, but your body couldn't keep up. This is the reality of cuttlefish reproduction: parents give everything they have, and sometimes it isn't enough." Shows which system suffered most under degraded controls.

---

## 11. Wardrobe Screen

- Left panel: live cuttlefish avatar rendered in canvas/SVG, updates in real time as player swaps items.
- Right panel: 4 equipment slots (Color, Pattern, Fin, Mantle). Tapping a slot opens the options grid below showing all unlocked items of that type.
- Currently equipped item highlighted with a colored border matching its rarity tier.
- **"Generate Share Card"** button at the bottom.

### Share card (modal over wardrobe)
- Modal appears over the wardrobe screen when player taps "Generate Share Card".
- Card is rendered as a canvas image (use `html2canvas` or equivalent).
- Card contents:
  - Game logo ("CuttleQuest") top-left
  - Player's cuttlefish in full equipped outfit, centered
  - Player stats: Stage, Levels cleared, Best star ratings, Cosmetics unlocked (e.g. "47/120")
  - Rarity badge of highest tier reached
  - Retro pixel aesthetic matching game theme
- Two action buttons below the card:
  1. **Copy image** — copies card PNG to clipboard (Web Share API / clipboard API)
  2. **Share** — triggers native OS share sheet on mobile, fallback download on desktop
- Guest players see a subtle "Sign in to save your outfit" note below the buttons — but card generation still works.

---

## 12. Screens & Navigation

### Bottom navigation (4 tabs)
1. **Home** — cuttlefish avatar, current stage/scene, Continue button
2. **Play** — enters current game scene (or scene select for replay)
3. **Collection** — cosmetics collection tab
4. **Wardrobe** — equip cosmetics + share card

### Home screen
- Game title "CuttleQuest" top-left
- **Codex book icon** top-left area (below or beside title) — shows badge dot for unviewed entries
- "Guest — Save?" pill top-right (hidden when signed in, replaced by Google profile photo)
- Cuttlefish avatar centered, large, showing equipped cosmetics
- Current stage name and scene progress below avatar
- One large **Continue** button
- Best star ratings displayed for completed scenes

### Stage-up animations (fullscreen, tap to continue)
- **Egg → Hatchling:** Shell develops cracks, shakes, shatters. Tiny cuttlefish wriggles out. Color burst radiates from center.
- **Hatchling → Juvenile:** Cuttlefish visibly grows, fins elongate, first chromatophore patterns ripple across skin.
- **Juvenile → Adult:** Full iridescent color-wave display — every color cycles across the body in a shimmer sequence.
- All animations built with CSS keyframes + canvas. No heavy animation libraries.

---

## 13. Codex (Interactive Biology Encyclopedia)

The Codex is a collection of **11 full interactive experiences** — one unlocked per drop-eligible scene. Each entry is a hands-on exploration of a deep biology topic that goes beyond what the pre-level briefings and fact cards cover. These are not articles or text entries — they are mini-experiences at the same quality bar as core gameplay scenes, built for curious players who want to understand cuttlefish biology at a deeper level.

### Access & Unlock

- **Location:** Accessible from a **book icon on the Home screen** (not a bottom nav tab).
- **Unlock trigger:** Each entry unlocks on **first completion** of its linked scene. Replaying the scene does not re-trigger the unlock notification.
- **All entries visible from the start** as locked silhouettes with titles, so players can see what's coming.
- **No cosmetic rewards.** The Codex is purely educational — the knowledge IS the reward.

### Unlock Notification Flow

1. On first scene completion, after the star reveal and cosmetic drop, a book icon pulses on the results screen: **"New Codex Entry: [Title]"**
2. Two buttons: **"View Now"** (opens the Codex entry immediately) / **"Later"**
3. If the player chooses "Later," the Home screen book icon shows a **badge dot** for any unviewed entries.
4. Badge clears when the entry is opened.

### Scene-to-Codex Mapping

| Scene | Codex Entry | Interactive Description |
|-------|-------------|----------------------|
| Pick a Habitat | **Egg Anatomy** | Interactive cross-section of a cuttlefish egg. Tap to peel layers: outer casing (ink-stained), inner membrane, yolk sac, embryo. Each layer reveals biology about the structure and its function. |
| Tend the Egg | **Egg Color & Ink Camouflage** | Color-matching puzzle: cuttlefish eggs are coated in ink for camouflage. Player drags eggs onto different substrates and sees how ink coloration provides concealment. Teaches why females ink their eggs during laying. |
| First Hunt | **W-Shaped Pupils & Vision** | Light simulation: player rotates a light source around a cuttlefish eye and watches the W-shaped pupil adjust. Toggle between cuttlefish vision and human vision to compare. Teaches near-360° visual field, unique pupil shape, and how cuttlefish may perceive color through chromatic aberration despite being colorblind. |
| Camouflage | **Chromatophore Deep Dive** | Hands-on chromatophore simulator. Player controls individual chromatophores (expand/contract via pinch/spread gesture), layers leucophores (white/reflective), and adds iridophores (structural iridescence). Build patterns from scratch on a virtual cuttlefish skin. Teaches the three-layer system in a way the gameplay scene can't. |
| Ink and Hide | **Sepia Ink History** | Interactive timeline: the word "sepia" → genus *Sepia* → Renaissance artists using cuttlefish ink for drawing → modern applications. Player swipes through eras, each with a visual demonstration (e.g. watch a sepia-toned sketch being drawn). Teaches cultural and scientific history of cuttlefish ink. |
| Advanced Hunting | **Passing Cloud Display** | Slow-motion replay of the passing cloud hunting behavior. Player controls the speed, can freeze individual frames, and sees a heat-map overlay of chromatophore activation traveling across the body. Side panel explains the neural mechanism and why prey is mesmerized. |
| Territory & Ecosystem | **Cephalopod Evolution** | Draggable timeline: player places cephalopod ancestors in chronological order (nautiloids → ammonites → belemnites → modern cephalopods). Each placement triggers a brief animation showing the body plan changes. Teaches that cuttlebone is a vestigial internal shell, connecting modern cuttlefish to their shelled ancestors. |
| Attract a Mate | **Color Communication** | Two cuttlefish on screen. Player selects from a palette of pattern/color combinations and applies them to one cuttlefish, then sees the other's behavioral response (approach, flee, display back, attack). Teaches that cuttlefish have a visual "language" of color patterns for aggression, submission, courtship, and alarm. |
| Rival Mating Tactics | **Sneaker Male Biology** | Interactive research recreation. Player observes a mating scenario and identifies which male is using the sneaker strategy (disguised as female). Then explores real research data: success rates, body size correlations, how frequently the strategy occurs in wild populations. Teaches the evolutionary game theory behind alternative mating strategies. |
| Build the Egg Nest | **Cuttlebone & Buoyancy** | Cross-section of the cuttlebone with fillable gas chambers. Player adjusts gas/liquid ratios in different chambers and watches the cuttlefish rise or sink in a water column. Teaches that the cuttlebone is a sophisticated buoyancy organ — essentially a biological submarine ballast tank. |
| Tend the Eggs (Final) | **Lifespan & Senescence** | Interactive ~2 year timeline of a cuttlefish life. Player scrubs through the timeline and watches biological changes: growth rate, chromatophore development, brain maturation, reproductive development, and finally senescence — cellular breakdown, immune collapse, and death after reproduction. Emotionally direct. Teaches semelparous reproduction and why cuttlefish die after breeding. |

### Data
Store all codex content in `data/codex.js` (id, title, linkedSceneId, content, interactiveConfig).

---

## 14. Audio

- **Chiptune background music:** Different looping track per stage. Stage 1 (Egg): slow, mysterious. Stage 2 (Hatchling): curious, light. Stage 3 (Juvenile): energetic, building. Stage 4 (Adult): epic, full.
- **Sound effects:** correct action, wrong action, fact card appears, stage-up, UI taps, ink release, tentacle strike, camouflage activate, predator alert, detection meter warning.
- **Star reveal SFX:** ascending chime per star filled, special flourish for 4-5 stars.
- **Drop reveal SFX:** Common/Rare/Epic share the same clean chime on card flip. **Legendary gets a unique triumphant 4-5 note chiptune fanfare** that only plays on Legendary drops — players will learn to associate this sound with the best loot.
- **Codex unlock SFX:** subtle book-opening sound effect.
- Use the **Web Audio API** for SFX (generated programmatically — simple beeps/tones in retro style, no audio file dependencies).
- For music, generate simple chiptune patterns using Web Audio API oscillators. No external audio files required.
- **Mute button** accessible from all screens (top corner).
- Respect `prefers-reduced-motion` for animations.

---

## 15. Player Profile Data Model

```js
PlayerProfile {
  // Identity
  uid: string,                    // Firebase UID or guest UUID
  isGuest: boolean,
  displayName: string,
  photoURL: string | null,        // From Google auth

  // Progress
  currentStage: 'egg' | 'hatchling' | 'juvenile' | 'adult',
  currentScene: string,           // e.g. 'hatchling_camouflage'
  completedScenes: string[],      // scene IDs completed

  // Star ratings (best per scene)
  bestStarRatings: {
    [sceneId: string]: number     // 1-5
  },

  // Attempt tracking
  attemptCounts: {
    [sceneId: string]: number     // total attempts per scene (including failures)
  },

  // Learning
  shownFactCards: string[],       // fact card IDs already shown — never show again
  unlockedCodexEntries: string[], // codex entry IDs unlocked (1 per scene)
  viewedCodexEntries: string[],   // codex entries player has opened (for badge clearing)

  // Cosmetics
  unlockedCosmetics: string[],    // cosmetic item IDs
  equippedCosmetics: {
    color: string | null,
    pattern: string | null,
    fin: string | null,
    mantle: string | null
  },

  // Stats
  totalCorrectDecisions: number,
  totalDecisions: number,
  accuracy: number,               // computed: totalCorrect / totalDecisions
  cosmeticsUnlocked: number,      // count of unique cosmetics owned

  // Meta
  createdAt: timestamp,
  lastActive: timestamp
}
```

---

## 16. Content Data Files

Store all game content in `/data/` files, separate from component logic:

- `data/factCards.js` — all biology fact cards (id, term, explanation, triggerMechanic)
- `data/briefings.js` — all pre-level briefings (id, sceneId, screens: [missionContext, biologyBrief, fieldNotes, survivalOdds])
- `data/scenes.js` — all scene definitions (id, stage, type, title, mechanics, starCriteria, nextScene)
- `data/cosmetics.js` — all 120 cosmetic items (id, name, tier, type, description, visualConfig)
- `data/codex.js` — all 11 codex entries (id, title, linkedSceneId, content, interactiveConfig)
- `data/dropTable.js` — star-to-rarity probability mappings

Generate realistic, accurate cuttlefish biology content for all data files. Every fact must be scientifically accurate. Cite the biological concept being taught in a comment next to each entry.

---

## 17. Visual Design System

### Fonts
- **Primary (game UI):** Press Start 2P (Google Fonts) — headings, buttons, labels, scores, star ratings
- **Secondary (readable text):** System sans-serif — fact card body text, briefing body text, longer descriptions

### Color palette
```
Background (dark screen):  #0d0d1a
Surface (cards):           #13132a
Border (subtle):           #2a2a4a
Border (active):           #534AB7

Rarity / Stage colors:
  Common:    #639922 (green)
  Rare:      #378ADD (blue)
  Epic:      #7F77DD (purple)
  Legendary: #EF9F27 (amber/gold)

Danger / low timer: #A32D2D (red)
Warning:           #BA7517 (amber)
Success:           #3B6D11 (dark green)

Text primary:      #e0d8ff
Text secondary:    #c0b8f0
Text muted:        #444466

Star (filled):     #EF9F27 (gold)
Star (empty):      #2a2a4a
```

### Component rules
- Bold outlines (2px borders) on all game cards and buttons
- Chunky border-radius (12px for cards, 8px for buttons)
- No gradients except in stage-up animations and Legendary drop reveal
- Pixel-style decorative elements where possible
- All interactive elements have clear hover/active states
- Drop reveal cards: identical card-back for all rarities. Rarity border color appears only after flip. Legendary gets gold shockwave + particle effects.

---

## 18. Mobile Touch Controls

All scenes must be fully playable on a phone held in portrait mode with thumb-only input. Desktop mouse/keyboard is a secondary concern — design for touch first, then ensure mouse works.

### Global Touch Rules

- **Minimum touch target: 44×44px.** No interactive element smaller than this. Buttons, toggles, sliders, tap zones — all 44px minimum.
- **No hover-dependent interactions.** Hover states are visual polish only — every interaction must work with tap/drag.
- **No pinch-to-zoom conflicts.** Disable browser zoom on the game viewport. Multi-touch is reserved for split display controls only.
- **Visual feedback on every touch.** Brief flash, scale pulse, or color shift on every tap/drag — the player must always know their input registered.
- **Forgiving hit areas.** When two interactive elements are near each other, bias toward the one the player most likely intended (e.g. in a color palette, tapping between two swatches picks the nearest one, not nothing).

### Per-Scene Control Specs

**Pick a Habitat / Build Egg Nest**
- Pan/scroll around the reef cross-section by dragging.
- Tap a site to inspect it (shows variable readout overlay). Tap "Select" to commit.
- On mobile: the reef fills the screen horizontally, scrolls vertically. No tiny targets.

**Tend the Egg / Tend the Eggs (Final)**
- **Fanning (oxygenation):** Hold and drag horizontally across the egg cluster. Speed of drag = fan intensity. A visual indicator (animated water lines) shows current flow level. Sweet spot marked with subtle guide lines.
- **Temperature repositioning:** Tap an egg cluster, then tap a destination zone (shaded/sunny). Drag-and-drop also works.
- **Predator defense:** Predators approach with a warning indicator (directional arrow at screen edge). Tap the predator to respond. Different predators require different tap patterns: single tap (scare wrasse), hold-tap (push crab), find-and-tap (spot camouflaged starfish — no arrow, player must visually locate it).
- **Infection spotting:** Infected eggs have a subtle color shift. Tap to select, then tap "Remove" button. On small screens, a magnify-on-tap feature zooms into the cluster area so the player can see color differences.

**First Hunt**
- **Movement:** Thumb joystick in bottom-left corner (virtual stick, ~80px radius). Drag to move, release to stop. The stick appears wherever you first touch in the joystick zone — no fixed position.
- **Strike:** Tap anywhere in the right half of the screen to strike. No button — the entire right side is the strike zone. This keeps it fast and natural.
- **Prey identification:** Tap-and-hold on any organism to see a brief ID tooltip (species name). Release to dismiss. This is optional — skilled players won't need it.

**Camouflage**
- **Color palette:** Row of 6 color swatches at the bottom, 52px each. Tap to select. Currently active swatch has a bright border.
- **Pattern selector:** Three buttons below colors (Uniform / Mottled / Disruptive), 44px tall, full width split into thirds.
- **Texture toggle:** Large toggle switch, 60px wide. Clearly labeled Smooth / Papillate.
- All controls are in a fixed bottom panel (~140px tall) so the game view stays unobstructed above. The player watches the predator approach in the top 2/3 of the screen while adjusting controls in the bottom 1/3.

**Ink and Hide**
- **Ink type selection:** Three large buttons appear when ink is available (Cloud / Pseudomorph / Jet). Each ~100px wide, stacked or side-by-side depending on screen width. Tap to deploy.
- **Jet escape (inverted controls):** Same virtual joystick as First Hunt, but directions are reversed. A brief "INVERTED" label flashes on first use. The joystick area is visually distinct (red-tinted border) to remind the player controls are flipped.
- **Hiding spot selection:** Available spots pulse with a subtle glow. Tap to dive into one. Spots that are too small for your body show a warning icon on tap ("Too small").

**Advanced Hunting**
- **Stalk movement:** Virtual joystick, same as First Hunt. Speed is proportional to drag distance from center — small movements = slow creep, large movements = fast (and dangerous).
- **Color matching:** Simplified during stalk — a single "Match" button auto-adjusts to the substrate beneath you. Tap it when the substrate changes. Failing to tap when transitioning between substrate types = detection meter spike. This keeps the control count manageable while preserving the mechanic.
- **Posture toggle:** A "Flatten" button in the top-right. Must stay toggled ON during the entire stalk. If the player accidentally taps it off, detection meter spikes.
- **Hypnosis rhythm:** Full-width tap zone. Tap at the correct rhythm (visual metronome bar sweeps left-to-right, tap when it hits each marker). Like a simplified rhythm game input.
- **Strike:** Same right-half tap zone as First Hunt. Familiar by this point.

**Territory and Ecosystem**
- **Event cards:** Each event appears as a card in the center of the screen with 2-3 response options as large buttons below. Simple and readable. No complex controls — this is a thinking scene, not a dexterity scene.
- **Territory view:** Top-down map that the player can pan by dragging. Tap on elements (prey groups, predators, competing cuttlefish) to see info tooltips.

**Attract a Mate**
- **Split display:** Screen divided into LEFT and RIGHT halves by a visible center line. Each half has its own set of pattern buttons (3-4 buttons per side, 48px each). Left thumb controls the aggressive display (left side of body), right thumb controls courtship (right side). Both must be maintained simultaneously. Buttons are color-coded: red-tinted on the left (aggression), pink-tinted on the right (courtship).
- **Pattern memory (Simon Says):** 4-6 colored pads arranged in a semicircle at the bottom of the screen, each 56px minimum. The sequence plays on the cuttlefish body above, then pads light up for the player to tap. Familiar rhythm-game layout. Timer bar appears across the top from round 3.
- **Rival reading:** When a rival signal event triggers, two response buttons appear (large, center screen). Binary choice each time — clear and fast.

**Rival Mating Tactics**
- **Path selection:** Three large illustrated cards (Aggressive / Sneaker / Retreat), each taking ~1/3 of the screen. Tap to choose.
- **Sneaker tactic execution:** Reuses the camouflage controls from Stage 2 (color palette + pattern + texture) but now matching female coloration patterns. An additional "Suppress" button must be held during close passes to prevent involuntary aggressive flashes. Holding with one thumb while adjusting colors with the other — deliberately challenging on mobile.
- **Aggressive path:** Display sequence buttons similar to Attract a Mate. Physical contest = timed tap sequences (rapid taps to show dominance intensity).
- **Retreat path:** Waiting/timing mechanic — a "Re-approach" button appears when the rival shows fatigue signals. Tapping too early = detected. Patient observation + precise timing.

### Desktop Fallback
On desktop (screen width > 768px), all virtual joysticks convert to WASD/arrow key movement. All tap zones convert to mouse click zones. All hold interactions convert to mouse hold. Split display in Attract a Mate uses left-click for left side, right-click for right side. Keyboard shortcuts shown in a toggleable overlay.

---

## 19. Cosmetic Visual Design Guide

### Philosophy
Cosmetics must be **visually distinguishable by rarity at a glance.** A player seeing someone's share card should immediately recognize Legendary items without reading labels. The quality ladder is dramatic: Common items look clean but simple. Legendary items look like they belong in a different, more beautiful game.

### Per-Type Visual Escalation

**Color Palette (full-body color scheme)**
- **Common:** Single flat color. Clean, natural cuttlefish tones — sandy brown, dull green, muted grey, simple orange. No animation.
- **Rare:** Two-tone gradient. More saturated, slightly unusual combinations — teal-to-navy, copper-to-rust, olive-to-gold. Subtle static shimmer.
- **Epic:** Three-color gradient with a slow animated color shift (colors gently cycle, ~10 second loop). Unnatural but beautiful — aurora-like blends, deep ocean bioluminescence tones, sunset palettes.
- **Legendary:** Animated iridescent color wave that continuously ripples across the body. Colors shift based on viewing angle (parallax to cursor/gyroscope on mobile). Think opal, abalone shell, or oil-on-water effects. Particle trails on movement. These should stop people mid-scroll on a share card.

**Skin Pattern (texture/pattern overlay)**
- **Common:** Simple geometric patterns — basic stripes, small dots, uniform speckle. Flat, single-color overlay at low opacity.
- **Rare:** More complex patterns — leopard dapple, branching coral veins, concentric rings. Two-color overlay, slightly animated (very slow pulse).
- **Epic:** Intricate animated patterns — traveling wave bands (like real passing cloud display), fractal branching that grows and recedes, kaleidoscopic rotating geometry. Multi-color, moderate animation speed.
- **Legendary:** Fully animated complex patterns that react to gameplay — hypnotic spiraling rings that accelerate during action, bioluminescent constellations that pulse with a heartbeat rhythm, liquid mercury fractal that constantly morphs. The pattern feels alive.

**Fin Style (lateral fin shape and animation)**
- **Common:** Standard fin shape. Simple wave animation (slow, gentle undulation). Minimal visual flair.
- **Rare:** Slightly modified shape — frilled edges, wider spread, swept-back style. Smoother wave animation with a trailing glow effect on the fin edge.
- **Epic:** Distinctly different shape — feathered, split-fin, elongated streamers. Animated with flowing ribbon physics. Subtle particle trail behind fin tips.
- **Legendary:** Dramatic sculptural fins — crystalline transparent fins with internal light refraction, flame-like fins with ember particles, jellyfish-tendril fins that trail and curl with fluid physics. Each legendary fin is a mini art piece.

**Mantle Shape (body silhouette variation)**
- **Common:** Subtle silhouette tweaks — slightly rounder, slightly more elongated, marginally wider. The default body shape with minor proportional adjustments. No additional effects.
- **Rare:** Noticeable shape difference — compact and stout, sleek and torpedo-shaped, flattened and wide. Distinctive enough to recognize at a glance.
- **Epic:** Exotic shapes — leafy seadragon-inspired appendages, flowing mantle extensions, armored/ridged texture on the mantle surface. Shape alone tells you it's Epic.
- **Legendary:** Fantastical and unmistakable — bioluminescent translucent mantle that reveals internal organs, kraken-esque enlarged mantle with animated tendrils, ethereal ghost-like form with trailing wisps. These break the "realistic cuttlefish" silhouette into something mythical.

### Naming Convention
- **Common:** Simple, natural names. "Sandy Shallows", "Kelp Green", "Reef Stone", "Dusk Speckle."
- **Rare:** Evocative nature names. "Tidal Surge", "Coral Vein", "Storm Current", "Deep Copper."
- **Epic:** Dramatic compound names. "Nebula Pulse", "Abyssal Flame", "Phantom Aurora", "Glacial Fracture."
- **Legendary:** Mythical, grand, unforgettable names. "Leviathan's Crown", "Primordial Shimmer", "Void Dancer", "Cthulhu's Dream."

### Technical Notes
- All cosmetics must render correctly on the cuttlefish avatar at all sizes: large (Home screen ~150px), medium (Wardrobe ~140px), small (Collection grid ~40px), and share card.
- Animated cosmetics should use CSS animations or lightweight canvas effects — no heavy libraries. Animations should be performant on mid-range phones.
- Respect `prefers-reduced-motion`: animated cosmetics fall back to their static "frame 0" state.
- Each cosmetic's visualConfig in `data/cosmetics.js` should include: base colors (hex array), animation type (none/pulse/wave/ripple/reactive), animation speed, opacity, any particle config, and shape modification parameters.

---

## 20. Build Order

Build in this exact order to ensure a working testable state at each step:

1. **Project scaffold** — Next.js setup, folder structure, Google Fonts, color variables, Press Start 2P font loaded globally.
2. **Credentials template** — `config/credentials.template.js`, `.gitignore`, README with setup instructions.
3. **Data files** — Generate all content in `/data/` (factCards, briefings, scenes, cosmetics, codex, dropTable).
4. **Player profile system** — localStorage guest session, Firebase sync when signed in, merge logic.
5. **Auth flow** — Guest mode, Google sign-in button, merge dialog, profile pill in top-right.
6. **Home screen** — Avatar, stage label, Continue button, star ratings, Codex book icon, bottom nav.
7. **Pre-level briefing system** — Multi-screen dossier component, pause-menu re-read access.
8. **Stage 1 gameplay** — All 3 core scenes for Egg stage, fully playable with star rating and drop system.
9. **Fact card system** — Slide-up card component, trigger logic, shown-once tracking.
10. **Results screen** — Full post-scene flow: banner → star reveal → performance summary → drop reveal (with Legendary-specific dramatic sequence) → Codex unlock notification → action buttons. First-completion unskippable; replays skippable after star reveal.
11. **Stage-up animations** — All 3 transition animations (hatch, grow, shimmer).
12. **Stage 2 gameplay** — All 3 core scenes for Hatchling stage.
13. **Stage 3 gameplay** — All 3 core scenes for Juvenile stage.
14. **Stage 4 gameplay** — All 3 core scenes for Adult stage, win condition, senescence mechanic.
15. **Collection tab** — Grid, filters, locked silhouettes, tier counters, 120 items.
16. **Wardrobe screen** — Live avatar, equipment slots, options grid.
17. **Share card** — Modal, canvas render, copy-to-clipboard, native share sheet.
18. **Codex** — 11 interactive entries, scene-linked unlock tracking, Home screen badge, "View Now"/"Later" flow on results screen.
19. **Scene replay system** — Scene select screen, replay with fresh drop rolls, skippable results flow.
20. **Audio system** — Web Audio API SFX + chiptune music, mute toggle, Legendary drop fanfare, star reveal chimes.
21. **Polish pass** — Transitions, loading states, error states, empty states, mobile touch optimization.
22. **README** — Setup instructions, credential steps, deploy command, local dev command.

---

## 21. Player Testing Mode

The app must be fully playable for testing WITHOUT real Google credentials. Implement a **mock auth mode** that activates automatically when no credentials are configured:

- A "Play as Test User" button appears on the auth screen instead of the real Google button.
- Clicking it creates a mock signed-in session with a test player profile pre-populated with some progress (e.g. Hatchling stage, 5 cosmetics unlocked, some star ratings) so testers can see all systems working immediately.
- Mock mode is clearly labeled in the UI: a small "TEST MODE" badge in the corner.
- All game features work identically in mock mode. Only cloud sync is disabled.

---

## 22. README Requirements

The generated README must include:

1. What the app is (one paragraph)
2. Local development setup (exact commands)
3. How to configure credentials (step by step, referencing `credentials.template.js`)
4. How to enable Google Auth in Firebase console (brief checklist)
5. How to deploy (single command)
6. Folder structure overview
7. How to edit game content (point to `/data/` files)

---

## 23. Final Checklist Before Handing Off

Before considering the build complete, verify:

- [ ] App loads and is playable as guest with zero configuration
- [ ] Mock auth mode works — "Play as Test User" creates a usable session
- [ ] All 4 stages have playable core scenes (12 scenes total, 11 drop-eligible)
- [ ] Pre-level briefings display before every core scene (3-4 screens each)
- [ ] Briefings are re-readable from pause menu
- [ ] Fact cards fire on first mechanic use and never repeat
- [ ] Fact cards add depth beyond briefing content (minimal overlap)
- [ ] 5-star rating system works on all 11 drop-eligible scenes
- [ ] Results screen flow plays correctly: banner → stars → summary → drop → codex → buttons
- [ ] First-completion results are unskippable; replays are skippable after star reveal
- [ ] Cosmetic drops trigger on every completed run
- [ ] Drop table respects star-to-rarity probabilities
- [ ] Common/Rare/Epic drop reveals look identical (same animation, brief color flash mid-flip)
- [ ] Legendary drop reveal is dramatically different (freeze, screen dim, gold shockwave, fanfare, letter-by-letter name)
- [ ] Legendary gold flash mid-flip is barely noticeable — subtle hint only
- [ ] No duplicate cosmetics drop (shrinking pool works)
- [ ] Re-roll logic works when a tier is fully collected
- [ ] Scene replay works with fresh drops per attempt
- [ ] Stage-up animations play after all 3 scenes in a stage are cleared
- [ ] Stage progression requires no quizzes — just beating the scenes
- [ ] Failed runs show failure feedback screen with biology explanation
- [ ] Failure feedback is skippable (Skip button goes straight to retry)
- [ ] Failed runs do NOT award cosmetic drops
- [ ] Attempt counter tracks per scene and displays subtly
- [ ] Briefing is re-offered (skippable) before each retry
- [ ] Unlimited retries — no lives or cooldown system
- [ ] Senescence mechanic degrades controls in final scene (response lag, visual blur, input offset)
- [ ] Collection tab shows all 120 cosmetics (locked/unlocked states) with filters and counters
- [ ] Wardrobe equipping updates live avatar
- [ ] Share card generates and copies to clipboard
- [ ] Codex book icon visible on Home screen with badge dot for unviewed entries
- [ ] Codex entries unlock on first scene completion (1 per drop-eligible scene, 11 total)
- [ ] Codex unlock notification appears on results screen after drop reveal
- [ ] "View Now" / "Later" buttons work correctly on Codex unlock
- [ ] Codex badge clears when entry is opened
- [ ] Codex entries are full interactive experiences (not text articles)
- [ ] Replaying scenes does NOT re-trigger Codex unlock notification
- [ ] Audio plays (chiptune music + SFX) with working mute toggle
- [ ] Legendary drop has unique triumphant fanfare SFX
- [ ] Guest progress survives page refresh
- [ ] Google sign-in merges guest progress correctly
- [ ] `credentials.template.js` is present and clearly documented
- [ ] `.gitignore` includes `credentials.js`
- [ ] README covers setup, credentials, and deploy
- [ ] Mobile layout works on 375px width (iPhone SE)
- [ ] All touch targets are 44px minimum
- [ ] Virtual joystick works for movement scenes (First Hunt, Advanced Hunting, Ink and Hide)
- [ ] Split display controls work with two thumbs simultaneously (Attract a Mate)
- [ ] Inverted jet controls are clearly indicated (Ink and Hide)
- [ ] All game controls work on desktop with mouse/keyboard fallback
- [ ] No hover-dependent interactions — everything works with tap
- [ ] Cosmetic visual quality clearly escalates across rarity tiers
- [ ] Legendary cosmetics have animated effects (iridescent waves, particle trails, reactive patterns)
- [ ] Animated cosmetics respect prefers-reduced-motion
- [ ] Cosmetics render correctly at all avatar sizes (150px, 140px, 40px, share card)
- [ ] No hardcoded credentials anywhere in source code
- [ ] All biology content is scientifically accurate
