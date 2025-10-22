'use client'

import { useState } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link' 
import { Logo } from '@/components/Logo' 

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
    name: 'Privacy First',
    description:
      'Your financial data is yours alone. We prioritize privacy and security, ensuring your information remains confidential and protected.',
  },
  {
    name: 'Simplicity & Clarity',
    description:
      'We believe in making financial tracking simple and accessible. Our platform provides a clear picture of your net worth without unnecessary complexity.',
  },
  {
    name: 'Mindful Wealth Building',
    description:
      'We promote mindfulness through manual entry of financial data, helping you stay engaged with your financial decisions and build wealth with intention.',
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
            <div className="mx-auto max-w-7xl px-6 pb-32 pt-36 sm:pt-60 lg:px-8 lg:pt-32">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                <div className="relative w-full lg:max-w-xl lg:shrink-0 xl:max-w-2xl">
                  <h1 className="text-pretty text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl dark:text-white">
                    Track Your Net Worth, Build Your Wealth
                  </h1>
                  <p className="mt-8 text-pretty text-lg font-medium text-gray-500 sm:max-w-md sm:text-xl/8 lg:max-w-none dark:text-gray-400">
                    The biggest challenge in building wealth isn&apos;t earning more, it&apos;s understanding where you stand. Guapital helps Gen Z and young millennials track their net worth with clarity and confidence, promoting mindful financial decisions.
                  </p>
                </div>
                <div className="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
                  <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                    <div className="relative">
                      <Image
                        alt=""
                        src={screenshot_meeting}
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg dark:bg-gray-700/5"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10 dark:ring-white/10" />
                    </div>
                  </div>
                  <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                    <div className="relative">
                      <Image
                        alt=""
                        src={screenshot_work2}
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg dark:bg-gray-700/5"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10 dark:ring-white/10" />
                    </div>
                    <div className="relative">
                      <Image
                        alt=""
                        src={screenshot_talking}
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg dark:bg-gray-700/5"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10 dark:ring-white/10" />
                    </div>
                  </div>
                  <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
                    <div className="relative">
                      <Image
                        alt=""
                        src={screenshot_work}
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg dark:bg-gray-700/5"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10 dark:ring-white/10" />
                    </div>
                    <div className="relative">
                      <Image
                        alt=""
                        src={screenshot_ipad}
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg dark:bg-gray-700/5"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10 dark:ring-white/10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="mx-auto -mt-12 max-w-7xl px-6 sm:mt-0 lg:px-8 xl:-mt-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
            <h2 className="text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
              Our Mission
            </h2>
            <div className="mt-6 flex flex-col gap-x-8 gap-y-20 lg:flex-row">
              <div className="lg:w-full lg:max-w-2xl lg:flex-auto">
                <p className="text-xl/8 text-gray-600 dark:text-gray-300">
                  For most Gen Z and young millennials, building wealth starts with understanding where they stand financially. Guapital is a modern, privacy-first financial application that helps you track your net worth with clarity and confidence. Manual entry promotes mindfulness about your financial assets and liabilities, empowering you to make informed decisions about your financial future.
                </p>
              </div>
              {/* Removed stats section */}
            </div>
          </div>
        </div>

        {/* Image section */}
        <div className="mt-32 sm:mt-40 xl:mx-auto xl:max-w-7xl xl:px-8">
          <Image
            alt=""
            src={screenshot_friends}
            className="aspect-[5/2] w-full object-cover outline outline-1 -outline-offset-1 outline-black/5 xl:rounded-3xl dark:outline-white/10"
          />
        </div>

        {/* Feature section (Our values) */}
        <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
              Our Values
            </h2>
            <p className="mt-6 text-lg/8 text-gray-700 dark:text-gray-300">
              We are a team obsessed with empowering individuals to take control of their financial future. Our culture is built on three core principles.
            </p>
          </div>
          <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 text-base/7 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {values.map((value) => (
              <div key={value.name}>
                <dt className="font-semibold text-gray-900 dark:text-white">{value.name}</dt>
                <dd className="mt-1 text-gray-600 dark:text-gray-400">{value.description}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Removed Logo cloud, Team section, and Blog section */}
      </main>
    </div>
  )
}