'use client'

import { Dialog } from '@headlessui/react'
import { useState, useRef, useEffect } from 'react'
import {
    XMarkIcon,
    ShieldCheckIcon,
    ChartBarIcon,
    UserGroupIcon,
    EyeSlashIcon,
    BuildingLibraryIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    PencilSquareIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline'
import type { AgeBracket } from '@/lib/interfaces/percentile'

interface PercentileLearnMoreModalProps {
    isOpen: boolean
    onClose: () => void
    ageBracket: AgeBracket
    totalUsers: number
    usesSeedData: boolean
    onOptOut?: () => Promise<void>
    onChangeAgeBracket?: (newBracket: AgeBracket) => Promise<void>
}

export default function PercentileLearnMoreModal({
    isOpen,
    onClose,
    ageBracket,
    totalUsers,
    usesSeedData,
    onOptOut,
    onChangeAgeBracket
}: PercentileLearnMoreModalProps) {
    const [activeTab, setActiveTab] = useState<'how-it-works' | 'privacy' | 'settings'>('how-it-works')
    const [showChangeAge, setShowChangeAge] = useState(false)
    const [selectedAge, setSelectedAge] = useState<AgeBracket>(ageBracket)
    const [isOptingOut, setIsOptingOut] = useState(false)
    const [isChangingAge, setIsChangingAge] = useState(false)
    const [showConfirmOptOut, setShowConfirmOptOut] = useState(false)
    const [isAgeDropdownOpen, setIsAgeDropdownOpen] = useState(false)
    const ageDropdownRef = useRef<HTMLDivElement>(null)

    const ageBrackets: { value: AgeBracket; label: string }[] = [
        { value: '18-21', label: '18-21 years old' },
        { value: '22-25', label: '22-25 years old' },
        { value: '26-28', label: '26-28 years old' },
        { value: '29-32', label: '29-32 years old' },
        { value: '33-35', label: '33-35 years old' },
        { value: '36-40', label: '36-40 years old' },
        { value: '41+', label: '41+ years old' }
    ]

    const handleOptOut = async () => {
        if (!onOptOut) return
        setIsOptingOut(true)
        try {
            await onOptOut()
            onClose()
        } catch (error) {
            console.error('Error opting out:', error)
        } finally {
            setIsOptingOut(false)
            setShowConfirmOptOut(false)
        }
    }

    const handleChangeAge = async () => {
        if (!onChangeAgeBracket || selectedAge === ageBracket) return
        setIsChangingAge(true)
        try {
            await onChangeAgeBracket(selectedAge)
            setShowChangeAge(false)
            onClose()
        } catch (error) {
            console.error('Error changing age bracket:', error)
        } finally {
            setIsChangingAge(false)
        }
    }

    // Click outside handler for age dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ageDropdownRef.current && !ageDropdownRef.current.contains(event.target as Node)) {
                setIsAgeDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

            {/* Full-screen container */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
                    {/* Header - Fixed */}
                    <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-5 rounded-t-xl flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <Dialog.Title className="text-xl font-bold text-white">
                                Wealth Ranking
                            </Dialog.Title>
                            <button
                                onClick={onClose}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => setActiveTab('how-it-works')}
                                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                                    activeTab === 'how-it-works'
                                        ? 'bg-white text-teal-700'
                                        : 'bg-teal-700/50 text-white/90 hover:bg-teal-700/70'
                                }`}
                            >
                                How It Works
                            </button>
                            <button
                                onClick={() => setActiveTab('privacy')}
                                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                                    activeTab === 'privacy'
                                        ? 'bg-white text-teal-700'
                                        : 'bg-teal-700/50 text-white/90 hover:bg-teal-700/70'
                                }`}
                            >
                                Privacy
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                                    activeTab === 'settings'
                                        ? 'bg-white text-teal-700'
                                        : 'bg-teal-700/50 text-white/90 hover:bg-teal-700/70'
                                }`}
                            >
                                Settings
                            </button>
                        </div>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-5 min-h-[500px]">
                        {/* How It Works Tab */}
                        {activeTab === 'how-it-works' && (
                            <div className="space-y-4">
                                {/* Current methodology */}
                                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-sm">
                                    <div className="flex items-start gap-2 mb-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                                                <ChartBarIcon className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 text-sm">How We Calculate Your Rank</h3>
                                            <p className="text-xs text-slate-600 mt-0.5">
                                                Your rank is compared against:
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-start gap-3 bg-white rounded-lg p-2.5 border border-slate-200">
                                            <UserGroupIcon className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-semibold text-slate-900">Real Guapital Users</p>
                                                <p className="text-xs text-slate-600">
                                                    <strong className="text-teal-700">{totalUsers.toLocaleString()}</strong> user{totalUsers !== 1 ? 's' : ''} in ages {ageBracket}
                                                </p>
                                            </div>
                                        </div>

                                        {usesSeedData && (
                                            <div className="flex items-start gap-3 bg-white rounded-lg p-2.5 border border-slate-200">
                                                <BuildingLibraryIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-900">Federal Reserve Data</p>
                                                    <p className="text-xs text-slate-600">SCF 2022 — 6,000+ households</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Why blend data */}
                                {usesSeedData && (
                                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <BuildingLibraryIcon className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-teal-900 mb-1.5 text-xs">Why Blend Data?</h4>
                                                <ul className="space-y-1 text-xs text-teal-800">
                                                    <li className="flex items-start gap-1.5">
                                                        <span className="text-teal-600 mt-0.5 flex-shrink-0">✓</span>
                                                        <span>Need 1,000+ users per age bracket for 100% accuracy</span>
                                                    </li>
                                                    <li className="flex items-start gap-1.5">
                                                        <span className="text-teal-600 mt-0.5 flex-shrink-0">✓</span>
                                                        <span>Federal Reserve SCF = gold standard (6,000+ households)</span>
                                                    </li>
                                                    <li className="flex items-start gap-1.5">
                                                        <span className="text-teal-600 mt-0.5 flex-shrink-0">✓</span>
                                                        <span>Auto-transition to 100% real data as community grows</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!usesSeedData && totalUsers >= 1000 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <UserGroupIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-green-900 mb-1 text-xs">🎉 100% Real Data!</h4>
                                                <p className="text-xs text-green-800">
                                                    Your age bracket has reached <strong>{totalUsers.toLocaleString()} users</strong>! Rankings now use entirely real Guapital user data.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Data Source */}
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                    <h4 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5 text-xs">
                                        <BuildingLibraryIcon className="h-4 w-4 text-slate-600" />
                                        About the Federal Reserve SCF
                                    </h4>
                                    <p className="text-xs text-slate-700 leading-relaxed">
                                        The Survey of Consumer Finances is a triennial survey of U.S. household finances.
                                        The 2022 survey includes 6,000+ households and is the authoritative source for
                                        wealth distribution data in America.
                                    </p>
                                    <a
                                        href="https://www.federalreserve.gov/econres/scfindex.htm"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-2 inline-flex items-center gap-1"
                                    >
                                        Learn more →
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Privacy Tab */}
                        {activeTab === 'privacy' && (
                            <div className="space-y-4 flex flex-col justify-center min-h-full">
                                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-3 border border-teal-200">
                                    <div className="flex items-start gap-2 mb-2">
                                        <ShieldCheckIcon className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                                        <h3 className="font-semibold text-teal-900 text-sm">Your Privacy Matters</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <div className="flex-shrink-0 w-4 h-4 bg-teal-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                                                ✓
                                            </div>
                                            <p className="text-xs text-slate-800">
                                                Your <strong>exact net worth is NEVER shared</strong> with other users
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="flex-shrink-0 w-4 h-4 bg-teal-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                                                ✓
                                            </div>
                                            <p className="text-xs text-slate-800">
                                                Rankings are <strong>100% anonymous</strong> — no names or identifiable info
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="flex-shrink-0 w-4 h-4 bg-teal-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                                                ✓
                                            </div>
                                            <p className="text-xs text-slate-800">
                                                Only <strong>aggregated statistics</strong> are used (median, percentiles, etc.)
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="flex-shrink-0 w-4 h-4 bg-teal-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                                                ✓
                                            </div>
                                            <p className="text-xs text-slate-800">
                                                <strong>Opt-out anytime</strong> from the Settings tab
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <EyeSlashIcon className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-red-900 mb-2 text-xs">Never Shared</h4>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-red-800">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-red-600 flex-shrink-0">✗</span>
                                                    <span>Your name</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-red-600 flex-shrink-0">✗</span>
                                                    <span>Exact net worth</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-red-600 flex-shrink-0">✗</span>
                                                    <span>Transaction details</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-red-600 flex-shrink-0">✗</span>
                                                    <span>Account details</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Settings Tab */}
                        {activeTab === 'settings' && (
                            <div className="space-y-4 flex flex-col justify-center min-h-full">
                                {/* Change Age Bracket */}
                                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-sm">
                                    <div className="flex items-start gap-2 mb-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                                                <PencilSquareIcon className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-slate-900 text-sm">Change Age Group</h4>
                                            <p className="text-xs text-slate-600 mt-0.5">
                                                Current: <strong className="text-teal-700">Ages {ageBracket}</strong>
                                            </p>
                                        </div>
                                    </div>

                                    {!showChangeAge ? (
                                        <button
                                            onClick={() => setShowChangeAge(true)}
                                            className="w-full px-3 py-2 bg-teal-600 text-white text-sm rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm"
                                        >
                                            Update Age Group
                                        </button>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="block text-xs font-medium text-slate-700">
                                                Select your age group:
                                            </label>

                                            {/* Custom Tailwind Dropdown */}
                                            <div className="relative" ref={ageDropdownRef}>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAgeDropdownOpen(!isAgeDropdownOpen)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                                                >
                                                    <span className="text-slate-900">
                                                        {ageBrackets.find(b => b.value === selectedAge)?.label || 'Select age...'}
                                                    </span>
                                                    <ChevronDownIcon className={`h-4 w-4 text-slate-500 transition-transform ${
                                                        isAgeDropdownOpen ? 'rotate-180' : ''
                                                    }`} />
                                                </button>

                                                {/* Dropdown Menu - Opens Downward */}
                                                {isAgeDropdownOpen && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-auto z-50">
                                                        {ageBrackets.map((bracket) => (
                                                            <button
                                                                key={bracket.value}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedAge(bracket.value)
                                                                    setIsAgeDropdownOpen(false)
                                                                }}
                                                                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                                                    selectedAge === bracket.value
                                                                        ? 'bg-teal-50 text-teal-900 font-medium'
                                                                        : 'text-slate-700 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                {bracket.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleChangeAge}
                                                    disabled={isChangingAge || selectedAge === ageBracket}
                                                    className="flex-1 px-3 py-2 text-sm bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                                >
                                                    {isChangingAge ? 'Updating...' : 'Confirm'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowChangeAge(false)
                                                        setSelectedAge(ageBracket)
                                                        setIsAgeDropdownOpen(false)
                                                    }}
                                                    className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Opt Out - Fixed at Bottom of Modal (Settings Tab Only) */}
                    {activeTab === 'settings' && (
                        <div className="border-t border-slate-200 px-5 py-4 text-center bg-white rounded-b-xl flex-shrink-0">
                            {!showConfirmOptOut ? (
                                <button
                                    onClick={() => setShowConfirmOptOut(true)}
                                    className="text-xs text-red-600 hover:text-red-700 transition-colors underline"
                                >
                                    Opt out of percentile rankings
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-700">
                                        Are you sure? You can always opt back in later.
                                    </p>
                                    <div className="flex gap-2 justify-center">
                                        <button
                                            onClick={handleOptOut}
                                            disabled={isOptingOut}
                                            className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                                        >
                                            {isOptingOut ? 'Opting out...' : 'Yes, opt out'}
                                        </button>
                                        <span className="text-xs text-slate-400">•</span>
                                        <button
                                            onClick={() => setShowConfirmOptOut(false)}
                                            className="text-xs text-slate-600 hover:text-slate-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}
