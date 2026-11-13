import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Poppins } from 'next/font/google';
import CampaignTracker from '@/components/CampaignTracker';
import './globals.css';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#07080d',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: 'Jalwaplay',
  description: 'Masti Hai To Mast Hai',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CampaignTracker />
      </body>
    </html>
  );
}
