import { DrawArgs } from './types';
import { drawBubbles, drawSprite } from './drawShared';

// Developing chromatophores, growing fins, color-shift shimmer
export function drawJuvenile(args: DrawArgs) {
  const { ctx, t, sprite, spriteColor, tintColor } = args;

  const bodyX = 75;
  const bodyY = 48;
  const bodyRx = 32;
  const bodyRy = 38;
  const bobY = Math.sin(t) * 3;

  // Try sprite-based rendering
  const hasSprite = drawSprite(
    ctx, sprite, spriteColor, tintColor,
    bodyX - 58, bodyY - 44 + bobY, 116, 88,
  );

  if (!hasSprite) {
    // === PROCEDURAL FALLBACK ===
    const finSize = 0.6;

    // Small developing fins
    const finWave = Math.sin(t * 1.4) * 5 * finSize;
    const finTop = bodyY - 8 + bobY;
    const finBot = bodyY + 14 + bobY;
    const finMid = bodyY + 3 + bobY;

    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(bodyX - bodyRx + 4, finTop);
    ctx.bezierCurveTo(
      bodyX - bodyRx - 14 * finSize, finMid + finWave,
      bodyX - bodyRx - 14 * finSize, finBot + finWave,
      bodyX - bodyRx + 4, finBot,
    );
    ctx.quadraticCurveTo(bodyX - bodyRx - 5 * finSize, finMid, bodyX - bodyRx + 4, finTop);
    ctx.fillStyle = '#c898e0cc';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(bodyX + bodyRx - 4, finTop);
    ctx.bezierCurveTo(
      bodyX + bodyRx + 14 * finSize, finMid - finWave,
      bodyX + bodyRx + 14 * finSize, finBot - finWave,
      bodyX + bodyRx - 4, finBot,
    );
    ctx.quadraticCurveTo(bodyX + bodyRx + 5 * finSize, finMid, bodyX + bodyRx - 4, finTop);
    ctx.fillStyle = '#c898e0cc';
    ctx.fill();
    ctx.globalAlpha = 1;

    // Tentacles
    const tentBase = bodyY + bodyRy - 6 + bobY;
    for (let i = 0; i < 6; i++) {
      const armX = 56 + i * 7;
      const armWave = Math.sin(t * 1.1 + i * 0.8) * 4;
      const armLen = 16 + Math.sin(i * 1.3) * 3;
      ctx.beginPath();
      ctx.moveTo(armX, tentBase);
      ctx.quadraticCurveTo(armX + armWave, tentBase + armLen * 0.6, armX + armWave * 1.2, tentBase + armLen);
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#d098c0';
      ctx.lineWidth = 3.2 - i * 0.15;
      ctx.stroke();
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.arc(armX + armWave * 0.7, tentBase + armLen * 0.5, 1.1, 0, Math.PI * 2);
        ctx.fillStyle = '#b080a8';
        ctx.fill();
      }
    }

    // Mantle body
    const bodyGrad = ctx.createRadialGradient(bodyX, bodyY - 4 + bobY, 6, bodyX, bodyY + bobY, bodyRx + 10);
    bodyGrad.addColorStop(0, '#f0d0e8');
    bodyGrad.addColorStop(0.6, '#d8a8d0');
    bodyGrad.addColorStop(1, '#b080a8');
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY + bobY, bodyRx, bodyRy, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = '#b080a8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Color-shift shimmer overlay
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY + bobY, bodyRx - 1, bodyRy - 1, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = 0.1;
    const shimmerAngle = t * 0.3;
    const sx = bodyX + Math.cos(shimmerAngle) * 12;
    const sy = bodyY + bobY + Math.sin(shimmerAngle) * 10;
    const shimmer = ctx.createRadialGradient(sx, sy, 2, sx, sy, 22);
    shimmer.addColorStop(0, '#e8c0f8');
    shimmer.addColorStop(0.5, '#c0d8f0');
    shimmer.addColorStop(1, 'rgba(200, 184, 240, 0)');
    ctx.beginPath();
    ctx.ellipse(sx, sy, 22, 18, shimmerAngle * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = shimmer;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // Chromatophore dots
    const chromaDots = [
      { x: -12, y: -18, color: '#c06888', phase: 0 },
      { x: 14, y: -12, color: '#8868a8', phase: 1.2 },
      { x: -8, y: -4, color: '#a08860', phase: 2.4 },
      { x: 10, y: 2, color: '#c06888', phase: 0.8 },
      { x: -16, y: 6, color: '#8868a8', phase: 1.8 },
      { x: 6, y: 14, color: '#a08860', phase: 3.0 },
      { x: -4, y: -24, color: '#c06888', phase: 2.0 },
      { x: 16, y: -22, color: '#8868a8', phase: 0.5 },
    ];
    chromaDots.forEach((dot) => {
      const alpha = 0.15 + 0.3 * Math.sin(t * 0.8 + dot.phase);
      ctx.globalAlpha = Math.max(0.08, alpha);
      ctx.beginPath();
      ctx.arc(bodyX + dot.x, bodyY + dot.y + bobY, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = dot.color;
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Forming spots
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.ellipse(62, bodyY - 14 + bobY, 3.5, 3, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#d090c0';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(84, bodyY - 8 + bobY, 3, 2.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(70, bodyY + 2 + bobY, 2.5, 2, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (!hasSprite) {
    const eyeY = bodyY + 4 + bobY;
    // Mouth
    ctx.beginPath();
    ctx.arc(bodyX, eyeY + 10, 4, 0.1 * Math.PI, 0.9 * Math.PI, false);
    ctx.strokeStyle = '#b080a8';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Blush
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(50, eyeY + 6, 5, 3, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff88a8';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(100, eyeY + 6, 5, 3, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff88a8';
    ctx.fill();
    ctx.globalAlpha = 1;

    // Small crown
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY - bodyRy + 2 + bobY, 7, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f0d0e8';
    ctx.fill();
  }

  // Bubbles
  drawBubbles(ctx, t);
}
