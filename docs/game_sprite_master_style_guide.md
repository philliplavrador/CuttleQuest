# Game Sprite Master Style Guide

Use this as the master prompt/instruction set for creating future creature sprites for the same game.

## Purpose

I am building a game where all creature, animal, and monster sprites must share one unified pixel art style.  
Every new sprite should feel like it belongs to the same game world as the previous ones.

Your job is not just to draw a creature.  
Your job is to translate any creature into the same consistent sprite system every time.

---

## Core Art Direction

All sprites must follow these style rules:

- pixel art only
- clean, readable silhouette
- transparent background
- limited, cohesive color palette
- subtle shading only
- no painterly rendering
- no anti-aliasing
- no blurred edges
- hard pixel edges must be preserved
- readable at small size
- prioritize shape language over excessive detail
- slightly stylized, not hyper-realistic
- mature creature design unless I explicitly ask for cute or chibi
- anatomy should remain recognizable and appropriate for the creature
- design should feel game-ready, not like a standalone illustration

---

## Style Consistency Rules

All future sprites must stay visually consistent with each other.

Keep these things consistent across all creatures:

- overall pixel density
- outline treatment
- shading depth
- detail level
- silhouette clarity
- animation restraint
- frame sizing logic
- rendering philosophy

Do **not** radically reinvent the art style for each new creature.

If a creature is visually complex:
- simplify it
- preserve the most important anatomical features
- keep only the details that help silhouette and recognition
- remove details that clutter the sprite

Every creature should look like it belongs in the same game, even if the species are very different.

---

## Creature Translation Rule

Before generating the sprite, identify:

1. what features are most important to preserve in silhouette
2. what features are most important for species recognition
3. what details can be simplified or removed without losing identity

Then build the sprite around those priorities.

Always preserve the creature’s most iconic features first.  
Everything else is secondary.

---

## Workflow

Follow this process every time:

1. First propose **3 design directions** in plain text.
2. For each direction, describe:
   - silhouette
   - body proportions
   - pose feel
   - special anatomy handling
   - palette idea
   - overall mood
3. All 3 directions must still fit the same unified game style.
4. Wait for me to choose one direction.
5. After I choose, generate the final files.

Do not skip the design direction step unless I explicitly ask you to.

---

## Design Direction Guidance

When proposing the 3 directions, vary the design **within the same style system**.

For example, the directions can differ by:
- more elegant vs more threatening
- broader silhouette vs narrower silhouette
- more fin emphasis vs more limb emphasis
- more naturalistic vs more stylized
- heavier body proportions vs leaner body proportions

But all options must still look like they belong to the same game.

---

## Output Requirements

After I choose a direction, generate **both** of these files:

1. a transparent background animated GIF cycling through all 8 directions
2. a transparent background sprite sheet PNG containing the same 8 directions in a clean grid

These must be real downloadable files, not mockups.

Save files to `/mnt/data/`

Final response should contain download links only.

---

## 8 Direction Requirements

The sprite must include these 8 directions:

- North
- Northeast
- East
- Southeast
- South
- Southwest
- West
- Northwest

---

## Sprite Construction Rules

- every direction must use the same frame size
- sprite sheet must align frames cleanly in a grid
- sprite must remain readable from every direction
- anatomy must remain consistent across directions
- use nearest-neighbor scaling if enlarging for visibility
- do not smooth edges
- do not introduce blurry scaling
- preserve strong silhouette at small sizes
- keep visual complexity controlled
- avoid clutter

If readability and detail conflict, choose readability.

---

## Animation Rules

- GIF should cycle through the 8 directions
- subtle idle or bob motion is allowed only if it does not reduce readability
- do not distort anatomy too much between frames
- clarity matters more than flashy animation
- animation should support the sprite design, not distract from it

---

## Technical Requirements

- use python to generate the files
- use PIL/Pillow or similar
- create actual downloadable files
- save them to `/mnt/data/`
- final response should contain links to both files only

