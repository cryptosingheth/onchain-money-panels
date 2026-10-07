import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import '../styles/tokens.css';
import '../styles/additions.css';

export const metadata: Metadata = {
  title: 'On-chain Money Panels',
  description: 'Drop-in dashboard panels on Canadian-dollar stablecoins, real stablecoin use, AI-agent payments, tokenized assets and stock perps. By Opinder Preet Singh.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
