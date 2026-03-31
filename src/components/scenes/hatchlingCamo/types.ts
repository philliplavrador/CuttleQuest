/* ------------------------------------------------------------------ */
/*  HatchlingCamouflage — types, data & scoring                        */
/* ------------------------------------------------------------------ */

export interface Props {
  onComplete: (stars: number, metrics: { label: string; value: string }[]) => void;
  onFail: (reason: string, explanation: string) => void;
  attemptNumber: number;
}

/* --- Chromatophore color system --- */
export interface ChromaColor {
  red: number;    // 0-100
  yellow: number; // 0-100
  brown: number;  // 0-100
}

// Pattern: 0 = uniform, 50 = mottled, 100 = disruptive (continuous)
// Texture: 0 = smooth, 100 = papillate (continuous)
export interface CamoState {
  color: ChromaColor;
  pattern: number;  // 0-100
  texture: number;  // 0-100
}

/* --- Environment definitions --- */
export interface ReefEnv {
  name: string;
  idealColor: ChromaColor;
  idealPattern: number;  // 0-100
  idealTexture: number;  // 0-100
  bg: string;
  elements: { x: number; y: number; w: number; h: number; c: string; br: string; r: number }[];
  patternHint: string;
  textureHint: string;
}

export function chromaToHex(c: ChromaColor): string {
  const r = Math.round(40 + c.red * 1.8 + c.yellow * 0.5 - c.brown * 0.5);
  const g = Math.round(30 + c.yellow * 1.4 + c.red * 0.2 - c.brown * 0.6);
  const b = Math.round(20 - c.red * 0.1 - c.yellow * 0.1 + c.brown * 0.05);
  return `rgb(${clamp(r, 0, 255)}, ${clamp(g, 0, 255)}, ${clamp(b, 0, 255)})`;
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// Get a descriptive label for the current pattern value
export function patternLabel(v: number): string {
  if (v < 25) return 'Uniform';
  if (v < 75) return 'Mottled';
  return 'Disruptive';
}

export function textureLabel(v: number): string {
  if (v < 50) return 'Smooth';
  return 'Papillate';
}

/* --- Environments --- */
export const ENVS: ReefEnv[] = [
  {
    name: 'Sandy Shallows',
    idealColor: { red: 50, yellow: 70, brown: 20 },
    idealPattern: 10, idealTexture: 10,
    bg: 'linear-gradient(135deg, #C4A860 0%, #D4B870 30%, #B09848 60%, #C4A858 100%)',
    elements: [
      { x: 5, y: 60, w: 90, h: 35, c: '#B09848', br: '40% 40% 0 0', r: 0 },
      { x: 20, y: 70, w: 30, h: 20, c: '#C4A858', br: '50%', r: 5 },
      { x: 60, y: 75, w: 25, h: 15, c: '#A08838', br: '50%', r: -3 },
    ],
    patternHint: 'Flat, even sand — keep pattern low (uniform)',
    textureHint: 'Smooth sand — keep texture low (flat skin)',
  },
  {
    name: 'Rocky Reef',
    idealColor: { red: 30, yellow: 15, brown: 80 },
    idealPattern: 90, idealTexture: 85,
    bg: 'linear-gradient(160deg, #3A2818 0%, #4A3520 40%, #2A1808 70%, #3A2510 100%)',
    elements: [
      { x: 10, y: 30, w: 35, h: 50, c: '#2A1808', br: '20% 40% 10% 30%', r: -8 },
      { x: 50, y: 20, w: 40, h: 60, c: '#4A3510', br: '30% 50% 20% 40%', r: 12 },
      { x: 30, y: 55, w: 45, h: 35, c: '#3A2010', br: '40% 20% 30% 50%', r: -3 },
      { x: 75, y: 40, w: 25, h: 40, c: '#1A1008', br: '50% 30%', r: 5 },
    ],
    patternHint: 'Complex edges — crank pattern high (disruptive)',
    textureHint: 'Rough rocks — crank texture high (bumpy papillae)',
  },
  {
    name: 'Coral Garden',
    idealColor: { red: 80, yellow: 40, brown: 15 },
    idealPattern: 55, idealTexture: 75,
    bg: 'linear-gradient(145deg, #B06028 0%, #C87838 35%, #A05020 65%, #B86830 100%)',
    elements: [
      { x: 8, y: 25, w: 30, h: 50, c: '#C87838', br: '50% 50% 30% 30%', r: 5 },
      { x: 40, y: 35, w: 25, h: 45, c: '#A06020', br: '40% 40% 20% 20%', r: -7 },
      { x: 70, y: 20, w: 28, h: 55, c: '#B87030', br: '45% 45% 25% 25%', r: 12 },
      { x: 25, y: 65, w: 50, h: 25, c: '#A85828', br: '30% 30% 50% 50%', r: -2 },
    ],
    patternHint: 'Speckled coral — medium pattern (mottled)',
    textureHint: 'Bumpy coral polyps — texture fairly high',
  },
  {
    name: 'Red Algae Bed',
    idealColor: { red: 90, yellow: 20, brown: 40 },
    idealPattern: 45, idealTexture: 20,
    bg: 'linear-gradient(130deg, #8A2818 0%, #A03828 40%, #702018 70%, #903028 100%)',
    elements: [
      { x: 15, y: 20, w: 70, h: 30, c: '#802020', br: '20px', r: 3 },
      { x: 5, y: 50, w: 90, h: 25, c: '#6A1818', br: '15px', r: -2 },
      { x: 30, y: 70, w: 40, h: 20, c: '#903028', br: '10px', r: 1 },
    ],
    patternHint: 'Algae with light/dark patches — mid pattern (mottled)',
    textureHint: 'Smooth algae leaves — keep texture low',
  },
  {
    name: 'Kelp Forest',
    idealColor: { red: 30, yellow: 80, brown: 30 },
    idealPattern: 85, idealTexture: 15,
    bg: 'linear-gradient(150deg, #6A7A20 0%, #8A9A30 35%, #5A6A18 65%, #7A8A28 100%)',
    elements: [
      { x: 5, y: 5, w: 15, h: 90, c: '#5A6A18', br: '30%', r: 3 },
      { x: 28, y: 0, w: 12, h: 95, c: '#7A8A20', br: '25%', r: -2 },
      { x: 52, y: 8, w: 15, h: 88, c: '#6A7A18', br: '30%', r: 5 },
      { x: 78, y: 3, w: 12, h: 92, c: '#8A9A28', br: '25%', r: -4 },
    ],
    patternHint: 'Vertical kelp blades — high pattern (disruptive)',
    textureHint: 'Smooth kelp surfaces — keep texture low',
  },
  {
    name: 'Deep Seabed',
    idealColor: { red: 10, yellow: 5, brown: 90 },
    idealPattern: 5, idealTexture: 10,
    bg: 'linear-gradient(170deg, #0A0A0A 0%, #1A1A18 40%, #101010 70%, #181818 100%)',
    elements: [
      { x: 15, y: 40, w: 70, h: 30, c: '#0A0A0A', br: '50%', r: 2 },
      { x: 50, y: 60, w: 40, h: 25, c: '#151515', br: '40%', r: -3 },
      { x: 10, y: 55, w: 35, h: 20, c: '#0D0D0D', br: '30% 50%', r: 1 },
    ],
    patternHint: 'Featureless dark floor — keep pattern very low (uniform)',
    textureHint: 'Smooth sediment — keep texture low',
  },
];

/* --- Match scoring --- */
export function colorDistance(a: ChromaColor, b: ChromaColor): number {
  const dr = a.red - b.red;
  const dy = a.yellow - b.yellow;
  const db = a.brown - b.brown;
  return Math.sqrt(dr * dr + dy * dy + db * db);
}

export function colorScore(player: ChromaColor, env: ReefEnv): number {
  const maxDist = Math.sqrt(100 * 100 * 3);
  const dist = colorDistance(player, env.idealColor);
  return Math.max(0, 1 - dist / maxDist);
}

export function patternScore(player: number, env: ReefEnv): number {
  const dist = Math.abs(player - env.idealPattern);
  return Math.max(0, 1 - dist / 100);
}

export function textureScore(player: number, env: ReefEnv): number {
  const dist = Math.abs(player - env.idealTexture);
  return Math.max(0, 1 - dist / 100);
}

export function matchScore(state: CamoState, env: ReefEnv): number {
  const c = colorScore(state.color, env);
  const p = patternScore(state.pattern, env);
  const t = textureScore(state.texture, env);
  // All three matter equally-ish: 35% color, 35% pattern, 30% texture
  return c * 0.35 + p * 0.35 + t * 0.30;
}

/* --- Game constants --- */
export const GAME_DURATION = 45;
export const SHIFT_INTERVAL = 7000;
export const SCAN_INTERVAL = 5000;
export const SCAN_DURATION = 2500;
export const DETECTION_THRESHOLD = 0.45;
export const MAX_DETECTIONS = 3;
