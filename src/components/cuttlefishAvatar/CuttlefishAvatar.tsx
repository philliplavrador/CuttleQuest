'use client';

import React, { useRef, useEffect, useState } from 'react';
import { drawEggStage } from './drawEgg';
import { drawHatchling } from './drawHatchling';
import { drawJuvenile } from './drawJuvenile';
import { drawAdult } from './drawAdult';
import { loadStageSprites, fetchAssignedAvatars, type StageSprites } from './spriteLoader';
import { COSMETICS, Cosmetic } from '@data/cosmetics';

interface CuttlefishAvatarProps {
  size?: number;
  stage?: 'egg' | 'hatchling' | 'juvenile' | 'adult';
  equipped?: {
    color: string | null;
    pattern: string | null;
    fin: string | null;
    mantle: string | null;
  };
  animate?: boolean;
}

function getTintColor(colorId: string | null | undefined): string | null {
  if (!colorId) return null;
  const cosmetic = COSMETICS.find((c: Cosmetic) => c.id === colorId && c.type === 'color');
  if (!cosmetic) return null;
  return cosmetic.visualConfig.colors[0] ?? null;
}

export default function CuttlefishAvatar({
  size = 150,
  stage = 'juvenile',
  equipped,
  animate = true,
}: CuttlefishAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const wobbleRef = useRef(0);
  const spritesRef = useRef<StageSprites>({ base: null, eyeless: null });
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  const [assignedGif, setAssignedGif] = useState<string | null>(null);

  // Check for assigned avatar GIF from asset library
  useEffect(() => {
    let cancelled = false;
    fetchAssignedAvatars().then((assigned) => {
      if (!cancelled) {
        setAssignedGif(assigned[stage] || null);
      }
    });
    return () => { cancelled = true; };
  }, [stage]);

  // Load fallback sprites when stage changes (only if no assigned GIF)
  useEffect(() => {
    if (stage === 'egg' || assignedGif) return;
    let cancelled = false;
    loadStageSprites(stage).then((sprites) => {
      if (!cancelled) {
        spritesRef.current = sprites;
        setSpritesLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [stage, assignedGif]);

  useEffect(() => {
    if (assignedGif) return; // Using <img> instead of canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = 2;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const tintColor = getTintColor(equipped?.color);

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale((size / 150) * dpr, (size / 150) * dpr);

      const t = frameRef.current * 0.025;
      const now = performance.now();

      const sprites = spritesRef.current;

      if (stage === 'egg') {
        const wobbleAge = wobbleRef.current ? (now - wobbleRef.current) / 1000 : 999;
        drawEggStage(ctx, t, wobbleAge);
      } else if (stage === 'hatchling') {
        drawHatchling({
          ctx, t,
          sprite: sprites.base,
          spriteColor: sprites.eyeless,
          tintColor,
        });
      } else if (stage === 'juvenile') {
        drawJuvenile({
          ctx, t,
          sprite: sprites.base,
          spriteColor: sprites.eyeless,
          tintColor,
        });
      } else {
        drawAdult({
          ctx, t,
          sprite: sprites.base,
          spriteColor: sprites.eyeless,
          tintColor,
        });
      }

      ctx.restore();

      if (animate) {
        frameRef.current++;
        animFrameRef.current = requestAnimationFrame(draw);
      }
    }

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [size, stage, equipped, animate, spritesLoaded, assignedGif]);

  const handleClick = () => {
    if (stage === 'egg') {
      wobbleRef.current = performance.now();
    }
  };

  // Use assigned GIF from asset library if available
  if (assignedGif) {
    return (
      <img
        src={assignedGif}
        alt={`${stage} avatar`}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          imageRendering: 'pixelated',
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{ width: size, height: size, cursor: stage === 'egg' ? 'pointer' : 'default' }}
    />
  );
}
