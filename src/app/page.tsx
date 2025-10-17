'use client'

import Image from 'next/image'
import { } from '@headlessui/react'
import {
    ArrowPathIcon,
    CheckIcon,
    CloudArrowUpIcon,
    Cog6ToothIcon,
    FingerPrintIcon,
    LockClosedIcon,
    ServerIcon,
} from '@heroicons/react/20/solid'
import dashboard_screenshot from '@/images/screenshots/dashboard_screenshot.png'

export default function Example() {
    return (
        <main>
            {/* Hero section */}
            <div className="relative isolate overflow-hidden pb-16 pt-14 sm:pb-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl py-16 sm:py-48 lg:py-26">
                        <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                            <div className="relative rounded-full px-3 py-1 text-sm/6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:text-gray-400 dark:ring-white/10 dark:hover:ring-white/20">
                                Announcing our next round of funding.{' '}
                                <a href="#" className="font-semibold text-indigo-600 dark:text-indigo-400">
                                    <span aria-hidden="true" className="absolute inset-0" />
                                    Read more <span aria-hidden="true">&rarr;</span>
                                </a>
                            </div>
                        </div>
                        <div className="text-center">
                            <h1 className="text-balance text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl dark:text-white">
                                Guapital: Track Your Net Worth
                            </h1>
                            <p className="mt-8 text-pretty text-lg font-medium text-gray-600 sm:text-xl/8 dark:text-gray-400">
                                A modern, privacy-first financial application designed to help Gen Z and young millennials understand and track their net worth. Focus on wealth generation with simplicity, privacy, and motivation.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <a
                                    href="/signup"
                                    className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                                >
                                    Get started
                                </a>
                                <a href="/about" className="text-sm/6 font-semibold text-gray-900 dark:text-white">
                                    Learn more <span aria-hidden="true">→</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature section */}
            <div className="mt-32 sm:mt-56">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl sm:text-center">
                        <h2 className="text-base/7 font-semibold text-indigo-600 dark:text-indigo-400">Unlock Your Financial Potential</h2>
                        <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-balance sm:text-5xl dark:text-white">
                            Everything you need to master your net worth.
                        </p>
                        <p className="mt-6 text-lg/8 text-gray-600 dark:text-gray-300">
                            Guapital provides a clear, simple, and motivating picture of your financial health, focusing on wealth generation.
                        </p>
                    </div>
                </div>
                <div className="relative overflow-hidden pt-16">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <Image
                            alt="App screenshot"
                            src={dashboard_screenshot}
                            width={2432}
                            height={1442}
                            className="mb-[-12%] rounded-xl shadow-2xl ring-1 ring-gray-900/10 dark:hidden dark:ring-white/10"
                        />
                        <Image
                            alt="App screenshot"
                            src={dashboard_screenshot}
                            width={2432}
                            height={1442}
                            className="mb-[-12%] hidden rounded-xl shadow-2xl ring-1 ring-gray-900/10 dark:block dark:ring-white/10"
                        />
                        <div aria-hidden="true" className="relative">
                            <div className="absolute -inset-x-20 bottom-0 bg-gradient-to-t from-white pt-[7%] dark:from-gray-900" />
                        </div>
                    </div>
                </div>
                <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-20 md:mt-24 lg:px-8">
                    <dl className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 text-base/7 text-gray-600 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16 dark:text-gray-400">
                        <div className="relative pl-9">
                            <dt className="inline font-semibold text-gray-900 dark:text-white">
                                <CloudArrowUpIcon
                                    aria-hidden="true"
                                    className="absolute left-1 top-1 size-5 text-indigo-600 dark:text-indigo-400"
                                />
                                Core Net Worth Tracking
                            </dt>{' '}
                            <dd className="inline">Full CRUD functionality for user assets and liabilities.</dd>
                        </div>
                        <div className="relative pl-9">
                            <dt className="inline font-semibold text-gray-900 dark:text-white">
                                <LockClosedIcon
                                    aria-hidden="true"
                                    className="absolute left-1 top-1 size-5 text-indigo-600 dark:text-indigo-400"
                                />
                                Net Worth Dashboard
                            </dt>{' '}
                            <dd className="inline">A clean UI displaying Total Assets, Total Liabilities, and calculated Net Worth.</dd>
                        </div>
                        <div className="relative pl-9">
                            <dt className="inline font-semibold text-gray-900 dark:text-white">
                                <ArrowPathIcon
                                    aria-hidden="true"
                                    className="absolute left-1 top-1 size-5 text-indigo-600 dark:text-indigo-400"
                                />
                                Historical Tracking
                            </dt>{' '}
                            <dd className="inline">Automatically snapshot net worth data and visualize progression over time.</dd>
                        </div>
                        <div className="relative pl-9">
                            <dt className="inline font-semibold text-gray-900 dark:text-white">
                                <FingerPrintIcon
                                    aria-hidden="true"
                                    className="absolute left-1 top-1 size-5 text-indigo-600 dark:text-indigo-400"
                                />
                                Gamification & Motivation
                            </dt>{' '}
                            <dd className="inline">Opt-in anonymous percentile ranking for Investment Rate and Net Worth.</dd>
                        </div>
                        <div className="relative pl-9">
                            <dt className="inline font-semibold text-gray-900 dark:text-white">
                                <Cog6ToothIcon
                                    aria-hidden="true"
                                    className="absolute left-1 top-1 size-5 text-indigo-600 dark:text-indigo-400"
                                />
                                Achievements System
                            </dt>{' '}
                            <dd className="inline">Earn badges for hitting financial milestones like "Debt-Free" or "Investor."</dd>
                        </div>
                        <div className="relative pl-9">
                            <dt className="inline font-semibold text-gray-900 dark:text-white">
                                <ServerIcon
                                    aria-hidden="true"
                                    className="absolute left-1 top-1 size-5 text-indigo-600 dark:text-indigo-400"
                                />
                                Privacy-First Approach
                            </dt>{' '}
                            <dd className="inline">Manual entry promotes mindfulness about financial assets and liabilities.</dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Testimonial section */}
            <div className="relative z-10 mb-20 mt-32 sm:mb-24 sm:mt-56 xl:mb-0">
                <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
                    <div className="absolute left-[calc(50%-19rem)] top-[calc(50%-36rem)] transform-gpu blur-3xl">
                        <div
                            style={{
                                clipPath:
                                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                            }}
                            className="aspect-[1097/1023] w-[68.5625rem] bg-gradient-to-r from-[#ff4694] to-[#776fff] opacity-25"
                        />
                    </div>
                </div>
                <div className="bg-gray-900 pb-20 sm:pb-24 xl:pb-0 dark:bg-gray-800/50 dark:outline dark:outline-1 dark:outline-white/5">
                    <div className="mx-auto flex max-w-7xl flex-col items-center gap-x-8 gap-y-10 px-6 sm:gap-y-8 lg:px-8 xl:flex-row xl:items-stretch">
                        <div className="-mt-8 w-full max-w-2xl xl:-mb-8 xl:w-96 xl:flex-none">
                            <div className="relative aspect-[2/1] h-full after:absolute after:inset-0 after:rounded-2xl after:ring-1 after:ring-white/15 md:-mx-8 xl:mx-0 xl:aspect-auto">
                                <Image
                                    alt=""
                                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2102&q=80"
                                    className="absolute inset-0 size-full rounded-2xl bg-gray-800 object-cover shadow-2xl dark:bg-gray-700 dark:shadow-none"
                                    width={2102}
                                    height={1401}
                                />
                            </div>
                        </div>
                        <div className="w-full max-w-2xl xl:max-w-none xl:flex-auto xl:px-16 xl:py-24">
                            <figure className="relative isolate pt-6 sm:pt-12">
                                <svg
                                    fill="none"
                                    viewBox="0 0 162 128"
                                    aria-hidden="true"
                                    className="absolute left-0 top-0 -z-10 h-32 stroke-white/20"
                                >
                                    <path
                                        d="M65.5697 118.507L65.8918 118.89C68.9503 116.314 71.367 113.253 73.1386 109.71C74.9162 106.155 75.8027 102.28 75.8027 98.0919C75.8027 94.237 75.16 90.6155 73.8708 87.2314C72.5851 83.8565 70.8137 80.9533 68.553 78.5292C66.4529 76.1079 63.9476 74.2482 61.0407 72.9536C58.2795 71.4949 55.276 70.767 52.0386 70.767C48.9935 70.767 46.4686 71.1668 44.4872 71.9924L44.4799 71.9955L44.4726 71.9988C42.7101 72.7999 41.1035 73.6831 39.6544 74.6492C38.2407 75.5916 36.8279 76.455 35.4159 77.2394L35.4047 77.2457L35.3938 77.2525C34.2318 77.9787 32.6713 78.3634 30.6736 78.3634C29.0405 78.3634 27.5131 77.2868 26.1274 74.8257C24.7483 72.2185 24.0519 69.2166 24.0519 65.8071C24.0519 60.0311 25.3782 54.4081 28.0373 48.9335C30.703 43.4454 34.3114 38.345 38.8667 33.6325C43.5812 28.761 49.0045 24.5159 55.1389 20.8979C60.1667 18.0071 65.4966 15.6179 71.1291 13.7305C73.8626 12.8145 75.8027 10.2968 75.8027 7.38572C75.8027 3.6497 72.6341 0.62247 68.8814 1.1527C61.1635 2.2432 53.7398 4.41426 46.6119 7.66522C37.5369 11.6459 29.5729 17.0612 22.7236 23.9105C16.0322 30.6019 10.618 38.4859 6.47981 47.558L6.47976 47.558L6.47682 47.5647C2.4901 56.6544 0.5 66.6148 0.5 77.4391C0.5 84.2996 1.61702 90.7679 3.85425 96.8404L3.8558 96.8445C6.08991 102.749 9.12394 108.02 12.959 112.654L12.959 112.654L12.9646 112.661C16.8027 117.138 21.2829 120.739 26.4034 123.459L26.4033 123.459L26.4144 123.465C31.5505 126.033 37.0873 127.316 43.0178 127.316C47.5035 127.316 51.6783 126.595 55.5376 125.148L55.5376 125.148L55.5477 125.144C59.5516 123.542 63.0052 121.456 65.9019 118.881L65.5697 118.507Z"
                                        id="b56e9dab-6ccb-4d32-ad02-6b4bb5d9bbeb"
                                    />
                                    <use x={86} href="#b56e9dab-6ccb-4d32-ad02-6b4bb5d9bbeb" />
                                </svg>
                                <blockquote className="text-xl/8 font-semibold text-white sm:text-2xl/9 dark:text-gray-100">
                                    <p>
                                        Gravida quam mi erat tortor neque molestie. Auctor aliquet at porttitor a enim nunc suscipit
                                        tincidunt nunc. Et non lorem tortor posuere. Nunc eu scelerisque interdum eget tellus non nibh
                                        scelerisque bibendum.
                                    </p>
                                </blockquote>
                                <figcaption className="mt-8 text-base">
                                    <div className="font-semibold text-white dark:text-gray-100">Judith Black</div>
                                    <div className="mt-1 text-gray-400">CEO of Tuple</div>
                                </figcaption>
                            </figure>
                        </div>
                    </div>
                </div>
            </div>




        </main>
    )
}