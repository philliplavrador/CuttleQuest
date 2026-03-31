import { drawBubbles } from './drawShared';

export function drawEggStage(ctx: CanvasRenderingContext2D, t: number, wobbleAge: number) {
  const bobY = Math.sin(t * 0.8) * 2;

  // Gentle ambient wobble + click-triggered wobble that decays over ~1 second
  let wobble = Math.sin(t * 1.5) * 0.03;
  if (wobbleAge < 1) {
    const decay = Math.exp(-wobbleAge * 4);
    wobble += Math.sin(wobbleAge * 25) * 0.15 * decay;
  }

  ctx.save();
  ctx.translate(75, 65 + bobY);
  ctx.rotate(wobble);

  // Egg glow
  const glow = ctx.createRadialGradient(0, -5, 5, 0, 0, 40);
  glow.addColorStop(0, '#fce4f0');
  glow.addColorStop(0.5, '#f0c0d8');
  glow.addColorStop(1, '#d898b8');

  // Main egg shape
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 36, 0, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.strokeStyle = '#c880a8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Translucent inner glow (embryo hint)
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.ellipse(0, 2, 18, 22, 0, 0, Math.PI * 2);
  const inner = ctx.createRadialGradient(0, 0, 2, 0, 2, 20);
  inner.addColorStop(0, '#f8d8e8');
  inner.addColorStop(1, '#e0a8c8');
  ctx.fillStyle = inner;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Speckle pattern on egg
  ctx.globalAlpha = 0.15;
  const spots = [[10, -15], [-12, -10], [5, 15], [-8, 18], [15, 5], [-15, 0]];
  spots.forEach(([sx, sy]) => {
    ctx.beginPath();
    ctx.arc(sx, sy, 2 + Math.sin(t * 0.3 + sx) * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#b070a0';
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Highlight shine
  ctx.beginPath();
  ctx.ellipse(-8, -18, 6, 4, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fill();

  ctx.restore();

  // Floating bubbles
  drawBubbles(ctx, t);
}
