'use client';

import React from 'react';
import { PredatorSprite, KENNEY_FISH, UnderwaterBg, AmbientFish } from '@/components/sprites';
import CuttlefishAvatar from '@/components/cuttlefishAvatar';
import {
  Organism, Predator, CoverZone, ORGANISM_CONFIGS, PREDATOR_CONFIGS,
  STRIKE_RANGE, JOYSTICK_RADIUS, ARENA_W,
  dist,
} from './types';

// --- Organism rendering ---

export function RenderOrganism({ org, playerX, playerY }: {
  org: Organism;
  playerX: number;
  playerY: number;
}) {
  if (!org.alive) return null;
  const cfg = ORGANISM_CONFIGS[org.type];
  const inRange = dist(playerX, playerY, org.x, org.y) < STRIKE_RANGE;

  return (
    <div
      style={{
        position: 'absolute',
        left: org.x - cfg.width / 2,
        top: org.y - cfg.height / 2,
        width: cfg.width,
        height: cfg.height,
        zIndex: 5,
        transition: 'none',
      }}
    >
      {org.type === 'mysid' && (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <div style={{
            width: '100%', height: '60%',
            backgroundColor: cfg.color,
            borderRadius: '40% 40% 20% 20%',
            opacity: org.paused ? 0.9 : 1,
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: '20%',
            width: '25%', height: '50%',
            backgroundColor: cfg.color, borderRadius: '0 0 2px 2px',
            transform: 'rotate(-15deg)',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, right: '20%',
            width: '25%', height: '50%',
            backgroundColor: cfg.color, borderRadius: '0 0 2px 2px',
            transform: 'rotate(15deg)',
          }} />
        </div>
      )}
      {org.type === 'copepod' && (
        <div style={{
          width: cfg.width, height: cfg.height,
          backgroundColor: cfg.color, borderRadius: '50%',
          opacity: org.paused ? 0.8 : 1,
        }} />
      )}
      {org.type === 'amphipod' && (
        <div style={{
          width: cfg.width, height: cfg.height,
          backgroundColor: cfg.color, borderRadius: '60% 40% 40% 60%',
          transform: `rotate(${org.vx > 0 ? 15 : -15}deg)`,
          opacity: org.paused ? 0.85 : 1,
        }} />
      )}
      {inRange && (
        <div style={{
          position: 'absolute', top: -4, left: '50%',
          transform: 'translateX(-50%)',
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: org.type === 'mysid' ? 'var(--success)' : 'var(--warning)',
          animation: 'pulse 0.5s infinite',
        }} />
      )}
    </div>
  );
}

// --- Player rendering (uses the player's actual CuttlefishAvatar) ---

export function RenderPlayer({ x, y, strikeFlash, stunned, hidden, equipped }: {
  x: number;
  y: number;
  strikeFlash: boolean;
  stunned: boolean;
  hidden: boolean;
  equipped?: { color: string | null; pattern: string | null; fin: string | null; mantle: string | null };
}) {
  let filter = 'drop-shadow(0 0 4px rgba(176,144,208,0.4))';
  let opacity = 1;
  if (strikeFlash) {
    filter = 'brightness(2) drop-shadow(0 0 8px #fff)';
  } else if (stunned) {
    filter = 'brightness(0.5) saturate(0.3) drop-shadow(0 0 6px rgba(239,83,80,0.6))';
    opacity = 0.6;
  } else if (hidden) {
    filter = 'brightness(0.7) saturate(0.5) drop-shadow(0 0 4px rgba(102,187,106,0.5))';
    opacity = 0.5;
  }

  return (
    <div style={{
      position: 'absolute',
      left: x - 24, top: y - 24,
      width: 48, height: 48,
      zIndex: 10,
      pointerEvents: 'none',
    }}>
      <div style={{
        filter,
        transition: 'filter 0.15s, opacity 0.2s',
        opacity,
      }}>
        <CuttlefishAvatar
          size={48}
          stage="hatchling"
          equipped={equipped}
          animate={!stunned}
        />
      </div>
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: STRIKE_RANGE * 2, height: STRIKE_RANGE * 2,
        borderRadius: '50%',
        border: '1px dashed rgba(176,144,208,0.2)',
        pointerEvents: 'none',
      }} />
      {hidden && (
        <div style={{
          position: 'absolute', top: -14, left: '50%',
          transform: 'translateX(-50%)',
          padding: '1px 6px', borderRadius: 4,
          backgroundColor: 'rgba(102,187,106,0.85)',
          pointerEvents: 'none',
        }}>
          <span className="font-pixel" style={{ fontSize: 6, color: '#fff' }}>HIDDEN</span>
        </div>
      )}
    </div>
  );
}

