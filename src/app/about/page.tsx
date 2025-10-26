'use client'

import { useState } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Footer } from '@/components/Footer' 

import screenshot_ipad from '@/images/screenshots/screenshot_ipad.jpeg' 
import screenshot_meeting from '@/images/screenshots/screenshot_meeting.jpeg'
import screenshot_talking from '@/images/screenshots/screenshot_talk.jpeg'
import screenshot_work from '@/images/screenshots/screenshot_work.jpeg'
import screenshot_work2 from '@/images/screenshots/screenshot_work2.jpeg'
import screenshot_friends from '@/images/screenshots/screenshot_friends.jpeg'
import Image from 'next/image'

// Re-using navigation from pricing/page.tsx or similar global structure
const navigation = [
  { name: 'About', href: '/about' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Contact', href: '/contact' },
]

// Adapted from the "Our Culture" section
const values = [
  {
    name: 'Simplicity & Clarity',
    description:
      'We cut through the noise to give you one clear number: your net worth. No overwhelming dashboards, no feature bloat—just the insights you need to make informed financial decisions.',
  },
  {
    name: 'Education & Empowerment',
    description:
      'We help you understand your finances through clear insights and percentile rankings based on Federal Reserve data. Our goal is to inform and motivate, never to overwhelm or intimidate.',
  },
  {
    name: 'Privacy & Security',
    description:
      'Your financial data stays yours. We use bank-level encryption and will never sell your information to third parties. Our revenue comes from subscriptions, not from your data.',
  },
  {
    name: 'Transparent by Design',
    description:
      'From our straightforward pricing to our data sources (Federal Reserve SCF benchmarks), we believe in being open about how Guapital works and what you can expect.',
  },
  {
    name: 'Positive Financial Growth',
    description:
      'We focus on celebrating your progress and helping you build wealth with intention. No guilt, no shame—just clear tracking and encouraging insights to guide your journey.',
  },
  {
    name: 'Modern & Comprehensive',
    description:
      'Whether you\'re tracking cryptocurrency, stock options, real estate, or traditional accounts, Guapital supports the full range of modern assets in one unified platform.',
  },
]


export default function AboutPage() { // Renamed from Example to AboutPage
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="">
      <main className="isolate">
        {/* Hero section */}
        <div className="relative isolate -z-10">
          <div
            aria-hidden="true"
            className="absolute left-1/2 right-0 top-0 -z-10 -ml-24 transform-gpu overflow-hidden blur-3xl lg:ml-24 xl:ml-48"
          >
            <div
              style={{
                clipPath:
                  'polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)',
              }}
              className="aspect-[801/1036] w-[50.0625rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
            />
          </div>

          <div className="overflow-hidden relative"> {/* Added relative for absolute positioning of overlay */}
            {/* Overlay for opacity reduction */}
            <div className="" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-20 sm:pb-32 pt-8 sm:pt-36 md:pt-60 lg:px-8 lg:pt-32">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                <div className="relative w-full lg:max-w-xl lg:shrink-0 xl:max-w-2xl">
                  <h1 className="text-pretty text-3xl sm:text-4xl md:text-5xl lg:text-[4rem] font-semibold tracking-tight text-gray-900 dark:text-white leading-tight">
                    Track Your Net Worth, Build Your Wealth
                  </h1>
                  <p className="mt-6 sm:mt-8 text-pretty text-sm sm:text-base md:text-lg font-medium text-gray-500 sm:max-w-md lg:max-w-none dark:text-gray-400 leading-relaxed">
                    The biggest challenge in building wealth isn&apos;t earning more, it&apos;s understanding where you stand. Guapital helps young adults track their net worth with clarity and confidence, promoting mindful financial decisions.
                  </p>
                </div>
                <div className="mt-10 sm:mt-14 flex justify-end gap-3 sm:gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
                  <div className="ml-auto w-32 sm:w-44 flex-none space-y-4 sm:space-y-8 pt-20 sm:pt-32 md:ml-0 md:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                    <div className="relative">
                      <Image
                        alt=""
                        src={screenshot_meeting}
                        className="aspect-[2/3] w-full rounded-lg sm:rounded-xl bg-gray-900/5 object-cover shadow-lg dark:bg-gray-700/5"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-lg sm:rounded-xl ring-1 ring-inset ring-gray-900/10 dark:ring-white/10" />
                    </div>
                  </div>
                  <div className="mr-auto w-32 sm:w-44 flex-none space-y-4 sm:space-y-8 pt-10 sm:mr-0 sm:pt-52 lg:pt-36">
                    <div className="relative">
                      <Image
                        alt=""
                        src={screenshot_work2}
                        className="aspect-[2/3] w-full rounded-lg sm:rounded-xl bg-gray-900/5 object-cover shadow-lg dark:bg-gray-700/5"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-lg sm:rounded-xl ring-1 ring-inset ring-gray-900/10 dark:ring-white/10" />
                    </div>
                    <div className="relative">
                      <Image
                        alt=""
                        src={screenshot_talking}
                        className="aspect-[2/3] w-full rounded-lg sm:rounded-xl bg-gray-900/5 object-cover shadow-lg dark:bg-gray-700/5"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-lg sm:rounded-xl ring-1 ring-inset ring-gray-900/10 dark:ring-white/10" />
                    </div>
                  </div>
                  <div className="w-32 sm:w-44 flex-none space-y-4 sm:space-y-8 pt-16 sm:pt-32 md:pt-0">
                    <div className="relative">
                      <Image
                        alt=""
                        src={screenshot_work}
                        className="aspect-[2/3] w-full rounded-lg sm:rounded-xl bg-gray-900/5 object-cover shadow-lg dark:bg-gray-700/5"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-lg sm:rounded-xl ring-1 ring-inset ring-gray-900/10 dark:ring-white/10" />
                    </div>
                    <div className="relative">
                      <Image
                        alt=""
                        src={screenshot_ipad}
                        className="aspect-[2/3] w-full rounded-lg sm:rounded-xl bg-gray-900/5 object-cover shadow-lg dark:bg-gray-700/5"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-lg sm:rounded-xl ring-1 ring-inset ring-gray-900/10 dark:ring-white/10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="mx-auto -mt-8 sm:-mt-12 max-w-7xl px-4 sm:px-6 sm:mt-0 lg:px-8 xl:-mt-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
            <h2 className="text-pretty text-2xl sm:text-3xl md:text-4xl lg:text-[2.875rem] font-semibold tracking-tight text-gray-900 dark:text-white">
              Our Mission
            </h2>
            <div className="mt-6 flex flex-col gap-x-8 gap-y-20 lg:flex-row">
              <div className="lg:w-full lg:max-w-2xl lg:flex-auto">
                <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  We believe everyone deserves access to quality wealth management tools, not just those with significant assets. For young adults starting their financial journey, the first step is understanding where you stand—but many existing apps are either too expensive, too complex, or compromise your privacy.
                </p>
                <p className="mt-6 sm:mt-8 text-sm sm:text-base md:text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  That&apos;s why we created Guapital—an <strong>affordable, privacy-first platform</strong> that helps you track your complete financial picture. Whether it&apos;s traditional investments, cryptocurrency, or real-world assets like your home or car, everything lives in one beautiful, easy-to-use dashboard. We offer transparent pricing at $9.99/month (or $99/year) with unlimited accounts and features.
                </p>
                <p className="mt-6 sm:mt-8 text-sm sm:text-base md:text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  Beyond tracking, we&apos;re passionate about <strong>financial education that empowers</strong>. Our percentile rankings help you understand how you&apos;re doing compared to your peers—not to create pressure, but to celebrate your progress and set informed goals. We believe financial growth should feel motivating and transparent, not stressful or confusing.
                </p>
                <p className="mt-6 sm:mt-8 text-sm sm:text-base md:text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                  Whether you&apos;re just starting to build wealth or already managing a diverse portfolio, Guapital gives you the clarity and tools you need to make confident financial decisions. Welcome to wealth building made simple.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works section */}
        <div className="mx-auto mt-20 sm:mt-32 md:mt-40 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-pretty text-2xl sm:text-3xl md:text-4xl lg:text-[2.875rem] font-semibold tracking-tight text-gray-900 dark:text-white">
              How It Works
            </h2>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300">
              Get started with Guapital in three simple steps. No complicated setup, no financial jargon—just clear, actionable insights.
            </p>
          </div>
          <div className="mx-auto mt-10 sm:mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Connect Your Accounts
              </h3>
              <p className="mt-3 sm:mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Link your bank accounts, investment accounts, and crypto wallets securely via Plaid and Alchemy. Or add assets manually—real estate, vehicles, collectibles, anything you own.
              </p>
            </div>
            <div className="flex flex-col">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                See Your Complete Picture
              </h3>
              <p className="mt-3 sm:mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Your dashboard shows your total net worth, asset breakdown, and historical trends in one beautiful view. Track everything from checking accounts to cryptocurrency to real estate—all in one place.
              </p>
            </div>
            <div className="flex flex-col">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Track Your Progress
              </h3>
              <p className="mt-3 sm:mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                See how your net worth grows over time and compare yourself to peers in your age group with percentile rankings. Celebrate your wins and set informed financial goals.
              </p>
            </div>
          </div>
        </div>

        {/* Who It's For section */}
        <div className="mx-auto mt-20 sm:mt-32 md:mt-40 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-pretty text-2xl sm:text-3xl md:text-4xl lg:text-[2.875rem] font-semibold tracking-tight text-gray-900 dark:text-white">
              Who Guapital Is For
            </h2>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300">
              Guapital is designed for young adults who are actively building wealth and want clear visibility into their financial progress.
            </p>
          </div>
          <div className="mx-auto mt-10 sm:mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Tech-Savvy Professionals
              </h3>
              <p className="mt-3 sm:mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Software engineers, consultants, and entrepreneurs earning $75K-$200K who hold a mix of traditional investments, cryptocurrency, and emerging assets. You&apos;re comfortable with technology and want tools that work reliably.
              </p>
            </div>
            <div className="flex flex-col">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Wealth Builders
              </h3>
              <p className="mt-3 sm:mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                With net worth between $50K-$500K, you&apos;re past surviving paycheck to paycheck. You&apos;re focused on building wealth intentionally, not penny-pinching budgets. You want to celebrate your progress and set informed goals.
              </p>
            </div>
            <div className="flex flex-col">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Privacy-Conscious Users
              </h3>
              <p className="mt-3 sm:mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                You care about data privacy and are willing to pay for quality tools that respect your financial information. You want transparency about how your data is used and stored, with bank-level security you can trust.
              </p>
            </div>
          </div>
        </div>

        {/* Image section */}
        <div className="mt-20 sm:mt-32 md:mt-40 xl:mx-auto xl:max-w-7xl xl:px-8">
          <Image
            alt=""
            src={screenshot_friends}
            className="aspect-[5/2] w-full object-cover outline outline-1 -outline-offset-1 outline-black/5 sm:rounded-2xl xl:rounded-3xl dark:outline-white/10"
          />
        </div>

        {/* Feature section (Our values) */}
        <div className="mx-auto mt-20 sm:mt-32 md:mt-40 max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-pretty text-2xl sm:text-3xl md:text-4xl lg:text-[2.875rem] font-semibold tracking-tight text-gray-900 dark:text-white">
              Our Values
            </h2>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300">
              We&apos;re building Guapital on a foundation of affordability, transparency, and education. These aren&apos;t just marketing buzzwords—they&apos;re the principles that guide every decision we make.
            </p>
          </div>
          <dl className="mx-auto mt-10 sm:mt-16 grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 sm:gap-x-8 sm:gap-y-16 text-sm sm:text-base leading-relaxed sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {values.map((value) => (
              <div key={value.name}>
                <dt className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">{value.name}</dt>
                <dd className="mt-2 sm:mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{value.description}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Removed Logo cloud, Team section, and Blog section */}
      </main>

    </div>
  )
}