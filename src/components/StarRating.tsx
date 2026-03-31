'use client';

import React from 'react';

interface StarRatingProps {
  stars: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const SIZES = {
  sm: 'text-sm',
  md: 'text-xl',
  lg: 'text-3xl',
};

export default function StarRating({ stars, maxStars = 5, size = 'md', animated = false }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: maxStars }).map((_, i) => (
        <span
          key={i}
          className={`${SIZES[size]} transition-all duration-300`}
          style={{
            color: i < stars ? 'var(--star-filled)' : 'var(--star-empty)',
            animationDelay: animated ? `${i * 0.3}s` : undefined,
            animation: animated && i < stars ? 'pulse 0.3s ease-in-out' : undefined,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
