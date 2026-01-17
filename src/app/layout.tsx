import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'DropDeck - Every drop. One deck.',
    template: '%s - DropDeck',
  },
  description:
    'Track all your deliveries from DoorDash, Uber Eats, Instacart, Amazon, and more in one unified dashboard.',
  keywords: [
    'delivery tracking',
    'package tracking',
    'DoorDash',
    'Uber Eats',
    'Instacart',
    'Amazon',
    'delivery dashboard',
  ],
  authors: [{ name: 'DropDeck' }],
  creator: 'DropDeck',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'DropDeck',
    title: 'DropDeck - Every drop. One deck.',
    description:
      'Track all your deliveries from DoorDash, Uber Eats, Instacart, Amazon, and more in one unified dashboard.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DropDeck - Every drop. One deck.',
    description:
      'Track all your deliveries from DoorDash, Uber Eats, Instacart, Amazon, and more in one unified dashboard.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
