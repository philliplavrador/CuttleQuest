export interface PlayerProfile {
  uid: string;
  isGuest: boolean;
  displayName: string;
  photoURL: string | null;

  currentStage: 'egg' | 'hatchling' | 'juvenile' | 'adult';
  currentScene: string;
  completedScenes: string[];

  bestStarRatings: Record<string, number>;
  attemptCounts: Record<string, number>;

  shownFactCards: string[];
  unlockedCodexEntries: string[];
  viewedCodexEntries: string[];

  unlockedCosmetics: string[];
  equippedCosmetics: {
    color: string | null;
    pattern: string | null;
    fin: string | null;
    mantle: string | null;
  };

  totalCorrectDecisions: number;
  totalDecisions: number;

  createdAt: number;
  lastActive: number;
}

function generateGuestId(): string {
  return 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function createDefaultProfile(uid?: string, isGuest = true): PlayerProfile {
  return {
    uid: uid || generateGuestId(),
    isGuest,
    displayName: isGuest ? 'Guest' : '',
    photoURL: null,

    currentStage: 'egg',
    currentScene: 'egg_habitat',
    completedScenes: [],

    bestStarRatings: {},
    attemptCounts: {},

    shownFactCards: [],
    unlockedCodexEntries: [],
    viewedCodexEntries: [],

    unlockedCosmetics: [],
    equippedCosmetics: {
      color: null,
      pattern: null,
      fin: null,
      mantle: null,
    },

    totalCorrectDecisions: 0,
    totalDecisions: 0,

    createdAt: Date.now(),
    lastActive: Date.now(),
  };
}

export function createTestProfile(): PlayerProfile {
  return {
    uid: 'test_user_001',
    isGuest: false,
    displayName: 'Test Player',
    photoURL: null,

    currentStage: 'hatchling',
    currentScene: 'hatchling_hunt',
    completedScenes: ['egg_habitat', 'egg_tend', 'egg_hatch'],

    bestStarRatings: {
      egg_habitat: 4,
      egg_tend: 3,
      egg_hatch: 0,
    },
    attemptCounts: {
      egg_habitat: 2,
      egg_tend: 3,
      egg_hatch: 1,
    },

    shownFactCards: ['fc_substrate', 'fc_oxygenation', 'fc_chromatophores'],
    unlockedCodexEntries: ['codex_egg_anatomy', 'codex_egg_ink'],
    viewedCodexEntries: ['codex_egg_anatomy'],

    unlockedCosmetics: [
      'color_common_01', 'color_common_03', 'pattern_rare_01',
      'fin_common_02', 'mantle_common_01',
    ],
    equippedCosmetics: {
      color: 'color_common_01',
      pattern: 'pattern_rare_01',
      fin: null,
      mantle: null,
    },

    totalCorrectDecisions: 12,
    totalDecisions: 18,

    createdAt: Date.now() - 86400000,
    lastActive: Date.now(),
  };
}

const STORAGE_KEY = 'cuttlequest_profile';

export function saveProfileToLocal(profile: PlayerProfile): void {
  if (typeof window === 'undefined') return;
  profile.lastActive = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function loadProfileFromLocal(): PlayerProfile | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as PlayerProfile;
  } catch {
    return null;
  }
}

export function clearLocalProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Merge guest progress into a signed-in profile.
 * 'keepGuest' = use guest progress, 'keepCloud' = use cloud progress.
 */
export function mergeProfiles(
  guest: PlayerProfile,
  cloud: PlayerProfile,
  choice: 'keepGuest' | 'keepCloud'
): PlayerProfile {
  if (choice === 'keepCloud') {
    return { ...cloud, lastActive: Date.now() };
  }

  // Keep guest progress but with cloud identity
  return {
    ...guest,
    uid: cloud.uid,
    isGuest: false,
    displayName: cloud.displayName || guest.displayName,
    photoURL: cloud.photoURL,
    lastActive: Date.now(),
  };
}

import { SCENE_ORDER, STAGE_SCENES, STAGE_ORDER } from '@data/sceneManifest';

export function getNextScene(currentScene: string): string | null {
  const idx = SCENE_ORDER.indexOf(currentScene);
  if (idx === -1 || idx >= SCENE_ORDER.length - 1) return null;
  return SCENE_ORDER[idx + 1];
}

export function checkStageUp(profile: PlayerProfile): PlayerProfile['currentStage'] | null {
  const currentStageScenes = STAGE_SCENES[profile.currentStage];
  if (!currentStageScenes) return null;

  const allCompleted = currentStageScenes.every(s => profile.completedScenes.includes(s));
  if (!allCompleted) return null;

  const currentIdx = STAGE_ORDER.indexOf(profile.currentStage);
  if (currentIdx >= STAGE_ORDER.length - 1) return null;

  return STAGE_ORDER[currentIdx + 1];
}

export function completeScene(
  profile: PlayerProfile,
  sceneId: string,
  stars: number
): PlayerProfile {
  const updated = { ...profile };

  if (!updated.completedScenes.includes(sceneId)) {
    updated.completedScenes = [...updated.completedScenes, sceneId];
  }

  updated.bestStarRatings = { ...updated.bestStarRatings };
  if (!updated.bestStarRatings[sceneId] || stars > updated.bestStarRatings[sceneId]) {
    updated.bestStarRatings[sceneId] = stars;
  }

  updated.attemptCounts = { ...updated.attemptCounts };
  updated.attemptCounts[sceneId] = (updated.attemptCounts[sceneId] || 0) + 1;

  // Check for stage up
  const nextStage = checkStageUp(updated);
  if (nextStage) {
    updated.currentStage = nextStage;
  }

  // Advance to next scene
  const nextScene = getNextScene(sceneId);
  if (nextScene && !updated.completedScenes.includes(nextScene)) {
    updated.currentScene = nextScene;
  }

  updated.lastActive = Date.now();
  return updated;
}
