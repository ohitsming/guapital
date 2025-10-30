import Link from 'next/link'

import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Logo } from '@/components/Logo'
import { socialMediaProfiles } from '@/components/SocialMedia'

const navigation = [
    {
        title: 'Company',
        links: [
            { title: 'About', href: '/about' },
            // { title: 'Process', href: '/process' },
            // { title: 'Blog', href: '/blog' },
            { title: 'Contact us', href: '/contact' },
        ],
    },
    // {
    //     title: 'Connect',
    //     links: socialMediaProfiles,
    // },
]

function Navigation() {
    return (
        <nav>
            <ul role="list" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                {navigation.map((section, sectionIndex) => (
                    <li key={sectionIndex}>
                        <div className="font-display text-sm font-semibold tracking-wider text-neutral-950">
                            {section.title}
                        </div>
                        <ul role="list" className="mt-4 text-sm text-neutral-700">
                            {section.links.map((link, linkIndex) => (
                                <li key={linkIndex} className="mt-4">
                                    <Link
                                        href={link.href}
                                        className="transition hover:text-neutral-950"
                                    >
                                        {link.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </nav>
    )
}

function ArrowIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <svg viewBox="0 0 16 6" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M16 3 10 .5v2H0v1h10v2L16 3Z"
            />
        </svg>
    )
}

function NewsletterForm() {
    return (
        <form className="max-w-sm">
            <h2 className="font-display text-sm font-semibold tracking-wider text-neutral-950">
                Sign up for early access.
            </h2>
            <p className="mt-4 text-sm text-neutral-700">
                Join our early access list to get first dibs on Guapital.
            </p>
            <div className="relative mt-6">
                <input
                    type="email"
                    placeholder="Email address"
                    autoComplete="email"
                    aria-label="Email address"
                    className="block w-full rounded-2xl border border-neutral-300 bg-transparent py-4 pr-20 pl-6 text-base/6 text-neutral-950 ring-4 ring-transparent transition placeholder:text-neutral-500 focus:border-neutral-950 focus:ring-neutral-950/5 focus:outline-hidden"
                />
                <div className="absolute inset-y-1 right-1 flex justify-end">
                    <button
                        type="submit"
                        aria-label="Submit"
                        className="flex aspect-square h-full items-center justify-center rounded-xl bg-neutral-950 text-white transition hover:bg-neutral-800"
                    >
                        <ArrowIcon className="w-4" />
                    </button>
                </div>
            </div>
        </form>
    )
}

export function Footer() {
    return (
        <Container as="footer" className="w-full">
            <FadeIn>
                <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-2">
                    <div className="flex lg:justify-end">
                        {/* <NewsletterForm /> */}
                    </div>
                </div>
                <div className="mt-24 mb-20 border-t border-neutral-950/10 pt-12">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                        <Link href="/" aria-label="Home" className="flex-shrink-0">
                            <Logo className="h-8" fillOnHover />
                        </Link>

                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm">
                            <Link href="/privacy" className="text-neutral-700 hover:text-neutral-950 transition-colors">
                                Privacy
                            </Link>
                            <Link href="/terms" className="text-neutral-700 hover:text-neutral-950 transition-colors">
                                Terms
                            </Link>
                            <p className="text-neutral-700">
                                © {new Date().getFullYear()} LocalMoco LLC. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </FadeIn>
        </Container>
    )
}
