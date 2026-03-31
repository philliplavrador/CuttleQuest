'use client';

import React from 'react';

interface FailureScreenProps {
  sceneTitle: string;
  failReason: string;
  biologyExplanation: string;
  attemptNumber: number;
  onRetry: () => void;
  onHome: () => void;
  onSkipToRetry: () => void;
}

export default function FailureScreen({
  sceneTitle,
  failReason,
  biologyExplanation,
  attemptNumber,
  onRetry,
  onHome,
  onSkipToRetry,
}: FailureScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-bg-dark flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h2 className="font-pixel text-sm text-danger mb-4">MISSION FAILED</h2>
        <p className="font-pixel text-[10px] text-text-primary mb-6">{sceneTitle}</p>

        <div className="card mb-6 text-left">
          <h3 className="font-pixel text-[9px] text-warning mb-3">What went wrong</h3>
          <p className="text-text-secondary text-sm mb-4">{failReason}</p>

          <h3 className="font-pixel text-[9px] text-border-active mb-3">The biology</h3>
          <p className="text-text-secondary text-sm">{biologyExplanation}</p>
        </div>

        <p className="font-pixel text-[7px] text-text-muted mb-6">Attempt #{attemptNumber}</p>

        <div className="flex flex-col gap-3">
          <button onClick={onRetry} className="btn btn-primary w-full text-[10px]">
            Retry (Briefing)
          </button>
          <button onClick={onSkipToRetry} className="btn w-full text-[10px]">
            Skip to Retry
          </button>
          <button onClick={onHome} className="btn w-full text-[10px]">
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
