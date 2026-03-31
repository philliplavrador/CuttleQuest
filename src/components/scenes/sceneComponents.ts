// Scene Component Registry — Maps scene IDs to dynamically imported components.
// When adding a new scene, append ONE line to SCENE_COMPONENTS below.
// Do NOT edit play/page.tsx — it reads from this registry automatically.
// IMPORTANT: next/dynamic requires object literal options — do NOT extract { ssr: false } into a variable.

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCENE_COMPONENTS: Record<string, ComponentType<any>> = {
  egg_habitat:           dynamic(() => import('./EggHabitat'), { ssr: false }),
  egg_tend:              dynamic(() => import('./EggTend'), { ssr: false }),
  egg_hatch:             dynamic(() => import('./EggHatch'), { ssr: false }),
  hatchling_hunt:        dynamic(() => import('./HatchlingHunt'), { ssr: false }),
  hatchling_camouflage:  dynamic(() => import('./HatchlingCamouflage'), { ssr: false }),
  hatchling_ink:         dynamic(() => import('./HatchlingInk'), { ssr: false }),
  juvenile_hunting:      dynamic(() => import('./JuvenileHunting'), { ssr: false }),
  juvenile_territory:    dynamic(() => import('./JuvenileTerritory'), { ssr: false }),
  juvenile_mate:         dynamic(() => import('./JuvenileMate'), { ssr: false }),
  adult_rival:           dynamic(() => import('./AdultRival'), { ssr: false }),
  adult_nest:            dynamic(() => import('./AdultNest'), { ssr: false }),
  adult_tend:            dynamic(() => import('./AdultTend'), { ssr: false }),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSceneComponent(sceneId: string): ComponentType<any> | undefined {
  return SCENE_COMPONENTS[sceneId];
}
