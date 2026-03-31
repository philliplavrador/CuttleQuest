// Preloads and caches avatar sprite images for canvas rendering

const spriteCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

// Cache for assigned assets from asset library
let assignedAssetsCache: Record<string, string> | null = null;
let assignedAssetsFetchPromise: Promise<Record<string, string>> | null = null;

/** Fetch assigned avatar-8d assets from the asset library API. Cached after first call. */
export async function fetchAssignedAvatars(): Promise<Record<string, string>> {
  if (assignedAssetsCache) return assignedAssetsCache;
  if (assignedAssetsFetchPromise) return assignedAssetsFetchPromise;

  assignedAssetsFetchPromise = fetch('/api/assets')
    .then((res) => res.json())
    .then((data: { slots: Array<{ category: string; stage: string; assignedAssetId: string | null }>; assets: Array<{ id: string; thumbnail: string }> }) => {
      const result: Record<string, string> = {};
      for (const slot of data.slots) {
        if (slot.category === 'avatar-8d' && slot.assignedAssetId) {
          const asset = data.assets.find((a) => a.id === slot.assignedAssetId);
          if (asset) {
            result[slot.stage] = asset.thumbnail;
          }
        }
      }
      assignedAssetsCache = result;
      assignedAssetsFetchPromise = null;
      return result;
    })
    .catch(() => {
      assignedAssetsFetchPromise = null;
      return {};
    });

  return assignedAssetsFetchPromise;
}

/** Invalidate the assigned assets cache (call after assignments change). */
export function invalidateAssignedCache() {
  assignedAssetsCache = null;
  assignedAssetsFetchPromise = null;
}

const SPRITE_PATHS: Record<string, Record<string, string>> = {
  hatchling: {
    base: '/assets/avatars/hatchling-base.png',
    eyeless: '/assets/avatars/hatchling-eyeless.png',
    original: '/assets/avatars/hatchling.png',
  },
  juvenile: {
    base: '/assets/avatars/juvenile-base.png',
    eyeless: '/assets/avatars/juvenile-eyeless.png',
    original: '/assets/avatars/juvenile.png',
  },
  adult: {
    base: '/assets/avatars/adult-base.png',
    eyeless: '/assets/avatars/adult-eyeless.png',
    original: '/assets/avatars/adult.png',
  },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  if (spriteCache.has(src)) {
    return Promise.resolve(spriteCache.get(src)!);
  }
  if (loadingPromises.has(src)) {
    return loadingPromises.get(src)!;
  }
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      spriteCache.set(src, img);
      loadingPromises.delete(src);
      resolve(img);
    };
    img.onerror = () => {
      loadingPromises.delete(src);
      reject(new Error(`Failed to load sprite: ${src}`));
    };
    img.src = src;
  });
  loadingPromises.set(src, promise);
  return promise;
}

export interface StageSprites {
  base: HTMLImageElement | null;   // grayscale for tinting
  eyeless: HTMLImageElement | null; // color version without eyes
}

export function getSpritePaths(stage: string): { base: string; eyeless: string } | null {
  const paths = SPRITE_PATHS[stage];
  if (!paths) return null;
  return { base: paths.base, eyeless: paths.eyeless };
}

export async function loadStageSprites(stage: string): Promise<StageSprites> {
  const paths = SPRITE_PATHS[stage];
  if (!paths) return { base: null, eyeless: null };

  const [base, eyeless] = await Promise.all([
    loadImage(paths.base).catch(() => null),
    loadImage(paths.eyeless).catch(() => null),
  ]);

  return { base, eyeless };
}

export function getSprite(src: string): HTMLImageElement | null {
  return spriteCache.get(src) ?? null;
}
