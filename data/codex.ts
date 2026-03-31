// Codex — Interactive Biology Encyclopedia
// 11 full interactive experiences, one per drop-eligible scene.
// These go beyond briefings and fact cards — hands-on explorations
// of deep cuttlefish biology for curious players.

export interface CodexEntry {
  id: string;
  title: string;
  linkedSceneId: string;
  description: string;       // what the interactive experience is
  content: string;           // detailed text content
  interactiveType: string;   // type of interactive element
  interactiveConfig: {
    type: string;
    layers?: string[];
    controls?: string[];
    description: string;
  };
}

export const CODEX_ENTRIES: CodexEntry[] = [
  // ─────────────────────────────────────────────
  // Stage 1 — Egg
  // ─────────────────────────────────────────────

  {
    id: 'codex_egg_anatomy',
    title: 'Egg Anatomy',
    linkedSceneId: 'egg_habitat',
    description:
      'Interactive cross-section of a cuttlefish egg. Tap to peel layers: outer casing, inner membrane, yolk sac, embryo. Each layer reveals biology about its structure and function.',
    content:
      'A cuttlefish egg is a self-contained life support system roughly the size and shape of a grape. Unlike the hard-shelled eggs of birds or the leathery eggs of reptiles, cuttlefish eggs are encased in a tough but flexible capsule made of proteins secreted by the female\'s nidamental glands.\n\n' +
      'OUTER CASING — The outermost layer is the toughest. It is stained dark with ink applied by the mother during laying, providing camouflage against the substrate. This casing is semi-permeable: it allows dissolved oxygen and carbon dioxide to pass through while blocking bacteria, fungal spores, and most dissolved contaminants. The ink layer also contains melanin-based antimicrobial compounds — a first line of chemical defense. The casing texture is slightly rough and sticky, enabling the protein-based adhesive stalk to bond the egg to rocky substrate.\n\n' +
      'INNER MEMBRANE — Beneath the casing lies a thinner, more elastic membrane called the chorion. This layer directly surrounds the perivitelline fluid — the liquid environment in which the embryo develops. The chorion is selectively permeable, regulating the concentration of salts and dissolved gases reaching the embryo. As the embryo grows and its metabolic demands increase, the chorion stretches and thins, becoming more permeable and allowing greater gas exchange. By the final days before hatching, it is nearly transparent.\n\n' +
      'PERIVITELLINE FLUID — The embryo floats in this clear, protein-rich fluid that cushions it against physical shock, maintains osmotic balance, and provides a medium for waste diffusion. Researchers have found that late-stage embryos can detect chemical cues (predator scents, prey odors) through this fluid, suggesting that learning begins before hatching.\n\n' +
      'YOLK SAC — The large, nutrient-dense yolk provides all the energy for embryonic development. It is composed primarily of lipids and proteins synthesized by the mother and deposited before the egg casing forms. As the embryo grows, it absorbs the yolk through a vitelline membrane connected to its ventral surface. Hatchlings emerge with a small residual yolk reserve — enough for approximately 24-48 hours of activity before they must begin hunting.\n\n' +
      'EMBRYO — The developing cuttlefish is visible through the translucent casing in the final weeks of development. By this stage, the embryo has functional eyes (which track movement outside the egg), developing chromatophores (which pulse with color even before hatching), a beating heart, and eight arms plus two tentacles in miniature. Remarkably, embryos have been observed practicing color changes and arm movements inside the egg — rehearsing the behaviors they will need from the moment they hatch.',
    interactiveType: 'layered_cross_section',
    interactiveConfig: {
      type: 'peel_layers',
      layers: [
        'outer_casing_ink',
        'inner_membrane_chorion',
        'perivitelline_fluid',
        'yolk_sac',
        'embryo',
      ],
      controls: ['tap_to_peel', 'tap_layer_label_for_detail'],
      description:
        'A large cross-section of a cuttlefish egg fills the screen. Each layer is rendered as a concentric region with distinct color and texture. Tap the outermost visible layer to peel it away, revealing the next layer beneath with a smooth animation. Each peel triggers a labeled callout with the biology text for that layer. Tap the label again to expand the full description. After all layers are peeled, the embryo animates — chromatophores pulse, eyes track the player\'s touch position, and tiny arms flex.',
    },
  },

  {
    id: 'codex_egg_color_ink',
    title: 'Egg Color & Ink Camouflage',
    linkedSceneId: 'egg_tend',
    description:
      'Color-matching drag puzzle: cuttlefish eggs are coated in ink for camouflage. Drag eggs onto different substrates and see how ink coloration provides concealment.',
    content:
      'When a female cuttlefish lays her eggs, she performs a remarkable act of preemptive camouflage: each egg is individually coated in ink from her ink sac as it passes through her arms. The resulting dark coloration helps the eggs blend with the rocky substrate where they are attached, making them far less visible to visual predators like wrasses, butterflyfish, and crabs.\n\n' +
      'The ink used for egg coating is the same melanin-based ink the cuttlefish uses for defensive clouds and pseudomorphs, but it is applied in a concentrated, adhesive form that bonds to the egg casing\'s protein surface. The shade varies depending on the species and the individual — Sepia officinalis eggs tend toward deep brownish-black, while some tropical species produce eggs with a more purplish or reddish-brown tone.\n\n' +
      'WHY INK? — The ink coating serves multiple functions beyond camouflage. Melanin is a potent antimicrobial compound — it inhibits the growth of bacteria and fungi on the egg surface. Research has shown that ink-coated eggs have significantly lower infection rates than experimentally de-inked eggs. The coating also provides mild UV protection for eggs in shallow, sun-exposed habitats.\n\n' +
      'SUBSTRATE MATCHING — The effectiveness of ink camouflage depends entirely on the substrate. Dark eggs on dark volcanic rock are nearly invisible. The same eggs on white sand are conspicuous. Females appear to preferentially select nest sites where the substrate color matches their ink tone — an observation that suggests cuttlefish evaluate their own egg color against potential backgrounds. This is consistent with their extraordinary visual processing capabilities, though the exact mechanism of this "color planning" is still debated.\n\n' +
      'PREDATOR VISION — Different predators see different things. Wrasses have tetrachromatic vision (four color channels) and excellent spatial resolution — they can spot a poorly camouflaged egg from over a meter away. Crabs rely more on contrast detection than color. The ink coating must defeat multiple visual systems simultaneously, which is why high-contrast mismatches (dark egg on light background) are universally dangerous regardless of predator type.\n\n' +
      'EXPERIMENTAL EVIDENCE — In controlled studies, researchers placed ink-coated and uncoated cuttlefish eggs in natural reef environments and measured predation rates. Uncoated (translucent) eggs suffered predation rates 3-5 times higher than ink-coated eggs on matching substrates. The combination of ink coating plus correct substrate matching reduced predation by over 90% compared to uncoated eggs on mismatched substrates.',
    interactiveType: 'drag_puzzle',
    interactiveConfig: {
      type: 'color_match_drag',
      layers: [
        'ink_coated_egg_dark',
        'ink_coated_egg_medium',
        'ink_coated_egg_light',
        'uncoated_translucent_egg',
      ],
      controls: [
        'drag_egg_to_substrate',
        'substrate_options_sand_rock_coral_kelp',
        'visibility_meter_display',
      ],
      description:
        'Four egg variants (dark ink, medium ink, light ink, uncoated) appear at the top of the screen. Five substrate strips span the bottom: white sand, dark volcanic rock, mottled brown reef rock, reddish coral rubble, and green-brown kelp holdfast. The player drags each egg onto each substrate. On placement, a "predator visibility meter" fills to show how easily a wrasse would spot the egg — low is good, high is dangerous. A toggle switches between "wrasse vision" and "crab vision" to show how different predators perceive the same match. The best combinations flash green; poor matches flash red with a brief explanation of why.',
    },
  },

  // ─────────────────────────────────────────────
  // Stage 2 — Hatchling
  // ─────────────────────────────────────────────

  {
    id: 'codex_w_shaped_pupils',
    title: 'W-Shaped Pupils & Vision',
    linkedSceneId: 'hatchling_hunt',
    description:
      'Light simulation: rotate a light source around a cuttlefish eye and watch the W-shaped pupil adjust. Toggle between cuttlefish and human vision to compare.',
    content:
      'Cuttlefish possess some of the most sophisticated eyes in the animal kingdom — and they look almost nothing like ours. The most striking feature is the pupil: a W-shaped (or dumbbell-shaped) opening that can change shape dynamically based on light conditions.\n\n' +
      'PUPIL SHAPE — In bright light, the cuttlefish pupil contracts into a distinctive W or curved line. In dim light, it opens into a wider, rounder shape. This unusual geometry is not arbitrary — the W shape creates multiple focal points across the retina simultaneously, which may allow the cuttlefish to focus on objects at different distances without the lens accommodation that humans rely on. Think of it as a biological multifocal lens.\n\n' +
      'CHROMATIC ABERRATION HYPOTHESIS — Cuttlefish are colorblind. They have only one type of photoreceptor (compared to our three), meaning they cannot distinguish colors through the standard trichromatic mechanism that humans use. And yet, their camouflage matches background colors with extraordinary precision. How? One leading hypothesis proposes that cuttlefish exploit chromatic aberration — the way a lens bends different wavelengths of light by slightly different amounts. By changing the shape of their pupil and lens, they may scan through focal planes and infer color from the degree of blur at each wavelength. The W-shaped pupil, with its multiple aperture points, may be specifically adapted to maximize this chromatic blur signal.\n\n' +
      'VISUAL FIELD — Cuttlefish eyes are positioned laterally on the head, giving a near-360-degree visual field. But unlike most cephalopods, cuttlefish can rotate their eyes forward to create a binocular overlap zone of approximately 70 degrees — the region where both eyes see the same point in space. This binocular zone enables stereoscopic depth perception, critical for judging the precise distance to prey during tentacular strikes. Cuttlefish are the only cephalopods known to have this ability.\n\n' +
      'POLARIZATION VISION — Beyond color (or the lack thereof), cuttlefish can detect the polarization of light — the orientation of light waves as they oscillate. Polarization is invisible to humans without specialized filters, but for cuttlefish it adds an entire dimension of visual information. Polarization patterns on the bodies of other cuttlefish may serve as a secret communication channel invisible to most predators and prey. Some researchers call this a "hidden channel" — messages written in a visual language that only cephalopods can read.\n\n' +
      'EYE DEVELOPMENT — Cuttlefish eyes begin developing early in embryonic life and are functional before hatching. Late-stage embryos track moving objects outside their egg casing, and there is evidence that visual experiences in the egg influence post-hatching prey preferences — cuttlefish exposed to images of specific prey species while still in the egg preferentially hunt those species after hatching.',
    interactiveType: 'light_simulation',
    interactiveConfig: {
      type: 'rotatable_light_source',
      layers: [
        'cuttlefish_eye_model',
        'pupil_shape_overlay',
        'focal_plane_visualization',
        'retinal_image_preview',
      ],
      controls: [
        'drag_light_source_360',
        'toggle_cuttlefish_vs_human_vision',
        'toggle_polarization_overlay',
        'brightness_slider',
      ],
      description:
        'A large, detailed cuttlefish eye fills the center of the screen. A draggable light source (rendered as a small sun icon) can be moved in a circle around the eye. As the light position and intensity change, the W-shaped pupil dynamically contracts and expands in real time. A split-screen toggle shows the same scene as perceived by the cuttlefish (single color channel, polarization data visible as colored overlays) versus a human (full color, no polarization). A brightness slider demonstrates how the pupil shifts from the wide open circle shape in darkness to the tight W-shape in bright light. Tapping the retina area shows a simulated "retinal image" demonstrating the chromatic aberration hypothesis — blurred color fringes that shift as the pupil shape changes.',
    },
  },

  {
    id: 'codex_chromatophore_deep_dive',
    title: 'Chromatophore Deep Dive',
    linkedSceneId: 'hatchling_camouflage',
    description:
      'Hands-on chromatophore simulator. Control individual chromatophores, layer leucophores and iridophores. Build patterns from scratch on virtual cuttlefish skin.',
    content:
      'The cuttlefish skin is the most sophisticated color-change system in the natural world — a biological display screen with millions of individually controllable pixels, capable of changing its entire appearance in under 300 milliseconds.\n\n' +
      'CHROMATOPHORES (Layer 1 — Outermost) — Each chromatophore is a single cell containing an elastic sac of pigment granules. The sac is surrounded by 15-25 radial muscle fibers, each innervated by a dedicated motor neuron from the brain. When the muscles contract, the pigment sac expands from a tiny dot (< 0.1mm) to a flat disc up to 1.5mm across — a 15-fold increase in apparent size. When the muscles relax, elastic proteins in the sac snap it back to a point. Different chromatophores contain different pigments: yellow (xanthophores), red-orange (erythrophores), and brown-black (melanophores). By selectively expanding combinations of these three pigment types, the cuttlefish creates any warm color from pale yellow to deep black.\n\n' +
      'IRIDOPHORES (Layer 2 — Middle) — Beneath the chromatophores lie iridophores: cells packed with stacks of thin protein platelets (reflectin proteins) separated by cytoplasm layers of precise thickness. These stacks act as biological thin-film interference mirrors — the same physics that creates the rainbow shimmer on soap bubbles and oil slicks. By adjusting the spacing between platelets (through muscular or chemical signals), the cuttlefish can tune the reflected wavelength from deep blue through green to red. This produces vivid structural colors that no pigment could achieve — brilliant metallic blues, iridescent greens, and shimmering golds.\n\n' +
      'LEUCOPHORES (Layer 3 — Deepest) — The deepest layer contains leucophores: cells filled with spherical protein granules (reflectin and other proteins) that scatter all wavelengths of incoming light equally, producing a broadband white reflection. Leucophores act as a bright backdrop behind the other layers, amplifying the intensity of whatever color the chromatophores and iridophores produce above them. They also create brilliant white spots and lines when chromatophores above them are fully retracted, letting the underlying white shine through.\n\n' +
      'NEURAL CONTROL — The brain controls chromatophores through direct motor neuron connections — no hormones, no delay. A signal from the brain reaches a chromatophore muscle in approximately 10 milliseconds. The cuttlefish brain contains specialized lobes (the lateral basal lobes and chromatophore lobes) dedicated entirely to pattern generation. These lobes can activate coordinated patterns across the entire body — uniform coloration, mottled camouflage, zebra-stripe aggression displays, or traveling waves — with the same ease that a human brain activates a smile.\n\n' +
      'DENSITY — Sepia officinalis has roughly 200 chromatophores per square millimeter of skin. Across its entire body, that totals millions of independently controllable color elements. For comparison, a 4K television screen has approximately 8.3 million pixels. A large cuttlefish\'s skin operates on a comparable scale — and it can change its entire display in a fraction of a second.\n\n' +
      'SKIN VISION — Cuttlefish chromatophore organs express opsin proteins — the same light-sensitive molecules found in the retina. This means the skin itself can detect light, independent of the eyes. Researchers have demonstrated that isolated cuttlefish skin patches expand their chromatophores in response to light stimulation, even when severed from the nervous system. The skin is, in a very real sense, a distributed visual organ that can sense its own background.',
    interactiveType: 'simulator',
    interactiveConfig: {
      type: 'chromatophore_simulator',
      layers: [
        'chromatophore_layer_pigments',
        'iridophore_layer_structural',
        'leucophore_layer_white',
      ],
      controls: [
        'pinch_spread_individual_chromatophore',
        'pigment_type_selector_yellow_red_brown',
        'iridophore_wavelength_slider',
        'leucophore_intensity_toggle',
        'pattern_preset_buttons',
      ],
      description:
        'A magnified patch of virtual cuttlefish skin fills the screen, showing a grid of ~50 individually controllable chromatophores as colored dots on a translucent background. The player can tap and spread (pinch-out gesture) on any individual chromatophore to expand it, or pinch to contract it. A pigment selector at the bottom lets the player choose yellow, red-orange, or brown-black for new chromatophores. Beneath the chromatophore layer, a slider controls the iridophore color (cool blue through green to warm gold), and a toggle activates/deactivates the leucophore white backing. As the player builds a pattern, a small preview shows how the combined effect looks on a full cuttlefish body silhouette. Preset buttons ("Sand match," "Coral match," "Alarm display") auto-configure the layers for reference.',
    },
  },

  {
    id: 'codex_sepia_ink_history',
    title: 'Sepia Ink History',
    linkedSceneId: 'hatchling_ink',
    description:
      'Interactive timeline: the word "sepia" to Renaissance art to modern science. Swipe through eras with visual demonstrations.',
    content:
      'The word "sepia" — that warm, brownish tone associated with old photographs and vintage aesthetics — comes directly from the cuttlefish. The genus name Sepia was assigned to cuttlefish by Linnaeus in 1758, derived from the ancient Greek "σηπία" (sēpía), meaning cuttlefish. The pigment, the animal, and the word are inseparable.\n\n' +
      'ANCIENT WORLD (500 BCE – 400 CE) — Ancient Greeks and Romans harvested cuttlefish ink for writing. The Roman naturalist Pliny the Elder described the process: cuttlefish were caught, their ink sacs extracted, and the ink diluted for use in manuscripts. Cicero mentions sepia ink in his letters. The ink was prized for its rich, permanent brown tone and its resistance to fading — properties imparted by melanin\'s extraordinary chemical stability. Some ancient manuscripts written in cuttlefish ink remain legible after two thousand years.\n\n' +
      'RENAISSANCE (1400 – 1600 CE) — European artists adopted cuttlefish ink as a drawing medium. Leonardo da Vinci used sepia ink for many of his anatomical studies and engineering sketches. The ink was prepared by drying cuttlefish ink sacs, grinding them to powder, and reconstituting with water and a binder (often gum arabic). Artists valued sepia for its warm undertone and natural gradation — diluted sepia produces a luminous golden-brown wash unlike any mineral-based pigment. The technique of sepia wash drawing became a recognized artistic discipline.\n\n' +
      'SCIENTIFIC ERA (1800 – 1900 CE) — As chemistry advanced, scientists analyzed cuttlefish ink and identified its primary component: melanin, a polymer of indole-5,6-quinone units. Remarkably, the melanin in cuttlefish ink is chemically identical to eumelanin in human skin and hair — the same molecule that determines skin color and provides UV protection. This discovery connected cuttlefish biology to human biology in an unexpected way. In the 1880s, the invention of sepia-toned photography — which used iron and silver compounds to produce a warm brown tone — borrowed the name from cuttlefish ink, embedding the cuttlefish in photographic history forever.\n\n' +
      'MODERN APPLICATIONS (1950 CE – Present) — Cuttlefish ink has found unexpected modern uses. In biomedicine, melanin nanoparticles derived from Sepia ink are being researched as contrast agents for medical imaging (photoacoustic imaging and MRI). The ink\'s natural biocompatibility — it evolved to be deployed in the open ocean without harming the cuttlefish — makes it a promising candidate for injectable diagnostic agents. In materials science, researchers study Sepia melanin as a model for biodegradable electronic components and UV-protective coatings. The humble defensive ink cloud turns out to be an advanced biomaterial.\n\n' +
      'CULINARY TRADITION — In Mediterranean and East Asian cuisines, cuttlefish ink has been a culinary ingredient for centuries. Italian "nero di seppia" (black of cuttlefish) is used to color and flavor pasta, risotto, and sauces. The ink imparts a subtle briny, savory flavor (umami) along with its dramatic black color. Spanish arroz negro, Venetian risotto al nero di seppia, and Japanese ikasumi dishes all celebrate this ancient ingredient.\n\n' +
      'INK CHEMISTRY — Sepia ink is approximately 90% melanin by dry weight, suspended in a mucus matrix containing proteins, polysaccharides, and the enzyme tyrosinase. Tyrosinase catalyzes melanin synthesis and, when deployed in a defensive cloud, can irritate a predator\'s gill membranes. The mucus component controls cloud viscosity — pseudomorphs require thicker mucus to hold their shape, while dispersive clouds use thinner formulations. The cuttlefish can modulate this ratio, essentially adjusting the "recipe" in real time.',
    interactiveType: 'timeline',
    interactiveConfig: {
      type: 'swipeable_timeline',
      layers: [
        'era_ancient_world',
        'era_renaissance',
        'era_scientific',
        'era_modern',
        'era_culinary',
      ],
      controls: [
        'swipe_horizontal_between_eras',
        'tap_illustration_to_animate',
        'pinch_zoom_on_artifacts',
      ],
      description:
        'A horizontal timeline spans the screen, divided into five illustrated eras. The player swipes left/right to move through time. Each era fills the screen with a styled illustration: ancient Greek manuscripts with sepia text, Leonardo da Vinci\'s sketches rendered in sepia wash, a Victorian microscope revealing melanin structure, a modern MRI scan with melanin contrast, and a plate of risotto al nero di seppia. Tapping each illustration triggers an animation — the ancient quill draws a letter in real sepia ink, the Renaissance sketch builds stroke by stroke, the microscope zooms into molecular structure, the MRI scan lights up, and the risotto plate shows ink being stirred in. Each era card includes concise text summarizing the key facts.',
    },
  },

  // ─────────────────────────────────────────────
  // Stage 3 — Juvenile
  // ─────────────────────────────────────────────

  {
    id: 'codex_passing_cloud_display',
    title: 'Passing Cloud Display',
    linkedSceneId: 'juvenile_hunting',
    description:
      'Slow-motion replay of the passing cloud hunting behavior with heat map overlay of chromatophore activation. Control speed and freeze individual frames.',
    content:
      'The passing cloud display is a predatory behavior unique to cuttlefish — traveling bands of dark coloration that ripple across the body like shadows of clouds moving over a landscape. First described in detail by researchers Hanlon and Messenger, this display is used specifically during the stalk phase of hunting and appears to mesmerize prey, causing them to freeze in place.\n\n' +
      'THE PATTERN — Each "cloud" is a band of maximally expanded chromatophores approximately 1-2 centimeters wide that travels from the posterior (tail) end of the mantle toward the head. As the leading edge of the band expands new chromatophores, the trailing edge contracts the ones it passes, creating a smooth traveling wave. The bands move at approximately 1-2 centimeters per second across the body surface. Multiple bands can be active simultaneously, creating a continuous rippling effect.\n\n' +
      'NEURAL MECHANISM — The traveling wave requires precisely timed sequential activation of chromatophore motor neurons along the body axis. This is coordinated by the chromatophore lobes in the cuttlefish brain, which generate a rhythmic pattern of neural activity that sweeps through the motor neuron population like a wave through a stadium crowd doing "the wave." The frequency and speed of the wave are under voluntary control — the cuttlefish can speed up, slow down, or halt the display at will.\n\n' +
      'WHY PREY FREEZES — The leading hypothesis for the mesmerizing effect involves the prey\'s optomotor response — the involuntary reflex that causes animals to visually track moving patterns in their environment (the same reflex that makes you feel like you\'re moving when a train next to yours pulls away). The traveling chromatophore bands may overwhelm the prey\'s optomotor system, creating conflicting motion signals that essentially "crash" the prey\'s visual processing. The crab or shrimp freezes because its nervous system cannot resolve the competing motion cues — a neurological exploit, not hypnosis in the mystical sense.\n\n' +
      'TIMING AND CONTEXT — Cuttlefish deploy the passing cloud display only after achieving a specific proximity to the prey (typically 2-3 body lengths) and only when their overall camouflage is intact. The display itself does not provide camouflage — it is conspicuous. But if the cuttlefish has stalked successfully to close range, the prey is already within strike distance by the time the display begins. The passing cloud buys the final 1-2 seconds needed to position the tentacles for a ballistic strike.\n\n' +
      'RHYTHM SENSITIVITY — Research has shown that the effectiveness of the passing cloud display depends on rhythm consistency. Irregular or interrupted patterns are significantly less effective at freezing prey, suggesting that the optomotor disruption requires sustained, predictable input to overload the prey\'s visual processing. A single missed beat can allow the prey\'s nervous system to "reset" and initiate an escape response.\n\n' +
      'SPECIES VARIATION — Not all cuttlefish species use the passing cloud display with equal frequency or skill. Sepia officinalis (common European cuttlefish) employs it regularly. Some tropical species use a modified version with different wave frequencies. The behavior appears to be both innate and refined through experience — juvenile cuttlefish attempt it with lower success rates than experienced adults.',
    interactiveType: 'slow_motion_replay',
    interactiveConfig: {
      type: 'replay_with_heatmap',
      layers: [
        'cuttlefish_body_silhouette',
        'chromatophore_activation_heatmap',
        'wave_propagation_overlay',
        'prey_response_indicator',
      ],
      controls: [
        'playback_speed_slider_0.1x_to_2x',
        'frame_by_frame_step',
        'freeze_frame_tap',
        'toggle_heatmap_overlay',
        'toggle_neural_signal_visualization',
      ],
      description:
        'A side-view cuttlefish silhouette fills the upper portion of the screen, with a crab prey target to the right. The passing cloud display plays in real time initially, then the player can control playback speed with a slider (0.1x slow motion to 2x fast). A heat map overlay shows chromatophore activation intensity — cool blue for contracted, hot red for fully expanded — creating a visible wave pattern sweeping across the body. Tapping the screen freezes the frame; a side panel shows which chromatophore motor neurons are active in that instant. A small inset shows the prey\'s "visual processing load" meter filling as the clouds travel. Step-forward and step-backward buttons allow frame-by-frame analysis. A toggle shows the neural signal propagation as a separate colored wave traveling through a simplified nervous system diagram beneath the body.',
    },
  },

  {
    id: 'codex_cephalopod_evolution',
    title: 'Cephalopod Evolution',
    linkedSceneId: 'juvenile_territory',
    description:
      'Draggable timeline: place cephalopod ancestors in chronological order and watch body plan animations. Connects cuttlebone to ancient shells.',
    content:
      'Cuttlefish are the inheritors of a 500-million-year evolutionary lineage — one of the oldest and most successful in the animal kingdom. Understanding where they came from illuminates why they are built the way they are.\n\n' +
      'EARLY CEPHALOPODS — Nautiloids (530 MYA) — The first cephalopods appeared in the late Cambrian period as small, shelled creatures. Early nautiloids had straight, conical shells divided into gas-filled chambers connected by a tube called the siphuncle. By adjusting gas and liquid in these chambers, they controlled buoyancy — the same principle that modern cuttlefish use with their cuttlebone. The nautiloid body plan was so successful that they dominated the oceans for over 200 million years. The living nautilus (Nautilus pompilius) is a direct descendant, largely unchanged.\n\n' +
      'AMMONITES (400 – 66 MYA) — Ammonites diverged from nautiloids with coiled, elaborately ridged shells and more complex chamber geometries. They diversified into thousands of species and became one of the most abundant marine animal groups for over 300 million years. Their shells are among the most common fossils found today. Ammonites went extinct in the same mass extinction event that killed the dinosaurs (66 MYA), leaving the ocean floor to their shell-less relatives.\n\n' +
      'BELEMNITES (200 – 66 MYA) — Belemnites represent a critical evolutionary transition: the external shell began to internalize. Belemnites had a bullet-shaped internal shell (the rostrum) surrounded by soft tissue. This internalization freed the body for greater maneuverability and speed. Belemnites are the direct ancestors of modern coleoid cephalopods (cuttlefish, squid, and octopuses). They were active predators with ink sacs — fossilized belemnite ink has been recovered and used to write, demonstrating that the ink defense system is at least 200 million years old.\n\n' +
      'MODERN CUTTLEFISH — Sepiida (66 MYA – Present) — After the mass extinction cleared the oceans of ammonites and many belemnite species, the surviving coleoids diversified rapidly. The cuttlefish lineage retained the internal shell as the cuttlebone — a chambered, gas-filled structure that provides buoyancy control without the weight and vulnerability of an external shell. The cuttlebone is not a bone at all; it is a highly modified shell made of aragonite (a form of calcium carbonate). Its internal chambers are separated by thin walls and connected by a porous structure that allows the cuttlefish to pump gas and liquid in and out to adjust buoyancy — the same basic mechanism the nautiloids used 500 million years ago.\n\n' +
      'SHELL TO BRAIN TRADE — The loss of the external shell freed cephalopods from a rigid body plan and allowed the evolution of flexible bodies, complex locomotion, and — crucially — large brains. Modern cuttlefish have the largest brain-to-body ratio of any invertebrate. Their nervous systems contain roughly 500 million neurons (compared to 20,000 in a typical snail, another mollusk). This neural complexity enables the color-change displays, learning behaviors, and problem-solving abilities that make cuttlefish unique. The price of intelligence, in evolutionary terms, was the loss of the protective shell.\n\n' +
      'CONVERGENT EVOLUTION — Cuttlefish eyes evolved independently from vertebrate eyes — yet they arrived at a strikingly similar solution (camera-type eye with lens and retina). This is one of the most famous examples of convergent evolution in biology. However, the cuttlefish eye has no blind spot (the optic nerve attaches behind the retina, not through it), arguably making it a superior design.',
    interactiveType: 'draggable_timeline',
    interactiveConfig: {
      type: 'chronological_placement',
      layers: [
        'nautiloid_era',
        'ammonite_era',
        'belemnite_era',
        'modern_cuttlefish_era',
        'evolutionary_branch_diagram',
      ],
      controls: [
        'drag_ancestor_to_timeline_position',
        'tap_placed_ancestor_for_animation',
        'pinch_zoom_timeline',
        'toggle_branch_diagram_overlay',
      ],
      description:
        'A horizontal geological timeline spans the bottom of the screen, marked with era labels (Cambrian, Ordovician, ... Cenozoic). Five cephalopod ancestor cards sit in a shuffled pile at the top: Nautiloid, Ammonite, Belemnite, Early Cuttlefish, Modern Cuttlefish. The player drags each card to its correct position on the timeline. Correct placement triggers a brief body plan animation — the nautiloid shell grows and fills with gas, the ammonite shell coils elaborately, the belemnite shell shrinks and internalizes, and the modern cuttlefish shows its cuttlebone pulsing with buoyancy adjustments. Incorrect placement shows a gentle "not quite" nudge. After all five are placed correctly, a branching evolutionary tree diagram overlays the timeline, showing how octopuses, squid, and cuttlefish diverged from common ancestors.',
    },
  },

  {
    id: 'codex_color_communication',
    title: 'Color Communication',
    linkedSceneId: 'juvenile_mate',
    description:
      'Two cuttlefish on screen. Apply pattern/color combinations to one and observe the other\'s behavioral response. Learn the visual "language."',
    content:
      'Cuttlefish have evolved an extraordinarily rich visual communication system — a language of color, pattern, texture, and posture that conveys aggression, submission, courtship interest, alarm, and identity. This visual vocabulary is among the most complex non-vocal communication systems in the animal kingdom.\n\n' +
      'THE COMMUNICATION PALETTE — Researchers have catalogued over 40 distinct body patterns in Sepia officinalis alone, each associated with specific behavioral contexts. These patterns are not random — they are stereotyped signals with consistent meanings across individuals:\n\n' +
      'AGGRESSION SIGNALS — Intense dark mantle (maximum chromatophore expansion), zebra-striped arm pattern (alternating dark and light bands), raised first arm pair (making the animal appear larger), flattened body (presenting maximum surface area to the opponent). Escalation proceeds in steps: mild darkening → full dark + zebra arms → raised arms → physical approach. Each step gives the opponent a chance to back down.\n\n' +
      'SUBMISSION SIGNALS — Rapid blanching to pale (chromatophores fully contracted, leucophores dominant), lowered arms tucked against the body, smooth skin texture (papillae retracted), retreating movement. Blanching is the universal "I give up" signal in cephalopods — it is recognized across species.\n\n' +
      'COURTSHIP SIGNALS — Males display complex patterns that differ dramatically from aggression. Courtship patterns typically involve pulsing or rhythmic intensity changes (unlike the sustained high-contrast of aggression), specific arm postures (third arm pair extended and waving), and species-specific pattern elements that may serve as honest fitness indicators. Female courtship acceptance is signaled by specific patterns that differ from species to species.\n\n' +
      'ALARM SIGNALS — A distinctive "deimatic display" used to startle predators: sudden expansion of dark spots on a pale background, arms spread wide to maximize apparent size, and rapid pattern pulsing. This display is not camouflage — it is the opposite, designed to be maximally conspicuous and startling. It buys the cuttlefish a fraction of a second of predator hesitation, often enough to begin an escape jet.\n\n' +
      'BILATERAL ASYMMETRY — The split display capability (showing different patterns on each side of the body) allows a cuttlefish to send two different messages simultaneously to two different receivers. A male can signal aggression to a rival on his left while signaling courtship to a female on his right. This requires independent neural control of the chromatophore lobes on each side of the brain — a feat of multitasking with no parallel in vertebrate communication.\n\n' +
      'SPEED OF COMMUNICATION — Color changes can be completed in under 300 milliseconds. This makes cuttlefish visual communication faster than human speech (which requires at least 600 milliseconds per word). A rapid-fire "conversation" between two cuttlefish — display, response, counter-response — can cycle through multiple signal exchanges in under two seconds.',
    interactiveType: 'behavioral_simulator',
    interactiveConfig: {
      type: 'pattern_response_simulator',
      layers: [
        'sender_cuttlefish',
        'receiver_cuttlefish',
        'pattern_palette',
        'behavioral_response_animation',
      ],
      controls: [
        'select_pattern_from_palette',
        'apply_pattern_to_sender',
        'observe_receiver_response',
        'tap_response_for_explanation',
      ],
      description:
        'Two cuttlefish face each other on screen — a "sender" on the left that the player controls, and a "receiver" on the right that responds autonomously. A palette at the bottom offers 8 pattern/color presets: Intense Dark (aggression), Zebra Arms (escalated aggression), Pale Blanch (submission), Pulsing Courtship, Deimatic Startle, Passing Cloud, Calm Mottled (neutral), and Female Mimic (sneaker). The player taps a pattern to apply it to the sender cuttlefish. The receiver cuttlefish reacts with an appropriate behavioral response — approaching aggressively, fleeing, displaying back, adopting a courtship posture, or attacking. Tapping the receiver after its response reveals a text explanation of why it responded that way and what the signal meant in biological context. Multiple exchanges can be chained to simulate a full interaction sequence.',
    },
  },

  // ─────────────────────────────────────────────
  // Stage 4 — Adult
  // ─────────────────────────────────────────────

  {
    id: 'codex_sneaker_male_biology',
    title: 'Sneaker Male Biology',
    linkedSceneId: 'adult_rival',
    description:
      'Interactive research recreation. Identify sneaker males in mating scenarios and explore real research data on success rates and evolutionary game theory.',
    content:
      'The sneaker male strategy is one of the most fascinating examples of alternative reproductive tactics in the animal kingdom — and cuttlefish execute it with a sophistication that borders on theatrical.\n\n' +
      'THE STRATEGY — Small male cuttlefish that cannot win direct physical contests against larger rivals have evolved a deceptive alternative: they disguise themselves as females. By adopting female coloration (mottled brown), female body posture (arms tucked, mantle rounded), and even suppressing male-typical behaviors (no aggressive displays, no territorial posturing), sneaker males can approach a guarded female without triggering the dominant male\'s aggression. Once close enough, they mate rapidly and retreat before the dominant male realizes what happened.\n\n' +
      'BODY SIZE CORRELATION — Sneaker behavior is strongly correlated with body size. In Sepia apama (giant Australian cuttlefish), males below a certain size threshold almost never attempt direct competition — they adopt the sneaker strategy almost exclusively. Larger males almost never use it. Mid-sized males may switch between strategies based on the size of the current dominant male. This is an example of conditional strategy expression — the same individual can play different roles depending on context.\n\n' +
      'SUCCESS RATES — Field research on wild Sepia apama populations in Spencer Gulf, Australia, revealed that sneaker males achieve successful copulation in approximately 30-40% of attempts. This is remarkably high given that dominant males are actively guarding their mates. The success rate varies by situation: sneaker attempts are more successful when the dominant male is engaged in a display contest with another rival (distracted guarding) and less successful when the dominant male is vigilant and nearby.\n\n' +
      'SPERM COMPETITION — Even after a sneaker male mates, the battle is not over. Cuttlefish females can store sperm from multiple males, and the dominant male — if he mates afterward — may attempt to flush the sneaker\'s sperm from the female\'s buccal seminal receptacle using water jets from his siphon before depositing his own spermatophores. This "sperm flushing" behavior has been directly observed and represents a post-copulatory competitive mechanism.\n\n' +
      'EVOLUTIONARY GAME THEORY — The coexistence of dominant and sneaker strategies in a population is a real-world example of a mixed evolutionary stable strategy (ESS). If all males were fighters, a sneaker would have enormous success (no one expects deception). If all males were sneakers, a fighter would dominate (no competition). The equilibrium frequency of each strategy is maintained by frequency-dependent selection — each strategy\'s success rate depends on how common it is in the population. This is the Hawk-Dove game playing out in living cuttlefish.\n\n' +
      'NEURAL SUPPRESSION — Perhaps the most remarkable aspect of the sneaker strategy is the neural control required. Male cuttlefish have deeply ingrained aggressive display reflexes — seeing a rival or a potential mate normally triggers involuntary chromatophore responses (darkening, arm raising). A sneaker male must suppress these reflexes completely. Research suggests that successful sneaker males may have measurably different neural thresholds for aggressive chromatophore activation, potentially representing a neurological adaptation rather than simple behavioral flexibility.\n\n' +
      'CROSS-SPECIES PARALLELS — Alternative mating strategies appear across the animal kingdom: satellite male frogs that intercept females attracted by a calling male, jack male salmon that sneak past fighting dominant males, and female-mimicking males in several lizard species. The cuttlefish version is arguably the most sophisticated due to the complexity of the visual disguise and the neural control required to maintain it.',
    interactiveType: 'research_recreation',
    interactiveConfig: {
      type: 'observation_and_data',
      layers: [
        'mating_scenario_animation',
        'data_overlay_success_rates',
        'ess_game_theory_diagram',
        'population_frequency_graph',
      ],
      controls: [
        'play_mating_scenario',
        'tap_to_identify_sneaker',
        'toggle_data_overlay',
        'drag_strategy_frequency_slider',
      ],
      description:
        'The screen shows an animated reef scene with a dominant male guarding a female, and 2-3 other cuttlefish nearby. One is a sneaker male in female disguise. The player taps the cuttlefish they believe is the sneaker — subtle cues (slightly different arm posture, suppressed flash when the dominant male approaches, marginally off-shade coloration) distinguish the sneaker from true females. After correct identification, the scene plays out and a data panel slides up showing real research statistics: success rates by size class, population frequency of each strategy, and a simple interactive graph where the player can drag a slider to change the proportion of sneakers vs. fighters in a population and watch the predicted success rate of each strategy change in response (demonstrating frequency-dependent selection and the ESS equilibrium point).',
    },
  },

  {
    id: 'codex_cuttlebone_buoyancy',
    title: 'Cuttlebone & Buoyancy',
    linkedSceneId: 'adult_nest',
    description:
      'Cross-section of the cuttlebone with fillable gas chambers. Adjust gas/liquid ratios and watch the cuttlefish rise or sink in a water column.',
    content:
      'The cuttlebone is the cuttlefish\'s most distinctive internal structure — a chambered, gas-filled shell that serves as a sophisticated buoyancy control organ. It is also a direct evolutionary link to the external shells of ancient cephalopods.\n\n' +
      'STRUCTURE — The cuttlebone is an oval, flattened structure that runs the length of the cuttlefish\'s dorsal (back) surface. It is made of aragonite — a crystalline form of calcium carbonate, the same mineral in seashells and coral. Internally, the cuttlebone is divided into over 100 thin, parallel chambers separated by walls (septa) supported by tiny pillars. This architecture creates a structure that is over 90% empty space by volume yet strong enough to withstand the crushing pressures of depth changes. It is, in engineering terms, a remarkably efficient lightweight pressure vessel.\n\n' +
      'BUOYANCY MECHANISM — Each chamber can be partially filled with gas or liquid. The cuttlefish controls buoyancy by pumping fluid in or out of the chambers through a porous region called the siphuncular zone (named after the siphuncle in nautilus shells — the same structure, internalized). When fluid is pumped out and replaced by gas, the cuttlebone becomes more buoyant and the cuttlefish rises. When fluid is pumped in, gas compresses, the cuttlebone becomes denser, and the cuttlefish sinks. The pump is osmotic — the cuttlefish actively transports ions across the siphuncular membrane, creating an osmotic gradient that draws water out of the chambers.\n\n' +
      'DEPTH LIMITS — The cuttlebone chambers can only withstand a limited hydrostatic pressure before they implode. This sets a hard depth limit for each cuttlefish species. Sepia officinalis is limited to approximately 150-200 meters. Below this depth, the thin aragonite walls between chambers crack and the buoyancy system fails catastrophically. This is why cuttlefish are primarily coastal, shallow-water animals — their buoyancy system, inherited from shell-bearing ancestors, constrains them to the upper ocean.\n\n' +
      'RESPONSE TIME — Buoyancy adjustment via the cuttlebone is slow — it takes minutes to hours to significantly change the gas/liquid ratio. This is fine for routine depth adjustments but useless for rapid escape maneuvers. For quick vertical movement, cuttlefish rely on jet propulsion and fin undulation. The cuttlebone provides a passive baseline buoyancy that the cuttlefish "sets" for its current depth, reducing the energy cost of maintaining position in the water column.\n\n' +
      'AFTER DEATH — Cuttlebones are frequently found washed up on beaches, especially after seasonal die-offs following mass spawning events. Because they are filled with gas, cuttlebones float — they can drift for weeks or months before washing ashore. Beachcombers in Europe and Australia commonly find them. They are sold as calcium supplements for pet birds (budgerigars and cockatiels gnaw on them) — one of the stranger intersections of marine biology and pet care.\n\n' +
      'BIOMIMETIC INSPIRATION — Engineers have studied cuttlebone architecture for inspiration in designing lightweight, strong structures. The parallel-chamber design with supporting pillars is remarkably similar to engineered honeycomb and sandwich-panel composites used in aerospace. The cuttlefish arrived at this engineering solution roughly 500 million years before humans did.',
    interactiveType: 'cross_section_simulator',
    interactiveConfig: {
      type: 'gas_chamber_control',
      layers: [
        'cuttlebone_cross_section',
        'chamber_gas_liquid_fill',
        'water_column_position',
        'pressure_indicator',
      ],
      controls: [
        'tap_chamber_to_fill_or_drain',
        'drag_gas_liquid_ratio_slider',
        'depth_pressure_readout',
        'toggle_internal_structure_labels',
      ],
      description:
        'The screen is split: the left side shows a detailed cross-section of a cuttlebone with ~20 visible chambers, each rendered as a thin rectangular space between septa. The right side shows a vertical water column with a cuttlefish silhouette that moves up or down based on overall buoyancy. The player taps individual chambers to toggle them between gas-filled (shown as light/empty) and liquid-filled (shown as blue). A master slider controls the overall gas/liquid ratio across all chambers simultaneously. As the player adjusts, the cuttlefish on the right floats up or sinks down in the water column. A depth gauge and pressure indicator show current depth. Below a critical depth (marked in red), a warning appears and chambers begin to crack visually if the player forces the cuttlefish too deep. Labels toggle on/off to identify the siphuncular zone, septa, pillars, and dorsal shield.',
    },
  },

  {
    id: 'codex_lifespan_senescence',
    title: 'Lifespan & Senescence',
    linkedSceneId: 'adult_tend',
    description:
      'Interactive 2-year cuttlefish life timeline. Scrub through biological changes: growth, maturation, reproduction, and the programmed death that follows.',
    content:
      'A cuttlefish lives for approximately 1-2 years. In that time, it grows from a rice-grain-sized hatchling to a full-sized adult, learns to hunt, camouflage, communicate, mate, and reproduce — and then dies. This entire arc plays out in less time than a human toddler takes to learn to walk.\n\n' +
      'MONTHS 1-2: HATCHLING — The cuttlefish emerges from its egg fully formed but tiny — approximately 6-8 millimeters in mantle length. It has a residual yolk sac that provides energy for 24-48 hours, after which it must begin hunting. Growth is explosive: hatchlings can double in size within the first two weeks. Chromatophores are functional from birth but limited in number; the skin "resolution" increases as new chromatophores develop throughout growth. The brain is disproportionately large relative to the body, and learning is rapid — hunting strike accuracy improves dramatically within the first dozen attempts.\n\n' +
      'MONTHS 3-6: JUVENILE — Growth continues at a rapid pace, fueled by an aggressive predatory lifestyle. The cuttlefish is now large enough to take crabs and larger shrimp. Chromatophore density has increased to adult levels. The cuttlebone grows in step with the body, adding new chambers at the anterior (front) edge. This is a period of intense learning — juveniles refine their camouflage repertoire, develop hunting specializations, and begin exploring territorial behavior. Brain maturation is approaching completion. This is also the most dangerous period: the cuttlefish is large enough to be noticed by bigger predators but not yet fast or skilled enough to escape reliably.\n\n' +
      'MONTHS 7-12: SUB-ADULT — The cuttlefish reaches sexual maturity. Males develop the enhanced chromatophore patterns needed for courtship and aggressive displays. Females\' nidamental glands begin to enlarge in preparation for egg production. Behavior shifts from pure survival to include reproductive motivation — males become territorial and display to rivals. Body growth slows as metabolic resources begin diverting toward reproductive tissue development.\n\n' +
      'MONTHS 12-18: ADULT / REPRODUCTIVE — Mating occurs. Males compete for females through display contests, physical confrontation, and sneaker tactics. Females select mates, store sperm, and begin producing eggs. Egg-laying is a massive metabolic investment — a female may produce 200-500 eggs over several laying bouts, each egg requiring protein, lipid, and ink from her body reserves. After laying, the female guards the nest.\n\n' +
      'MONTHS 18-24: SENESCENCE — After reproduction, the optic glands release a cascade of hormones that trigger rapid physiological decline. The cuttlefish stops eating (appetite is suppressed at the hormonal level). The immune system collapses, making the animal vulnerable to infections and parasites. Muscle tissue breaks down — the protein is metabolized for energy to sustain the final weeks of egg guarding. Vision deteriorates as the optic lobes degenerate. Chromatophore control becomes erratic — the once-precise color change system fails, producing patchy, incomplete patterns. Wound healing ceases. The animal loses coordination, reaction speed, and eventually the ability to maintain buoyancy. Death follows within weeks of the onset of senescence.\n\n' +
      'THE OPTIC GLAND EXPERIMENT — In the 1970s, researcher Jerome Wodinsky demonstrated that removing the optic glands from post-reproductive octopuses halted senescence. The animals resumed eating, regained weight, and lived for months beyond their normal lifespan — but never reproduced again. This experiment proved that senescence in cephalopods is not simply "wearing out" — it is an actively triggered program, a hormonal self-destruct sequence initiated by reproduction. The evolutionary logic is stark: all resources must go to offspring. There is no second chance.\n\n' +
      'WHY SEMELPARITY? — The evolutionary advantage of dying after reproduction is counterintuitive, but the math is clear. A cuttlefish that survives to reproduce a second time would need to survive another full year of predation, starvation risk, disease, and environmental hazards — with a probability of success well below 50%. By investing all available energy into one large clutch and intensive parental care, the cuttlefish maximizes the number of offspring from its single guaranteed reproductive opportunity. Natural selection favors the strategy that produces the most surviving offspring, not the strategy that keeps the parent alive longest.',
    interactiveType: 'timeline_scrubber',
    interactiveConfig: {
      type: 'life_timeline_scrubber',
      layers: [
        'cuttlefish_body_model',
        'biological_stats_overlay',
        'organ_system_indicators',
        'life_event_markers',
      ],
      controls: [
        'drag_timeline_scrubber',
        'tap_life_event_for_detail',
        'toggle_stat_graph_overlay',
        'toggle_organ_highlight',
      ],
      description:
        'A horizontal timeline representing approximately 24 months spans the bottom of the screen, with labeled life stage regions (Hatchling, Juvenile, Sub-Adult, Adult, Senescence) in different colors. A draggable scrubber handle lets the player move freely through the timeline. The main display shows a cuttlefish that visually transforms as the scrubber moves — growing from a tiny hatchling to a full adult, then visibly deteriorating during senescence (patchy skin, drooping arms, clouded eyes). Stat graphs overlay the cuttlefish showing real-time values for: body size, chromatophore count, brain development, reproductive organ size, muscle mass, immune function, and visual acuity. During senescence, the muscle mass, immune function, and visual acuity lines drop sharply while the cuttlefish model degrades visually. Key life events (first hunt, first camouflage, first mating, egg laying, onset of senescence) are marked on the timeline as tappable nodes that open brief explanatory cards. The emotional weight of the final phase — watching all stats decline while the cuttlefish guards its eggs — is intentionally direct.',
    },
  },
];
