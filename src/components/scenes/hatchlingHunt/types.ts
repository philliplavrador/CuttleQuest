// Types, constants, and utilities for HatchlingHunt scene

// --- Organism types ---

export type OrganismType = 'mysid' | 'copepod' | 'amphipod';

export interface Organism {
  id: number;
  type: OrganismType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  paused: boolean;
  pauseTimer: number;
  moveTimer: number;
  alive: boolean;
}

export const ORGANISM_CONFIGS: Record<OrganismType, {
  color: string;
  width: number;
  height: number;
  speed: number;
  label: string;
}> = {
  mysid: { color: '#f0a0b0', width: 18, height: 8, speed: 1.2, label: 'Mysid Shrimp' },
  copepod: { color: '#90d0f0', width: 8, height: 8, speed: 2.0, label: 'Copepod' },
  amphipod: { color: '#c0a060', width: 14, height: 10, speed: 2.5, label: 'Amphipod' },
};

// --- Predator types ---

export type PredatorType = 'wrasse' | 'crab';

export interface Predator {
  id: number;
  type: PredatorType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  spawnTime: number;
  hasHitPlayer: boolean;
}

export const PREDATOR_CONFIGS: Record<PredatorType, {
  speed: number;
  chaseSpeed: number;
  hitRadius: number;
  size: number;
}> = {
  wrasse: {
    speed: 1.8,
    chaseSpeed: 2.8,
    hitRadius: 28,
    size: 36,
  },
  crab: {
    speed: 0.8,
    chaseSpeed: 1.4,
    hitRadius: 24,
    size: 32,
  },
};

// --- Cover zones (kelp forests, rock crevices) ---

export type CoverType = 'kelp' | 'rock';

export interface CoverZone {
  id: number;
  type: CoverType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const COVER_HIDE_RADIUS = 30; // how close player must be to center to count as "hidden"

// Fixed cover positions spread around the arena edges/corners
// Note: uses literal 360 (ARENA_W) to avoid forward-reference issues
export const COVER_ZONES: CoverZone[] = [
  { id: 0, type: 'kelp', x: 30, y: 120, width: 50, height: 80 },
  { id: 1, type: 'rock', x: 310, y: 400, width: 55, height: 45 },
  { id: 2, type: 'kelp', x: 320, y: 80, width: 50, height: 90 },
  { id: 3, type: 'rock', x: 40, y: 420, width: 50, height: 40 },
];

export interface PredatorScheduleEntry {
  time: number;
  type: PredatorType;
}

export const PREDATOR_SCHEDULE: PredatorScheduleEntry[] = [
  { time: 8, type: 'wrasse' },
  { time: 18, type: 'crab' },
  { time: 28, type: 'wrasse' },
];

// How much earlier predators spawn on retry attempts (attemptNumber >= 3)
export const RETRY_TIME_OFFSET = 3;

export const STUN_DURATION = 1.5;
export const PREDATOR_DAMAGE = 2;

// --- Arena constants ---

export const ARENA_W = 360;
export const ARENA_H = 560;
export const STRIKE_RANGE = 60;
export const JOYSTICK_RADIUS = 80;
export const PLAYER_SPEED = 3;
export const CATCHES_NEEDED = 3;
export const MAX_ENERGY = 8;

// --- Utility functions ---

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

// --- Organism spawning ---

function makeOrganism(id: number, type: OrganismType): Organism {
  const cfg = ORGANISM_CONFIGS[type];
  return {
    id,
    type,
    x: 40 + Math.random() * (ARENA_W - 80),
    y: 60 + Math.random() * (ARENA_H - 200),
    vx: (Math.random() - 0.5) * cfg.speed * 2,
    vy: (Math.random() - 0.5) * cfg.speed * 2,
    paused: false,
    pauseTimer: 2 + Math.random() * 3,
    moveTimer: 1 + Math.random() * 2,
    alive: true,
  };
}

export function spawnOrganisms(): Organism[] {
  let id = 0;
  const organisms: Organism[] = [];
  for (let i = 0; i < 3; i++) organisms.push(makeOrganism(id++, 'mysid'));
  for (let i = 0; i < 3; i++) organisms.push(makeOrganism(id++, 'copepod'));
  for (let i = 0; i < 2; i++) organisms.push(makeOrganism(id++, 'amphipod'));
  return organisms;
}
