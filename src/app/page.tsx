import { type Metadata } from 'next'
import Link from 'next/link'
import { LightBulbIcon, SparklesIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { Container } from '@/components/Container'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import { List, ListItem } from '@/components/List'
import { SectionIntro } from '@/components/SectionIntro'
import { StylizedImage } from '@/components/StylizedImage'
import image from '@/images/conversation.png'

import FeatureSection from '@/components/FeatureSection'
import FaqSection from '@/components/FaqSection'

import { URL as url, WEB_NAME, WEB_DESC, WEB_LONG_DESC } from '@/lib/constant'
import { Button } from '@/components/Button'
import AnimatedText from '@/components/AnimatedText';
import HeroInteractive from '@/components/HeroInteractive'; // Import the new interactive component
import { GridList, GridListItem } from '@/components/GridList'

export const metadata: Metadata = {
    title: `${WEB_NAME} - ${WEB_DESC}`,
    description: `${WEB_LONG_DESC}`,
    keywords: ['ai survey builder', 'market research', 'user feedback', 'product validation', 'survey platform', 'generative ai', 'startup tools'],
    icons: {
        icon: '/favicon.ico?v=2',
    },
    openGraph: {
        title: `${WEB_NAME} - ${WEB_DESC}`,
        description: `${WEB_LONG_DESC}`,
        url: url,
        siteName: WEB_NAME,
        images: [
            {
                url: url + '/og-image.png',
                width: 1200,
                height: 630,
                alt: `${WEB_NAME} Preview`,
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: `${WEB_NAME} - ${WEB_DESC}`,
        description: `${WEB_LONG_DESC}`,
        images: [url + '/twitter-card.png'],
        creator: '@localmoco',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
        },
    },
    metadataBase: new URL(url),
}

export default function LandingPage() {
    return (
        <>
            {/* Hero Section */}
            <Container className="min-h-[90vh] flex items-center justify-center">
                <FadeIn className="max-w-3xl text-center mx-auto">
                    <AnimatedText
                        initialText="AI-Powered Market Research Validate Market Fit In Weeks"
                        wordsToCycle={["Days"]}
                        className="font-display text-3xl font-semibold tracking-tight text-neutral-900 sm:text-6xl"
                    />
                    <p className="mt-6 text-xl text-neutral-600">
                        LocalMoco is an AI-powered platform that transforms business goals into actionable insights by automating {' '}
                        <b>survey creation</b> and <b>data analysis</b>.
                    </p>
                    <div className="mt-10 flex justify-center gap-x-6">
                        <HeroInteractive /> {/* Render the new interactive component here */}
                    </div>
                </FadeIn>
            </Container>



            <FeatureSection />

            <FaqSection />
        </>
    )
}
