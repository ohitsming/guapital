'use client'

import {
    createContext,
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { motion, MotionConfig, useReducedMotion } from 'framer-motion'
import { BanknotesIcon } from '@heroicons/react/24/solid'
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/solid'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { Footer } from '@/components/Footer'
import { GridPattern } from '@/components/GridPattern'
import { Logo, Logomark } from '@/components/Logo'

const RootLayoutContext = createContext<{
    logoHovered: boolean
    setLogoHovered: React.Dispatch<React.SetStateAction<boolean>>
} | null>(null)


export function RootLayout({ children }: { children: React.ReactNode }) {
    let pathname = usePathname()
    let [logoHovered, setLogoHovered] = useState(false)

    return (
        <RootLayoutContext.Provider value={{ logoHovered, setLogoHovered }}>
            <RootLayoutInner key={pathname} pathname={pathname}>{children}</RootLayoutInner>
        </RootLayoutContext.Provider>
    )
}

function XIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path d="m5.636 4.223 14.142 14.142-1.414 1.414L4.222 5.637z" />
            <path d="M4.222 18.363 18.364 4.22l1.414 1.414L5.636 19.777z" />
        </svg>
    )
}

function MenuIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path d="M2 6h20v2H2zM2 16h20v2H2z" />
        </svg>
    )
}

import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { PRE_LAUNCH_MODE } from '@/lib/featureFlags'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon, UserCircleIcon } from '@heroicons/react/20/solid'

function Header({
    panelId,
    icon: Icon,
    expanded,
    onToggle,
    toggleRef,
    invert = false,
}: {
    panelId: string
    icon: React.ComponentType<{ className?: string }>
    expanded: boolean
    onToggle: () => void
    toggleRef: React.RefObject<HTMLButtonElement>
    invert?: boolean
}) {
    let pathname = usePathname()
    let { logoHovered, setLogoHovered } = useContext(RootLayoutContext)!
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user || null);
            setLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [supabase.auth]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        window.location.href = '/'; // Redirect to home page after sign out
    };

    return (
        <Container className={pathname.startsWith('/dashboard') ? 'max-w-none' : ''}>
            <div className={clsx(
                "flex items-center justify-between",
                pathname.startsWith('/dashboard') && "ml-64"
            )}>
                <Link
                    href="/"
                    aria-label="Home"
                    onMouseEnter={() => setLogoHovered(true)}
                    onMouseLeave={() => setLogoHovered(false)}
                >
                    <Logo
                        className="hidden h-8 sm:block"
                        invert={invert}
                        filled={logoHovered}
                    />
                </Link>
                <div className="flex items-center gap-x-6">
                    <div className="hidden sm:flex sm:gap-x-6 sm:items-center">
                        {!pathname.startsWith('/dashboard') && (
                            <>
                                <Link href="/about" className={clsx('inline-block rounded-lg py-1 px-2 text-sm', invert ? 'text-white hover:bg-white/10' : 'text-neutral-950 hover:bg-neutral-100')}>
                                    About
                                </Link>
                                <Link href="/pricing" className={clsx('inline-block rounded-lg py-1 px-2 text-sm', invert ? 'text-white hover:bg-white/10' : 'text-neutral-950 hover:bg-neutral-100')}>
                                    Pricing
                                </Link>
                            </>
                        )}

                        {/* Desktop Auth Section */}
                        {loading ? (
                            <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200" />
                        ) : user ? (
                            <Menu as="div" className="relative">
                                <MenuButton className={clsx(
                                    'flex items-center gap-x-1 rounded-full p-1 text-sm font-semibold transition',
                                    invert ? 'text-white hover:bg-white/10' : 'text-neutral-950 hover:bg-neutral-100'
                                )}>
                                    <UserCircleIcon className="h-8 w-8" />
                                    <ChevronDownIcon className="h-4 w-4" />
                                </MenuButton>
                                <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                                    <div className="py-1">
                                        <MenuItem>
                                            {({ focus }) => (
                                                <Link
                                                    href="/dashboard"
                                                    className={clsx(
                                                        focus ? 'bg-neutral-100' : '',
                                                        'block px-4 py-2 text-sm text-neutral-700'
                                                    )}
                                                >
                                                    Dashboard
                                                </Link>
                                            )}
                                        </MenuItem>
                                        <MenuItem>
                                            {({ focus }) => (
                                                <Link
                                                    href="/profile"
                                                    className={clsx(
                                                        focus ? 'bg-neutral-100' : '',
                                                        'block px-4 py-2 text-sm text-neutral-700'
                                                    )}
                                                >
                                                    Profile
                                                </Link>
                                            )}
                                        </MenuItem>
                                        <MenuItem>
                                            {({ focus }) => (
                                                <Link
                                                    href="/settings"
                                                    className={clsx(
                                                        focus ? 'bg-neutral-100' : '',
                                                        'block px-4 py-2 text-sm text-neutral-700'
                                                    )}
                                                >
                                                    Settings
                                                </Link>
                                            )}
                                        </MenuItem>
                                        <div className="border-t border-neutral-100" />
                                        <MenuItem>
                                            {({ focus }) => (
                                                <button
                                                    onClick={handleSignOut}
                                                    className={clsx(
                                                        focus ? 'bg-neutral-100' : '',
                                                        'block w-full px-4 py-2 text-left text-sm text-neutral-700'
                                                    )}
                                                >
                                                    Sign out
                                                </button>
                                            )}
                                        </MenuItem>
                                    </div>
                                </MenuItems>
                            </Menu>
                        ) : (
                            <Link
                                href="/login"
                                className={clsx(
                                    'inline-block rounded-lg px-3 py-1.5 text-sm font-semibold transition',
                                    invert
                                        ? 'bg-white text-neutral-950 hover:bg-neutral-100'
                                        : 'bg-neutral-950 text-white hover:bg-neutral-800'
                                )}
                            >
                                Log in
                            </Link>
                        )}
                    </div>

                    <div className="sm:hidden">
                        <button
                            ref={toggleRef}
                            type="button"
                            onClick={onToggle}
                            aria-expanded={expanded ? 'true' : 'false'}
                            aria-controls={panelId}
                            className={clsx(
                                'group -m-2.5 rounded-full p-2.5 transition',
                                invert ? 'hover:bg-white/10' : 'hover:bg-neutral-950/10',
                            )}
                            aria-label="Toggle navigation"
                        >
                            <Icon
                                className={clsx(
                                    'h-6 w-6',
                                    invert
                                        ? 'fill-white group-hover:fill-neutral-200'
                                        : 'fill-neutral-950 group-hover:fill-neutral-700',
                                )}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </Container>
    )
}

