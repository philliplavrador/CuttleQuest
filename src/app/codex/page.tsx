'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProfileProvider, useProfile } from '@/hooks/useProfile';
import MuteButton from '@/components/MuteButton';
import { sfxTap } from '@/lib/audio';

const CODEX_ENTRIES = [
  { id: 'codex_egg_anatomy', title: 'Egg Anatomy', scene: 'Pick a Habitat', interactiveType: 'Cross-section explorer' },
  { id: 'codex_egg_ink', title: 'Egg Color & Ink Camouflage', scene: 'Tend the Egg', interactiveType: 'Color-matching puzzle' },
  { id: 'codex_vision', title: 'W-Shaped Pupils & Vision', scene: 'First Hunt', interactiveType: 'Light simulation' },
  { id: 'codex_chromatophores', title: 'Chromatophore Deep Dive', scene: 'Camouflage', interactiveType: 'Chromatophore simulator' },
  { id: 'codex_sepia', title: 'Sepia Ink History', scene: 'Ink and Hide', interactiveType: 'Interactive timeline' },
  { id: 'codex_passing_cloud', title: 'Passing Cloud Display', scene: 'Advanced Hunting', interactiveType: 'Slow-motion replay' },
  { id: 'codex_evolution', title: 'Cephalopod Evolution', scene: 'Territory & Ecosystem', interactiveType: 'Draggable timeline' },
  { id: 'codex_color_comm', title: 'Color Communication', scene: 'Attract a Mate', interactiveType: 'Pattern simulator' },
  { id: 'codex_sneaker', title: 'Sneaker Male Biology', scene: 'Rival Mating Tactics', interactiveType: 'Research recreation' },
  { id: 'codex_cuttlebone', title: 'Cuttlebone & Buoyancy', scene: 'Build the Egg Nest', interactiveType: 'Gas chamber simulator' },
  { id: 'codex_senescence', title: 'Lifespan & Senescence', scene: 'Final Exam', interactiveType: 'Life timeline scrubber' },
];

// Interactive content for each codex entry
const CODEX_CONTENT: Record<string, { description: string; interactiveContent: React.ReactNode }> = {
  codex_egg_anatomy: {
    description: 'Explore the layers of a cuttlefish egg — from the ink-stained outer casing to the developing embryo within.',
    interactiveContent: (
      <div className="space-y-4">
        <div className="card border-rarity-epic p-4">
          <h4 className="font-pixel text-[9px] text-rarity-epic mb-2">Outer Casing</h4>
          <p className="text-text-secondary text-sm">The female coats each egg in ink from her ink sac during laying. This dark coating provides camouflage against the seafloor substrate, making eggs nearly invisible to visual predators. The ink contains melanin — the same pigment in human skin.</p>
        </div>
        <div className="card border-rarity-rare p-4">
          <h4 className="font-pixel text-[9px] text-rarity-rare mb-2">Protective Membrane</h4>
          <p className="text-text-secondary text-sm">A tough, rubbery chorion surrounds each embryo. This membrane is permeable to oxygen and dissolved gases but blocks bacteria and fungal spores. It swells with seawater after laying, becoming taut and resilient.</p>
        </div>
        <div className="card border-rarity-legendary p-4">
          <h4 className="font-pixel text-[9px] text-rarity-legendary mb-2">Yolk Sac</h4>
          <p className="text-text-secondary text-sm">The yolk provides all nutrition for the developing embryo over its 30-60 day incubation. Cuttlefish eggs are among the largest relative to body size in cephalopods — each yolk contains enough energy for the hatchling to survive its first 48 hours after hatching.</p>
        </div>
        <div className="card border-border-active p-4">
          <h4 className="font-pixel text-[9px] text-border-active mb-2">Embryo</h4>
          <p className="text-text-secondary text-sm">The developing cuttlefish can already change color inside the egg — chromatophores are functional weeks before hatching. Embryos can detect predator shadows through the translucent membrane and will delay hatching if a threat is present, waiting until the shadow passes.</p>
        </div>
      </div>
    ),
  },
  codex_egg_ink: {
    description: 'Discover why cuttlefish mothers ink their eggs and how coloration provides critical camouflage.',
    interactiveContent: (
      <div className="space-y-4">
        <p className="text-text-secondary text-sm">Female cuttlefish apply ink to each egg individually as they lay them, rolling the egg between their arms to ensure complete coverage. The degree of inking varies by habitat — eggs laid on dark substrates receive heavier ink coating.</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { bg: '#8B7355', label: 'Sandy substrate', match: 'Light ink' },
            { bg: '#4A3728', label: 'Dark rock', match: 'Heavy ink' },
            { bg: '#2F4F2F', label: 'Kelp forest', match: 'Medium-green tint' },
            { bg: '#696969', label: 'Coral rubble', match: 'Mottled application' },
          ].map((item, i) => (
            <div key={i} className="card p-3 text-center">
              <div className="w-full h-12 rounded mb-2" style={{ backgroundColor: item.bg }} />
              <span className="font-pixel text-[7px] text-text-primary block">{item.label}</span>
              <span className="font-pixel text-[6px] text-text-muted">{item.match}</span>
            </div>
          ))}
        </div>
        <p className="text-text-secondary text-sm">Research by Hanlon et al. demonstrated that eggs from the same clutch can vary dramatically in ink coverage depending on local substrate, suggesting mothers actively adjust their inking behavior based on visual assessment of the surrounding environment.</p>
      </div>
    ),
  },
  codex_vision: {
    description: 'Understand the unique W-shaped pupil and how cuttlefish may perceive color despite being colorblind.',
    interactiveContent: (
      <div className="space-y-4">
        <div className="flex justify-center mb-4">
          <div className="w-24 h-32 rounded-full bg-bg-surface border-2 border-border-active relative overflow-hidden flex items-center justify-center">
            <div className="text-4xl">👁️</div>
            <div className="absolute bottom-2 font-pixel text-[6px] text-border-active">W-shaped pupil</div>
          </div>
        </div>
        <p className="text-text-secondary text-sm">Cuttlefish pupils form a distinctive W-shape that allows light to enter from multiple angles simultaneously. This unique arrangement may enable chromatic aberration-based color detection — different wavelengths focus at slightly different points, and the brain interprets the blur patterns.</p>
        <div className="card p-3">
          <h4 className="font-pixel text-[8px] text-rarity-legendary mb-2">Human vs Cuttlefish Vision</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="font-pixel text-[7px] text-text-muted">Human</span>
              <p className="text-text-secondary text-xs">~180° field, binocular overlap, 3 color receptors (RGB), round pupil</p>
            </div>
            <div>
              <span className="font-pixel text-[7px] text-text-muted">Cuttlefish</span>
              <p className="text-text-secondary text-xs">~330° field, 1 color receptor, W-shaped pupil, polarized light detection</p>
            </div>
          </div>
        </div>
        <p className="text-text-secondary text-sm">Despite having only one type of photoreceptor (making them technically colorblind), cuttlefish produce remarkably precise color matches to their environment. The leading theory is that the W-shaped pupil creates controlled chromatic aberration, allowing the brain to extract wavelength information from a single receptor type.</p>
      </div>
    ),
  },
};

function CodexContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, markCodexViewed } = useProfile();
  const [activeEntry, setActiveEntry] = useState<string | null>(searchParams.get('entry'));

  const openEntry = (id: string) => {
    sfxTap();
    setActiveEntry(id);
    markCodexViewed(id);
  };

  // Active entry detail view
  if (activeEntry) {
    const entry = CODEX_ENTRIES.find(e => e.id === activeEntry);
    const content = CODEX_CONTENT[activeEntry];

    return (
      <div className="min-h-screen bg-bg-dark">
        <div className="p-4">
          <button
            onClick={() => { sfxTap(); setActiveEntry(null); }}
            className="btn text-[9px] mb-4"
          >
            ← Back
          </button>

          <h1 className="font-pixel text-sm text-rarity-legendary mb-2">{entry?.title}</h1>
          <p className="font-pixel text-[7px] text-text-muted mb-1">From: {entry?.scene}</p>
          <p className="font-pixel text-[7px] text-border-active mb-4">{entry?.interactiveType}</p>

          {content ? (
            <>
              <p className="text-text-secondary text-sm mb-4">{content.description}</p>
              {content.interactiveContent}
            </>
          ) : (
            <div className="card p-6 text-center">
              <span className="text-3xl mb-3 block">🔬</span>
              <p className="text-text-secondary text-sm">
                Interactive experience for this codex entry. Explore the fascinating biology of cuttlefish through hands-on interaction.
              </p>
              <p className="font-pixel text-[8px] text-text-muted mt-4">
                Full interactive content coming soon
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Codex list view
  return (
    <div className="min-h-screen bg-bg-dark">
      <MuteButton />
      <div className="p-4">
        <button
          onClick={() => { sfxTap(); router.push('/'); }}
          className="btn text-[9px] mb-4"
        >
          ← Home
        </button>

        <h1 className="font-pixel text-sm text-text-primary mb-2 mt-10">Codex</h1>
        <p className="font-pixel text-[8px] text-text-muted mb-6">
          {profile.unlockedCodexEntries.length} / {CODEX_ENTRIES.length} Entries Unlocked
        </p>

        <div className="space-y-3">
          {CODEX_ENTRIES.map(entry => {
            const isUnlocked = profile.unlockedCodexEntries.includes(entry.id);
            const isViewed = profile.viewedCodexEntries.includes(entry.id);
            const isNew = isUnlocked && !isViewed;

            return (
              <button
                key={entry.id}
                onClick={() => isUnlocked && openEntry(entry.id)}
                disabled={!isUnlocked}
                className={`card w-full text-left p-4 transition-all relative ${
                  isUnlocked ? 'cursor-pointer hover:border-border-active' : 'opacity-40'
                }`}
              >
                {isNew && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full" />
                )}
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{isUnlocked ? '📖' : '🔒'}</span>
                  <div>
                    <span className="font-pixel text-[9px] text-text-primary block">
                      {isUnlocked ? entry.title : '???'}
                    </span>
                    <span className="font-pixel text-[7px] text-text-muted">
                      {entry.scene}
                    </span>
                    {isUnlocked && (
                      <span className="font-pixel text-[6px] text-border-active block mt-1">
                        {entry.interactiveType}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function CodexPage() {
  return (
    <ProfileProvider>
      <React.Suspense fallback={<div className="min-h-screen bg-bg-dark flex items-center justify-center font-pixel text-text-muted">Loading...</div>}>
        <CodexContent />
      </React.Suspense>
    </ProfileProvider>
  );
}
