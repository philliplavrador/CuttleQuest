'use client';

import dynamic from 'next/dynamic';
import { ProfileProvider } from '@/hooks/useProfile';

const HomeContent = dynamic(() => import('@/components/HomeContent'), { ssr: false });

export default function Home() {
  return (
    <ProfileProvider>
      <HomeContent />
    </ProfileProvider>
  );
}
