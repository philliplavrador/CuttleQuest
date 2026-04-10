# Game Assets — CuttleQuest

## Assets to Download

Download these free packs and extract into `public/assets/`:

### 1. Deep-sea Creatures by pixel_emm
- **URL:** https://pixel-emm.itch.io/deep-sea-creatures
- **Price:** Free
- **Style:** 48x48 pixel art, 2-frame animations, cohesive color palette
- **Includes:** 31 unique sea creatures (fish, jellyfish, crabs, etc.)
- **Format:** PNG spritesheet + Aseprite file
- **License:** CC-BY-SA 4.0 (credit required)
- **Extract to:** `public/assets/deep-sea-creatures/`
- **Use for:** Predator sprites (wrasse, crab, starfish), ambient fish, decorative creatures

### 2. Underwater Fantasy Environment by ansimuz
- **URL:** https://ansimuz.itch.io/underwater-fantasy-pixel-art-environment
- **Price:** Free
- **Style:** 16-bit/SNES pixel art, parallax layers
- **Includes:** 3 background layers (coral, seaweed, rocks, ocean gradient)
- **Format:** PNG (1.6 MB ZIP)
- **License:** CC-BY 4.0 (credit appreciated)
- **Extract to:** `public/assets/underwater-bg/`
- **Use for:** Scene backgrounds (EggTend, EggHatch, Hatchling scenes)

### 3. Kenney Fish Pack
- **URL:** https://kenney.nl/assets/fish-pack
- **Price:** Free
- **Style:** Clean vector/flat design, 120 assets
- **Includes:** Various fish, sea creatures, tiles, objects
- **Format:** PNG + vector files
- **License:** CC0 (public domain, no attribution needed)
- **Extract to:** `public/assets/fish-pack/`
- **Use for:** UI icons, menu decorations, ambient fish variety

## Optional Paid Packs

### 4. Animated Pixel Art Crab Enemy by dustdfg
- **URL:** https://dustdfg.itch.io/animated-pixel-art-crab-enemy
- **Price:** Free (name your own price)
- **License:** CC-BY-SA 4.0
- **Extract to:** `public/assets/pixel-art-crab/`
- **Use for:** Crab predator in EggTend scene

### 5. 20 32x32 Sea Creatures Pixel Pack by NinjaGame_Dev
- **URL:** https://ninjagame-dev.itch.io/sea-creatures-pixel-pack-20-ocean-themed-sprites
- **Price:** Paid (minimum $1)
- **License:** Commercial use OK, no redistribution
- **Extract to:** `public/assets/sea-creatures-pack/`
- **Use for:** Starfish predator sprite in EggTend scene

### 6. Ocean Creatures Pixel Art Pack by NeoPixelBoyCo — $3.99
- **URL:** https://neopixelboyco.itch.io/ocean-creatures-pixel-art-pack
- **Includes:** Animated crab, octopus, shark, starfish, seahorse, pufferfish, whale (96-160px)
- **License:** Commercial use OK, no redistribution
- **Use for:** Animated predator sprites in EggTend (crab + starfish are exact matches)

### 5. Marine Creatures by Weenter — $5.00
- **URL:** https://weentermakesgames.itch.io/marine-creatures-sea-animals-pixel-art-animations
- **Includes:** 14 creatures with full swim/attack/death animations (dolphin, jellyfish, turtle, pufferfish, 10 tropical fish)
- **License:** CC-BY 4.0
- **Use for:** Hatchling scenes (HatchlingHunt prey, HatchlingCamouflage predator)

### 4. Hatching Egg Sprites by Nightspore (Viergacht)
- **URL:** https://nightspore.itch.io/hatching-egg-sprites
- **Price:** Free (name your own price)
- **Style:** 32x32 pixel art, animated hatching sequence
- **Includes:** 4 egg colors (cream, brown, grey, purple) with rock/bounce/crack/hatch animation. GIF + PNG spritesheet.
- **Format:** GIF (32x32), PNG spritesheet (828x468)
- **License:** Free for commercial use, modifications allowed. No NFT/crypto/AI.
- **Extract to:** `public/assets/hatching-eggs/`
- **Use for:** EggHatch scene — interactive tap-to-hatch egg visual

### 5. Fantasy Pixel Art Eggs by Frostwindz
- **URL:** https://frostwindz.itch.io/fantasy-pixel-art-eggs
- **Price:** Free (name your own price)
- **Style:** 64x64 hand-painted pixel art, fantasy themed
- **Includes:** 20 unique fantasy eggs (dragon, slime, magic, monster themed). Individual PNGs + spritesheet + PSD source.
- **Format:** PNG (64x64 each), PSD
- **License:** Personal + commercial use, modifications allowed, credit appreciated, no redistribution
- **Extract to:** `public/assets/fantasy-eggs/`
- **Use for:** Future cosmetic egg skins, collection items

## Other Free Background Options

