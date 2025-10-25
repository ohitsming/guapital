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
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

import { Container } from '@/components/Container'
import { Footer } from '@/components/Footer'
import { GridPattern } from '@/components/GridPattern'
import { Logo } from '@/components/Logo'

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


import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { PRE_LAUNCH_MODE } from '@/lib/featureFlags'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon, UserCircleIcon } from '@heroicons/react/20/solid'

function Header({
    panelId,
    expanded,
    onToggle,
    toggleRef,
    isSticky = false,
    setExpanded,
    menuRef,
}: {
    panelId: string
    expanded: boolean
    onToggle: () => void
    toggleRef: React.RefObject<HTMLButtonElement>
    isSticky?: boolean
    setExpanded: (value: boolean) => void
    menuRef?: React.RefObject<HTMLDivElement>
}) {
    let pathname = usePathname()
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
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
        <div className={clsx(
            "fixed top-4 z-50 transition-all duration-200",
            !pathname.startsWith('/dashboard') && [
                "left-8 right-8 sm:left-12 sm:right-12 lg:left-16 lg:right-16",
                "rounded-full border border-neutral-200",
                "bg-transparent backdrop-blur-md shadow-sm"
            ],
            pathname.startsWith('/dashboard') && "top-0 left-0 right-0 rounded-none"
        )}>
            <div className={clsx(
                "mx-auto px-6",
                pathname.startsWith('/dashboard') ? 'max-w-none' : 'max-w-7xl'
            )}>
                <div className={clsx(
                    "flex items-center justify-between h-14",
                    pathname.startsWith('/dashboard') && "ml-64"
                )}>
                    {/* Logo on the left */}
                    <Link
                        href="/"
                        aria-label="Home"
                        className="flex items-center"
                    >
                        <Logo className="h-12" />
                        {/* <span className="text-xl font-semibold text-neutral-950">
                            Guapital
                        </span> */}
                    </Link>

                    {/* Center navigation */}
                    <nav className="hidden lg:flex lg:items-center lg:gap-x-1 absolute left-1/2 -translate-x-1/2">
                        {!pathname.startsWith('/dashboard') && (
                            <>
                                <Link
                                    href="/about"
                                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
                                >
                                    About
                                </Link>
                                <Link
                                    href="/pricing"
                                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
                                >
                                    Pricing
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Right side auth buttons */}
                    <div className="flex items-center gap-x-3">
                        {loading ? (
                            <div className="h-9 w-20 animate-pulse rounded-lg bg-neutral-200" />
                        ) : user ? (
                            <Menu as="div" className="relative">
                                <MenuButton className="flex items-center gap-x-2 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-950 transition-colors">
                                    <UserCircleIcon className="h-5 w-5" />
                                    <span>Account</span>
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
                            <>
                                <Link
                                    href="/login"
                                    className="hidden sm:block px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="hidden sm:block px-4 py-2 text-sm font-medium text-white bg-neutral-950 rounded-lg hover:bg-neutral-800 transition-colors"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                        {/* Mobile menu button */}
                        <button
                            ref={toggleRef}
                            type="button"
                            onClick={onToggle}
                            aria-expanded={expanded ? 'true' : 'false'}
                            aria-controls={panelId}
                            className="lg:hidden p-2 -m-2 text-neutral-600 hover:text-neutral-950 transition-colors"
                            aria-label="Toggle navigation"
                        >
                            {expanded ? (
                                <XMarkIcon className="h-5 w-5" />
                            ) : (
                                <Bars3Icon className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu dropdown */}
            {expanded && !pathname.startsWith('/dashboard') && (
                <div ref={menuRef} className="lg:hidden fixed top-20 left-8 right-8 sm:left-12 sm:right-12 z-40 bg-white border border-neutral-200 rounded-2xl shadow-lg overflow-hidden">
                    <nav className="px-4 py-6 space-y-1">
                        <Link
                            href="/about"
                            className="block px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 rounded-lg transition-colors"
                            onClick={() => setExpanded(false)}
                        >
                            About
                        </Link>
                        <Link
                            href="/pricing"
                            className="block px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 rounded-lg transition-colors"
                            onClick={() => setExpanded(false)}
                        >
                            Pricing
                        </Link>

                        {/* Auth section */}
                        {user ? (
                            <div className="pt-4 mt-4 border-t border-neutral-200 space-y-1">
                                <Link
                                    href="/dashboard"
                                    className="block px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 rounded-lg transition-colors"
                                    onClick={() => setExpanded(false)}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/profile"
                                    className="block px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 rounded-lg transition-colors"
                                    onClick={() => setExpanded(false)}
                                >
                                    Profile
                                </Link>
                                <Link
                                    href="/settings"
                                    className="block px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 rounded-lg transition-colors"
                                    onClick={() => setExpanded(false)}
                                >
                                    Settings
                                </Link>
                                <button
                                    onClick={() => {
                                        handleSignOut();
                                        setExpanded(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 rounded-lg transition-colors"
                                >
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <div className="pt-4 mt-4 border-t border-neutral-200 space-y-2">
                                <Link
                                    href="/login"
                                    className="block px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 rounded-lg transition-colors text-center"
                                    onClick={() => setExpanded(false)}
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="block px-4 py-2.5 text-sm font-medium text-white bg-neutral-950 rounded-lg hover:bg-neutral-800 transition-colors text-center"
                                    onClick={() => setExpanded(false)}
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>
            )}
        </div>
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
            (_, session) => {
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
                <NavigationItem href="/about">About</NavigationItem>
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
                        <NavigationItem href="/login">Log In</NavigationItem>
                    )
                )}
            </NavigationRow>
            {!loading && !user && !PRE_LAUNCH_MODE && (
                <NavigationRow>
                    <NavigationItem href="/signup">
                        <span className="font-semibold text-amber-400">Get Started →</span>
                    </NavigationItem>
                </NavigationRow>
            )}
        </nav>
    )
}

function RootLayoutInner({ children, pathname }: { children: React.ReactNode, pathname: string }) {
    let panelId = useId()
    let [expanded, setExpanded] = useState(false)
    let [isSticky, setIsSticky] = useState(false)
    let openRef = useRef<React.ElementRef<'button'>>(null)
    let menuRef = useRef<HTMLDivElement>(null)
    let shouldReduceMotion = useReducedMotion()
    let isDashboard = pathname.startsWith('/dashboard')

    useEffect(() => {
        if (!isDashboard) {
            const handleScroll = () => {
                setIsSticky(window.scrollY > 104);
            };

            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, [isDashboard])

    useEffect(() => {
        function onClick(event: MouseEvent) {
            if (
                event.target instanceof HTMLElement &&
                event.target.closest('a')?.href === window.location.href
            ) {
                setExpanded(false)
            }
        }

        window.addEventListener('click', onClick)

        return () => {
            window.removeEventListener('click', onClick)
        }
    }, [])

    // Close mobile menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                expanded &&
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                openRef.current &&
                !openRef.current.contains(event.target as Node)
            ) {
                setExpanded(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [expanded])

    return (
        <MotionConfig
            transition={shouldReduceMotion ? { duration: 0 } : undefined}
        >
            {!isDashboard && (
                <header>
                    {/* Spacer for floating header - top margin + header height */}
                    <div className="h-24" />
                    <div
                        className="top-0 right-0 left-0 z-40"
                        aria-hidden={expanded ? 'true' : undefined}
                        // @ts-ignore (https://github.com/facebook/react/issues/17157)
                        inert={expanded ? '' : undefined}
                    >
                        <Header
                            panelId={panelId}
                            toggleRef={openRef}
                            expanded={expanded}
                            isSticky={isSticky}
                            setExpanded={setExpanded}
                            menuRef={menuRef}
                            onToggle={() => {
                                setExpanded((expanded) => !expanded)
                            }}
                        />
                    </div>
                </header>
            )}

            <motion.div
                layout
                style={!isDashboard ? { borderTopLeftRadius: 40, borderTopRightRadius: 40 } : {}}
                className={!isDashboard ? "relative flex flex-auto overflow-hidden bg-white" : "relative flex flex-auto overflow-hidden bg-white"}
            >
                <motion.div
                    layout
                    className="relative isolate flex w-full flex-col"
                >
                    {!isDashboard && (
                        <GridPattern
                            className="absolute inset-x-0 -top-14 -z-10 h-[1000px] w-full mask-[linear-gradient(to_bottom,white_80%,transparent)] fill-neutral-100 stroke-neutral-950/6"
                            yOffset={-26}
                            interactive
                        />
                    )}

                    <main className="w-full flex-auto">{children}</main>

                    {!isDashboard && <Footer />}
                </motion.div>
            </motion.div>
        </MotionConfig>
    )
}