// --- Predator rendering ---

export function RenderPredator({ pred }: { pred: Predator }) {
  if (!pred.active) return null;
  const cfg = PREDATOR_CONFIGS[pred.type];
  const flip = pred.vx < 0;

  return (
    <div style={{
      position: 'absolute',
      left: pred.x - cfg.size / 2,
      top: pred.y - cfg.size / 2,
      width: cfg.size,
      height: cfg.size,
      zIndex: 8,
      transition: 'none',
      pointerEvents: 'none',
    }}>
      {pred.type === 'wrasse' ? (
        <img
          src={KENNEY_FISH.fish_red}
          alt=""
          style={{
            width: cfg.size,
            height: cfg.size,
            objectFit: 'contain',
            transform: flip ? 'scaleX(-1)' : 'none',
            filter: 'drop-shadow(0 0 6px rgba(239,83,80,0.5))',
          }}
        />
      ) : (
        <PredatorSprite
          creature="crab"
          size={cfg.size}
          animate
          flip={flip}
          style={{ filter: 'drop-shadow(0 0 6px rgba(239,83,80,0.5))' }}
        />
      )}
      {/* Danger ring around predator */}
      <div style={{
        position: 'absolute',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: cfg.size + 12, height: cfg.size + 12,
        borderRadius: '50%',
        border: '1.5px solid rgba(239,83,80,0.35)',
        animation: 'pulse 1s infinite',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// --- Joystick rendering ---

export function RenderJoystick({ joy, onTouchStart, onTouchMove, onTouchEnd, onMouseDown }: {
  joy: { active: boolean; originX: number; originY: number; dx: number; dy: number };
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 10, left: 10,
        width: JOYSTICK_RADIUS * 2 + 20,
        height: JOYSTICK_RADIUS * 2 + 20,
        touchAction: 'none',
        zIndex: 20,
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
    >
      {joy.active && (
        <>
          <div style={{
            position: 'absolute',
            left: joy.originX - JOYSTICK_RADIUS,
            top: joy.originY - JOYSTICK_RADIUS,
            width: JOYSTICK_RADIUS * 2,
            height: JOYSTICK_RADIUS * 2,
            borderRadius: '50%',
            border: '2px solid rgba(176,144,208,0.3)',
            backgroundColor: 'rgba(13,13,26,0.4)',
          }} />
          <div style={{
            position: 'absolute',
            left: joy.originX + joy.dx - 18,
            top: joy.originY + joy.dy - 18,
            width: 36, height: 36,
            borderRadius: '50%',
            backgroundColor: 'rgba(176,144,208,0.5)',
            border: '2px solid rgba(176,144,208,0.7)',
          }} />
        </>
      )}
      {!joy.active && (
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.3, textAlign: 'center',
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: '50%',
            border: '2px dashed var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="font-pixel" style={{ fontSize: 7, color: 'var(--text-muted)' }}>MOVE</span>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Stun overlay ---

export function StunOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      boxShadow: 'inset 0 0 60px 20px rgba(239,83,80,0.3)',
      pointerEvents: 'none',
      zIndex: 28,
      animation: 'pulse 0.8s infinite',
    }} />
  );
}

// --- Background ---

export function RenderBackground() {
  return (
    <>
      <UnderwaterBg brightness={0.4} />
      <AmbientFish count={2} />
    </>
  );
}

// --- Cover zones (kelp forests, rock crevices) ---

export function RenderCoverZone({ zone, playerNearby }: { zone: CoverZone; playerNearby: boolean }) {
  const isKelp = zone.type === 'kelp';

  return (
    <div style={{
      position: 'absolute',
      left: zone.x, top: zone.y,
      width: zone.width, height: zone.height,
      zIndex: 3,
      pointerEvents: 'none',
    }}>
      {isKelp ? (
        // Kelp forest — multiple wavy strands
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {[0, 0.25, 0.5, 0.75, 1].map((offset, i) => (
            <img
              key={i}
              src={KENNEY_FISH[i % 2 === 0 ? 'seaweed_green_a' : 'seaweed_green_b']}
              alt=""
              style={{
                position: 'absolute',
                left: `${offset * 70}%`,
                bottom: 0,
                width: 18 + (i % 3) * 4,
                height: zone.height * (0.7 + (i % 3) * 0.15),
                objectFit: 'contain',
                opacity: 0.85,
                filter: playerNearby ? 'brightness(1.3) drop-shadow(0 0 4px rgba(102,187,106,0.5))' : 'none',
                transition: 'filter 0.3s',
              }}
            />
          ))}
        </div>
      ) : (
        // Rock crevice
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {[0, 0.5].map((offset, i) => (
            <img
              key={i}
              src={KENNEY_FISH[i === 0 ? 'rock_a' : 'rock_b']}
              alt=""
              style={{
                position: 'absolute',
                left: `${offset * 50}%`,
                bottom: 0,
                width: zone.width * 0.6,
                height: zone.height,
                objectFit: 'contain',
                opacity: 0.9,
                filter: playerNearby ? 'brightness(1.2) drop-shadow(0 0 4px rgba(102,187,106,0.5))' : 'none',
                transition: 'filter 0.3s',
              }}
            />
          ))}
        </div>
      )}
      {/* Safe zone indicator ring */}
      {playerNearby && (
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: zone.width + 16, height: zone.height + 16,
          borderRadius: 12,
          border: '1.5px solid rgba(102,187,106,0.4)',
          animation: 'pulse 1.2s infinite',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

// --- Strike zone ---

export function StrikeZone({ onStrike }: { onStrike: () => void }) {
  return (
    <div
      style={{
        position: 'absolute', top: 0, right: 0,
        width: '50%', height: '100%',
        zIndex: 15, cursor: 'crosshair',
      }}
      onClick={onStrike}
      onTouchEnd={(e) => { e.preventDefault(); onStrike(); }}
    >
      <div style={{
        position: 'absolute', bottom: 20, right: 20,
        opacity: 0.25, textAlign: 'center',
      }}>
        <div style={{
          width: 50, height: 50, borderRadius: '50%',
          border: '2px dashed var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="font-pixel" style={{ fontSize: 7, color: 'var(--text-muted)' }}>TAP</span>
        </div>
      </div>
    </div>
  );
}

// --- Strike flash overlay ---

export function StrikeFlashOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundColor: 'rgba(255,255,255,0.1)',
      pointerEvents: 'none', zIndex: 29,
    }} />
  );
}

// --- Feedback popup ---

export function FeedbackPopup({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'absolute', top: '40%', left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '8px 16px', borderRadius: 8,
      backgroundColor: type === 'success' ? 'rgba(59,109,17,0.9)' : 'rgba(163,45,45,0.9)',
      border: `2px solid ${type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
      zIndex: 30, animation: 'fadeIn 0.2s',
      pointerEvents: 'none',
    }}>
      <span className="font-pixel" style={{ fontSize: 9, color: '#fff', whiteSpace: 'nowrap' }}>
        {message}
      </span>
    </div>
  );
}
