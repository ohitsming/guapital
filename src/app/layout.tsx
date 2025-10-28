import type { Metadata, Viewport } from 'next'
import { DM_Sans, Plus_Jakarta_Sans } from 'next/font/google'
import '@/styles/tailwind.css'
import { RootLayout } from '@/components/RootLayout'
import { ToastProvider } from '@/components/toast/ToastProvider'
import { WEB_NAME, WEB_DESC, WEB_LONG_DESC, URL } from '@/lib/constant'

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
  title: {
    default: `${WEB_NAME}: ${WEB_DESC}`,
    template: `%s | ${WEB_NAME}`,
  },
  description: WEB_LONG_DESC,
  keywords: ['net worth', 'financial tracking', 'wealth management', 'personal finance', 'assets', 'liabilities', 'financial independence', 'young adults finance'],
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
            <body className="flex min-h-full flex-col font-sans">
                <ToastProvider>
                    <RootLayout>
                        {children}
                    </RootLayout>
                </ToastProvider>
            </body>
        </html>
    )
}