function NavigationRow({ children }: { children: React.ReactNode }) {
    return (
        <div className="even:mt-px sm:bg-neutral-950">
            <Container>
                <div className="grid grid-cols-1 sm:grid-cols-2">{children}</div>
            </Container>
        </div>
    )
}

function NavigationItem({
    href,
    children,
}: {
    href: string
    children: React.ReactNode
}) {
    return (
        <Link
            href={href}
            className="group relative isolate -mx-6 bg-neutral-950 px-6 py-10 even:mt-px sm:mx-0 sm:px-0 sm:py-16 sm:odd:pr-16 sm:even:mt-0 sm:even:border-l sm:even:border-neutral-800 sm:even:pl-16"
        >
            {children}
            <span className="absolute inset-y-0 -z-10 w-screen bg-neutral-900 opacity-0 transition group-odd:right-0 group-even:left-0 group-hover:opacity-100" />
        </Link>
    )
}

function Navigation() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user || null)
                setLoading(false)
            },
        )

        return () => {
            authListener.subscription.unsubscribe()
        }
    }, [supabase.auth])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        window.location.href = '/' // Redirect to home page after sign out
    }

    return (
        <nav className="mt-px font-display text-xl font-medium tracking-tight text-white">
            <NavigationRow>
                <NavigationItem href="/about">About Us</NavigationItem>
                <NavigationItem href="/pricing">Pricing</NavigationItem>
            </NavigationRow>
            <NavigationRow>
                <NavigationItem href="/contact">Contact</NavigationItem>
                {loading ? <div /> : user ? (
                    <button
                        onClick={handleSignOut}
                        className="group relative isolate -mx-6 bg-neutral-950 px-6 py-10 text-left even:mt-px sm:mx-0 sm:px-0 sm:py-16 sm:odd:pr-16 sm:even:mt-0 sm:even:border-l sm:even:border-neutral-800 sm:even:pl-16"
                    >
                        Sign Out
                        <span className="absolute inset-y-0 -z-10 w-screen bg-neutral-900 opacity-0 transition group-odd:right-0 group-even:left-0 group-hover:opacity-100" />
                    </button>
                ) : (
                    PRE_LAUNCH_MODE ? null : (
                        <NavigationItem href="/login">Sign In</NavigationItem>
                    )
                )}
            </NavigationRow>
        </nav>
    )
}