### 6. Undersea Pixel Scene by 3Dotsq
- **URL:** https://3dotsq.itch.io/undersea-pixel-scene-asset-pack
- **Price:** Free
- **Includes:** 2 sea snails, 2 jellyfish, 2 seaweeds, bubbles, colorful fish (PNG, 377 kB)
- **License:** Personal + commercial use (credit appreciated)
- **Use for:** Ambient overlay elements, bubble effects

### 7. Free Underwater Backgrounds by CraftPix
- **URL:** https://craftpix.net/freebies/free-underwater-world-pixel-art-backgrounds/
- **Price:** Free
- **Includes:** 4 underwater scene backgrounds (576x324, PSD + PNG)
- **License:** Royalty free
- **Use for:** Alternative scene backgrounds

## Attribution

Add credits to the game's about/credits screen:
- pixel_emm — Deep-sea Creatures (CC-BY-SA 4.0)
- ansimuz — Underwater Fantasy Environment (CC-BY 4.0)
- Kenney (kenney.nl) — Fish Pack (CC0)
- Nightspore — Hatching Egg Sprites (free, commercial OK)
- Frostwindz — Fantasy Pixel Art Eggs (free, commercial OK, credit appreciated)
- dustdfg — Animated Pixel Art Crab Enemy (CC-BY-SA 4.0)
- NinjaGame_Dev — Sea Creatures Pixel Pack (paid, no redistribution)

## Scripts

### `scripts/prep_asset.py` — General Asset Processor

Converts ChatGPT-generated pixel art (or any image) into game-ready transparent PNGs. Handles background removal, trimming, resizing, and spritesheet splitting.

**Requirements:**
```bash
pip install pillow numpy        # always needed
pip install rembg               # needed unless using --no-rembg
```

**Usage:**
```bash
# Basic: remove background, trim, resize to 64x64
python scripts/prep_asset.py input.png -o creatures -s 64

# Already transparent (skip rembg)
python scripts/prep_asset.py input.png -o items -s 32 --no-rembg

# Split a spritesheet into 4x3 grid, name with prefix
python scripts/prep_asset.py sheet.png -o creatures -s 48 --split 4x3 --prefix crab

# Explicit names for each sprite
python scripts/prep_asset.py sheet.png -o fish -s 48 --split 2x1 --names idle,swim

# Background image (skip trim to preserve full frame)
python scripts/prep_asset.py bg.png -o backgrounds -s 256 --no-trim

# Multiple inputs at once
python scripts/prep_asset.py *.png -o items -s 32 --no-rembg

# Add padding before resize
python scripts/prep_asset.py input.png -o creatures -s 64 -p 4
```

**Pipeline:** `Input PNG → [remove background] → [auto-trim] → [add padding] → [resize NEAREST] → Save`

Each step is skippable via flags (`--no-rembg`, `--no-trim`).

**Output:** `public/assets/<output>/` — transparent PNGs at the specified square size, pixel-art crisp (NEAREST interpolation).

| Flag | Description |
|------|-------------|
| `-o/--output` | Subdirectory under `public/assets/` |
| `-s/--size` | Target square size in px |
| `--split COLSxROWS` | Split spritesheet into grid |
| `-p/--padding N` | Transparent padding before resize |
| `--no-trim` | Skip auto-trim |
| `--no-rembg` | Skip background removal |
| `--prefix NAME` | Prefix for auto-generated filenames |
| `--names a,b,c` | Explicit output names (no .png) |

---

### `scripts/prep_avatars.py` — Sprite Preparation Tool

Automated pipeline for preparing sprite images for use in the game. Takes a reference image containing multiple sprites and outputs game-ready assets.

**What it does:**
1. Removes background (AI-powered via `rembg`)
2. Splits image into individual sprites (auto-detects separate shapes)
3. Removes eyes (so canvas can draw animated eyes on top)
4. Creates grayscale "base" versions (for cosmetic color tinting)
5. Resizes to 300x300 with NEAREST interpolation (pixel art stays crisp)

**Requirements:**
```bash
pip install rembg pillow numpy
```

**Usage:**
```bash
python scripts/prep_avatars.py <path_to_image>
```

**Output (to `public/assets/avatars/`):**
| File | Purpose |
|------|---------|
| `*-base.png` | Grayscale, no eyes — used for tinting with cosmetic colors |
| `*-eyeless.png` | Original colors, no eyes — fallback/default |
| `*.png` | Original with eyes — reference only |

**Notes:**
- First run downloads a ~170MB AI model for background removal (one-time)
- Uses `Image.NEAREST` resize to preserve pixel art sharpness
- Eye detection works by color (white sclera, black pupils, yellow-green iris)
- If eye removal isn't perfect, touch up in Photopea (photopea.com)

## Directory Structure

```
public/assets/
  avatars/               ← Cuttlefish avatar sprites (300x300, generated by prep_avatars.py)
  deep-sea-creatures/    ← Creature spritesheet (48x48, 31 creatures)
  underwater-bg/         ← Parallax background layers
  fish-pack/             ← Kenney fish, bubbles, seaweed, rocks
  hatching-eggs/         ← Hatching egg GIF + spritesheet
  fantasy-eggs/          ← 20 fantasy egg PNGs (64x64)
```
