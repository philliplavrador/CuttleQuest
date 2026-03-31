import type { Metadata, Viewport } from 'next';
import FloatingHomeButton from '@/components/FloatingHomeButton';
import './globals.css';

export const metadata: Metadata = {
  title: 'CuttleQuest — Cuttlefish Life Cycle Simulator',
  description: 'Live through the complete life cycle of a cuttlefish in this educational web game.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg-dark text-text-primary min-h-screen">
        <FloatingHomeButton />
        {children}
      </body>
    </html>
  );
}
