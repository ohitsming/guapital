import type { Metadata, Viewport } from 'next'
import { DM_Sans, Plus_Jakarta_Sans } from 'next/font/google'
import '@/styles/tailwind.css'
import { RootLayout } from '@/components/RootLayout'
import { ToastProvider } from '@/components/toast/ToastProvider'
import { PostHogProvider } from '@/lib/posthog'
import { WEB_NAME, WEB_DESC, WEB_LONG_DESC, URL } from '@/lib/constant'
import { StructuredData } from '@/components/seo/StructuredData'

// Optimized Google Fonts
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  metadataBase: new globalThis.URL(URL),
  title: {
    default: `${WEB_NAME}: ${WEB_DESC}`,
    template: `%s | ${WEB_NAME}`,
  },
  description: WEB_LONG_DESC,
  keywords: [
    'net worth tracker',
    'net worth percentile by age',
    'financial tracking',
    'wealth management',
    'personal finance app',
    'crypto net worth tracker',
    'plaid integration',
    'assets and liabilities',
    'financial independence',
    'FIRE calculator',
    'young adults finance',
    'wealth building',
    'net worth calculator',
    'financial dashboard',
    'percentile ranking',
    'am i wealthy for my age',
  ],
  authors: [{ name: 'Guapital Team' }],
  creator: 'Guapital',
  publisher: 'Guapital',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: `${WEB_NAME}: ${WEB_DESC}`,
    description: WEB_LONG_DESC,
    url: URL,
    siteName: WEB_NAME,
    images: [
      {
        url: `${URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: `${WEB_NAME} - Track Your Net Worth`,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${WEB_NAME}: ${WEB_DESC}`,
    description: WEB_LONG_DESC,
    creator: '@guapital',
    images: [`${URL}/twitter-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '8bhBdOKxqe-V-Fi52GXd9v69zwOpwTAfJ_LGKVn1-aI',
    other: {
      'msvalidate.01': '6EAAFF46B793D414F944DDC0F2487DAD',  // Bing verification
    },
  },
  alternates: {
    canonical: URL,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/assets/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/assets/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/assets/favicon/favicon.ico',
    apple: [
      { url: '/assets/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/assets/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/assets/favicon/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function Layout({ children }: { children: React.ReactNode }) {

    return (
        <html lang="en" className={`h-full text-base antialiased ${dmSans.variable} ${plusJakartaSans.variable}`}>
            <head>
                <StructuredData />
            </head>
            <body className="flex min-h-full flex-col font-sans">
                <PostHogProvider>
                    <ToastProvider>
                        <RootLayout>
                            {children}
                        </RootLayout>
                    </ToastProvider>
                </PostHogProvider>
            </body>
        </html>
    )
}
