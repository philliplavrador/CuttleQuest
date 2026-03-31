'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileProvider, useProfile } from '@/hooks/useProfile';
import { SCENE_ORDER, SCENE_LABELS, STAGE_SCENES, CODEX_MAP, getManifestEntry } from '@data/sceneManifest';

function AdminContent() {
  const router = useRouter();
  const { profile, updateProfile, handleSceneComplete, resetProgress } = useProfile();
  const [rawJson, setRawJson] = useState('');
  const [jsonOpen, setJsonOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const jumpToScene = (targetId: string) => {
    const targetIdx = SCENE_ORDER.indexOf(targetId);
    const entry = getManifestEntry(targetId);
    if (targetIdx === -1 || !entry) return;

    const priorScenes = SCENE_ORDER.slice(0, targetIdx);
    const afterScenes = SCENE_ORDER.slice(targetIdx);
    const completedScenes = [...priorScenes];
    const bestStarRatings: Record<string, number> = {};
    const attemptCounts: Record<string, number> = {};
    priorScenes.forEach(s => {
      bestStarRatings[s] = 5;
      attemptCounts[s] = 1;
    });
    // Keep attempt counts for scenes after target but clear their completion
    afterScenes.forEach(s => {
      if (profile.attemptCounts[s]) attemptCounts[s] = profile.attemptCounts[s];
    });

    updateProfile({
      currentScene: targetId,
      currentStage: entry.stageId as 'egg' | 'hatchling' | 'juvenile' | 'adult',
      completedScenes,
      bestStarRatings,
      attemptCounts,
    });
    showToast(`Jumped to ${SCENE_LABELS[targetId]}`);
  };

  const completeWithStars = (sceneId: string, stars: number) => {
    handleSceneComplete(sceneId, stars);
    showToast(`${SCENE_LABELS[sceneId]}: ${stars} stars`);
  };

  const completeAll = () => {
    const bestStarRatings: Record<string, number> = {};
    const attemptCounts: Record<string, number> = {};
    SCENE_ORDER.forEach(id => {
      bestStarRatings[id] = 5;
      attemptCounts[id] = (profile.attemptCounts[id] || 0) + 1;
    });
    const lastScene = SCENE_ORDER[SCENE_ORDER.length - 1];
    const lastEntry = getManifestEntry(lastScene);
    updateProfile({
      completedScenes: [...SCENE_ORDER],
      bestStarRatings,
      attemptCounts,
      currentScene: lastScene,
      currentStage: lastEntry?.stageId as 'egg' | 'hatchling' | 'juvenile' | 'adult' || 'adult',
    });
    showToast('All scenes completed with 5 stars');
  };

  const unlockAllCodex = () => {
    const allIds = Object.values(CODEX_MAP).map(entry => entry.id);
    const merged = Array.from(new Set([...profile.unlockedCodexEntries, ...allIds]));
    updateProfile({ unlockedCodexEntries: merged });
    showToast('All codex entries unlocked');
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(rawJson);
      updateProfile(parsed);
      showToast('Profile updated from JSON');
      setJsonOpen(false);
    } catch {
      showToast('Invalid JSON!');
    }
  };

  const stageColors: Record<string, string> = {
    egg: '#4ade80',
    hatchling: '#60a5fa',
    juvenile: '#c084fc',
    adult: '#f97316',
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-4 pb-24">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1e293b] border border-[#334155] text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-lg mt-10">Dev Tools</h1>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-400 hover:text-white"
        >
          Back to Game
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <button
          onClick={() => { resetProgress(); showToast('Progress reset'); }}
          className="bg-red-900/40 border border-red-800 rounded-lg py-2 px-3 text-xs font-medium hover:bg-red-900/60"
        >
          Reset All
        </button>
        <button
          onClick={completeAll}
          className="bg-green-900/40 border border-green-800 rounded-lg py-2 px-3 text-xs font-medium hover:bg-green-900/60"
        >
          Complete All
        </button>
        <button
          onClick={unlockAllCodex}
          className="bg-purple-900/40 border border-purple-800 rounded-lg py-2 px-3 text-xs font-medium hover:bg-purple-900/60"
        >
          Unlock Codex
        </button>
      </div>

      {/* Profile Summary */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-lg p-3 mb-6 text-xs">
        <div className="grid grid-cols-2 gap-y-1">
          <span className="text-gray-400">Stage:</span>
          <span style={{ color: stageColors[profile.currentStage] }}>{profile.currentStage}</span>
          <span className="text-gray-400">Current Scene:</span>
          <span>{SCENE_LABELS[profile.currentScene] || profile.currentScene}</span>
          <span className="text-gray-400">Completed:</span>
          <span>{profile.completedScenes.length}/{SCENE_ORDER.length}</span>
          <span className="text-gray-400">Cosmetics:</span>
          <span>{profile.unlockedCosmetics.length}</span>
          <span className="text-gray-400">Codex:</span>
          <span>{profile.unlockedCodexEntries.length}/{Object.keys(CODEX_MAP).length}</span>
        </div>
      </div>

      {/* Scene Grid */}
      {Object.entries(STAGE_SCENES).map(([stage, scenes]) => (
        <div key={stage} className="mb-5">
          <h2
            className="text-xs font-bold uppercase mb-2 tracking-wider"
            style={{ color: stageColors[stage] }}
          >
            {stage}
          </h2>
          <div className="space-y-2">
            {scenes.map(sceneId => {
              const isCompleted = profile.completedScenes.includes(sceneId);
              const isCurrent = sceneId === profile.currentScene;
              const bestStars = profile.bestStarRatings[sceneId] || 0;

              return (
                <div
                  key={sceneId}
                  className={`bg-[#111827] border rounded-lg p-3 ${
                    isCurrent ? 'border-yellow-500/50' : 'border-[#1e293b]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        isCompleted ? 'bg-green-400' : isCurrent ? 'bg-yellow-400' : 'bg-gray-600'
                      }`} />
                      <span className="text-xs font-medium">{SCENE_LABELS[sceneId]}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => jumpToScene(sceneId)}
                        className="text-[10px] bg-blue-900/40 border border-blue-800 rounded px-2 py-0.5 hover:bg-blue-900/60"
                      >
                        Jump Here
                      </button>
                      <button
                        onClick={() => { jumpToScene(sceneId); router.push(`/play?auto=1`); }}
                        className="text-[10px] bg-green-900/40 border border-green-800 rounded px-2 py-0.5 hover:bg-green-900/60"
                      >
                        Play
                      </button>
                    </div>
                  </div>

                  {/* Star buttons */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => completeWithStars(sceneId, star)}
                        className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                          star <= bestStars
                            ? 'bg-yellow-500/30 border border-yellow-500 text-yellow-300'
                            : 'bg-[#1e293b] border border-[#334155] text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {star}
                      </button>
                    ))}
                    <span className="text-[10px] text-gray-500 ml-2">
                      {profile.attemptCounts[sceneId] || 0} attempts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* JSON Editor */}
      <div className="mt-6">
        <button
          onClick={() => {
            setJsonOpen(!jsonOpen);
            if (!jsonOpen) setRawJson(JSON.stringify(profile, null, 2));
          }}
          className="text-xs text-gray-400 hover:text-white mb-2"
        >
          {jsonOpen ? 'Close' : 'Open'} Profile JSON Editor
        </button>
        {jsonOpen && (
          <div className="space-y-2">
            <textarea
              value={rawJson}
              onChange={e => setRawJson(e.target.value)}
              className="w-full h-64 bg-[#0d1117] border border-[#1e293b] rounded-lg p-3 text-xs font-mono text-gray-300 resize-y"
              spellCheck={false}
            />
            <button
              onClick={applyJson}
              className="bg-green-900/40 border border-green-800 rounded-lg py-2 px-4 text-xs font-medium hover:bg-green-900/60"
            >
              Apply JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProfileProvider>
      <Suspense fallback={<div className="min-h-screen bg-[#0a0e1a]" />}>
        <AdminContent />
      </Suspense>
    </ProfileProvider>
  );
}
