import type { Metadata } from 'next'
import '@/styles/tailwind.css'
import { RootLayout } from '@/components/RootLayout'
import { ToastProvider } from '@/components/toast/ToastProvider'

export const metadata: Metadata = {
  title: {
    default: 'LocalMoco: Validate Market Fit with AI-Powered Surveys',
    template: '%s | LocalMoco',
  },
  description: 'LocalMoco is an AI-powered tool that helps businesses create high-quality surveys and feedback forms in seconds. Stop guessing at what questions to ask and let AI build an effective survey based on your goals.',
  keywords: ['AI', 'surveys', 'feedback', 'market research', 'business tools', 'generative AI', 'product validation', 'customer insights'],
  openGraph: {
    title: 'LocalMoco: Validate Market Fit with AI-Powered Surveys',
    description: 'LocalMoco is an AI-powered tool that helps businesses create high-quality surveys and feedback forms in seconds. Stop guessing at what questions to ask and let AI build an effective survey based on your goals.',
    url: 'https://localmoco.io', // Replace with your actual domain
    siteName: 'LocalMoco',
    images: [
      {
        url: 'https://localmoco.io/og-image.jpg', // Replace with your actual OG image
        width: 1200,
        height: 630,
        alt: 'LocalMoco - AI Surveys',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LocalMoco: AI-Powered Survey & Feedback Tool',
    description: 'LocalMoco is an AI-powered tool that helps businesses create high-quality surveys and feedback forms in seconds. Stop guessing at what questions to ask and let AI build an effective survey based on your goals.',
    creator: '@localmoco', // Replace with your actual Twitter handle
    images: ['https://localmoco.io/twitter-image.jpg'], // Replace with your actual Twitter image
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#ffffff',
  manifest: '/manifest.json', // Ensure you have a manifest.json if using PWA features
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {

    return (
        <html lang="en" className="h-full  text-base antialiased">
            <body className="flex min-h-full flex-col">
                <ToastProvider>
                    <RootLayout>
                        {children}
                    </RootLayout>
                </ToastProvider>
            </body>
        </html>
    )
}
