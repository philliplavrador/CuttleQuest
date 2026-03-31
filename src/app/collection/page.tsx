'use client';

import React, { useState } from 'react';
import { ProfileProvider, useProfile } from '@/hooks/useProfile';
import BottomNav from '@/components/BottomNav';
import MuteButton from '@/components/MuteButton';

type FilterType = 'all' | 'common' | 'rare' | 'epic' | 'legendary';

const RARITY_COLORS: Record<string, string> = {
  common: '#639922',
  rare: '#378ADD',
  epic: '#7F77DD',
  legendary: '#EF9F27',
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

// Generate all 120 cosmetic IDs for display
function generateAllCosmetics() {
  const types = ['color', 'pattern', 'fin', 'mantle'];
  const rarities: { rarity: string; count: number }[] = [
    { rarity: 'common', count: 13 },
    { rarity: 'rare', count: 9 },
    { rarity: 'epic', count: 5 },
    { rarity: 'legendary', count: 3 },
  ];

  const items: { id: string; type: string; rarity: string; name: string }[] = [];

  types.forEach(type => {
    rarities.forEach(({ rarity, count }) => {
      for (let i = 1; i <= count; i++) {
        items.push({
          id: `${type}_${rarity}_${String(i).padStart(2, '0')}`,
          type,
          rarity,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} #${i}`,
        });
      }
    });
  });

  return items;
}

const ALL_COSMETICS = generateAllCosmetics();

function CollectionContent() {
  const { profile } = useProfile();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all'
    ? ALL_COSMETICS
    : ALL_COSMETICS.filter(c => c.rarity === filter);

  const countByRarity = (rarity: string) =>
    profile.unlockedCosmetics.filter(id => id.includes(`_${rarity}_`)).length;
  const totalByRarity = (rarity: string) =>
    ALL_COSMETICS.filter(c => c.rarity === rarity).length;

  return (
    <div className="min-h-screen bg-bg-dark pb-20">
      <MuteButton />
      <div className="p-4">
        <h1 className="font-pixel text-sm text-text-primary mb-2 mt-10">Collection</h1>
        <p className="font-pixel text-[8px] text-text-muted mb-4">
          {profile.unlockedCosmetics.length} / 120 Cosmetics
        </p>

        {/* Rarity counters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {['common', 'rare', 'epic', 'legendary'].map(r => (
            <div key={r} className="card py-1 px-2 text-center" style={{ borderColor: RARITY_COLORS[r] }}>
              <span className="font-pixel text-[7px]" style={{ color: RARITY_COLORS[r] }}>
                {countByRarity(r)}/{totalByRarity(r)}
              </span>
              <span className="font-pixel text-[6px] text-text-muted block">{RARITY_LABELS[r]}</span>
            </div>
          ))}
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {(['all', 'common', 'rare', 'epic', 'legendary'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn text-[8px] py-2 px-3 whitespace-nowrap ${
                filter === f ? 'btn-primary' : ''
              }`}
            >
              {f === 'all' ? 'All' : RARITY_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-4 gap-2">
          {filtered.map(item => {
            const isUnlocked = profile.unlockedCosmetics.includes(item.id);
            const isNew = isUnlocked; // Simplified - would track "new" status

            return (
              <div
                key={item.id}
                className="card aspect-square flex flex-col items-center justify-center p-1 relative"
                style={{
                  borderColor: isUnlocked ? RARITY_COLORS[item.rarity] : 'var(--border-subtle)',
                  opacity: isUnlocked ? 1 : 0.4,
                }}
              >
                <span className="text-xl mb-1">
                  {isUnlocked ? '✦' : '?'}
                </span>
                <span className="font-pixel text-[5px] text-center leading-tight" style={{
                  color: isUnlocked ? RARITY_COLORS[item.rarity] : 'var(--text-muted)',
                }}>
                  {isUnlocked ? item.name : '???'}
                </span>
                <span className="font-pixel text-[5px] text-text-muted mt-0.5">{item.type}</span>
              </div>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default function CollectionPage() {
  return (
    <ProfileProvider>
      <CollectionContent />
    </ProfileProvider>
  );
}
