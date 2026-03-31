import { DrawArgs } from './types';
import { drawBubbles, drawSprite } from './drawShared';

// Tiny translucent baby — huge eyes, stubby nubs, no fins, yolk sac remnant
export function drawHatchling(args: DrawArgs) {
  const { ctx, t, sprite, spriteColor, tintColor } = args;

  const bodyX = 75;
  const bodyY = 58;
  const bodyRx = 24;
  const bodyRy = 26;
  const bobY = Math.sin(t * 1.5) * 2;

  // Subtle breathing pulse
  const breathScale = 1 + Math.sin(t * 2) * 0.015;

  ctx.save();
  ctx.translate(bodyX, bodyY + bobY);
  ctx.scale(breathScale, breathScale);
  ctx.translate(-bodyX, -(bodyY + bobY));

  // Try sprite-based rendering
  const hasSprite = drawSprite(
    ctx, sprite, spriteColor, tintColor,
    bodyX - 52, bodyY - 40 + bobY, 104, 80,
  );

  if (!hasSprite) {
    // === PROCEDURAL FALLBACK ===

    // Stubby arms (behind body)
    const armCount = 5;
    const armBase = bodyY + bodyRy - 4 + bobY;
    for (let i = 0; i < armCount; i++) {
      const armX = 62 + i * 6.5;
      const sway = Math.sin(t * 0.8 + i * 1.2) * 2;
      const armLen = 7 + Math.sin(i * 1.5) * 2;
      ctx.beginPath();
      ctx.moveTo(armX, armBase);
      ctx.quadraticCurveTo(armX + sway, armBase + armLen * 0.6, armX + sway * 0.8, armBase + armLen);
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#d8c8e8';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Outer glow
    const outerGlow = ctx.createRadialGradient(bodyX, bodyY + bobY, 4, bodyX, bodyY + bobY, bodyRx + 12);
    outerGlow.addColorStop(0, 'rgba(232, 216, 240, 0.15)');
    outerGlow.addColorStop(1, 'rgba(232, 216, 240, 0)');
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY + bobY, bodyRx + 12, bodyRy + 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = outerGlow;
    ctx.fill();

    // Main body — translucent
    ctx.globalAlpha = 0.6;
    const bodyGrad = ctx.createRadialGradient(bodyX, bodyY - 4 + bobY, 4, bodyX, bodyY + bobY, bodyRx + 8);
    bodyGrad.addColorStop(0, '#f5eef8');
    bodyGrad.addColorStop(0.6, '#e8d8f0');
    bodyGrad.addColorStop(1, '#c8b0d8');
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY + bobY, bodyRx, bodyRy, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = '#c8b0d8';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Inner organ hint
    ctx.globalAlpha = 0.2;
    const organGlow = ctx.createRadialGradient(bodyX, bodyY + 2 + bobY, 2, bodyX, bodyY + 2 + bobY, 14);
    organGlow.addColorStop(0, '#f8d0c8');
    organGlow.addColorStop(1, 'rgba(248, 208, 200, 0)');
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY + 2 + bobY, 14, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = organGlow;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Highlight shine
    ctx.beginPath();
    ctx.ellipse(bodyX - 8, bodyY - 14 + bobY, 5, 3, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();

    // Yolk sac remnant
    ctx.globalAlpha = 0.35;
    const yolkGrad = ctx.createRadialGradient(bodyX, bodyY + bodyRy - 6 + bobY, 1, bodyX, bodyY + bodyRy - 4 + bobY, 10);
    yolkGrad.addColorStop(0, '#ffe0a0');
    yolkGrad.addColorStop(1, 'rgba(240, 200, 112, 0)');
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY + bodyRy - 4 + bobY, 10, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = yolkGrad;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (!hasSprite) {
    const procEyeY = bodyY + 2 + bobY;
    // Tiny mouth
    ctx.beginPath();
    ctx.arc(bodyX, procEyeY + 12 * 1.35, 3, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.strokeStyle = '#c8b0d8';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Blush
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.ellipse(50, procEyeY + 7, 4.5, 2.5, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffb0c8';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(100, procEyeY + 7, 4.5, 2.5, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffb0c8';
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // Bubbles
  drawBubbles(ctx, t);
}
