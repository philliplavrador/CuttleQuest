'use client';

import React, { useState, useEffect } from 'react';

/* ------------------------------------------------------------------ */
/*  Deep-sea Creatures spritesheet (48x48 frames, 2 per row, 31 rows) */
/* ------------------------------------------------------------------ */

const SPRITESHEET = '/assets/deep-sea-creatures/DeepseaCreatures_spritesheet.png';
const FRAME_W = 48;
const FRAME_H = 48;

// Map creature names to spritesheet row indices (0-based)
// Each row has 2 animation frames side by side
export const CREATURES: Record<string, number> = {
  dumbo_octopus: 0,
  pufferfish_gold: 1,
  moray_eel: 2,
  moray_dark: 3,
  stingray: 4,
  octopus: 5,
  cuttlefish: 6,
  blobfish: 7,
  shark_blue: 8,
  crab: 9,
  anglerfish: 10,
  pufferfish_dark: 11,
  butterfly_fish: 12,
  seahorse: 13,
  shrimp: 14,
  spider_crab: 15,
  wrasse: 16,
  catfish: 17,
  hammerhead: 18,
  clownfish: 19,
  pufferfish_orange: 20,
  anemone: 21,
  axolotl: 22,
  fish_small_a: 23,
  fish_small_b: 24,
  ammonite: 25,
  nudibranch: 26,
  sea_turtle: 27,
  sea_slug: 28,
  nautilus: 29,
  eel: 30,
};

/**
 * Renders a creature from the deep-sea spritesheet with 2-frame animation.
 */
