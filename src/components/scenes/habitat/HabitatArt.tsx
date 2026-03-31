'use client';

import React from 'react';
import type { HabitatOption } from './types';

const BASE = '/assets/fish-pack/PNG/Default';

interface SpriteProps {
  src: string;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  unit: number;
  animStyle?: React.CSSProperties;
}

function Sprite({ src, x, y, scale = 1, flip = false, unit, animStyle }: SpriteProps) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        position: 'absolute',
        left: `${x}%`,
        bottom: `${y}%`,
        width: `${scale * unit}px`,
        height: `${scale * unit}px`,
        imageRendering: 'pixelated' as const,
        transform: flip ? 'scaleX(-1)' : undefined,
        pointerEvents: 'none',
        ...animStyle,
      }}
    />
  );
}

export default function HabitatArt({ option, size = 'card' }: { option: HabitatOption; size?: 'card' | 'zoomed' }) {
  const { substrate, waterFlow, light, predatorDistance, nestProximity } = option;
  const zoomed = size === 'zoomed';
  const unit = zoomed ? 96 : 40;
  const height = zoomed ? 280 : 72;

  // Background gradient based on light
  let gradTop = '#0a1e3d';
  let gradBot = '#122a4a';
  if (light === 'bright') { gradTop = '#1a3a5c'; gradBot = '#1e4468'; }
  else if (light === 'dim') { gradTop = '#06142a'; gradBot = '#0a1a35'; }
  else if (light === 'dark') { gradTop = '#030a15'; gradBot = '#06101e'; }

  // Light glow overlay
  let glowOpacity = light === 'bright' ? 0.15 : light === 'moderate' ? 0.06 : 0;
  if (zoomed) glowOpacity *= 1.5;

  // Seaweed sway speed based on water flow
  let swayDuration = '0s';
  if (waterFlow === 'strong') swayDuration = '0.8s';
  else if (waterFlow === 'moderate') swayDuration = '2s';
  else if (waterFlow === 'gentle') swayDuration = '3.5s';

  const sprites: Omit<SpriteProps, 'unit'>[] = [];

  // Substrate-based sprites
  if (substrate === 'rough rock' || substrate === 'coral') {
    sprites.push({ src: `${BASE}/background_rock_a.png`, x: 10, y: 0, scale: 1.2 });
    sprites.push({ src: `${BASE}/background_rock_b.png`, x: 60, y: 0, scale: 1.0 });
  } else if (substrate === 'smooth rock') {
    sprites.push({ src: `${BASE}/background_terrain_top.png`, x: 5, y: 0, scale: 1.4 });
    if (zoomed) {
      sprites.push({ src: `${BASE}/background_terrain_top.png`, x: 45, y: 0, scale: 1.3, flip: true });
    }
  } else if (substrate === 'sand') {
    sprites.push({ src: `${BASE}/background_terrain.png`, x: 0, y: 0, scale: 1.5 });
    sprites.push({ src: `${BASE}/background_terrain.png`, x: 40, y: 0, scale: 1.5 });
    if (zoomed) {
      sprites.push({ src: `${BASE}/background_terrain.png`, x: 75, y: 0, scale: 1.5 });
    }
  } else if (substrate === 'kelp') {
    sprites.push({ src: `${BASE}/background_seaweed_a.png`, x: 15, y: 0, scale: 1.3 });
    sprites.push({ src: `${BASE}/background_seaweed_c.png`, x: 40, y: 0, scale: 1.2 });
    sprites.push({ src: `${BASE}/background_seaweed_a.png`, x: 65, y: 0, scale: 1.1, flip: true });
    if (zoomed) {
      sprites.push({ src: `${BASE}/background_seaweed_b.png`, x: 85, y: 0, scale: 1.0 });
    }
  }

  // Add seaweed for non-kelp substrates
  if (substrate !== 'kelp' && substrate !== 'sand') {
    sprites.push({ src: `${BASE}/background_seaweed_d.png`, x: 38, y: 0, scale: 0.9 });
    if (zoomed) {
      sprites.push({ src: `${BASE}/background_seaweed_c.png`, x: 72, y: 0, scale: 0.8 });
    }
  }

  // Extra rock for rough/coral
  if (substrate === 'rough rock') {
    sprites.push({ src: `${BASE}/background_rock_a.png`, x: 78, y: 0, scale: 0.7, flip: true });
    if (zoomed) {
      sprites.push({ src: `${BASE}/background_rock_b.png`, x: 35, y: 0, scale: 0.6 });
    }
  }

  // Bubble speed for water flow visualization
  const bubbleSpeed = waterFlow === 'strong' ? 1.2 : waterFlow === 'moderate' ? 2.5 : 0;
  const bubbleCount = zoomed
    ? (waterFlow === 'strong' ? 5 : waterFlow === 'moderate' ? 3 : waterFlow === 'gentle' ? 1 : 0)
    : 0;

  // Predator fish (zoomed only)
  const showPredator = zoomed && (predatorDistance === 'near' || predatorDistance === 'medium');
  const predatorFish = predatorDistance === 'near' ? 'fish_red.png' : 'fish_orange.png';
  const predatorSpeed = predatorDistance === 'near' ? 3 : 5;

  // Nest density dots (zoomed only)
  const nestDotCount = zoomed
    ? (nestProximity === 'crowded' ? 8 : nestProximity === 'moderate' ? 3 : 0)
    : 0;

  return (
    <div
      className={`relative w-full overflow-hidden ${zoomed ? 'rounded-xl' : 'rounded-t-lg'}`}
      style={{
        height: `${height}px`,
        background: `linear-gradient(180deg, ${gradTop} 0%, ${gradBot} 100%)`,
      }}
    >
      {/* Light glow */}
      {glowOpacity > 0 && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 80% at 50% 0%, rgba(180,220,255,${glowOpacity}), transparent)`,
          }}
        />
      )}

      {/* Bright light harsh overlay (zoomed) */}
      {zoomed && light === 'bright' && (
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,200,0.12), transparent)' }} />
      )}

      {/* Seaweed sprites (with sway) */}
      <div style={{
        position: 'absolute', inset: 0,
        transformOrigin: '50% 100%',
        animation: swayDuration !== '0s' ? `sway ${swayDuration} ease-in-out infinite alternate` : undefined,
      }}>
        {sprites.filter(s => s.src.includes('seaweed')).map((s, i) => (
          <Sprite key={`sw-${i}`} {...s} unit={unit} />
        ))}
      </div>

      {/* Rock/terrain sprites */}
      {sprites.filter(s => !s.src.includes('seaweed')).map((s, i) => (
        <Sprite key={`rock-${i}`} {...s} unit={unit} />
      ))}

      {/* Bubbles (zoomed only) — water flow indicator */}
      {bubbleCount > 0 && Array.from({ length: bubbleCount }).map((_, i) => (
        <img
          key={`bub-${i}`}
          src={`${BASE}/bubble_${['a', 'b', 'c'][i % 3]}.png`}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: `${15 + i * 18}%`,
            top: `${20 + (i * 17) % 40}%`,
            width: 16 + (i % 2) * 8,
            height: 16 + (i % 2) * 8,
            imageRendering: 'pixelated' as const,
            opacity: 0.5,
            pointerEvents: 'none',
            animation: bubbleSpeed > 0
              ? `floatBubble ${bubbleSpeed + i * 0.4}s ease-in-out infinite`
              : undefined,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}

      {/* Predator fish (zoomed only) */}
      {showPredator && (
        <img
          src={`${BASE}/${predatorFish}`}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            top: '20%',
            width: zoomed ? 64 : 32,
            height: zoomed ? 64 : 32,
            imageRendering: 'pixelated' as const,
            pointerEvents: 'none',
            animation: `swimRight ${predatorSpeed}s linear infinite`,
          }}
        />
      )}

      {/* Nest density dots (zoomed only) */}
      {nestDotCount > 0 && Array.from({ length: nestDotCount }).map((_, i) => (
        <div
          key={`nest-${i}`}
          style={{
            position: 'absolute',
            left: `${8 + (i * 23) % 85}%`,
            bottom: `${5 + (i * 13) % 25}%`,
            width: 8,
            height: 10,
            borderRadius: '40% 40% 50% 50%',
            background: 'rgba(140,100,180,0.5)',
            boxShadow: '0 0 3px rgba(140,100,180,0.3)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}
