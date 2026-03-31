# CuttleQuest

A cuttlefish life cycle simulator and educational web app. Players live through the complete life cycle of a cuttlefish — from choosing a habitat for their egg, to hatching, hunting, camouflaging, attracting a mate, and watching their own eggs hatch. Biology is taught through pre-level briefings and post-gameplay fact cards. The game is genuinely challenging and biology-dense, targeting college-age and adult players.

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app runs at `http://localhost:3000`.

## Credentials Setup

The app works fully without any credentials (TEST MODE). To enable Google sign-in and cloud sync:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google** as a sign-in provider under Authentication > Sign-in method
3. Create a Firestore database
4. Copy your Firebase config values
5. Create `.env.local` in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

See `config/credentials.template.js` for reference.

### Enabling Google Auth in Firebase Console

- Go to Firebase Console > Authentication > Sign-in method
- Enable Google provider
- Add your domain to Authorized domains
- Copy the Web client ID if needed

## Deploy

```bash
# Deploy to Vercel (recommended for Next.js)
npx vercel

# Or build and deploy anywhere that supports Node.js
npm run build && npm start
```

## Folder Structure

```
CuttleQuest/
├── config/                    # Credentials template
├── data/                      # Game content (editable)
│   ├── briefings.ts           # Pre-level briefing content
│   ├── codex.ts               # 11 interactive codex entries
│   ├── cosmetics.ts           # 120 cosmetic items
│   ├── dropTable.ts           # Star-to-rarity drop probabilities
│   ├── factCards.ts           # Biology fact cards
│   └── scenes.ts             # Scene definitions and star criteria
├── src/
│   ├── app/                   # Next.js pages
│   │   ├── page.tsx           # Home screen
│   │   ├── play/page.tsx      # Game play & scene select
│   │   ├── collection/page.tsx # Cosmetics collection
│   │   ├── wardrobe/page.tsx  # Equip cosmetics & share card
│   │   └── codex/page.tsx     # Biology codex
│   ├── components/
│   │   ├── scenes/            # 12 gameplay scene components
│   │   ├── BriefingScreen.tsx  # Pre-level briefing system
│   │   ├── BottomNav.tsx       # 4-tab navigation
│   │   ├── CuttlefishAvatar.tsx # Animated cuttlefish render
│   │   ├── FactCard.tsx        # Slide-up biology cards
│   │   ├── FailureScreen.tsx   # Fail state with biology feedback
│   │   ├── MuteButton.tsx      # Audio toggle
│   │   ├── ResultsScreen.tsx   # Post-scene results & drop reveal
│   │   ├── StageUpAnimation.tsx # Stage transition animations
│   │   └── StarRating.tsx      # Star display component
│   ├── hooks/
│   │   └── useProfile.tsx     # Player profile context & state
│   └── lib/
│       ├── audio.ts           # Web Audio API SFX & music
│       ├── firebase.ts        # Firebase initialization
│       └── playerProfile.ts   # Profile data model & persistence
└── public/                    # Static assets
```

## Editing Game Content

All game content is in the `/data/` directory. You can edit biology text, scene definitions, cosmetic items, and more without touching component code:

- **Briefings** (`data/briefings.ts`): Pre-level biology dossiers
- **Fact Cards** (`data/factCards.ts`): Post-mechanic biology cards
- **Scenes** (`data/scenes.ts`): Scene definitions, star criteria, fail conditions
- **Cosmetics** (`data/cosmetics.ts`): All 120 cosmetic items with visual configs
- **Codex** (`data/codex.ts`): Interactive biology encyclopedia entries
- **Drop Table** (`data/dropTable.ts`): Star-to-rarity probability mappings

## Game Structure

4 stages, 12 scenes, 11 drop-eligible:

| Stage | Scenes |
|-------|--------|
| Egg | Pick a Habitat, Tend the Egg, Hatch (narrative) |
| Hatchling | First Hunt, Camouflage, Ink and Hide |
| Juvenile | Advanced Hunting, Territory & Ecosystem, Attract a Mate |
| Adult | Rival Mating Tactics, Build the Egg Nest, Tend the Eggs (Final Exam) |

## Tech Stack

- **Next.js 14** (App Router) — React framework
- **TypeScript** — Type safety
- **Tailwind CSS** — Styling
- **Firebase** — Auth (Google OAuth) + Firestore (cloud sync)
- **Web Audio API** — Programmatic chiptune SFX and music
- **html2canvas** — Share card generation
