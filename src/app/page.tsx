'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import {
    SparklesIcon,
    ChartBarIcon,
    ShieldCheckIcon,
    BoltIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    ArrowRightIcon,
    CheckIcon,
    TrophyIcon,
    LockClosedIcon,
    CubeTransparentIcon,
    ChartPieIcon,
} from '@heroicons/react/24/outline'
import { PricingSection } from '@/components/pricing/PricingSection'
import { Footer } from '@/components/Footer'
import dashboard_screenshot from '@/images/screenshots/dashboard_screenshot2.png'

// Animation wrapper component
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "0px 0px -25% 0px" })

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    )
}

export default function LandingPage() {
    const [remainingSlots, setRemainingSlots] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchRemainingSlots() {
            try {
                const response = await fetch('/api/founding-members/remaining')
                const data = await response.json()
                setRemainingSlots(data.remaining)
            } catch (error) {
                console.error('Error fetching remaining slots:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchRemainingSlots()
    }, [])

    return (
        <main className="">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden">
                {/* Animated background gradient */}
                <div className="absolute inset-0 " />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-[#FFC107]/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                    className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-[#004D40]/20 rounded-full blur-3xl"
                />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 md:pt-24">
                    <div className="text-center">
                        {/* Founding member badge */}
                        {!isLoading && remainingSlots !== null && remainingSlots > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 bg-[#004D40] text-white rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8 shadow-lg"
                            >
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <SparklesIcon className="h-4 w-4 text-[#FFC107]" />
                                </motion.div>
                                <span className="text-xs sm:text-sm">{remainingSlots} founding spots left • Lock in $79/year forever</span>
                            </motion.div>
                        )}

                        {/* Guap definition */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mb-4 sm:mb-6 font-medium italic px-4"
                        >
                            <a
                                href="https://www.urbandictionary.com/define.php?term=guap"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
                            >
                                <span className="text-[#FFC107] hover:text-[#FFD54F] transition-colors">guap</span> 
                            </a>
                            <span>
                                /ɡwäp/ <span className="mx-2">•</span> slang for money
                            </span>
                        </motion.p>

                        {/* Main headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            style={{ opacity: 1 }}
                            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight px-4"
                        >
                            <span className="text-gray-900">Get Your Guap Together</span>
                            <br />
                            <span className="bg-gradient-to-r from-[#004D40] to-[#00695C] bg-clip-text text-transparent">
                                Watch Your Capital Grow
                            </span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-4xl mx-auto font-light px-4"
                        >
                            Track your entire net worth. { ' ' }
                            <br className="hidden sm:block" />
                            <strong className="text-gray-900 font-semibold">See where you rank</strong> against your generation.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 sm:mb-12 px-4"
                        >
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link
                                    href="/signup"
                                    className="group inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-[#FFC107] text-gray-900 text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl hover:bg-[#FFD54F] transition-all min-h-[48px]"
                                >
                                    Get Started For Free
                                    <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </motion.div>
                        </motion.div>

                        {/* Trust badges */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                            className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-4"
                        >
                            <div className="flex items-center gap-2">
                                <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                                <span>No credit card needed</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                                <span>Bank-level security</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                                <span>Free plan forever</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Dashboard preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1 }}
                        className="mt-8 sm:mt-12 md:mt-16 mb-16 sm:mb-24 md:mb-32"
                    >
                        <div className="relative max-w-6xl mx-auto px-2 sm:px-0">
                            {/* Glow effect */}
                            <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-[#004D40] to-[#FFC107] rounded-[2rem] sm:rounded-[2.5rem] blur-xl sm:blur-2xl opacity-20" />

                            {/* Screenshot */}
                            <div className="relative sm:rounded-[2rem] overflow-hidden shadow-2xl sm:border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                                <Image
                                    src={dashboard_screenshot}
                                    alt="Guapital Dashboard"
                                    width={1400}
                                    height={900}
                                    className="w-full h-auto sm:p-2"
                                    priority
                                />
                            </div>

                            {/* Floating stats - Hidden on mobile and tablet */}
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 1.4 }}
                                className="absolute -left-8 top-1/4 hidden xl:block"
                            >
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                            <ChartBarIcon className="h-6 w-6 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Net Worth</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">$1,902,900</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 1.6 }}
                                className="absolute -right-8 bottom-1/4 hidden xl:block"
                            >
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-[#FFC107]/20 rounded-xl">
                                            <TrophyIcon className="h-6 w-6 text-[#FFC107]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Your Rank</p>
                                            <p className="text-xl font-bold text-[#004D40] dark:text-[#FFC107]">Top 13%</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>


            {/* HOW IT WORKS */}
            <section id="how-it-works" className="py-16 sm:py-24 md:py-32 bg-white dark:bg-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <FadeIn>
                        <div className="text-center mb-12 sm:mb-16 md:mb-20">
                            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                                Get Started in Minutes
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-4">
                                No complicated setup. Connect your accounts and start tracking immediately.
                            </p>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
                        {/* Step 1 */}
                        <FadeIn delay={0.1}>
                            <motion.div
                                className="relative"
                            >
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 pt-8 sm:pt-12 h-full border border-gray-200 dark:border-gray-800">
                                    <div className="p-3 sm:p-4 bg-[#004D40] rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-6">
                                        <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8 text-[#FFC107]" />
                                    </div>
                                    <h3 className="font-display text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                        Sign Up Free
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                                        Create your account in 30 seconds. No credit card required, ever.
                                    </p>
                                </div>
                            </motion.div>
                        </FadeIn>

                        {/* Step 2 */}
                        <FadeIn delay={0.2}>
                            <motion.div
                                className="relative"
                            >
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 pt-8 sm:pt-12 h-full border border-gray-200 dark:border-gray-800">
                                    <div className="p-3 sm:p-4 bg-[#004D40] rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-6">
                                        <CubeTransparentIcon className="h-6 w-6 sm:h-8 sm:w-8 text-[#FFC107]" />
                                    </div>
                                    <h3 className="font-display text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                        Connect Accounts
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                                        Link your banks, crypto wallets, and add manual assets. All secure and encrypted.
                                    </p>
                                </div>
                            </motion.div>
                        </FadeIn>

                        {/* Step 3 */}
                        <FadeIn delay={0.3}>
                            <motion.div
                                className="relative"
                            >
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 pt-8 sm:pt-12 h-full border border-gray-200 dark:border-gray-800">
                                    <div className="p-3 sm:p-4 bg-[#004D40] rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-6">
                                        <ChartPieIcon className="h-6 w-6 sm:h-8 sm:w-8 text-[#FFC107]" />
                                    </div>
                                    <h3 className="font-display text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                        Watch It Grow
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                                        Track your net worth, see your rank, and celebrate your progress.
                                    </p>
                                </div>
                            </motion.div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* PERCENTILE FEATURE */}
            <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-gradient-to-br from-[#004D40] via-[#00695C] to-[#004D40] text-white relative overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 90, 0]
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-[#FFC107]/10 rounded-full blur-3xl"
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
                        <FadeIn>
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#FFC107] text-[#004D40] rounded-full text-xs sm:text-sm font-bold mb-4 sm:mb-6">
                                    <TrophyIcon className="h-4 w-4" />
                                    <span>UNIQUE TO GUAPITAL</span>
                                </div>
                                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
                                    See Where You Really Stand
                                </h2>
                                <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed">
                                    Are you ahead or behind? Guapital shows you your percentile rank compared to others your age.
                                    It&apos;s motivating, private, and totally opt-in.
                                </p>
                                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                                    <li className="flex items-start gap-3">
                                        <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[#FFC107] flex-shrink-0 mt-0.5 sm:mt-1" />
                                        <span className="text-sm sm:text-base">Compare against real federal data + anonymous users</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[#FFC107] flex-shrink-0 mt-0.5 sm:mt-1" />
                                        <span className="text-sm sm:text-base">Watch your rank improve as you build wealth</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[#FFC107] flex-shrink-0 mt-0.5 sm:mt-1" />
                                        <span className="text-sm sm:text-base">100% anonymous—no one knows it&apos;s you</span>
                                    </li>
                                </ul>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link
                                        href="/signup"
                                        className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 bg-[#FFC107] text-[#004D40] text-sm sm:text-base font-bold rounded-xl shadow-xl hover:bg-[#FFD54F] transition-all min-h-[48px]"
                                    >
                                        See Your Rank
                                        <ArrowRightIcon className="h-5 w-5" />
                                    </Link>
                                </motion.div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.2}>
                            <div className="relative mt-8 lg:mt-0">
                                <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
                                    <div className="text-center mb-6 sm:mb-8">
                                        <p className="text-white/80 text-xs sm:text-sm mb-2">Your Net Worth Percentile</p>
                                        <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#FFC107] mb-2">18%</div>
                                        <p className="text-sm sm:text-base text-white/80">You&apos;re doing better than 82% of people your age</p>
                                    </div>
                                    <div className="space-y-3 sm:space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="text-white/80">Bottom 50%</span>
                                                <span className="text-white/60">$12,000</span>
                                            </div>
                                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                                <div className="h-full w-[50%] bg-gray-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="text-white/80">Top 50%</span>
                                                <span className="text-white/60">$76,000</span>
                                            </div>
                                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                                <div className="h-full w-[70%] bg-blue-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="text-[#FFC107] font-semibold">You (Top 13%)</span>
                                                <span className="text-[#FFC107] font-semibold">$1,902,900</span>
                                            </div>
                                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                                <div className="h-full w-[82%] bg-[#FFC107]" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="text-white/80">Top 10%</span>
                                                <span className="text-white/60">$450,000+</span>
                                            </div>
                                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                                <div className="h-full w-[90%] bg-green-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-white dark:bg-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <FadeIn>
                        <div className="text-center mb-12 sm:mb-16 md:mb-20">
                            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                                Everything You Need
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-4">
                                Track every dollar across all your accounts—automatically and securely.
                            </p>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {[
                            {
                                icon: BoltIcon,
                                title: 'Auto-Sync Everything',
                                description: 'Connect your banks, brokerages, and credit cards. Balances update automatically.'
                            },
                            {
                                icon: CubeTransparentIcon,
                                title: 'Unlimited Crypto',
                                description: 'Track unlimited wallets across Ethereum, Polygon, Base, Arbitrum, and Optimism.'
                            },
                            {
                                icon: ChartPieIcon,
                                title: 'Manual Assets',
                                description: 'Add your house, car, collections—anything you own. Track value over time.'
                            },
                            {
                                icon: ChartBarIcon,
                                title: 'Beautiful Charts',
                                description: 'See your net worth trends, asset allocation, and growth over time.'
                            },
                            {
                                icon: ShieldCheckIcon,
                                title: 'Bank-Level Security',
                                description: 'Your data is encrypted end-to-end. We can&apos;t move your money, only read balances.'
                            },
                            {
                                icon: LockClosedIcon,
                                title: 'Privacy First',
                                description: 'We never sell your data. You pay us, so we work for you—not advertisers.'
                            },
                        ].map((feature, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <motion.div
                                    className="bg-gray-50 dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 h-full"
                                >
                                    <div className="p-3 sm:p-4 bg-[#004D40] rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-6">
                                        <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-[#FFC107]" />
                                    </div>
                                    <h3 className="font-display text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section id="pricing" className="py-16 sm:py-24 md:py-32 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <PricingSection
                        showFoundingBanner={true}
                        remainingFoundingSlots={remainingSlots ?? undefined}
                    />
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-16 sm:py-24 md:py-32 bg-gradient-to-br from-[#004D40] to-[#00695C] text-white relative overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.3, 0.2],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-[#FFC107]/10 rounded-full blur-3xl"
                />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
                    <FadeIn>
                        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
                            Ready to Track Your Wealth?
                        </h2>
                        <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-12">
                            Join thousands tracking their net worth with Guapital. Start free today.
                        </p>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                                href="/signup"
                                className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-[#FFC107] text-[#004D40] text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl shadow-2xl hover:bg-[#FFD54F] transition-all min-h-[48px]"
                            >
                                Get Started Free!
                            </Link>
                        </motion.div>
                        <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-white/70">
                            No credit card • 5-minute setup • Free forever plan
                        </p>
                    </FadeIn>
                </div>
            </section>

        </main>
    )
}