Suggested output filenames:

- `/mnt/data/[creature_name]_8dir_pixel.gif`
- `/mnt/data/[creature_name]_8dir_spritesheet.png`

---

## Design Priority Order

Use this priority order when making decisions:

1. silhouette clarity
2. species recognition
3. consistency with the game’s sprite style
4. anatomy readability
5. shading and surface detail
6. animation polish

If something looks unclear, simplify it.

---

## What To Avoid

Do not do these unless I explicitly request them:

- chibi proportions
- overly cute baby-like interpretation
- painterly shading
- soft rendering
- inconsistent palette logic
- random extra detail
- style drift between creatures
- overly realistic texture detail
- anatomy that reads like the wrong species
- dramatic stylistic changes from prior sprites

---

## Reusable Prompt Version

Paste this into future chats:

Create a pixel art game sprite of a [CREATURE / ANIMAL / MONSTER] for the same game art style as my previous sprites.

Important: keep the art style consistent across different creatures so all sprites look like they belong to one game.

STYLE LOCK
- pixel art only
- readable 2D game sprite style
- clean, strong silhouette
- limited cohesive palette
- subtle shading, not painterly
- no blurry rendering
- preserve hard pixel edges
- transparent background
- design should read clearly at small size
- prioritize shape language over excessive detail
- slightly stylized, not hyper-realistic
- mature creature design unless I explicitly ask for cute/chibi
- anatomy should be recognizable and appropriate for the creature
- the sprite should feel like part of the same world as my other sprites

CONSISTENCY RULES
- keep the same overall rendering logic each time
- keep similar pixel density each time
- keep similar outline treatment each time
- keep similar shading depth each time
- keep similar visual complexity each time
- do not radically change style between creatures
- if a creature is complex, simplify it so it still matches the established sprite style
- all creatures should look like they belong to the same game, even if they are different species

WORKFLOW
1. First, propose 3 possible design directions in plain text before generating files.
2. For each direction, describe:
   - silhouette
   - body proportions
   - pose feel
   - special anatomy handling
   - palette idea
   - overall mood
3. Make sure all 3 options still fit the same game style.
4. Wait for me to choose one direction.
5. After I choose, generate the files.

FILE OUTPUT REQUIREMENTS
Generate both:
- a transparent background animated GIF cycling through all 8 directions
- a transparent background sprite sheet PNG containing the same 8 directions in a clean grid

8 DIRECTION REQUIREMENTS
The 8 directions must be:
- North
- Northeast
- East
- Southeast
- South
- Southwest
- West
- Northwest

SPRITE REQUIREMENTS
- every direction must have the same frame size
- sprite sheet must align all frames cleanly in a grid
- silhouette must remain readable from every direction
- use nearest-neighbor scaling if enlarging for preview/output
- do not anti-alias
- do not smooth edges
- do not distort anatomy too much between directions

ANIMATION REQUIREMENTS
- GIF should cycle through the 8 directions
- optional very subtle idle/bob motion only if readability is preserved
- animation should not introduce inconsistent anatomy
- design clarity matters more than animation flair

TECHNICAL REQUIREMENTS
- use python to generate the image files
- use PIL/Pillow or similar
- create actual downloadable files, not mockups
- save files to /mnt/data/
- final response should contain download links only

OUTPUT FILENAMES
- /mnt/data/[creature_name]_8dir_pixel.gif
- /mnt/data/[creature_name]_8dir_spritesheet.png

DESIGN PRIORITY
- prioritize a strong, reusable game sprite design
- if something looks unclear, simplify the design
- keep the sprite stylistically consistent with the rest of my game assets

Extra line to add when needed:
"Use the exact same sprite philosophy, rendering density, and silhouette readability standards as the previous creature sprites I had made for this game."

Extra line to add when needed:
"Before generating, identify what features of this creature are most important to preserve in silhouette, and simplify everything else."
