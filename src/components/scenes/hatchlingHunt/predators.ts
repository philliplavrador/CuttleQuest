// Predator AI: spawning, movement, chase, collision, retreat on hide

import {
  Predator, PredatorType, PREDATOR_CONFIGS, CoverZone,
  ARENA_W, ARENA_H, COVER_HIDE_RADIUS,
  clamp, dist,
} from './types';

let nextPredatorId = 100;

/** Spawn a predator just outside a random arena edge. */
export function makePredator(type: PredatorType, elapsed: number): Predator {
  const id = nextPredatorId++;
  const cfg = PREDATOR_CONFIGS[type];

  let x: number, y: number, vx: number, vy: number;

  if (type === 'wrasse') {
    const fromLeft = Math.random() > 0.5;
    x = fromLeft ? -cfg.size : ARENA_W + cfg.size;
    y = 60 + Math.random() * (ARENA_H * 0.5);
    vx = fromLeft ? cfg.speed : -cfg.speed;
    vy = (Math.random() - 0.5) * cfg.speed * 0.3;
  } else {
    x = 40 + Math.random() * (ARENA_W - 80);
    y = ARENA_H + cfg.size;
    vx = (Math.random() - 0.5) * cfg.speed * 0.5;
    vy = -cfg.speed;
  }

  return { id, type, x, y, vx, vy, active: true, spawnTime: elapsed, hasHitPlayer: false };
}

/** Check if the player is inside a cover zone. */
export function isPlayerInCover(playerX: number, playerY: number, covers: CoverZone[]): boolean {
  for (const c of covers) {
    const cx = c.x + c.width / 2;
    const cy = c.y + c.height / 2;
    if (dist(playerX, playerY, cx, cy) < COVER_HIDE_RADIUS + Math.max(c.width, c.height) / 2) {
      return true;
    }
  }
  return false;
}

/** Update predator — always chases player. Retreats when player is hidden. */
export function updatePredator(
  pred: Predator,
  playerX: number,
  playerY: number,
  playerHidden: boolean,
  dt: number,
): void {
  if (!pred.active) return;

  const cfg = PREDATOR_CONFIGS[pred.type];

  if (playerHidden) {
    // Player is in cover — predator retreats off-screen
    // Move away from player toward nearest edge
    const toLeft = pred.x < ARENA_W / 2;
    const retreatX = toLeft ? -80 : ARENA_W + 80;
    const dx = retreatX - pred.x;
    const dy = (pred.type === 'crab' ? ARENA_H + 80 : pred.y) - pred.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 0) {
      pred.vx += (dx / mag * cfg.speed * 1.5 - pred.vx) * 0.1;
      pred.vy += (dy / mag * cfg.speed * 1.5 - pred.vy) * 0.1;
    }
  } else {
    // Chase the player
    const dx = playerX - pred.x;
    const dy = playerY - pred.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 0) {
      const nx = dx / mag;
      const ny = dy / mag;
      pred.vx += (nx * cfg.chaseSpeed - pred.vx) * 0.08;
      pred.vy += (ny * cfg.chaseSpeed - pred.vy) * 0.08;
    }
  }

  pred.x += pred.vx * dt * 60;
  pred.y += pred.vy * dt * 60;

  // Only bounce if not retreating
  if (!playerHidden) {
    if (pred.x < 10) { pred.x = 10; pred.vx = Math.abs(pred.vx); }
    if (pred.x > ARENA_W - 10) { pred.x = ARENA_W - 10; pred.vx = -Math.abs(pred.vx); }
    if (pred.y < 10) { pred.y = 10; pred.vy = Math.abs(pred.vy) * 0.5; }
    if (pred.y > ARENA_H - 20) { pred.y = ARENA_H - 20; pred.vy = -Math.abs(pred.vy); }
  }
}

/** Check if a predator collides with the player. */
export function checkPredatorCollision(pred: Predator, playerX: number, playerY: number): boolean {
  if (!pred.active || pred.hasHitPlayer) return false;
  const cfg = PREDATOR_CONFIGS[pred.type];
  return dist(pred.x, pred.y, playerX, playerY) < cfg.hitRadius;
}

/** Check if predator has retreated off-screen. */
export function isPredatorOffscreen(pred: Predator): boolean {
  const margin = 80;
  return pred.x < -margin || pred.x > ARENA_W + margin ||
         pred.y < -margin || pred.y > ARENA_H + margin;
}
