'use client';

import React from 'react';
import { chromaToHex } from './types';
import type { ChromaColor } from './types';

/* ------------------------------------------------------------------ */
/*  Cuttlefish body — continuous pattern/texture driven by 0-100 vals  */
/* ------------------------------------------------------------------ */

export function CuttlefishBody({ color, pattern, texture, result }: {
  color: ChromaColor;
  pattern: number;   // 0-100: uniform → mottled → disruptive
  texture: number;   // 0-100: smooth → papillate
  result: 'safe' | 'detected' | null;
}) {
  const hex = chromaToHex(color);
  // How much mottled vs disruptive to show
  const mottledAmount = pattern < 50 ? pattern / 50 : (100 - pattern) / 50; // peaks at 50
  const disruptiveAmount = pattern > 50 ? (pattern - 50) / 50 : 0; // ramps up after 50
  const bumpCount = Math.round((texture / 100) * 16);
  const bumpSize = 3 + (texture / 100) * 3;

  return (
    <div className="relative" style={{ width: 80, height: 56 }}>
      <div style={{
        width: '100%', height: '100%',
        background: hex,
        borderRadius: '50% 50% 40% 40%',
        position: 'relative', overflow: 'hidden',
        transition: 'background-color 0.25s',
        boxShadow: result === 'detected'
          ? '0 0 24px rgba(239,83,80,0.7)'
          : result === 'safe'
          ? '0 0 18px rgba(102,187,106,0.5)'
          : '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        {/* Mottled overlay — dappled spots */}
        {mottledAmount > 0.05 && <>
          <div className="absolute" style={{ top: '8%', left: '12%', width: '28%', height: '32%', background: `rgba(0,0,0,${0.25 * mottledAmount})`, borderRadius: '50%' }} />
          <div className="absolute" style={{ top: '15%', right: '15%', width: '22%', height: '28%', background: `rgba(255,255,255,${0.15 * mottledAmount})`, borderRadius: '50%' }} />
          <div className="absolute" style={{ bottom: '12%', left: '30%', width: '35%', height: '22%', background: `rgba(0,0,0,${0.2 * mottledAmount})`, borderRadius: '50%' }} />
          <div className="absolute" style={{ top: '45%', left: '55%', width: '18%', height: '20%', background: `rgba(0,0,0,${0.15 * mottledAmount})`, borderRadius: '50%' }} />
        </>}

        {/* Disruptive overlay — bold high-contrast patches */}
        {disruptiveAmount > 0.05 && <>
          <div className="absolute" style={{ top: 0, left: 0, width: '42%', height: '55%', background: `rgba(0,0,0,${0.4 * disruptiveAmount})`, borderRadius: '0 0 80% 0' }} />
          <div className="absolute" style={{ bottom: 0, right: 0, width: '48%', height: '50%', background: `rgba(255,255,255,${0.2 * disruptiveAmount})`, borderRadius: '80% 0 0 0' }} />
          <div className="absolute" style={{ top: '20%', right: '10%', width: '25%', height: '30%', background: `rgba(0,0,0,${0.25 * disruptiveAmount})`, borderRadius: '50%' }} />
        </>}

        {/* Papillae bumps — more and bigger as texture increases */}
        {bumpCount > 0 && [...Array(bumpCount)].map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{
            left: `${8 + (i % 4) * 22}%`,
            top: `${12 + Math.floor(i / 4) * 20}%`,
            width: bumpSize, height: bumpSize,
            background: `rgba(255,255,255,${0.12 + (texture / 100) * 0.1})`,
            boxShadow: `0 1px ${1 + texture / 50}px rgba(0,0,0,0.25)`,
          }} />
        ))}

        {/* Eyes */}
        <div className="absolute" style={{ top: '20%', left: '20%', width: 7, height: 8, background: '#111', borderRadius: '50%' }} />
        <div className="absolute" style={{ top: '20%', right: '20%', width: 7, height: 8, background: '#111', borderRadius: '50%' }} />
        <div className="absolute" style={{ top: '24%', left: '21%', width: 5, height: 2, background: '#333', borderRadius: '0 0 50% 50%' }} />
        <div className="absolute" style={{ top: '24%', right: '21%', width: 5, height: 2, background: '#333', borderRadius: '0 0 50% 50%' }} />
      </div>

      {/* Tentacles */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-[2px]">
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            width: 3, height: 8 + (i % 2) * 3,
            background: hex, borderRadius: '0 0 2px 2px',
            opacity: 0.7, transition: 'background-color 0.25s',
          }} />
        ))}
      </div>
    </div>
  );
}
