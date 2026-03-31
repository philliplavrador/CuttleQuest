'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  phase: number;
}

interface Caustic {
  x: number;
  y: number;
  radius: number;
  phase: number;
  speed: number;
}

export default function UnderwaterCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const causticsRef = useRef<Caustic[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 2;
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const w = () => canvas.clientWidth;
    const h = () => canvas.clientHeight;

    // Initialize particles
    particlesRef.current = Array.from({ length: 25 }, () => ({
      x: Math.random() * w(),
      y: Math.random() * h(),
      size: 1 + Math.random() * 2.5,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: -0.08 - Math.random() * 0.25,
      opacity: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
    }));

    // Initialize caustic patches
    causticsRef.current = Array.from({ length: 3 }, () => ({
      x: Math.random() * w(),
      y: Math.random() * h() * 0.6,
      radius: 40 + Math.random() * 60,
      phase: Math.random() * Math.PI * 2,
      speed: 0.003 + Math.random() * 0.004,
    }));

    let animId: number;

    function draw() {
      const cw = w();
      const ch = h();
      ctx!.clearRect(0, 0, cw, ch);
      frameRef.current++;
      const t = frameRef.current;

      // Deep ocean gradient
      const grad = ctx!.createLinearGradient(0, 0, 0, ch);
      grad.addColorStop(0, '#0a1e3d');
      grad.addColorStop(0.5, '#0d2847');
      grad.addColorStop(1, '#122a4a');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, cw, ch);

      // Caustic light patches
      for (const c of causticsRef.current) {
        const ox = Math.sin(t * c.speed) * 30;
        const oy = Math.cos(t * c.speed * 0.7) * 20;
        const r = c.radius + Math.sin(t * c.speed * 1.3) * 10;

        const cGrad = ctx!.createRadialGradient(
          c.x + ox, c.y + oy, 0,
          c.x + ox, c.y + oy, r,
        );
        cGrad.addColorStop(0, 'rgba(100, 180, 255, 0.06)');
        cGrad.addColorStop(1, 'rgba(100, 180, 255, 0)');
        ctx!.fillStyle = cGrad;
        ctx!.fillRect(c.x + ox - r, c.y + oy - r, r * 2, r * 2);
      }

      // Floating particles
      for (const p of particlesRef.current) {
        p.x += p.speedX + Math.sin(t * 0.01 + p.phase) * 0.1;
        p.y += p.speedY;

        // Wrap around
        if (p.y < -5) { p.y = ch + 5; p.x = Math.random() * cw; }
        if (p.x < -5) p.x = cw + 5;
        if (p.x > cw + 5) p.x = -5;

        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = '#a0c8e8';
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
