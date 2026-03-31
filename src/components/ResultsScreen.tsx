'use client';

import React, { useState, useEffect, useCallback } from 'react';
import StarRating from './StarRating';
import { sfxStarChime, sfxStarFlourish, sfxDropReveal, sfxLegendaryFanfare, sfxCodexUnlock } from '@/lib/audio';

interface ResultsScreenProps {
  stars: number;
  previousBest: number;
  metrics: { label: string; value: string }[];
  droppedItem: {
    id: string;
    name: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    type: string;
  } | null;
  codexUnlock?: { id: string; title: string } | null;
  isFirstCompletion: boolean;
  onReplay: () => void;
  onNext: () => void;
  onHome: () => void;
  onViewCodex?: (id: string) => void;
}

type Phase = 'banner' | 'stars' | 'metrics' | 'drop-approach' | 'drop-flip' | 'drop-legendary' | 'drop-reveal' | 'codex' | 'actions';

const RARITY_COLORS: Record<string, string> = {
  common: '#639922',
  rare: '#378ADD',
  epic: '#7F77DD',
  legendary: '#EF9F27',
};

export default function ResultsScreen({
  stars,
  previousBest,
  metrics,
  droppedItem,
  codexUnlock,
  isFirstCompletion,
  onReplay,
  onNext,
  onHome,
  onViewCodex,
}: ResultsScreenProps) {
  const [phase, setPhase] = useState<Phase>('banner');
  const [revealedStars, setRevealedStars] = useState(0);
  const [canSkip, setCanSkip] = useState(!isFirstCompletion);

  const advancePhase = useCallback(() => {
    setPhase(prev => {
      switch (prev) {
        case 'banner': return 'stars';
        case 'stars': return 'metrics';
        case 'metrics': return droppedItem ? 'drop-approach' : (codexUnlock ? 'codex' : 'actions');
        case 'drop-approach': return 'drop-flip';
        case 'drop-flip':
          return droppedItem?.rarity === 'legendary' ? 'drop-legendary' : 'drop-reveal';
        case 'drop-legendary': return 'drop-reveal';
        case 'drop-reveal': return codexUnlock ? 'codex' : 'actions';
        case 'codex': return 'actions';
        default: return 'actions';
      }
    });
  }, [droppedItem, codexUnlock]);

  // Auto-advance phases with timing
  useEffect(() => {
    let timer: NodeJS.Timeout;

    switch (phase) {
      case 'banner':
        timer = setTimeout(advancePhase, 1500);
        break;
      case 'stars':
        // Reveal stars one by one
        if (revealedStars < stars) {
          timer = setTimeout(() => {
            setRevealedStars(prev => prev + 1);
            sfxStarChime(revealedStars + 1);
          }, 500);
        } else {
          if (stars >= 4) sfxStarFlourish();
          timer = setTimeout(advancePhase, 1000);
        }
        break;
      case 'metrics':
        timer = setTimeout(advancePhase, 2000);
        break;
      case 'drop-approach':
        timer = setTimeout(advancePhase, 1500);
        break;
      case 'drop-flip':
        sfxDropReveal();
        timer = setTimeout(advancePhase, droppedItem?.rarity === 'legendary' ? 800 : 500);
        break;
      case 'drop-legendary':
        sfxLegendaryFanfare();
        timer = setTimeout(advancePhase, 5000);
        break;
      case 'drop-reveal':
        timer = setTimeout(advancePhase, 2000);
        break;
      case 'codex':
        sfxCodexUnlock();
        break;
    }

    return () => clearTimeout(timer);
  }, [phase, revealedStars, stars, advancePhase, droppedItem]);

  // Handle skip tap
  const handleTap = () => {
    if (!canSkip) return;
    if (phase === 'stars' || phase === 'banner') {
      // After star reveal, allow skip
      setCanSkip(true);
    }
    if (canSkip && phase !== 'drop-flip' && phase !== 'drop-legendary' && phase !== 'drop-reveal') {
      // Skip to drop reveal (drop always plays)
      if (droppedItem) {
        setRevealedStars(stars);
        setPhase('drop-approach');
      } else {
        setPhase('actions');
      }
    }
  };

  // Enable skipping after star reveal for replays
  useEffect(() => {
    if (!isFirstCompletion && phase === 'stars' && revealedStars >= stars) {
      setCanSkip(true);
    }
  }, [phase, revealedStars, stars, isFirstCompletion]);

  return (
    <div
      className="fixed inset-0 z-50 bg-bg-dark flex flex-col items-center justify-center px-6"
      onClick={handleTap}
    >
      {/* Banner */}
      {phase === 'banner' && (
        <div style={{ animation: 'slam 0.5s ease-out' }}>
          <h1 className="font-pixel text-xl text-rarity-legendary text-center">
            SCENE COMPLETE
          </h1>
        </div>
      )}

      {/* Stars */}
      {(phase === 'stars' || phase === 'metrics' || phase === 'drop-approach' || phase === 'drop-flip' ||
        phase === 'drop-legendary' || phase === 'drop-reveal' || phase === 'codex' || phase === 'actions') && (
        <div className="mb-6 text-center" style={{ animation: phase === 'stars' ? 'fadeIn 0.3s' : undefined }}>
          <StarRating stars={revealedStars} size="lg" animated />
          {previousBest > 0 && (
            <p className="font-pixel text-[8px] text-text-muted mt-2">
              Previous best: {'★'.repeat(previousBest)}{'☆'.repeat(5 - previousBest)}
            </p>
          )}
        </div>
      )}

      {/* Metrics */}
      {(phase === 'metrics' || phase === 'drop-approach' || phase === 'drop-flip' ||
        phase === 'drop-reveal' || phase === 'codex' || phase === 'actions') && (
        <div className="mb-6 space-y-2" style={{ animation: 'fadeIn 0.5s' }}>
          {metrics.map((m, i) => (
            <div key={i} className="flex justify-between gap-4 font-pixel text-[9px]">
              <span className="text-text-secondary">{m.label}</span>
              <span className="text-text-primary">{m.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Drop approach */}
      {phase === 'drop-approach' && (
        <div className="w-32 h-44 rounded-card border-2 border-border-subtle bg-bg-surface flex items-center justify-center"
          style={{ animation: 'fadeIn 0.5s' }}
        >
          <span className="font-pixel text-2xl text-text-muted">?</span>
        </div>
      )}

      {/* Drop flip (all rarities look the same initially) */}
      {phase === 'drop-flip' && droppedItem && (
        <div
          className="w-32 h-44 rounded-card border-2 bg-bg-surface flex items-center justify-center relative overflow-hidden"
          style={{
            borderColor: 'var(--border-subtle)',
            animation: 'pulse 0.3s ease-in-out',
          }}
        >
          {/* Brief color flash mid-flip (subtle for non-legendary, barely visible for legendary) */}
          <div
            className="absolute inset-0 opacity-0"
            style={{
              backgroundColor: RARITY_COLORS[droppedItem.rarity],
              animation: 'fadeIn 0.1s ease-in 0.1s',
            }}
          />
          <span className="font-pixel text-2xl text-text-muted">?</span>
        </div>
      )}

      {/* Legendary dramatic reveal */}
      {phase === 'drop-legendary' && droppedItem && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-60">
          {/* Card slams down */}
          <div
            className="w-40 h-56 rounded-card border-4 bg-bg-surface flex flex-col items-center justify-center p-4 relative"
            style={{
              borderColor: RARITY_COLORS.legendary,
              animation: 'slam 0.5s ease-out, goldShockwave 1s ease-out 0.5s',
              boxShadow: `0 0 40px ${RARITY_COLORS.legendary}80`,
            }}
          >
            {/* Gold particles */}
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  backgroundColor: RARITY_COLORS.legendary,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `fadeIn ${0.2 + Math.random() * 0.5}s ease-out ${Math.random() * 2}s infinite`,
                }}
              />
            ))}
            <span className="text-3xl mb-2">✦</span>
            <p className="font-pixel text-[8px] text-rarity-legendary text-center leading-relaxed">
              {droppedItem.name.split('').map((char, i) => (
                <span
                  key={i}
                  style={{
                    animation: `fadeIn 0.1s ease-out ${i * 0.08}s both`,
                  }}
                >
                  {char}
                </span>
              ))}
            </p>
            <span className="font-pixel text-[7px] text-text-muted mt-2 uppercase">
              {droppedItem.type}
            </span>
          </div>
          {/* Light rays */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${RARITY_COLORS.legendary}20 0%, transparent 60%)`,
            }}
          />
        </div>
      )}

      {/* Normal drop reveal */}
      {phase === 'drop-reveal' && droppedItem && droppedItem.rarity !== 'legendary' && (
        <div
          className="w-32 h-44 rounded-card border-2 bg-bg-surface flex flex-col items-center justify-center p-3"
          style={{
            borderColor: RARITY_COLORS[droppedItem.rarity],
            animation: 'fadeIn 0.3s',
          }}
        >
          <span className="text-2xl mb-2">✦</span>
          <p className="font-pixel text-[8px] text-center leading-relaxed" style={{ color: RARITY_COLORS[droppedItem.rarity] }}>
            {droppedItem.name}
          </p>
          <span className="font-pixel text-[7px] text-text-muted mt-1 uppercase">{droppedItem.type}</span>
          <span
            className="font-pixel text-[7px] mt-1 uppercase"
            style={{ color: RARITY_COLORS[droppedItem.rarity] }}
          >
            {droppedItem.rarity}
          </span>
        </div>
      )}

      {/* Legendary in normal reveal phase (after dramatic) */}
      {phase === 'drop-reveal' && droppedItem && droppedItem.rarity === 'legendary' && (
        <div
          className="w-32 h-44 rounded-card border-2 bg-bg-surface flex flex-col items-center justify-center p-3"
          style={{
            borderColor: RARITY_COLORS.legendary,
            boxShadow: `0 0 20px ${RARITY_COLORS.legendary}40`,
          }}
        >
          <span className="text-2xl mb-2">✦</span>
          <p className="font-pixel text-[8px] text-rarity-legendary text-center leading-relaxed">
            {droppedItem.name}
          </p>
          <span className="font-pixel text-[7px] text-text-muted mt-1 uppercase">{droppedItem.type}</span>
          <span className="font-pixel text-[7px] text-rarity-legendary mt-1 uppercase">LEGENDARY</span>
        </div>
      )}

      {/* Codex unlock */}
      {phase === 'codex' && codexUnlock && (
        <div className="mt-6 text-center" style={{ animation: 'fadeIn 0.5s' }}>
          <div className="inline-flex items-center gap-2 mb-3" style={{ animation: 'pulse 1s infinite' }}>
            <span className="text-2xl">📖</span>
            <span className="font-pixel text-[10px] text-border-active">New Codex Entry</span>
          </div>
          <p className="font-pixel text-[9px] text-text-primary mb-4">{codexUnlock.title}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewCodex?.(codexUnlock.id);
              }}
              className="btn btn-primary text-[9px]"
            >
              View Now
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPhase('actions');
              }}
              className="btn text-[9px]"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {phase === 'actions' && (
        <div className="mt-8 flex flex-col gap-3 w-full max-w-xs" style={{ animation: 'fadeIn 0.5s' }}>
          <button onClick={onReplay} className="btn w-full text-[10px]">
            Replay
          </button>
          <button onClick={onNext} className="btn btn-primary w-full text-[10px]">
            Next Scene
          </button>
          <button onClick={onHome} className="btn w-full text-[10px]">
            Home
          </button>
        </div>
      )}

      {/* Skip hint */}
      {canSkip && phase !== 'actions' && phase !== 'codex' && phase !== 'drop-flip' &&
        phase !== 'drop-legendary' && phase !== 'drop-reveal' && (
        <p className="absolute bottom-8 font-pixel text-[7px] text-text-muted">Tap to skip</p>
      )}
    </div>
  );
}
