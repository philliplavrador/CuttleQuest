import type { SceneProps } from '@/types/game';
export type { SceneProps };

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type PredatorType = 'wrasse' | 'crab' | 'starfish';

export interface Predator {
  id: number;
  type: PredatorType;
  progress: number;     // 0-1; reaches eggs at 1
  x: number;            // horizontal position 0-1
  revealed: boolean;    // starfish: has player found it?
  active: boolean;
  spawnDay: number;
  taps?: number;        // crab: tracks multi-tap progress (needs 3)
}

export interface InfectedEgg {
  id: number;
  index: number;        // grid index
  age: number;          // ticks alive; spreads & kills over time
}

export type EggZone = 'sunny' | 'shaded';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

export const TOTAL_EGGS = 120;        // reduced from 200 for bigger, cuter eggs
export const TOTAL_DAYS = 30;
export const TICK_MS = 120;
export const TICKS_PER_DAY = 17;

export const OXY_SWEET_LOW = 40;
export const OXY_SWEET_HIGH = 70;
export const OXY_SUFFOCATE = 30;
export const OXY_DETACH = 80;

export const GRID_COLS = 10;
export const GRID_ROWS = 12;          // 120 eggs in 10x12

export const PREDATOR_SCHEDULE: { day: number; type: PredatorType }[] = [
  { day: 4, type: 'wrasse' },
  { day: 8, type: 'crab' },
  { day: 12, type: 'starfish' },
  { day: 15, type: 'wrasse' },
  { day: 19, type: 'crab' },
  { day: 22, type: 'starfish' },
  { day: 25, type: 'wrasse' },
  { day: 28, type: 'crab' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
