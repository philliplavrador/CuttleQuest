'use client';

import React, { useRef, useCallback } from 'react';
import { sfxTap } from '@/lib/audio';
import { clamp, OXY_SWEET_LOW, OXY_SWEET_HIGH } from './types';
import type { EggZone } from './types';

/* ------------------------------------------------------------------ */
/*  Minimal top bar — just egg count + day, super compact              */
/* ------------------------------------------------------------------ */

export function TopBar({ eggsAlive, day, totalDays, survivalPct, onPause }: {
  eggsAlive: number;
  day: number;
  totalDays: number;
  survivalPct: number;
  onPause: () => void;
}) {
  const eggColor = survivalPct >= 80 ? '#66bb6a' : survivalPct >= 60 ? '#ffa726' : '#ef5350';
  const clampedDay = Math.min(day, totalDays);
  const dayPct = (clampedDay / totalDays) * 100;
  const daysLeft = totalDays - clampedDay;

  return (
    <div className="px-3 py-2" style={{ paddingLeft: '56px' }}>
      {/* Top row: eggs + pause */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-sm">🥚</span>
          <span className="font-pixel text-[10px]" style={{ color: eggColor }}>{eggsAlive}</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${survivalPct}%`, background: eggColor }} />
          </div>
        </div>
        <button onClick={onPause}
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 active:scale-90"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <span className="text-sm">⏸️</span>
        </button>
      </div>
      {/* Day progress bar */}
      <div className="flex items-center gap-2 mt-1.5">
        <div className="flex-1 h-2.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${dayPct}%`,
              background: daysLeft <= 5
                ? 'linear-gradient(90deg, #42a5f5, #66bb6a)'
                : 'linear-gradient(90deg, #1a3a5c, #42a5f5)',
            }} />
        </div>
        <span className="font-pixel text-[9px] shrink-0" style={{
          color: daysLeft <= 5 ? '#66bb6a' : '#90caf9',
        }}>
          {daysLeft > 0 ? `${daysLeft}d left` : 'Done!'}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bottom control panel — fan slider + zone toggle side by side       */
/* ------------------------------------------------------------------ */

export function BottomControls({ fanSpeed, oxygenation, oxyColor, onFanChange, zone, temperature, tempColor, onZoneToggle }: {
  fanSpeed: number;
  oxygenation: number;
  oxyColor: string;
  onFanChange: (speed: number) => void;
  zone: EggZone;
  temperature: number;
  tempColor: string;
  onZoneToggle: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const updateFromPointer = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    onFanChange(Math.round(pct));
  }, [onFanChange]);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    updateFromPointer(e.touches[0].clientX);
  }, [updateFromPointer]);

  const handleMouse = useCallback((e: React.MouseEvent) => {
    if (e.buttons === 1) updateFromPointer(e.clientX);
  }, [updateFromPointer]);

  const isSunny = zone === 'sunny';
  const oxyInSweet = oxygenation >= OXY_SWEET_LOW && oxygenation <= OXY_SWEET_HIGH;
  const tempInRange = temperature >= 20 && temperature <= 25;

  return (
    <div className="px-3 pt-2 pb-4" style={{ background: 'rgba(8,6,18,0.95)' }}>
      {/* Fan / O2 slider */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">🌊</span>
            <span className="font-pixel text-[7px] text-text-muted">Fan your eggs</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{
              background: oxyInSweet ? 'rgba(102,187,106,0.12)' : 'rgba(239,83,80,0.12)',
              border: `1px solid ${oxyInSweet ? 'rgba(102,187,106,0.2)' : 'rgba(239,83,80,0.2)'}`,
            }}>
            <span className="font-pixel text-[8px]" style={{ color: oxyColor }}>
              O2 {Math.round(oxygenation)}%
            </span>
            <span className="text-[8px]">{oxyInSweet ? '✅' : '⚠️'}</span>
          </div>
        </div>

        <div
          ref={trackRef}
          className="relative h-10 rounded-xl overflow-hidden cursor-pointer touch-none"
          style={{
            background: 'linear-gradient(90deg, #1a1030, #152040, #1a1030)',
            border: '1.5px solid rgba(100,150,255,0.1)',
          }}
          onTouchStart={handleTouch}
          onTouchMove={handleTouch}
          onMouseDown={(e) => updateFromPointer(e.clientX)}
          onMouseMove={handleMouse}
        >
          {/* Sweet spot zone */}
          <div className="absolute inset-y-0 rounded-lg"
            style={{
              left: `${OXY_SWEET_LOW}%`,
              width: `${OXY_SWEET_HIGH - OXY_SWEET_LOW}%`,
              background: 'rgba(102,187,106,0.08)',
              borderLeft: '1px dashed rgba(102,187,106,0.2)',
              borderRight: '1px dashed rgba(102,187,106,0.2)',
            }}>
          </div>

          {/* Animated water streaks that respond to fan speed */}
          {fanSpeed > 10 && Array.from({ length: Math.min(Math.floor(fanSpeed / 15), 6) }).map((_, i) => (
            <div key={i} className="absolute pointer-events-none"
              style={{
                top: `${15 + (i * 37) % 70}%`,
                left: '-20%',
                width: '140%',
                height: '1px',
                background: `linear-gradient(90deg, transparent, rgba(100,180,255,${0.05 + fanSpeed * 0.002}), transparent)`,
                animation: `waterFlow ${1.5 - fanSpeed * 0.008}s linear infinite`,
                animationDelay: `${i * 0.2}s`,
              }} />
          ))}

          {/* O2 level indicator needle */}
          <div className="absolute top-1 bottom-1 w-0.5 pointer-events-none transition-all duration-300"
            style={{
              left: `${clamp(oxygenation, 1, 99)}%`,
              background: oxyColor,
              borderRadius: '1px',
              boxShadow: `0 0 4px ${oxyColor}`,
              opacity: 0.5,
            }} />

          {/* Drag handle */}
          <div className="absolute top-1/2 -translate-y-1/2 pointer-events-none transition-[left] duration-75 z-10"
            style={{ left: `${clamp(fanSpeed, 4, 96)}%` }}>
            <div className="w-9 h-9 -ml-[18px] rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #c0d8ff, #8ab0e0)',
                border: '2.5px solid rgba(255,255,255,0.85)',
                boxShadow: '0 2px 10px rgba(80,140,255,0.35)',
              }}>
              <span className="text-sm">💨</span>
            </div>
          </div>

          {/* Zone labels */}
          <div className="absolute left-2 inset-y-0 flex items-center">
            <span className="font-pixel text-[5px] text-red-400/30">LOW</span>
          </div>
          <div className="absolute right-2 inset-y-0 flex items-center">
            <span className="font-pixel text-[5px] text-red-400/30">HIGH</span>
          </div>
        </div>
      </div>

      {/* Zone toggle */}
      <button
        onClick={() => { sfxTap(); onZoneToggle(); }}
        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl transition-all active:scale-[0.97]"
        style={{
          background: isSunny
            ? 'linear-gradient(135deg, rgba(255,200,100,0.1), rgba(255,160,50,0.05))'
            : 'linear-gradient(135deg, rgba(80,160,240,0.1), rgba(40,120,200,0.05))',
          border: `1.5px solid ${isSunny ? 'rgba(255,183,77,0.2)' : 'rgba(66,165,245,0.2)'}`,
        }}>
        <span className="text-lg">{isSunny ? '☀️' : '🌙'}</span>
        <div className="flex-1 text-left">
          <span className="font-pixel text-[7px]" style={{ color: isSunny ? '#ffa726' : '#42a5f5' }}>
            {isSunny ? 'In Sunlight' : 'In Shade'}
          </span>
          <span className="text-[10px] text-text-muted ml-2">tap to move</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{
            background: tempInRange ? 'rgba(102,187,106,0.12)' : 'rgba(239,83,80,0.12)',
            border: `1px solid ${tempInRange ? 'rgba(102,187,106,0.2)' : 'rgba(239,83,80,0.2)'}`,
          }}>
          <span className="text-[10px]">🌡️</span>
          <span className="font-pixel text-[8px]" style={{ color: tempColor }}>{temperature.toFixed(1)}°</span>
          <span className="text-[8px]">{tempInRange ? '✅' : '⚠️'}</span>
        </div>
      </button>
    </div>
  );
}
