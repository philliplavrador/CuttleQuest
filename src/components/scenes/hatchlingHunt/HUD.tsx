'use client';

import React from 'react';
import { MAX_ENERGY, ARENA_W } from './types';

export function HuntHUD({ energy, catches, catchesNeeded, predatorActive, onPause }: {
  energy: number;
  catches: number;
  catchesNeeded: number;
  predatorActive: boolean;
  onPause: () => void;
}) {
  return (
    <div style={{
      width: '100%',
      maxWidth: ARENA_W,
      padding: '8px 12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '2px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-surface)',
      zIndex: 25,
    }}>
      {/* Energy */}
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <span className="font-pixel" style={{ fontSize: 8, color: 'var(--text-muted)', marginRight: 4 }}>NRG</span>
        {Array.from({ length: MAX_ENERGY }).map((_, i) => (
          <div key={i} style={{
            width: 8,
            height: 14,
            borderRadius: 2,
            backgroundColor: i < energy ? 'var(--success)' : 'var(--border-subtle)',
            transition: 'background-color 0.2s',
          }} />
        ))}
      </div>

      {/* Catches + danger indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {predatorActive && (
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#ef5350',
            animation: 'pulse 0.6s infinite',
            boxShadow: '0 0 6px rgba(239,83,80,0.6)',
          }} />
        )}
        <span className="font-pixel" style={{ fontSize: 9, color: 'var(--text-primary)' }}>
          {catches}/{catchesNeeded}
        </span>
      </div>

      {/* Pause */}
      <button
        onClick={onPause}
        style={{
          width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'transparent',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8, cursor: 'pointer',
          color: 'var(--text-primary)',
        }}
      >
        <span className="font-pixel" style={{ fontSize: 10 }}>II</span>
      </button>
    </div>
  );
}

export function OrganismLegend() {
  return (
    <div style={{
      width: '100%',
      maxWidth: ARENA_W,
      padding: '6px 12px',
      display: 'flex',
      justifyContent: 'center',
      gap: 16,
      backgroundColor: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-subtle)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 10, height: 5, backgroundColor: '#f0a0b0', borderRadius: 2 }} />
        <span className="font-pixel" style={{ fontSize: 6, color: 'var(--text-muted)' }}>Mysid</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 6, height: 6, backgroundColor: '#90d0f0', borderRadius: '50%' }} />
        <span className="font-pixel" style={{ fontSize: 6, color: 'var(--text-muted)' }}>Copepod</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 9, height: 6, backgroundColor: '#c0a060', borderRadius: '40%' }} />
        <span className="font-pixel" style={{ fontSize: 6, color: 'var(--text-muted)' }}>Amphipod</span>
      </div>
    </div>
  );
}

export function PauseOverlay({ onResume }: { onResume: () => void }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundColor: 'rgba(13,13,26,0.85)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 50,
    }}>
      <h2 className="font-pixel" style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 24 }}>
        PAUSED
      </h2>
      <button
        onClick={onResume}
        className="btn btn-primary"
        style={{ fontSize: 10, minWidth: 140 }}
      >
        Resume
      </button>
    </div>
  );
}
