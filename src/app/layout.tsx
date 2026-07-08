import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Google Flow Studio - useapi.net',
  description: 'Next.js studio UI for useapi.net Google Flow API'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
