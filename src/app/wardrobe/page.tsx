'use client';

import React, { useState, useRef } from 'react';
import { ProfileProvider, useProfile } from '@/hooks/useProfile';
import BottomNav from '@/components/BottomNav';
import MuteButton from '@/components/MuteButton';
import CuttlefishAvatar from '@/components/cuttlefishAvatar';
import { sfxTap } from '@/lib/audio';

type SlotType = 'color' | 'pattern' | 'fin' | 'mantle';

const SLOT_LABELS: Record<SlotType, string> = {
  color: 'Color',
  pattern: 'Pattern',
  fin: 'Fin Style',
  mantle: 'Mantle',
};

const RARITY_COLORS: Record<string, string> = {
  common: '#639922',
  rare: '#378ADD',
  epic: '#7F77DD',
  legendary: '#EF9F27',
};

function WardrobeContent() {
  const { profile, equipCosmetic, isMockMode, signInWithGoogle } = useProfile();
  const [activeSlot, setActiveSlot] = useState<SlotType | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const getItemsForSlot = (slot: SlotType) =>
    profile.unlockedCosmetics.filter(id => id.startsWith(`${slot}_`));

  const getRarity = (id: string): string => {
    if (id.includes('_legendary_')) return 'legendary';
    if (id.includes('_epic_')) return 'epic';
    if (id.includes('_rare_')) return 'rare';
    return 'common';
  };

  const handleEquip = (slot: SlotType, id: string | null) => {
    sfxTap();
    equipCosmetic(slot, id);
  };

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#0d0d1a',
        scale: 2,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.share) {
          const file = new File([blob], 'cuttlequest-card.png', { type: 'image/png' });
          try {
            await navigator.share({ files: [file], title: 'My CuttleQuest Outfit' });
          } catch {
            downloadBlob(blob);
          }
        } else if (navigator.clipboard) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            alert('Card copied to clipboard!');
          } catch {
            downloadBlob(blob);
          }
        } else {
          downloadBlob(blob);
        }
      });
    } catch {
      alert('Failed to generate share card');
    }
  };

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cuttlequest-card.png';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-bg-dark pb-20">
      <MuteButton />
      <div className="p-4">
        <h1 className="font-pixel text-sm text-text-primary mb-4 mt-10">Wardrobe</h1>

        {/* Avatar preview */}
        <div className="flex justify-center mb-4">
          <div className="card p-4 flex items-center justify-center">
            <CuttlefishAvatar size={140} stage={profile.currentStage as 'egg' | 'hatchling' | 'juvenile' | 'adult'} equipped={profile.equippedCosmetics} />
          </div>
        </div>

        {/* Equipment slots */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(Object.keys(SLOT_LABELS) as SlotType[]).map(slot => (
            <button
              key={slot}
              onClick={() => { sfxTap(); setActiveSlot(activeSlot === slot ? null : slot); }}
              className={`card text-center py-3 cursor-pointer transition-all ${
                activeSlot === slot ? 'border-border-active' : ''
              }`}
            >
              <span className="font-pixel text-[8px] text-text-muted block">{SLOT_LABELS[slot]}</span>
              <span
                className="font-pixel text-[7px] mt-1 block"
                style={{
                  color: profile.equippedCosmetics[slot]
                    ? RARITY_COLORS[getRarity(profile.equippedCosmetics[slot]!)]
                    : 'var(--text-muted)',
                }}
              >
                {profile.equippedCosmetics[slot] || 'None'}
              </span>
            </button>
          ))}
        </div>

        {/* Item selection grid */}
        {activeSlot && (
          <div className="mb-4">
            <h3 className="font-pixel text-[9px] text-text-secondary mb-2">
              {SLOT_LABELS[activeSlot]} Options
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {/* None option */}
              <button
                onClick={() => handleEquip(activeSlot, null)}
                className={`card aspect-square flex items-center justify-center cursor-pointer ${
                  !profile.equippedCosmetics[activeSlot] ? 'border-border-active' : ''
                }`}
              >
                <span className="font-pixel text-[7px] text-text-muted">None</span>
              </button>
              {getItemsForSlot(activeSlot).map(id => {
                const rarity = getRarity(id);
                const isEquipped = profile.equippedCosmetics[activeSlot] === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleEquip(activeSlot, id)}
                    className={`card aspect-square flex flex-col items-center justify-center cursor-pointer ${
                      isEquipped ? '' : ''
                    }`}
                    style={{
                      borderColor: isEquipped ? RARITY_COLORS[rarity] : 'var(--border-subtle)',
                    }}
                  >
                    <span className="text-lg">✦</span>
                    <span className="font-pixel text-[5px]" style={{ color: RARITY_COLORS[rarity] }}>
                      {rarity}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Share button */}
        <button
          onClick={() => { sfxTap(); setShowShareModal(true); }}
          className="btn btn-primary w-full text-[10px]"
        >
          Generate Share Card
        </button>
      </div>

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4">
          <div className="max-w-sm w-full">
            {/* Share card content */}
            <div
              ref={shareCardRef}
              className="card p-6 text-center"
              style={{ borderColor: 'var(--border-active)' }}
            >
              <h2 className="font-pixel text-[10px] text-rarity-legendary mb-3">CuttleQuest</h2>
              <div className="flex justify-center mb-3">
                <CuttlefishAvatar size={100} stage={profile.currentStage as 'egg' | 'hatchling' | 'juvenile' | 'adult'} equipped={profile.equippedCosmetics} animate={false} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-left">
                <div>
                  <span className="font-pixel text-[6px] text-text-muted">Stage</span>
                  <span className="font-pixel text-[8px] text-text-primary block">{profile.currentStage}</span>
                </div>
                <div>
                  <span className="font-pixel text-[6px] text-text-muted">Scenes</span>
                  <span className="font-pixel text-[8px] text-text-primary block">{profile.completedScenes.length}/12</span>
                </div>
                <div>
                  <span className="font-pixel text-[6px] text-text-muted">Cosmetics</span>
                  <span className="font-pixel text-[8px] text-text-primary block">{profile.unlockedCosmetics.length}/120</span>
                </div>
                <div>
                  <span className="font-pixel text-[6px] text-text-muted">Accuracy</span>
                  <span className="font-pixel text-[8px] text-text-primary block">
                    {profile.totalDecisions > 0
                      ? Math.round((profile.totalCorrectDecisions / profile.totalDecisions) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button onClick={handleShare} className="btn btn-primary flex-1 text-[9px]">
                Share
              </button>
              <button onClick={() => setShowShareModal(false)} className="btn flex-1 text-[9px]">
                Close
              </button>
            </div>

            {profile.isGuest && (
              <p className="font-pixel text-[7px] text-text-muted text-center mt-3">
                Sign in to save your outfit permanently
              </p>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default function WardrobePage() {
  return (
    <ProfileProvider>
      <WardrobeContent />
    </ProfileProvider>
  );
}
