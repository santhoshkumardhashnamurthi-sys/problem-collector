import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ARTIX — Every Problem Is an Opportunity',
  description:
    'ARTIX collects real-world problems to understand what people truly need and discover better opportunities. An ARTIX Product by CodeArtix, Founded by Santhoshkumar.',
  keywords: [
    'ARTIX',
    'CodeArtix',
    'Problem Collection Platform',
    'Real World Problems',
    'Opportunity Signals',
    'Startup Discovery',
    'Problem First',
  ],
  authors: [{ name: 'Santhoshkumar', url: 'https://codeartix.com' }],
  creator: 'CodeArtix',
  publisher: 'CodeArtix',
  openGraph: {
    title: 'ARTIX — Every Problem Is an Opportunity',
    description:
      'Tell us a problem you face. ARTIX collects, organizes, and understands real-world problems to discover what should be built next.',
    siteName: 'ARTIX',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ARTIX — Every Problem Is an Opportunity',
    description:
      'ARTIX collects real-world problems to understand what people truly need and discover better opportunities.',
    creator: '@codeartix',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F7F4EA] text-[#101114]">
        {children}
      </body>
    </html>
  );
}
