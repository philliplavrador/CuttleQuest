'use client';

import React, { useCallback, useRef } from 'react';
import type { ChromaColor } from './types';
import { clamp, patternLabel, textureLabel } from './types';

/* ------------------------------------------------------------------ */
/*  Generic slider                                                     */
/* ------------------------------------------------------------------ */

function CamoSlider({ emoji, value, gradient, label, onChange }: {
  emoji: string;
  value: number;
  gradient: string;
  label: string;
  onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const update = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    onChange(Math.round(pct));
  }, [onChange]);

  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-sm w-5 text-center">{emoji}</span>
      <div
        ref={trackRef}
        className="flex-1 h-8 rounded-lg relative cursor-pointer touch-none overflow-hidden"
        style={{
          background: gradient,
          border: '1.5px solid rgba(255,255,255,0.08)',
        }}
        onTouchStart={e => update(e.touches[0].clientX)}
        onTouchMove={e => update(e.touches[0].clientX)}
        onMouseDown={e => update(e.clientX)}
        onMouseMove={e => { if (e.buttons === 1) update(e.clientX); }}
      >
        {/* Thumb */}
        <div className="absolute top-1 bottom-1 pointer-events-none transition-[left] duration-75"
          style={{ left: `${clamp(value, 2, 98)}%` }}>
          <div className="w-6 h-full -ml-3 rounded-md flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            <span className="font-pixel text-[5px] text-gray-800">{value}</span>
          </div>
        </div>
      </div>
      <span className="font-pixel text-[6px] text-text-muted w-16 text-right">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chromatophore sliders — 3 pigment layers                           */
/* ------------------------------------------------------------------ */

export function ChromaSliders({ color, onChange }: {
  color: ChromaColor;
  onChange: (c: ChromaColor) => void;
}) {
  return (
    <div>
      <CamoSlider emoji="🔴" value={color.red}
        gradient="linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgb(200,60,40) 100%)"
        label="Red" onChange={v => onChange({ ...color, red: v })} />
      <CamoSlider emoji="🟡" value={color.yellow}
        gradient="linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgb(200,180,40) 100%)"
        label="Yellow" onChange={v => onChange({ ...color, yellow: v })} />
      <CamoSlider emoji="🟤" value={color.brown}
        gradient="linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgb(80,50,20) 100%)"
        label="Brown" onChange={v => onChange({ ...color, brown: v })} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pattern slider — uniform ↔ mottled ↔ disruptive                    */
/* ------------------------------------------------------------------ */

export function PatternSlider({ value, onChange }: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <CamoSlider emoji="🔲" value={value}
      gradient="linear-gradient(90deg, rgba(140,140,180,0.15) 0%, rgba(140,140,180,0.3) 50%, rgba(140,140,180,0.5) 100%)"
      label={patternLabel(value)} onChange={onChange} />
  );
}

/* ------------------------------------------------------------------ */
/*  Texture slider — smooth ↔ papillate                                */
/* ------------------------------------------------------------------ */

export function TextureSlider({ value, onChange }: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <CamoSlider emoji="🪨" value={value}
      gradient="linear-gradient(90deg, rgba(200,200,220,0.1) 0%, rgba(160,130,100,0.4) 100%)"
      label={textureLabel(value)} onChange={onChange} />
  );
}
