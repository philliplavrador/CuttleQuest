'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { sfxTap, sfxCorrect, sfxWrong } from '@/lib/audio';
import type { SceneProps, HabitatOption } from './habitat/types';
import { selectQuestions, starsFromCorrect, labelForStars, getWorstDanger } from './habitat/types';
import UnderwaterCanvas from './habitat/UnderwaterCanvas';
import HabitatArt from './habitat/HabitatArt';
import SpotDanger from './habitat/SpotDanger';

type Phase = 'choosing' | 'explained' | 'spotDanger' | 'transitioning';

/* ------------------------------------------------------------------ */
/*  Exploration flavor text (rotates per question)                     */
/* ------------------------------------------------------------------ */

const FLAVOR_LINES = [
  'Exploring the reef...',
  'Deeper waters ahead...',
  'A sheltered cove nearby...',
  'Drifting along the current...',
  'The seafloor shifts beneath you...',
  'Two overhangs catch your eye...',
  'You sense something promising...',
  'The reef opens up ahead...',
  'Following the current...',
  'Almost there...',
];

/* ------------------------------------------------------------------ */
/*  Progress dots                                                      */
/* ------------------------------------------------------------------ */

function JourneyDots({ total, results, current }: {
  total: number;
  results: (boolean | null)[];
  current: number;
}) {
  return (
    <div className="flex gap-1.5 justify-center">
      {Array.from({ length: total }, (_, i) => {
        let bg = 'rgba(255,255,255,0.12)';
        if (results[i] === true) bg = '#4ade80';
        else if (results[i] === false) bg = '#f87171';
        else if (i === current) bg = 'rgba(124,200,255,0.7)';

        return (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? '10px' : '7px',
              height: i === current ? '10px' : '7px',
              background: bg,
              boxShadow: i === current ? '0 0 6px rgba(124,200,255,0.4)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Site card (prose only — no attribute chips)                        */
/* ------------------------------------------------------------------ */

interface SiteCardProps {
  option: HabitatOption;
  selected: boolean;
  correct: boolean | null;
  onSelect: () => void;
  disabled: boolean;
}

function SiteCard({ option, selected, correct, onSelect, disabled }: SiteCardProps) {
  let borderColor = 'rgba(255,255,255,0.1)';
  let bgColor = 'rgba(10,20,40,0.55)';

  if (correct === true) {
    borderColor = '#4ade80';
    bgColor = 'rgba(74,222,128,0.1)';
  } else if (correct === false && selected) {
    borderColor = '#f87171';
    bgColor = 'rgba(248,113,113,0.1)';
  } else if (selected) {
    borderColor = 'rgba(124,200,255,0.5)';
    bgColor = 'rgba(124,200,255,0.08)';
  }

  return (
    <button
      onClick={() => { if (!disabled) { sfxTap(); onSelect(); } }}
      disabled={disabled}
      className="w-full text-left rounded-xl overflow-hidden transition-all duration-300 touch-manipulation"
      style={{
        background: bgColor,
        border: `2px solid ${borderColor}`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        opacity: disabled && correct === null ? 0.35 : 1,
      }}
    >
      {/* Habitat illustration */}
      <HabitatArt option={option} />

      <div className="px-4 pb-4 pt-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{option.emoji}</span>
          <span className="font-pixel text-[10px] text-text-primary">{option.name}</span>
          {correct === true && <span className="ml-auto text-sm">✅</span>}
          {correct === false && selected && <span className="ml-auto text-sm">❌</span>}
        </div>

        {/* Prose description */}
        <p className="text-text-secondary text-[12px] leading-relaxed">
          {option.prose}
        </p>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function EggHabitat({ onComplete, onFail, attemptNumber }: SceneProps) {
  const questions = useMemo(() => selectQuestions(attemptNumber), [attemptNumber]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<(boolean | null)[]>(
    () => new Array(questions.length).fill(null),
  );
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | null>(null);
  const [phase, setPhase] = useState<Phase>('choosing');
  const [finished, setFinished] = useState(false);
  const [dangersSpotted, setDangersSpotted] = useState(0);
  const [dangerBeats, setDangerBeats] = useState(0);

  const question = questions[currentIdx];

  const handleSelect = useCallback((answer: 'A' | 'B') => {
    if (selectedAnswer !== null) return;

    const isCorrect = answer === question.correctAnswer;
    setSelectedAnswer(answer);
    setPhase('explained');

    if (isCorrect) sfxCorrect();
    else sfxWrong();

    setResults(prev => {
      const next = [...prev];
      next[currentIdx] = isCorrect;
      return next;
    });
  }, [selectedAnswer, question, currentIdx]);

  const advanceToNext = useCallback(() => {
    if (currentIdx >= questions.length - 1) {
      setFinished(true);
      const finalCorrect = results.reduce((sum, r) => sum + (r === true ? 1 : 0), 0);
      const stars = starsFromCorrect(finalCorrect, questions.length);

      if (stars === 0) {
        onFail(
          'Too many wrong choices \u2014 the eggs didn\'t survive.',
          'Cuttlefish eggs need rough surfaces, moderate current, moderate light, distance from predators, and moderate spacing from other nests.',
        );
        return;
      }

      onComplete(stars, [
        { label: 'Correct answers', value: `${finalCorrect}/${questions.length}` },
        { label: 'Dangers spotted', value: `${dangersSpotted}/${dangerBeats}` },
        { label: 'Rating', value: labelForStars(stars) },
      ]);
      return;
    }

    // Swim transition
    setPhase('transitioning');
    setTimeout(() => {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setPhase('choosing');
    }, 400);
  }, [currentIdx, questions, results, onComplete, onFail, dangersSpotted, dangerBeats]);

  const handleNext = useCallback(() => {
    sfxTap();
    const wasCorrect = selectedAnswer === question.correctAnswer;

    if (wasCorrect) {
      // Show spot-the-danger for correct answers
      setDangerBeats(prev => prev + 1);
      setPhase('spotDanger');
    } else {
      advanceToNext();
    }
  }, [selectedAnswer, question, advanceToNext]);

  const handleDangerComplete = useCallback((firstTry: boolean) => {
    if (firstTry) setDangersSpotted(prev => prev + 1);
    advanceToNext();
  }, [advanceToNext]);

  if (finished) return null;

  const isAnswered = selectedAnswer !== null;
  const isCorrectA = isAnswered ? question.correctAnswer === 'A' : null;
  const isCorrectB = isAnswered ? question.correctAnswer === 'B' : null;
  const wrongOption = question.correctAnswer === 'A' ? question.optionB : question.optionA;

  return (
    <div className="fixed inset-0 z-30 flex flex-col game-viewport overflow-hidden">
      {/* Animated underwater background */}
      <UnderwaterCanvas />

      {/* Header */}
      <div
        className="relative z-10 px-4 pt-3 pb-3"
        style={{ paddingLeft: '56px' }}
      >
        <p className="text-text-muted text-[10px] italic mb-2">
          {FLAVOR_LINES[currentIdx % FLAVOR_LINES.length]}
        </p>
        <JourneyDots total={questions.length} results={results} current={currentIdx} />
      </div>

      {/* Content (with swim transition) */}
      <div
        className="relative z-10 flex-1 overflow-y-auto px-4 pb-4"
        style={{
          opacity: phase === 'transitioning' ? 0 : 1,
          transform: phase === 'transitioning' ? 'translateY(24px)' : 'translateY(0)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
        }}
      >
        {phase === 'spotDanger' ? (
          /* Spot the Danger mini-game */
          <SpotDanger
            wrongOption={wrongOption}
            danger={getWorstDanger(wrongOption)}
            onComplete={handleDangerComplete}
          />
        ) : (
          <>
            {/* Prompt */}
            <div className="py-3">
              <h2 className="text-text-primary text-[13px] font-medium text-center leading-relaxed">
                {question.prompt}
              </h2>
            </div>

            {/* Two site cards */}
            <div className="flex flex-col gap-3">
              <SiteCard
                option={question.optionA}
                selected={selectedAnswer === 'A'}
                correct={isAnswered ? isCorrectA : null}
                onSelect={() => handleSelect('A')}
                disabled={isAnswered}
              />

              <SiteCard
                option={question.optionB}
                selected={selectedAnswer === 'B'}
                correct={isAnswered ? isCorrectB : null}
                onSelect={() => handleSelect('B')}
                disabled={isAnswered}
              />
            </div>

            {/* Explanation */}
            {phase === 'explained' && (
              <div
                className="mt-4 p-3 rounded-lg animate-fadeIn"
                style={{
                  background: selectedAnswer === question.correctAnswer
                    ? 'rgba(74,222,128,0.1)'
                    : 'rgba(248,113,113,0.1)',
                  border: `1px solid ${
                    selectedAnswer === question.correctAnswer
                      ? 'rgba(74,222,128,0.3)'
                      : 'rgba(248,113,113,0.3)'
                  }`,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  <span className="font-medium text-text-primary">
                    {selectedAnswer === question.correctAnswer ? 'Correct! ' : 'Not quite. '}
                  </span>
                  {question.explanation}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom button */}
      {phase === 'explained' && (
        <div
          className="relative z-10 p-4 animate-fadeIn"
          style={{
            background: 'linear-gradient(0deg, rgba(10,20,40,0.9) 0%, transparent 100%)',
          }}
        >
          <button
            onClick={handleNext}
            className="btn btn-primary w-full touch-manipulation"
          >
            {currentIdx >= questions.length - 1 ? 'Surface' : 'Continue Exploring'}
          </button>
        </div>
      )}
    </div>
  );
}
