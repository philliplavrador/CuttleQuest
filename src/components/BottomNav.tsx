'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { sfxTap } from '@/lib/audio';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/play', label: 'Play', icon: '🎮' },
  { path: '/collection', label: 'Collection', icon: '📦' },
  { path: '/wardrobe', label: 'Wardrobe', icon: '👔' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => {
        const isActive = pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => {
              sfxTap();
              router.push(item.path);
            }}
            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] bg-transparent border-none cursor-pointer transition-all ${
              isActive ? 'text-text-primary' : 'text-text-muted'
            }`}
            style={{
              borderTop: isActive ? '2px solid var(--border-active)' : '2px solid transparent',
            }}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="font-pixel text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
