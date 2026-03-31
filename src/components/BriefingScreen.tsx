'use client';

import React, { useState } from 'react';
import { sfxTap } from '@/lib/audio';

interface BriefingScreenData {
  title: string;
  content: string;
  interactiveHint?: string;
  youtubeId?: string;
}

interface BriefingScreenProps {
  screens: BriefingScreenData[];
  onComplete: () => void;
  skippable?: boolean;
}

export default function BriefingScreen({ screens, onComplete, skippable = false }: BriefingScreenProps) {
  const [currentScreen, setCurrentScreen] = useState(0);

  const screen = screens[currentScreen];
  const isLast = currentScreen === screens.length - 1;

  return (
    <div className="fixed inset-0 z-40 bg-bg-dark flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pl-14 border-b-2 border-border-subtle">
        <span className="font-pixel text-[10px] text-rarity-legendary">BRIEFING</span>
        <span className="font-pixel text-[8px] text-text-muted">
          {currentScreen + 1} / {screens.length}
        </span>
        {skippable && (
          <button
            onClick={() => { sfxTap(); onComplete(); }}
            className="btn text-[8px] py-2 px-4"
          >
            Skip
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 justify-center py-3">
        {screens.map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i <= currentScreen ? 'var(--border-active)' : 'var(--border-subtle)',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <h2 className="font-pixel text-sm text-rarity-legendary mb-4 leading-relaxed">
          {screen.title}
        </h2>
        {screen.youtubeId && (
          <div className="mb-4 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${screen.youtubeId}?rel=0&modestbranding=1`}
              title="Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 'none' }}
            />
          </div>
        )}
        <div className="text-text-secondary font-body text-sm leading-relaxed whitespace-pre-line">
          {screen.content}
        </div>
        {screen.interactiveHint && (
          <div className="mt-4 p-3 border-2 border-border-active rounded-card bg-bg-surface">
            <span className="font-pixel text-[8px] text-border-active block mb-2">FIELD NOTES</span>
            <p className="text-text-muted text-xs italic">{screen.interactiveHint}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-4 flex gap-3 border-t-2 border-border-subtle">
        {currentScreen > 0 && (
          <button
            onClick={() => { sfxTap(); setCurrentScreen(prev => prev - 1); }}
            className="btn flex-1"
          >
            Back
          </button>
        )}
        <button
          onClick={() => {
            sfxTap();
            if (isLast) {
              onComplete();
            } else {
              setCurrentScreen(prev => prev + 1);
            }
          }}
          className="btn btn-primary flex-1"
        >
          {isLast ? 'Begin' : 'Next'}
        </button>
      </div>
    </div>
  );
}
