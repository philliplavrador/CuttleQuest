# CLAUDE.md — CuttleQuest

## Project
CuttleQuest is a cuttlefish life cycle simulator built with Next.js 14 (App Router), TypeScript, and Tailwind CSS. Players guide a cuttlefish from egg to adulthood through 12 interactive scenes across 4 life stages (Egg, Hatchling, Juvenile, Adult). Canvas-based animations, glassmorphism UI, custom cursor.

## Architecture

### Directory structure
```
src/
  app/                    — Next.js pages (Home, Play, Codex, Collection, Wardrobe)
  components/
    scenes/               — 12 game scene components (the core gameplay)
      habitat/            — Extracted sub-components for EggHabitat scene
    *.tsx                 — Shared UI (CuttlefishAvatar, BriefingScreen, ResultsScreen, etc.)
  hooks/
    useProfile.tsx        — Player profile context, auth, cloud sync
  lib/
    audio.ts              — Web Audio API SFX + procedural music
    firebase.ts           — Firebase init
    playerProfile.ts      — Profile model, localStorage, Firestore sync
  types/
    game.ts               — Shared types (SceneProps, SceneMetric)
data/                     — Game content (sceneManifest, briefings, codex, cosmetics, factCards, dropTable)
public/                   — Static assets (cursor SVG, map assets)
```

### Scene pattern
Every scene component receives `SceneProps` from `src/types/game.ts`:
```typescript
interface SceneProps {
  onComplete: (stars: number, metrics: { label: string; value: string }[]) => void;
  onFail: (reason: string, explanation: string) => void;
  attemptNumber: number;
}
```

Scene types: `decision` (no timer), `reflex` (timed), `hybrid` (timed + choices), `narrative` (scripted).

### State management
- `useProfile` hook provides player state (progress, cosmetics, codex, auth)
- Scene state is local to each component (useState/useRef)
- Game data lives in `data/` and is imported statically

## Target device
- **iPhone 14 Pro Max (430x932 viewport) is the primary target.** All UI, layout, and interactions must be designed and tested for this mobile resolution first.
- **Safari (iOS) is the primary browser.** All code must work on Safari/WebKit:
  - No `lookbehind` in regex — Safari doesn't support it in older versions
  - Use `-webkit-` prefixes for `backdrop-filter`, `text-stroke`, `mask-image`, etc.
  - Avoid `gap` on flex containers for older Safari — use margins instead, or verify minimum iOS target
  - Use `touch-action: manipulation` to prevent double-tap zoom on interactive elements
  - Prefer `requestAnimationFrame` over CSS animations for complex sequences (better Safari perf)
  - Test Web Audio API calls — Safari requires user gesture before `AudioContext.resume()`
  - Avoid `dvh`/`svh` if targeting iOS < 15.4 — use `-webkit-fill-available` as fallback
  - No `structuredClone` (use `JSON.parse(JSON.stringify())` or spread for deep copies)
  - Canvas `willReadFrequently` hint may behave differently — test `getImageData` perf
- Use mobile-first sizing: touch targets >= 44px, readable font sizes, thumb-friendly button placement
- Avoid horizontal scrolling — everything should fit within the 430px width
- Use `dvh` or `svh` units where appropriate for full-screen layouts to account for mobile browser chrome

## Code style
- Use `'use client'` for interactive components
- Canvas animations: `requestAnimationFrame` + `useRef` for frame/timing state
- 2x DPR canvases for crisp rendering
- Glassmorphism: `backdrop-filter: blur()` with semi-transparent backgrounds
- Font: `font-pixel` (Press Start 2P) for headings, system font for body
- Colors defined in `tailwind.config.ts` and CSS variables in `globals.css`
- No emojis in code comments unless rendering them in UI

## Critical rules

### NEVER touch assets_inbox/
The `assets_inbox/` directory is the user's personal staging area for raw assets they want to use in the game. Claude must **never** add, remove, rename, or modify any files in this directory without the user's explicit permission. You may read/reference files there when asked, but all changes require direct user approval.

### ALWAYS split large rewrites into multiple edits
When rewriting a component (especially canvas-heavy scenes):
1. **Never write an entire file >200 lines in a single Write tool call.** Break it into sequential Edit calls or multiple Writes that build up the file.
2. If you need to rewrite a whole file, do it in stages: types/data first, then helper functions, then the main component.
3. Prefer Edit over Write for existing files — send diffs, not full rewrites.
4. For complex scenes, consider extracting sub-components into a subdirectory (like `habitat/` for EggHabitat).

### Extract when files exceed ~300 lines
When a scene grows beyond ~300 lines, split it:
- `sceneName/types.ts` — Types, data, scoring logic
- `sceneName/SubComponent.tsx` — Extracted UI panels/overlays
- `sceneName/Canvas.tsx` — Canvas rendering logic
- `SceneName.tsx` — Slim main component that composes the above

### Keep responses concise
- Don't restate what the user said
- Don't explain what you're about to do in detail — just do it
- After making changes, summarize in 1-2 sentences max

### Prefer real assets over CSS placeholders
When building or modifying UI/scenes, prefer using real image/sprite assets over CSS-drawn shapes (gradients, border-radius hacks, etc.) whenever it improves the visual quality. If a suitable asset already exists in `public/assets/` or is listed in `ASSETS.md`, use it. If no suitable asset is available, search online for free game art packs (itch.io, opengameart.org, kenney.nl) and suggest downloads to the user — include the URL, license, and where to extract it.

### Game design conventions
- Scenes are not timed unless explicitly stated — no pause button needed for decision scenes
- The play page already has a floating home button (🏠 top-left) — scenes don't need their own back/home buttons
- Never reveal scoring/optimal answers to the player in the UI
- Briefings should be short, friendly, game-like — not textbook walls of text
- Fact cards trigger on specific mechanics/mistakes, not randomly

### Parallel development coordination
Multiple Claude conversations may work on different scenes simultaneously. Before starting work:
1. Read `CLAUDE_STATUS.md` to check what other conversations are working on
2. Add your work to the "Active Work" table in `CLAUDE_STATUS.md`
3. When done, move it to "Recently Completed" and remove from Active Work
4. If you modify a shared file (`sceneManifest.ts`, `sceneComponents.ts`, `play/page.tsx`, `playerProfile.ts`), log it under "Shared File Changes"
5. Never modify files listed as being actively edited by another conversation
6. If you need to modify a shared file another conversation is using, note it in "Shared File Changes" so they can pull/rebase

## Common tasks

### Adding a new scene
1. Create component in `src/components/scenes/` using `SceneProps` from `@/types/game`
2. Add scene entry to `data/sceneManifest.ts` (append to `SCENE_MANIFEST` array)
3. Add dynamic import to `src/components/scenes/sceneComponents.ts` (append one line)
4. Add briefing screens to `data/briefings.ts`
**Note:** `play/page.tsx` does NOT need to be edited — it reads from the manifest and registry automatically.

### Modifying game data
All game content is in `data/`:
- `briefings.ts` — Pre-scene story screens (2-3 per scene)
- `sceneManifest.ts` — Scene definitions, star criteria, fail conditions, labels, codex mappings
- `codex.ts` — Biology encyclopedia entries
- `cosmetics.ts` — 120 cosmetic items (colors, patterns, fins, mantles)
- `factCards.ts` — 31 biology fact cards (triggered by gameplay events)
- `dropTable.ts` — Star-to-rarity cosmetic drop probabilities

### Running the project
```bash
npm run dev      # Dev server
npx tsc --noEmit # Type check (no build needed)
npm run build    # Production build
```