export function CreatureSprite({ creature, size = 48, animate = true, flip = false, className = '', style = {} }: {
  creature: keyof typeof CREATURES | number;
  size?: number;
  animate?: boolean;
  flip?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const row = typeof creature === 'number' ? creature : CREATURES[creature] ?? 0;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!animate) return;
    const interval = setInterval(() => setFrame(f => (f + 1) % 2), 500);
    return () => clearInterval(interval);
  }, [animate]);

  const scale = size / FRAME_W;

  return (
    <div
      className={`overflow-hidden shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        transform: flip ? 'scaleX(-1)' : undefined,
        ...style,
      }}
    >
      <div
        style={{
          width: FRAME_W,
          height: FRAME_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          backgroundImage: `url(${SPRITESHEET})`,
          backgroundPosition: `-${frame * FRAME_W}px -${row * FRAME_H}px`,
          backgroundSize: `${FRAME_W * 2}px auto`,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Kenney fish pack — individual PNGs                                 */
/* ------------------------------------------------------------------ */

const KENNEY_BASE = '/assets/fish-pack/PNG/Double';

export const KENNEY_FISH = {
  fish_blue: `${KENNEY_BASE}/fish_blue.png`,
  fish_brown: `${KENNEY_BASE}/fish_brown.png`,
  fish_green: `${KENNEY_BASE}/fish_green.png`,
  fish_grey: `${KENNEY_BASE}/fish_grey.png`,
  fish_orange: `${KENNEY_BASE}/fish_orange.png`,
  fish_pink: `${KENNEY_BASE}/fish_pink.png`,
  fish_red: `${KENNEY_BASE}/fish_red.png`,
  bubble_a: `${KENNEY_BASE}/bubble_a.png`,
  bubble_b: `${KENNEY_BASE}/bubble_b.png`,
  bubble_c: `${KENNEY_BASE}/bubble_c.png`,
  seaweed_green_a: `${KENNEY_BASE}/seaweed_green_a.png`,
  seaweed_green_b: `${KENNEY_BASE}/seaweed_green_b.png`,
  seaweed_pink_a: `${KENNEY_BASE}/seaweed_pink_a.png`,
  seaweed_orange_a: `${KENNEY_BASE}/seaweed_orange_a.png`,
  rock_a: `${KENNEY_BASE}/rock_a.png`,
  rock_b: `${KENNEY_BASE}/rock_b.png`,
} as const;

/* ------------------------------------------------------------------ */
/*  Predator sprites — horizontal spritesheets for predators           */
/* ------------------------------------------------------------------ */

interface PredatorSpriteConfig {
  src: string;
  frameW: number;
  frameH: number;
  /** For horizontal strip spritesheets (crab idle) */
  frameCount: number;
  /** For grid spritesheets — pixel offset to the frame */
  offsetX?: number;
  offsetY?: number;
  /** Total spritesheet size (needed for grid sprites) */
  sheetW?: number;
  sheetH?: number;
}

export const PREDATOR_SPRITES: Record<string, PredatorSpriteConfig> = {
  crab: {
    src: '/assets/pixel-art-crab/idle/crab_idle.png',
    frameW: 32, frameH: 32, frameCount: 4,
  },
  starfish: {
    src: '/assets/sea-creatures-pack/PixelCreatures.png.PNG',
    frameW: 32, frameH: 32, frameCount: 1,
    offsetX: 0, offsetY: 64,
    sheetW: 160, sheetH: 128,
  },
};

export function PredatorSprite({ creature, size = 48, animate = true, flip = false, className = '', style = {} }: {
  creature: string;
  size?: number;
  animate?: boolean;
  flip?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const config = PREDATOR_SPRITES[creature];
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!animate || !config || config.frameCount <= 1) return;
    const interval = setInterval(() => setFrame(f => (f + 1) % config.frameCount), 500);
    return () => clearInterval(interval);
  }, [animate, config]);

  if (!config) return null;

  const scale = size / config.frameW;
  const isGrid = config.offsetX !== undefined;
  const bgX = isGrid ? config.offsetX! : frame * config.frameW;
  const bgY = isGrid ? config.offsetY! : 0;
  const bgW = isGrid ? config.sheetW! : config.frameW * config.frameCount;
  const bgH = isGrid ? config.sheetH! : config.frameH;

  return (
    <div
      className={`overflow-hidden shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        transform: flip ? 'scaleX(-1)' : undefined,
        ...style,
      }}
    >
      <div
        style={{
          width: config.frameW,
          height: config.frameH,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          backgroundImage: `url(${config.src})`,
          backgroundPosition: `-${bgX + (isGrid ? 0 : 0)}px -${bgY}px`,
          backgroundSize: `${bgW}px ${bgH}px`,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Egg assets                                                         */
/* ------------------------------------------------------------------ */

export const EGG_ASSETS = {
  hatchingGif: '/assets/hatching-eggs/egg-hatching.gif',
  spriteSheet: '/assets/hatching-eggs/egg sprite sheet.png',
  fantasyEgg: (n: number) => `/assets/fantasy-eggs/PNGs/egg_${n}.png`,
  fantasySpriteSheet: '/assets/fantasy-eggs/sprite-sheet.png',
} as const;

/* ------------------------------------------------------------------ */
/*  Underwater background layers (ansimuz)                             */
/* ------------------------------------------------------------------ */

const BG_BASE = '/assets/underwater-bg/underwater-fantasy-files/Assets/PNG/layers';

export const UW_LAYERS = {
  far: `${BG_BASE}/far.png`,
  sand: `${BG_BASE}/sand.png`,
  foreground1: `${BG_BASE}/foreground-1.png`,
  foreground2: `${BG_BASE}/foreground-2.png`,
  merged: `${BG_BASE}/foregound-merged.png`,
} as const;

/**
 * Full-screen underwater background with parallax layers.
 * Use as the first child of a relative/absolute container.
 */
export function UnderwaterBg({ brightness = 0.5, showForeground = true }: {
  brightness?: number;
  showForeground?: boolean;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Deep blue gradient base */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #0a1e3d 0%, #0d2847 40%, #122a4a 70%, #0a1628 100%)' }} />

      {/* Far layer — distant reef silhouette */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: `url(${UW_LAYERS.far})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          imageRendering: 'pixelated',
          opacity: brightness * 0.8,
        }} />

      {/* Sand/coral foreground */}
      {showForeground && (
        <div className="absolute inset-0"
          style={{
            backgroundImage: `url(${UW_LAYERS.sand})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            imageRendering: 'pixelated',
            opacity: brightness,
          }} />
      )}
    </div>
  );
}

/**
 * Ambient fish swimming across the background.
 */
export function AmbientFish({ count = 3 }: { count?: number }) {
  const fishOptions = [KENNEY_FISH.fish_blue, KENNEY_FISH.fish_pink, KENNEY_FISH.fish_orange, KENNEY_FISH.fish_green];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {Array.from({ length: count }).map((_, i) => {
        const fish = fishOptions[i % fishOptions.length];
        const y = 15 + (i * 37) % 60;
        const size = 20 + (i % 3) * 8;
        const duration = 12 + i * 4;
        const delay = i * 3;
        const goLeft = i % 2 === 0;
        return (
          <img
            key={i}
            src={fish}
            alt=""
            className="absolute"
            style={{
              top: `${y}%`,
              width: size,
              height: 'auto',
              opacity: 0.3,
              transform: goLeft ? 'scaleX(-1)' : undefined,
              animation: `${goLeft ? 'swimLeft' : 'swimRight'} ${duration}s linear ${delay}s infinite`,
              imageRendering: 'pixelated',
            }}
          />
        );
      })}
    </div>
  );
}