function RootLayoutInner({ children, pathname }: { children: React.ReactNode, pathname: string }) {
    let panelId = useId()
    let [expanded, setExpanded] = useState(false)
    let [isTransitioning, setIsTransitioning] = useState(false)
    let openRef = useRef<React.ElementRef<'button'>>(null)
    let closeRef = useRef<React.ElementRef<'button'>>(null)
    let navRef = useRef<React.ElementRef<'div'>>(null)
    let shouldReduceMotion = useReducedMotion()
    let isDashboard = pathname.startsWith('/dashboard')

    useEffect(() => {
        function onClick(event: MouseEvent) {
            if (
                event.target instanceof HTMLElement &&
                event.target.closest('a')?.href === window.location.href
            ) {
                setIsTransitioning(false)
                setExpanded(false)
            }
        }

        window.addEventListener('click', onClick)

        return () => {
            window.removeEventListener('click', onClick)
        }
    }, [])

    return (
        <MotionConfig
            transition={
                shouldReduceMotion || !isTransitioning ? { duration: 0 } : undefined
            }
        >
            {!isDashboard && (
                <header>
                    <div
                        className="absolute top-2 right-0 left-0 z-40 pt-14"
                        aria-hidden={expanded ? 'true' : undefined}
                        // @ts-ignore (https://github.com/facebook/react/issues/17157)
                        inert={expanded ? '' : undefined}
                    >
                        <Header
                            panelId={panelId}
                            icon={MenuIcon}
                            toggleRef={openRef}
                            expanded={expanded}
                            onToggle={() => {
                                setIsTransitioning(true)
                                setExpanded((expanded) => !expanded)
                                window.setTimeout(() =>
                                    closeRef.current?.focus({ preventScroll: true }),
                                )
                            }}
                        />
                    </div>

                    <motion.div
                        layout
                        id={panelId}
                        style={{ height: expanded ? 'auto' : '0.5rem' }}
                        className="relative z-50 overflow-hidden bg-neutral-950 pt-2"
                        aria-hidden={expanded ? undefined : 'true'}
                        // @ts-ignore (https://github.com/facebook/react/issues/17157)
                        inert={expanded ? undefined : ''}
                    >
                        <motion.div layout className="bg-neutral-800">
                            <div ref={navRef} className="bg-neutral-950 pt-14 pb-16">
                                <Header
                                    invert
                                    panelId={panelId}
                                    icon={XIcon}
                                    toggleRef={closeRef}
                                    expanded={expanded}
                                    onToggle={() => {
                                        setIsTransitioning(true)
                                        setExpanded((expanded) => !expanded)
                                        window.setTimeout(() =>
                                            openRef.current?.focus({ preventScroll: true }),
                                        )
                                    }}
                                />
                            </div>
                            <Navigation />
                            <div className="relative bg-neutral-950 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-neutral-800">
                                <Container>
                                    <div className="grid grid-cols-1 gap-y-10 pt-10 pb-16 sm:grid-cols-2 sm:pt-16">
                                        {/* Omitted for brevity */}
                                    </div>
                                </Container>
                            </div>
                        </motion.div>
                    </motion.div>
                </header>
            )}

            <motion.div
                layout
                style={!isDashboard ? { borderTopLeftRadius: 40, borderTopRightRadius: 40 } : {}}
                className={!isDashboard ? "relative flex flex-auto overflow-hidden bg-white pt-14" : "relative flex flex-auto overflow-hidden bg-white"}
            >
                <motion.div
                    layout
                    className={!isDashboard ? "relative isolate flex w-full flex-col pt-9" : "relative isolate flex w-full flex-col"}
                >
                    {!isDashboard && (
                        <GridPattern
                            className="absolute inset-x-0 -top-14 -z-10 h-[1000px] w-full mask-[linear-gradient(to_bottom,white_80%,transparent)] fill-neutral-100 stroke-neutral-950/6"
                            yOffset={-26}
                            interactive
                        />
                    )}

                    <main className="w-full flex-auto">{children}</main>

                    {/* {!isDashboard && <Footer />} */}
                </motion.div>
            </motion.div>
        </MotionConfig>
    )
}