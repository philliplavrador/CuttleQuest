'use client';

import { usePathname, useRouter } from 'next/navigation';
import { sfxTap } from '@/lib/audio';

export default function FloatingHomeButton() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide on home page — already there
  if (pathname === '/') return null;

  return (
    <button
      onClick={() => { sfxTap(); router.push('/'); }}
      className="fixed top-3 left-3 z-[60] w-[40px] h-[40px] flex items-center justify-center glass-btn text-base"
      style={{ touchAction: 'manipulation' }}
      aria-label="Home"
    >
      🏠
    </button>
  );
}
