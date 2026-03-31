'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';
import CuttlefishAvatar from '@/components/cuttlefishAvatar';
import BottomNav from '@/components/BottomNav';
import MuteButton from '@/components/MuteButton';
import { sfxTap } from '@/lib/audio';

const STAGE_LABELS: Record<string, string> = {
  egg: 'Egg',
  hatchling: 'Hatchling',
  juvenile: 'Juvenile',
  adult: 'Adult',
};

const SCENE_LABELS: Record<string, string> = {
  egg_habitat: 'Pick a Habitat',
  egg_tend: 'Tend the Egg',
  egg_hatch: 'Hatch',
  hatchling_hunt: 'First Hunt',
  hatchling_camouflage: 'Camouflage',
  hatchling_ink: 'Ink and Hide',
  juvenile_hunting: 'Advanced Hunting',
  juvenile_territory: 'Territory & Ecosystem',
  juvenile_mate: 'Attract a Mate',
  adult_rival: 'Rival Mating Tactics',
  adult_nest: 'Build the Egg Nest',
  adult_tend: 'Tend the Eggs — Final Exam',
};

const STAGE_EMOJI: Record<string, string> = {
  egg: '🥚',
  hatchling: '🐣',
  juvenile: '🦑',
  adult: '🌊',
};

export default function HomeContent() {
  const router = useRouter();
  const { profile, isMockMode, signInWithGoogle, enterTestMode } = useProfile();
  const [showStats, setShowStats] = useState(false);

  const unviewedCodex = profile.unlockedCodexEntries.filter(
    id => !profile.viewedCodexEntries.includes(id)
  );

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden home-bg">
      {/* Animated background bubbles */}
      <div className="bubble bubble-1" />
      <div className="bubble bubble-2" />
      <div className="bubble bubble-3" />
      <div className="bubble bubble-4" />
      <div className="bubble bubble-5" />

      {/* Header */}
      <div className="flex items-center justify-between p-4 relative z-10">
        <div>
          <h1 className="font-pixel text-xl home-title">CuttleQuest</h1>
          {isMockMode && (
            <span className="font-pixel text-[10px] text-pink-300 mt-1 block">TEST MODE</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Codex icon */}
          <button
            onClick={() => { sfxTap(); router.push('/codex'); }}
            className="relative w-[48px] h-[48px] flex items-center justify-center glass-btn"
          >
            <span className="text-2xl">📖</span>
            {unviewedCodex.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-pulse" />
            )}
          </button>

          {/* Mute */}
          <MuteButton />

          {/* Auth */}
          {profile.isGuest ? (
            <button
              onClick={() => {
                sfxTap();
                if (isMockMode) enterTestMode();
                else signInWithGoogle();
              }}
              className="font-pixel text-[9px] glass-btn px-4 py-2.5 text-purple-200"
            >
              {isMockMode ? 'Test User' : 'Save?'}
            </button>
          ) : (
            <div className="flex items-center">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-purple-400" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center font-pixel text-[10px] text-white">
                  {profile.displayName[0] || 'P'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content - focused & clean */}
      <div className="relative z-10 flex flex-col items-center mt-2">
        {/* Avatar with glow ring */}
        <div className="avatar-glow">
          <CuttlefishAvatar size={280} stage={profile.currentStage as 'egg' | 'hatchling' | 'juvenile' | 'adult'} equipped={profile.equippedCosmetics} />
        </div>

        {/* Stage badge */}
        <div className="stage-badge mt-4">
          <span className="mr-1">{STAGE_EMOJI[profile.currentStage] || '🦑'}</span>
          <span>{STAGE_LABELS[profile.currentStage]}</span>
        </div>

        {/* Next scene */}
        <p className="font-pixel text-xs text-purple-200 mt-4 opacity-80">
          Next: {SCENE_LABELS[profile.currentScene] || 'Complete!'}
        </p>

        {/* Continue button */}
        <div className="mt-8 px-6 w-full max-w-sm">
          <button
            onClick={() => { sfxTap(); router.push('/play?auto=1'); }}
            className="continue-btn w-full py-5 font-pixel text-lg"
          >
            Continue
          </button>
        </div>

        {/* Quick stats row - compact */}
        <button
          onClick={() => setShowStats(!showStats)}
          className="mt-6 font-pixel text-[9px] text-purple-300 opacity-60 hover:opacity-100 transition-opacity"
        >
          {showStats ? 'hide stats ▲' : 'stats ▼'}
        </button>

        {isMockMode && (
          <div className="flex gap-4 mt-2">
            <button
              onClick={() => { sfxTap(); router.push('/admin'); }}
              className="font-pixel text-[9px] text-pink-400 opacity-50 hover:opacity-100 transition-opacity"
            >
              admin panel
            </button>
            <button
              onClick={() => { sfxTap(); router.push('/preview'); }}
              className="font-pixel text-[9px] text-cyan-400 opacity-50 hover:opacity-100 transition-opacity"
            >
              asset manager
            </button>
          </div>
        )}

        {showStats && (
          <div className="mt-3 px-6 w-full max-w-sm animate-fadeIn">
            {/* Stats pills */}
            <div className="flex justify-center gap-3 mb-3">
              <div className="stat-pill">
                <span className="stat-value text-purple-300">{profile.completedScenes.length}</span>
                <span className="stat-label">Scenes</span>
              </div>
              <div className="stat-pill">
                <span className="stat-value text-pink-300">{profile.unlockedCosmetics.length}</span>
                <span className="stat-label">Cosmetics</span>
              </div>
              <div className="stat-pill">
                <span className="stat-value text-cyan-300">
                  {profile.totalDecisions > 0
                    ? Math.round((profile.totalCorrectDecisions / profile.totalDecisions) * 100)
                    : 0}%
                </span>
                <span className="stat-label">Accuracy</span>
              </div>
            </div>

            {/* Completed scenes */}
            {profile.completedScenes.length > 0 && (
              <div className="space-y-1.5">
                {profile.completedScenes.map(sceneId => (
                  <div key={sceneId} className="flex items-center justify-between glass-card py-1.5 px-3">
                    <span className="font-pixel text-[8px] text-purple-200">
                      {SCENE_LABELS[sceneId] || sceneId}
                    </span>
                    <span className="font-pixel text-[10px] text-yellow-400">
                      {'★'.repeat(profile.bestStarRatings[sceneId] || 0)}
                      {'☆'.repeat(5 - (profile.bestStarRatings[sceneId] || 0))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
