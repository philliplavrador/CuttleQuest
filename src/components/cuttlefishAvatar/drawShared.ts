/**
 * Draws a sprite on canvas with optional color tinting.
 * If tintColor is set and a grayscale base sprite is provided,
 * it draws the base and applies the tint via 'color' composite mode.
 * Otherwise falls back to the color eyeless sprite, then procedural.
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLImageElement | null | undefined,
  spriteColor: HTMLImageElement | null | undefined,
  tintColor: string | null | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  // If we have a grayscale base + tint color, draw tinted version
  if (sprite && tintColor) {
    ctx.save();
    // Draw grayscale sprite
    ctx.drawImage(sprite, x, y, w, h);
    // Apply color tint using 'color' composite (preserves luminosity)
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = tintColor;
    ctx.fillRect(x, y, w, h);
    // Clip to sprite shape (remove tint from transparent areas)
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(sprite, x, y, w, h);
    ctx.restore();
    return true;
  }

  // Fallback: color sprite (no tint)
  if (spriteColor) {
    ctx.drawImage(spriteColor, x, y, w, h);
    return true;
  }

  // Fallback: grayscale base without tint
  if (sprite) {
    ctx.drawImage(sprite, x, y, w, h);
    return true;
  }

  // No sprite available — caller should draw procedurally
  return false;
}

export function drawBubbles(ctx: CanvasRenderingContext2D, t: number) {
  const a = (Math.sin(t * 0.5) + 1) * 0.15 + 0.1;
  ctx.globalAlpha = a;
  ctx.fillStyle = '#c8e0ff';
  ctx.beginPath();
  ctx.arc(30, 25 + Math.sin(t * 0.7) * 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(120, 15 + Math.sin(t * 0.5 + 1) * 6, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(25, 70 + Math.sin(t * 0.6 + 2) * 5, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
