export interface BriefingScreen {
  title: string;
  content: string;
  interactiveHint?: string; // description of any interactive element
  /** YouTube video ID to embed (e.g. 'dQw4w9WgXcQ') */
  youtubeId?: string;
}

export interface Briefing {
  id: string;
  sceneId: string;
  screens: BriefingScreen[];
}

export const BRIEFINGS: Briefing[] = [
  // ─────────────────────────────────────────────
  // STAGE 1: EGG PHASE
  // ─────────────────────────────────────────────

  {
    id: "briefing_egg_habitat",
    sceneId: "egg_habitat",
    screens: [
      {
        title: "A Mother's Final Act",
        content:
          "After mating, a mother cuttlefish has one last mission — lay her eggs and give them the best chance at life.\n\n" +
          "She'll ink each egg black for camouflage, then glue them one by one to the seafloor. She won't survive to see them hatch.",
        // To add a video: set youtubeId to the YouTube video ID
        // e.g. youtubeId: 'abc123' for youtube.com/watch?v=abc123
      },
      {
        title: "What Makes a Good Nursery?",
        content:
          "Not all spots are equal. Eggs need five things:\n\n" +
          "  🪨  Rough surface — eggs grip with tiny protein stalks\n\n" +
          "  💧  Moderate current — brings oxygen, but won't rip eggs loose\n\n" +
          "  🔅  Moderate light — too dark stunts growth, too bright invites predators\n\n" +
          "  🛡️  Distance from predators — wrasses, crabs, and even other cuttlefish eat eggs\n\n" +
          "  📐  Moderate spacing — too crowded means competition and cannibalism",
      },
      {
        title: "Your Challenge",
        content:
          "You'll see 10 pairs of habitats. For each pair, pick the better spot for eggs.\n\n" +
          "Some choices are obvious. Others are tradeoffs — no spot is perfect, so think about which factors matter most.\n\n" +
          "Ready to think like a cuttlefish mom?",
      },
    ],
  },

  {
    id: "briefing_egg_tend",
    sceneId: "egg_tend",
    screens: [
      {
        title: "Guardian Duty",
        content:
          "Your eggs are laid — 120 tiny capsules clinging to the seafloor. Over 30 days they'll grow into baby cuttlefish.\n\n" +
          "They can't protect themselves. Fan fresh water over them, fight off predators, and remove infected eggs before fungus spreads.",
      },
      {
        title: "Threats to Watch",
        content:
          "Three dangers can appear at any time:\n\n" +
          "  🐟  Wrasses — fast reef fish. Tap once to scare them off!\n\n" +
          "  🦀  Crabs — tough scavengers. Tap 3 times to push them away!\n\n" +
          "  ⭐  Starfish — nearly invisible. Find them and tap before they reach the eggs!",
      },
      {
        title: "Oxygen & Survival",
        content:
          "Ocean currents shift constantly — use the fan slider to keep oxygen in the safe zone. Too low and eggs suffocate. Too high and they detach.\n\n" +
          "Losing some eggs is normal. Keep as many alive as you can by the end of day 30!",
      },
    ],
  },

  {
    id: "briefing_egg_hatch",
    sceneId: "egg_hatch",
    screens: [
      {
        title: "Hatching Day!",
        content:
          "After weeks of growing, you're ready to break free. But the reef isn't safe — wrasse and other predators patrol the egg cluster, looking for an easy meal.\n\n" +
          "You'll need to dissolve the membrane from inside using your Hoyle organ, a special gland that works in rhythm with your heartbeat.",
      },
      {
        title: "Stay Still!",
        content:
          "Even inside the egg, you can sense predator shadows through the membrane. When a predator is watching, FREEZE — any movement will give you away.\n\n" +
          "Tap with the glowing heartbeat pulse when it's safe. Off-beat taps still work, but slower. Five freezes and a predator will strike.",
      },
      {
        title: "Escape!",
        content:
          "Once you break free, you'll be tiny — barely 8 mm — and completely exposed. Swipe right to jet toward the seagrass before a predator catches you.\n\n" +
          "No parents. No training. Just instinct and a body built to survive.",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // STAGE 2: HATCHLING PHASE
  // ─────────────────────────────────────────────

  {
    id: "briefing_hatchling_hunt",
    sceneId: "hatchling_hunt",
    screens: [
      {
        title: "First Hunt",
        content:
          "You're tiny, translucent, and very hungry. Your yolk reserves will last maybe 72 hours — after that, you need to catch live prey or you'll starve.\n\n" +
          "Your targets: mysid shrimp — small, glassy crustaceans with big dark eyes. They hover in little groups and glide smoothly through the water.",
      },
      {
        title: "Your Secret Weapon",
        content:
          "Hidden under your eyes are two special feeding tentacles. When you strike, they shoot out in about 15 milliseconds — way faster than your prey can react!\n\n" +
          "But here's the catch: once fired, you can't steer them mid-flight. You have to aim perfectly before you launch. Best range? About one body-length away.",
      },
      {
        title: "You're Not Alone",
        content:
          "The reef is dangerous for an 8mm hatchling. Juvenile wrasse and shore crabs patrol the shallows, and they'd love an easy meal.\n\n" +
          "When a predator appears, it won't leave until you hide! Dash to a kelp forest or rock crevice to take cover — the predator will give up and retreat. If it catches you first, you'll lose energy and be stunned.",
      },
      {
        title: "How to Hunt",
        content:
          "  1. Position below your target — you're harder to spot against bright surface water\n\n" +
          "  2. Glide in slowly using your fins, not jets — jets create pressure waves that spook prey\n\n" +
          "  3. Wait for the shrimp to pause — a hovering target is much easier to hit\n\n" +
          "  4. Strike! Your tentacles do the rest\n\n" +
          "Expect to miss a lot at first. Hatchlings start at about 30% accuracy, but you'll get better fast!",
      },
    ],
  },

  {
    id: "briefing_hatchling_camouflage",
    sceneId: "hatchling_camouflage",
    screens: [
      {
        title: "Hide in Plain Sight",
        content:
          "You're small and soft — basically a snack for every fish bigger than your hand. You can't outswim them or outfight them.\n\n" +
          "But you have the most incredible camouflage system in the animal kingdom. You can change your color, pattern, and even skin texture in under a fifth of a second!",
      },
      {
        title: "How Your Skin Works",
        content:
          "Your skin has three layers of special cells:\n\n" +
          "  🎨  Chromatophores (top) — tiny sacs of yellow, red, or brown pigment. Muscles stretch them open to show color, or let them shrink to hide it. You have millions!\n\n" +
          "  💎  Iridophores (middle) — crystal-like cells that reflect blues, greens, and golds by bouncing light off thin plates\n\n" +
          "  ⬜  Leucophores (bottom) — bright white reflectors that act as your blank canvas",
      },
      {
        title: "Practice Time",
        content:
          "You'll practice each camouflage tool one at a time before the real challenge begins.\n\n" +
          "First, you'll learn to mix your chromatophore pigments (red, yellow, brown) to blend colors.\n\n" +
          "Then you'll practice choosing the right body pattern — uniform, mottled, or disruptive.\n\n" +
          "Finally, you'll learn when to raise your skin papillae for rough textures, or keep them flat for smooth ones.\n\n" +
          "Get all three right, and no predator will spot you!",
      },
    ],
  },

  {
    id: "briefing_hatchling_ink",
    sceneId: "hatchling_ink",
    screens: [
      {
        title: "Cover Blown!",
        content:
          "Camouflage has failed — a predator has spotted you and is closing in fast. You have seconds to act.\n\n" +
          "Luckily, you have a backup plan: your ink sac! You can squirt clouds of dark, melanin-rich ink to confuse predators while you jet away. But your ink supply is tiny — use it wisely.",
      },
      {
        title: "Three Ink Moves",
        content:
          "  ☁️  Smoke Screen — a big cloud that blocks the predator's view. Costs the most ink, but great against distant threats.\n\n" +
          "  🫧  Pseudomorph — a compact ink blob that holds its shape like a decoy \"fake you.\" While the predator attacks it, you go pale and drift away!\n\n" +
          "  💨  Ink Jet — a precise squirt aimed at the predator's face. Uses the least ink but you need good aim.",
      },
      {
        title: "Escape Plan",
        content:
          "Ink alone won't save you — you need a full escape sequence:\n\n" +
          "  1. Spot the threat\n" +
          "  2. Pick your ink type based on distance\n" +
          "  3. Deploy ink and jet away at the same time\n" +
          "  4. Find cover — a rock, crevice, or seagrass patch\n" +
          "  5. Re-camouflage immediately!\n\n" +
          "You have about 3–5 ink charges. Refilling takes hours. Make each one count!",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // STAGE 3: JUVENILE PHASE
  // ─────────────────────────────────────────────

  {
    id: "briefing_juvenile_hunting",
    sceneId: "juvenile_hunting",
    screens: [
      {
        title: "Level Up",
        content:
          "You've survived the hatchling phase! You're bigger now, and your menu has expanded — small fish, bigger shrimp, even other baby cephalopods are on the table.\n\n" +
          "Juvenile hunting isn't about desperate lunges anymore. It's about patience, stealth, and a wild new trick...",
      },
      {
        title: "The Hypno-Wave",
        content:
          "You've unlocked the \"passing cloud\" display — dark waves that ripple across your body while you stay perfectly still. Prey animals fixate on the moving bands and seem to freeze up, almost hypnotized!\n\n" +
          "It's cheap to perform (just chromatophore flexing), but you need to be close and completely still. If you move, the spell breaks.",
      },
      {
        title: "The Perfect Hunt",
        content:
          "  1. Spot your prey and identify it — is it the right size and type?\n\n" +
          "  2. Approach low and slow, matching your camo to the seafloor in real time\n\n" +
          "  3. Get within range and activate the passing cloud display. Watch the prey relax...\n\n" +
          "  4. Strike! Your tentacles are faster and more accurate now — aim for 70%+ hit rate\n\n" +
          "Patience is your greatest weapon. Rushing any step makes the next one harder.",
      },
    ],
  },

  {
    id: "briefing_juvenile_territory",
    sceneId: "juvenile_territory",
    screens: [
      {
        title: "Your Patch of Ocean",
        content:
          "You've settled into a home range — a patch of reef where you know the best hiding spots, the prey hot-spots, and when the predators come through.\n\n" +
          "But ecosystems aren't static. Hunt too much in one spot and the prey crashes. Ignore competitors and they'll eat you out of house and home.",
      },
      {
        title: "Watch for Trouble",
        content:
          "Big events can shake up your territory:\n\n" +
          "  🟢  Algal blooms — nutrient surges cause explosive algae growth, then oxygen crashes as it decays. Prey flee or suffocate.\n\n" +
          "  🔴  Heat waves — even 2-3°C warmer makes everyone hungrier. Competition gets fierce.\n\n" +
          "  🟡  Fishing nets — a single trawl can wipe out half the prey and wreck the habitat.\n\n" +
          "These have warning signs. Learn to read them!",
      },
      {
        title: "Think Long-Term",
        content:
          "The key to territory management: rotate your hunting across different patches. If you hammer one spot too hard, the prey population collapses — and the chain reaction can actually attract more predators to YOUR area.\n\n" +
          "Spread out your hunting, keep prey populations healthy, and your territory will sustain you for the long haul. Think in weeks, not minutes!",
      },
    ],
  },

  {
    id: "briefing_juvenile_mate",
    sceneId: "juvenile_mate",
    screens: [
      {
        title: "Time to Impress",
        content:
          "You've reached maturity, and it's time to find a partner! Cuttlefish courtship is a visual spectacle — you'll need to put on the most dazzling display of your life.\n\n" +
          "The catch? Other cuttlefish want the same thing, and they're not going to step aside politely.",
      },
      {
        title: "The Split Display",
        content:
          "Here's something amazing: you can show two completely different patterns on each side of your body at the same time!\n\n" +
          "  💜  Courtship side (facing your target) — vibrant zebra stripes, pulsing color waves, and complex patterns that show off your health\n\n" +
          "  🖤  Rival side (facing competitors) — dark, bold, and intimidating. \"Back off\" in cuttlefish body language\n\n" +
          "Your chromatophores are so precise that the left and right halves of your body can run completely different programs!",
      },
      {
        title: "Reading the Room",
        content:
          "Watch for signals from others:\n\n" +
          "  Rivals darkening and flattening → they're getting aggressive\n" +
          "  Rivals going pale and pulling back → you're winning!\n" +
          "  Multiple rivals at once → don't get distracted by fights — stay focused on your courtship display\n\n" +
          "The goal: your target turns toward you and extends their arms in a welcoming posture. That means you've been chosen!",
      },
    ],
  },

  // ─────────────────────────────────────────────
  // STAGE 4: ADULT PHASE
  // ─────────────────────────────────────────────

  {
    id: "briefing_adult_rival",
    sceneId: "adult_rival",
    screens: [
      {
        title: "The Arena",
        content:
          "You're a fully grown adult cuttlefish, and breeding season is in full swing. Competition is fierce — rivals of all sizes are vying for the chance to pass on their genes.\n\n" +
          "Brute force is one option, but cuttlefish are smarter than that. You have three distinct tactics at your disposal.",
      },
      {
        title: "Three Tactics",
        content:
          "  💪  Aggressive Display — Go dark, flatten your body, spread your arms wide. If you're bigger, the rival may back down without a fight. But if they call your bluff, things get physical — and even winners come out bruised.\n\n" +
          "  🎭  Sneaker Strategy — Disguise yourself! Smaller cuttlefish can mimic the appearance of a non-threatening bystander, sneak past the big territorial male, and slip in unnoticed. It works more often than you'd think.\n\n" +
          "  ⏳  Tactical Retreat — Back off, wait, and watch. Aggressive displays burn tons of energy. When your rival gets tired (sloppy patterns, drooping posture), swoop back in fresh.",
      },
      {
        title: "Choose Your Moment",
        content:
          "The best cuttlefish aren't locked into one tactic — they read the situation and adapt.\n\n" +
          "  Bigger than your rival? → Aggressive display\n" +
          "  Smaller but clever? → Sneaker strategy\n" +
          "  Evenly matched? → Retreat and wait for fatigue\n\n" +
          "Every encounter is different. Size, energy, timing — weigh them all before you commit.",
      },
    ],
  },

  {
    id: "briefing_adult_nest",
    sceneId: "adult_nest",
    screens: [
      {
        title: "Full Circle",
        content:
          "You picked a nest site once before, back when you were just starting out. Now you're doing it again — but with a lifetime of ocean experience behind you.\n\n" +
          "This time the stakes are higher and you know more. Every lesson about currents, predators, temperature, and territory matters now.",
      },
      {
        title: "Expert-Level Factors",
        content:
          "On top of the basics (grip, flow, temperature, predators, spacing), you now weigh:\n\n" +
          "  📅  Seasonal temperature trends — will this site get too warm in the coming weeks?\n\n" +
          "  🗺️  Predator patrol routes — some predators follow the same path daily. Even 10 meters off their route makes a huge difference.\n\n" +
          "  📐  Substrate angle — eggs on overhangs get natural water circulation as warm water rises away, pulling fresh oxygen in\n\n" +
          "  🍽️  Nearby food — the mother needs to eat while she tends the eggs. A nest near good hunting grounds means she won't have to leave them unguarded.",
      },
      {
        title: "Your Last Gift",
        content:
          "No perfect site exists — you're optimizing across nine different factors this time. Trust your experience.\n\n" +
          "This is the most important decision of your life. The site you choose will give the next generation their best shot at survival.",
      },
    ],
  },

  {
    id: "briefing_adult_tend",
    sceneId: "adult_tend",
    screens: [
      {
        title: "The Final Watch",
        content:
          "The eggs are laid — 200 capsules hanging from the spot you chose. Inside each one, a new cuttlefish is growing.\n\n" +
          "But your body is slowing down. After breeding, cuttlefish enter a natural decline — muscles weaken, vision fades, reactions slow. This isn't sickness; it's just how the life cycle works.",
      },
      {
        title: "Tending on Hard Mode",
        content:
          "The tasks are the same as before — fanning, predator defense, disease control — but now everything is harder:\n\n" +
          "  💨  Your jets are weaker, so you need to fan more often\n" +
          "  🛡️  Your ink regenerates slower and your pushes have less force\n" +
          "  👁️  Your vision is cloudier — infections are harder to spot early\n" +
          "  🔋  You're running on a fixed energy budget that shrinks every day\n\n" +
          "You can't do everything. Triage is the name of the game.",
      },
      {
        title: "Make It Count",
        content:
          "Focus your fading energy where it matters most:\n\n" +
          "  Healthy egg clusters > already-infected ones\n" +
          "  Big threats > small ones (let a single wrasse take an egg if a crab is heading for a whole cluster)\n" +
          "  Late-stage eggs are closest to hatching but need the most oxygen\n\n" +
          "Every hour of care you give increases the number of hatchlings that will make it. This is your final act — the most important one.",
      },
    ],
  },
];
