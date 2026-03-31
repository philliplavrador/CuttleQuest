import { DrawArgs } from './types';
import { drawBubbles, drawSprite } from './drawShared';

// Majestic adult — passing cloud patterns, full fins, suckers, iridescent shimmer
export function drawAdult(args: DrawArgs) {
  const { ctx, t, sprite, spriteColor, tintColor } = args;

  const bodyX = 75;
  const bodyY = 46;
  const bodyRx = 38;
  const bodyRy = 48;
  const bobY = Math.sin(t * 0.7) * 3.5;

  // Try sprite-based rendering
  const hasSprite = drawSprite(
    ctx, sprite, spriteColor, tintColor,
    bodyX - 65, bodyY - 48 + bobY, 130, 96,
  );

  if (!hasSprite) {
    // === PROCEDURAL FALLBACK ===
    const finSize = 1.3;

    // Full-length undulating fins
    const finWave1 = Math.sin(t * 1.6) * 10 * finSize;
    const finWave2 = Math.sin(t * 1.6 + 0.8) * 6 * finSize;
    const finTop = bodyY - bodyRy + 8 + bobY;
    const finBot = bodyY + bodyRy - 10 + bobY;
    const finMid = bodyY + bobY;

    ctx.beginPath();
    ctx.moveTo(bodyX - bodyRx + 2, finTop);
    ctx.bezierCurveTo(
      bodyX - bodyRx - 24 * finSize, finTop + (finMid - finTop) * 0.4 + finWave1,
      bodyX - bodyRx - 20 * finSize, finMid + finWave2,
      bodyX - bodyRx - 18 * finSize, finMid + finWave1 * 0.5,
    );
    ctx.bezierCurveTo(
      bodyX - bodyRx - 22 * finSize, finBot - (finBot - finMid) * 0.3 + finWave2,
      bodyX - bodyRx - 10 * finSize, finBot + finWave1 * 0.3,
      bodyX - bodyRx + 2, finBot,
    );
    ctx.quadraticCurveTo(bodyX - bodyRx - 10 * finSize, finMid, bodyX - bodyRx + 2, finTop);
    ctx.fillStyle = '#a878c8cc';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(bodyX + bodyRx - 2, finTop);
    ctx.bezierCurveTo(
      bodyX + bodyRx + 24 * finSize, finTop + (finMid - finTop) * 0.4 - finWave1,
      bodyX + bodyRx + 20 * finSize, finMid - finWave2,
      bodyX + bodyRx + 18 * finSize, finMid - finWave1 * 0.5,
    );
    ctx.bezierCurveTo(
      bodyX + bodyRx + 22 * finSize, finBot - (finBot - finMid) * 0.3 - finWave2,
      bodyX + bodyRx + 10 * finSize, finBot - finWave1 * 0.3,
      bodyX + bodyRx - 2, finBot,
    );
    ctx.quadraticCurveTo(bodyX + bodyRx + 10 * finSize, finMid, bodyX + bodyRx - 2, finTop);
    ctx.fillStyle = '#a878c8cc';
    ctx.fill();

    // 8 tentacles with suckers
    const tentBase = bodyY + bodyRy - 8 + bobY;
    for (let i = 0; i < 8; i++) {
      const armX = 48 + i * 6.5;
      const armWave = Math.sin(t * 1.0 + i * 0.6) * 5;
      const isFeeder = i === 3 || i === 4;
      const armLen = isFeeder ? 30 : 24 + Math.sin(i * 1.3) * 4;
      const lw = isFeeder ? 2.8 : 3.8 - i * 0.15;

      ctx.beginPath();
      ctx.moveTo(armX, tentBase);
      ctx.quadraticCurveTo(armX + armWave, tentBase + armLen * 0.6, armX + armWave * 1.3, tentBase + armLen);
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#b870a0';
      ctx.lineWidth = lw;
      ctx.stroke();

      const suckerCount = isFeeder ? 4 : 3;
      for (let s = 1; s <= suckerCount; s++) {
        const frac = s / (suckerCount + 1);
        const sx = armX + armWave * frac * 1.1;
        const sy = tentBase + armLen * frac;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.0, 0, Math.PI * 2);
        ctx.fillStyle = '#d8a8c8';
        ctx.fill();
      }
    }

    // Mantle body
    const bodyGrad = ctx.createRadialGradient(bodyX, bodyY - 6 + bobY, 8, bodyX, bodyY + bobY, bodyRx + 12);
    bodyGrad.addColorStop(0, '#e0b8d4');
    bodyGrad.addColorStop(0.6, '#c080b0');
    bodyGrad.addColorStop(1, '#905880');
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY + bobY, bodyRx, bodyRy, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = '#905880';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Mantle edge
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY - bodyRy + 6 + bobY, bodyRx - 4, 5, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = '#80486880';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Passing cloud pattern
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY + bobY, bodyRx - 2, bodyRy - 2, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = 0.18;

    const bandSpeed1 = t * 0.4;
    const bandSpeed2 = t * 0.25;
    const bandSpeed3 = t * 0.35;

    const b1x = bodyX + Math.sin(bandSpeed1) * (bodyRx * 1.5);
    ctx.beginPath();
    for (let y = bodyY - bodyRy + bobY; y < bodyY + bodyRy + bobY; y += 2) {
      const wave = Math.sin((y - bodyY) * 0.08 + t * 0.5) * 6;
      const x = b1x + wave;
      if (y === bodyY - bodyRy + bobY) ctx.moveTo(x - 8, y);
      else ctx.lineTo(x - 8, y);
    }
    for (let y = bodyY + bodyRy + bobY; y > bodyY - bodyRy + bobY; y -= 2) {
      const wave = Math.sin((y - bodyY) * 0.08 + t * 0.5) * 6;
      ctx.lineTo(b1x + wave + 8, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#805070';
    ctx.fill();

    const b2x = bodyX + Math.sin(bandSpeed2 + 2) * (bodyRx * 1.5);
    ctx.beginPath();
    for (let y = bodyY - bodyRy + bobY; y < bodyY + bodyRy + bobY; y += 2) {
      const wave = Math.sin((y - bodyY) * 0.1 + t * 0.4) * 5;
      const x = b2x + wave;
      if (y === bodyY - bodyRy + bobY) ctx.moveTo(x - 6, y);
      else ctx.lineTo(x - 6, y);
    }
    for (let y = bodyY + bodyRy + bobY; y > bodyY - bodyRy + bobY; y -= 2) {
      const wave = Math.sin((y - bodyY) * 0.1 + t * 0.4) * 5;
      ctx.lineTo(b2x + wave + 6, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#704060';
    ctx.fill();

    const b3x = bodyX + Math.sin(bandSpeed3 + 4) * (bodyRx * 1.5);
    ctx.beginPath();
    for (let y = bodyY - bodyRy + bobY; y < bodyY + bodyRy + bobY; y += 2) {
      const wave = Math.sin((y - bodyY) * 0.12 + t * 0.6) * 4;
      const x = b3x + wave;
      if (y === bodyY - bodyRy + bobY) ctx.moveTo(x - 4, y);
      else ctx.lineTo(x - 4, y);
    }
    for (let y = bodyY + bodyRy + bobY; y > bodyY - bodyRy + bobY; y -= 2) {
      const wave = Math.sin((y - bodyY) * 0.12 + t * 0.6) * 4;
      ctx.lineTo(b3x + wave + 4, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#805070';
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();

    // Chromatophore spots
    const adultSpots = [
      { x: -14, y: -22, r: 4, rot: 0.2 },
      { x: 12, y: -16, r: 3.5, rot: -0.2 },
      { x: -8, y: -6, r: 3, rot: 0.1 },
      { x: 16, y: -6, r: 3, rot: 0.3 },
      { x: -18, y: 6, r: 2.8, rot: -0.1 },
      { x: 6, y: 10, r: 3.2, rot: 0.15 },
      { x: -10, y: 18, r: 2.5, rot: -0.2 },
      { x: 14, y: 14, r: 2.8, rot: 0.1 },
      { x: 0, y: -28, r: 3, rot: 0 },
      { x: 8, y: 22, r: 2.5, rot: 0.2 },
    ];

    const flashCycle = t * 0.2;
    const flashIdx = Math.floor(flashCycle) % adultSpots.length;
    const flashFrac = flashCycle - Math.floor(flashCycle);

    adultSpots.forEach((spot, i) => {
      let alpha = 0.3;
      if (i === flashIdx && flashFrac < 0.15) {
        alpha = 0.3 + 0.5 * Math.sin(flashFrac / 0.15 * Math.PI);
      }
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.ellipse(bodyX + spot.x, bodyY + spot.y + bobY, spot.r, spot.r * 0.75, spot.rot, 0, Math.PI * 2);
      ctx.fillStyle = '#d090c0';
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Iridescent highlight sweep
    ctx.globalAlpha = 0.15;
    const hlX = bodyX + Math.sin(t * 0.4) * 16;
    const hlY = bodyY - 8 + bobY + Math.cos(t * 0.3) * 8;
    const hlGrad = ctx.createRadialGradient(hlX, hlY, 1, hlX, hlY, 16);
    hlGrad.addColorStop(0, '#ffffff');
    hlGrad.addColorStop(0.5, '#e8d0f8');
    hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.ellipse(hlX, hlY, 16, 10, t * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = hlGrad;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (!hasSprite) {
    const eyeY = bodyY + 4 + bobY;
    // Mouth
    ctx.beginPath();
    ctx.arc(bodyX, eyeY + 10 * 1.05, 4.5, 0.1 * Math.PI, 0.9 * Math.PI, false);
    ctx.strokeStyle = '#905880';
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Blush
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.ellipse(48, eyeY + 7, 5.5, 3, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#e06888';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(102, eyeY + 7, 5.5, 3, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#e06888';
    ctx.fill();
    ctx.globalAlpha = 1;

    // Large crown
    const crownGrad = ctx.createRadialGradient(bodyX, bodyY - bodyRy + 3 + bobY, 2, bodyX, bodyY - bodyRy + 3 + bobY, 12);
    crownGrad.addColorStop(0, '#e0b8d4');
    crownGrad.addColorStop(1, '#c090b8');
    ctx.beginPath();
    ctx.ellipse(bodyX, bodyY - bodyRy + 3 + bobY, 12, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = crownGrad;
    ctx.fill();
  }

  // Bubbles
  drawBubbles(ctx, t);
}
