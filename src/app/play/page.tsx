'use client';

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProfileProvider, useProfile } from '@/hooks/useProfile';
import BottomNav from '@/components/BottomNav';
import MuteButton from '@/components/MuteButton';
import BriefingScreen from '@/components/BriefingScreen';
import ResultsScreen from '@/components/ResultsScreen';
import FailureScreen from '@/components/FailureScreen';
import StageUpAnimation from '@/components/StageUpAnimation';
import FactCard from '@/components/FactCard';
import StarRating from '@/components/StarRating';
import { sfxTap } from '@/lib/audio';
import CuttlefishAvatar from '@/components/cuttlefishAvatar';
import { rollDrop, pickCosmeticFromTier } from '@data/dropTable';
import { Rarity } from '@data/cosmetics';
import { BRIEFINGS } from '@data/briefings';

import { getSceneComponent } from '@/components/scenes/sceneComponents';
import { SCENE_LABELS, DROP_ELIGIBLE, SCENE_ORDER, STAGE_SCENES, CODEX_MAP } from '@data/sceneManifest';

function getBriefingScreens(sceneId: string) {
  const briefing = BRIEFINGS.find(b => b.sceneId === sceneId);
  if (briefing) return briefing.screens;
  return [
    { title: 'Mission Context', content: `Preparing for: ${SCENE_LABELS[sceneId]}. Read carefully — this knowledge will determine your survival.` },
    { title: 'Begin', content: 'Good luck. The reef is waiting.' },
  ];
}

type GamePhase = 'select' | 'briefing' | 'playing' | 'results' | 'failure' | 'stageUp' | 'winScreen';

interface PendingResults {
  stars: number;
  metrics: { label: string; value: string }[];
  droppedItem: { id: string; name: string; rarity: Rarity; type: string } | null;
  codexUnlock: { id: string; title: string } | null;
  isFirstCompletion: boolean;
}

function PlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testMode = searchParams.get('test') === '1';
  const autoStart = searchParams.get('auto') === '1';
  const {
    profile,
    handleSceneComplete,
    addCosmetic,
    unlockCodexEntry,
    incrementAttempt,
  } = useProfile();

  const [phase, setPhase] = useState<GamePhase>(autoStart ? 'briefing' : 'select');
  const [activeScene, setActiveScene] = useState<string>(profile.currentScene);
  const [pendingResults, setPendingResults] = useState<PendingResults | null>(null);
  const [pendingStageUp, setPendingStageUp] = useState<{ from: string; to: string } | null>(null);
  const [showFactCard, setShowFactCard] = useState<{ term: string; explanation: string } | null>(null);
  const [eggsSurvivedForHatch, setEggsSurvivedForHatch] = useState(160);

  const isReplay = profile.completedScenes.includes(activeScene);

  // Auto-start: increment attempt on mount
  const autoIncremented = React.useRef(false);
  React.useEffect(() => {
    if (autoStart && !autoIncremented.current) {
      autoIncremented.current = true;
      incrementAttempt(profile.currentScene);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startScene = useCallback((sceneId: string) => {
    setActiveScene(sceneId);
    incrementAttempt(sceneId);
    setPhase('briefing');
  }, [incrementAttempt]);

  const startPlaying = useCallback(() => {
    setPhase('playing');
  }, []);

  const onSceneComplete = useCallback((stars: number, metrics: { label: string; value: string }[]) => {
    const previousBest = profile.bestStarRatings[activeScene] || 0;
    const isFirst = !profile.completedScenes.includes(activeScene);
    const previousStage = profile.currentStage;

    // Update profile
    const updatedProfile = handleSceneComplete(activeScene, stars);

    // Handle cosmetic drop if eligible
    let droppedItem = null;
    if (DROP_ELIGIBLE.includes(activeScene)) {
      const ownedByRarity: Record<Rarity, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
      // Count owned by rarity (simplified - in real impl would reference cosmetics data)
      profile.unlockedCosmetics.forEach(id => {
        if (id.includes('common')) ownedByRarity.common++;
        else if (id.includes('rare')) ownedByRarity.rare++;
        else if (id.includes('epic')) ownedByRarity.epic++;
        else if (id.includes('legendary')) ownedByRarity.legendary++;
      });
      const totalByRarity: Record<Rarity, number> = { common: 52, rare: 36, epic: 20, legendary: 12 };

      const rarity = rollDrop(stars, ownedByRarity, totalByRarity);
      if (rarity) {
        // Generate a cosmetic ID (simplified)
        const typeOptions = ['color', 'pattern', 'fin', 'mantle'];
        const type = typeOptions[Math.floor(Math.random() * typeOptions.length)];
        const idx = Math.floor(Math.random() * 30) + 1;
        const cosmeticId = `${type}_${rarity}_${String(idx).padStart(2, '0')}`;

        const namesByRarity: Record<string, string[]> = {
          common: ['Sandy Shallows', 'Kelp Green', 'Reef Stone', 'Dusk Speckle', 'Tide Pool', 'Sea Foam', 'Coral Sand', 'Deep Current'],
          rare: ['Tidal Surge', 'Coral Vein', 'Storm Current', 'Deep Copper', 'Moonlit Reef', 'Brine Crystal'],
          epic: ['Nebula Pulse', 'Abyssal Flame', 'Phantom Aurora', 'Glacial Fracture', 'Twilight Cascade'],
          legendary: ["Leviathan's Crown", 'Primordial Shimmer', 'Void Dancer', "Cthulhu's Dream"],
        };
        const names = namesByRarity[rarity];
        const name = names[Math.floor(Math.random() * names.length)];

        droppedItem = { id: cosmeticId, name, rarity, type };
        addCosmetic(cosmeticId);
      }
    }

    // Handle codex unlock
    let codexUnlock = null;
    if (isFirst && CODEX_MAP[activeScene]) {
      codexUnlock = CODEX_MAP[activeScene];
      unlockCodexEntry(codexUnlock.id);
    }

    // Check for stage up
    const stageChanged = updatedProfile.currentStage !== previousStage;

    setPendingResults({
      stars,
      metrics,
      droppedItem,
      codexUnlock,
      isFirstCompletion: isFirst,
    });

    if (stageChanged) {
      setPendingStageUp({ from: previousStage, to: updatedProfile.currentStage });
    }

    setPhase('results');
  }, [profile, activeScene, handleSceneComplete, addCosmetic, unlockCodexEntry]);

  const onSceneFail = useCallback((reason: string, explanation: string) => {
    setPendingResults(null);
    setPhase('failure');
    // Store fail info in pendingResults for the failure screen
    setPendingResults({
      stars: 0,
      metrics: [{ label: 'Failure', value: reason }],
      droppedItem: null,
      codexUnlock: null,
      isFirstCompletion: false,
    });
  }, []);

  const handleResultsNext = useCallback(() => {
    if (pendingStageUp) {
      setPhase('stageUp');
    } else {
      const nextIdx = SCENE_ORDER.indexOf(activeScene) + 1;
      if (nextIdx < SCENE_ORDER.length) {
        setActiveScene(SCENE_ORDER[nextIdx]);
        setPhase('select');
      } else {
        setPhase('winScreen');
      }
    }
  }, [pendingStageUp, activeScene]);

  const renderScene = () => {
    const SceneComponent = getSceneComponent(activeScene);
    if (!SceneComponent) {
      return <div className="p-8 text-center font-pixel text-text-muted">Scene not found</div>;
    }

    if (activeScene === 'egg_hatch') {
      return (
        <SceneComponent
          eggsSurvived={eggsSurvivedForHatch}
          totalEggs={200}
          onComplete={onSceneComplete}
          onFail={onSceneFail}
          attemptNumber={profile.attemptCounts[activeScene] || 1}
        />
      );
    }

    return (
      <SceneComponent
        onComplete={onSceneComplete}
        onFail={onSceneFail}
        attemptNumber={profile.attemptCounts[activeScene] || 1}
      />
    );
  };

  // Scene select screen
  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-bg-dark pb-20">
        <MuteButton />
        <div className="p-4">
          <h1 className="font-pixel text-lg text-text-primary mb-6 mt-10">Select Scene</h1>

          {Object.entries(STAGE_SCENES).map(([stage, scenes]) => (
            <div key={stage} className="mb-6">
              <h2 className="font-pixel text-xs text-border-active mb-3 uppercase">{stage}</h2>
              <div className="space-y-2">
                {scenes.map(sceneId => {
                  const isCompleted = profile.completedScenes.includes(sceneId);
                  const isCurrent = sceneId === profile.currentScene;
                  const isLocked = !testMode && !isCompleted && !isCurrent && SCENE_ORDER.indexOf(sceneId) > SCENE_ORDER.indexOf(profile.currentScene);

                  return (
                    <button
                      key={sceneId}
                      onClick={() => {
                        if (!isLocked) {
                          sfxTap();
                          startScene(sceneId);
                        }
                      }}
                      disabled={isLocked}
                      className={`card w-full text-left flex items-center justify-between py-4 px-5 transition-all ${
                        isLocked ? 'opacity-40' : 'cursor-pointer hover:border-border-active'
                      } ${isCurrent ? 'border-border-active' : ''}`}
                    >
                      <div>
                        <span className="font-pixel text-[11px] text-text-primary block">
                          {SCENE_LABELS[sceneId]}
                        </span>
                        {isCompleted && (
                          <span className="font-pixel text-[9px] text-text-muted">
                            Attempts: {profile.attemptCounts[sceneId] || 0}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <StarRating stars={profile.bestStarRatings[sceneId] || 0} size="sm" />
                        )}
                        {isCurrent && !isCompleted && (
                          <span className="font-pixel text-[9px] text-rarity-legendary">CURRENT</span>
                        )}
                        {isLocked && (
                          <span className="font-pixel text-[9px] text-text-muted">LOCKED</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  // Briefing phase
  if (phase === 'briefing') {
    return (
      <BriefingScreen
        screens={getBriefingScreens(activeScene)}
        onComplete={startPlaying}
        skippable={isReplay}
      />
    );
  }

  // Playing phase
  if (phase === 'playing') {
    return (
      <div className="game-viewport relative">
        {renderScene()}
        {showFactCard && (
          <FactCard
            term={showFactCard.term}
            explanation={showFactCard.explanation}
            onDismiss={() => setShowFactCard(null)}
          />
        )}
      </div>
    );
  }

  // Results phase
  if (phase === 'results' && pendingResults && pendingResults.stars > 0) {
    return (
      <ResultsScreen
        stars={pendingResults.stars}
        previousBest={profile.bestStarRatings[activeScene] || 0}
        metrics={pendingResults.metrics}
        droppedItem={pendingResults.droppedItem}
        codexUnlock={pendingResults.codexUnlock}
        isFirstCompletion={pendingResults.isFirstCompletion}
        onReplay={() => startScene(activeScene)}
        onNext={handleResultsNext}
        onHome={() => router.push('/')}
        onViewCodex={(id) => router.push(`/codex?entry=${id}`)}
      />
    );
  }

  // Failure phase
  if (phase === 'failure' || (phase === 'results' && pendingResults && pendingResults.stars === 0)) {
    const failMetrics = pendingResults?.metrics || [];
    return (
      <FailureScreen
        sceneTitle={SCENE_LABELS[activeScene] || activeScene}
        failReason={failMetrics[0]?.value || 'You did not survive.'}
        biologyExplanation="Review the briefing for clues on what went wrong. The answer is always in the biology."
        attemptNumber={profile.attemptCounts[activeScene] || 1}
        onRetry={() => startScene(activeScene)}
        onHome={() => router.push('/')}
        onSkipToRetry={() => { incrementAttempt(activeScene); setPhase('playing'); }}
      />
    );
  }

  // Stage up animation
  if (phase === 'stageUp' && pendingStageUp) {
    return (
      <StageUpAnimation
        fromStage={pendingStageUp.from}
        toStage={pendingStageUp.to}
        onComplete={() => {
          setPendingStageUp(null);
          setPhase('select');
        }}
      />
    );
  }

  // Win screen
  if (phase === 'winScreen') {
    return (
      <div className="fixed inset-0 z-50 bg-bg-dark flex flex-col items-center justify-center px-6">
        <h1 className="font-pixel text-lg text-rarity-legendary mb-4 text-center">
          The Cycle Continues
        </h1>
        <p className="text-text-secondary text-sm text-center mb-8 max-w-xs">
          Your eggs hatch. Tiny hatchlings swim out into the vast ocean,
          carrying forward the ancient legacy of the cuttlefish.
        </p>
        <CuttlefishAvatar size={120} stage={profile.currentStage as 'egg' | 'hatchling' | 'juvenile' | 'adult'} equipped={profile.equippedCosmetics} />
        <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => setPhase('select')} className="btn btn-primary w-full text-[10px]">
            Replay Scenes
          </button>
          <button onClick={() => router.push('/')} className="btn w-full text-[10px]">
            Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function PlayPage() {
  return (
    <ProfileProvider>
      <Suspense fallback={<div className="min-h-screen bg-bg-dark" />}>
        <PlayContent />
      </Suspense>
    </ProfileProvider>
  );
}
