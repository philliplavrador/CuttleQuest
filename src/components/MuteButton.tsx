'use client';

import React, { useState, useEffect } from 'react';
import { getMuted, setMuted } from '@/lib/audio';

export default function MuteButton() {
  const [mounted, setMounted] = useState(false);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMutedState(getMuted());
  }, []);

  // Render nothing on server to avoid hydration mismatch
  if (!mounted) return null;

  return (
    <button
      onClick={() => {
        const next = !muted;
        setMuted(next);
        setMutedState(next);
      }}
      className="w-[44px] h-[44px] flex items-center justify-center glass-btn text-lg cursor-pointer"
      aria-label={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
