'use client';

import React, { useEffect } from 'react';
import { sfxFactCard } from '@/lib/audio';

interface FactCardProps {
  term: string;
  explanation: string;
  onDismiss: () => void;
}

export default function FactCard({ term, explanation, onDismiss }: FactCardProps) {
  useEffect(() => {
    sfxFactCard();
  }, []);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-6"
      style={{ animation: 'slideUp 0.4s ease-out' }}
    >
      <div className="card max-w-md mx-auto border-border-active">
        <h3 className="font-pixel text-sm text-rarity-legendary mb-3 leading-relaxed">
          {term}
        </h3>
        <p className="text-text-secondary font-body text-sm leading-relaxed mb-4">
          {explanation}
        </p>
        <button
          onClick={onDismiss}
          className="btn btn-primary w-full text-[10px]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
