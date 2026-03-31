// Star-to-rarity probability mappings for cosmetic drops
// Every completed scene run guarantees a drop. Rarity determined by star rating.

import { Rarity } from './cosmetics';

export interface DropProbability {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

// Probabilities indexed by star count (1-5)
export const DROP_TABLE: Record<number, DropProbability> = {
  1: { common: 0.80, rare: 0.17, epic: 0.03, legendary: 0.00 },
  2: { common: 0.55, rare: 0.35, epic: 0.09, legendary: 0.01 },
  3: { common: 0.25, rare: 0.40, epic: 0.28, legendary: 0.07 },
  4: { common: 0.10, rare: 0.25, epic: 0.42, legendary: 0.23 },
  5: { common: 0.05, rare: 0.10, epic: 0.30, legendary: 0.55 },
};

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

/**
 * Roll a cosmetic drop based on star rating.
 * Returns the rarity tier. Handles shrinking pool re-roll:
 * if rolled tier is fully collected, moves UP one tier.
 */
export function rollDrop(
  stars: number,
  ownedByRarity: Record<Rarity, number>,
  totalByRarity: Record<Rarity, number>
): Rarity | null {
  const probs = DROP_TABLE[Math.min(Math.max(stars, 1), 5)];
  const roll = Math.random();

  let rolledRarity: Rarity;
  if (roll < probs.common) {
    rolledRarity = 'common';
  } else if (roll < probs.common + probs.rare) {
    rolledRarity = 'rare';
  } else if (roll < probs.common + probs.rare + probs.epic) {
    rolledRarity = 'epic';
  } else {
    rolledRarity = 'legendary';
  }

  // Shrinking pool re-roll: if tier is full, move UP
  let startIdx = RARITY_ORDER.indexOf(rolledRarity);
  for (let i = startIdx; i < RARITY_ORDER.length; i++) {
    const r = RARITY_ORDER[i];
    if (ownedByRarity[r] < totalByRarity[r]) {
      return r;
    }
  }
  // If all higher tiers full, check lower tiers
  for (let i = startIdx - 1; i >= 0; i--) {
    const r = RARITY_ORDER[i];
    if (ownedByRarity[r] < totalByRarity[r]) {
      return r;
    }
  }

  // All cosmetics collected
  return null;
}

/**
 * Pick a random cosmetic from the given rarity tier that the player doesn't own.
 */
export function pickCosmeticFromTier(
  rarity: Rarity,
  ownedIds: string[],
  allCosmetics: { id: string; rarity: Rarity }[]
): string | null {
  const available = allCosmetics.filter(
    c => c.rarity === rarity && !ownedIds.includes(c.id)
  );
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)].id;
}
