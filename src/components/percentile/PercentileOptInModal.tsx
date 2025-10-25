'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import {
    ChartBarIcon,
    ShieldCheckIcon,
    EyeSlashIcon,
    XMarkIcon,
    TrophyIcon,
    ChevronDownIcon,
    UserGroupIcon,
    BuildingLibraryIcon
} from '@heroicons/react/24/outline'
import type { AgeBracket } from '@/lib/interfaces/percentile'

interface PercentileOptInModalProps {
    isOpen: boolean
    onClose: () => void
    onOptIn: (ageBracket: AgeBracket) => Promise<void>
}

export default function PercentileOptInModal({ isOpen, onClose, onOptIn }: PercentileOptInModalProps) {
    const [selectedBracket, setSelectedBracket] = useState<AgeBracket | ''>('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasConsented, setHasConsented] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const ageBrackets: { value: AgeBracket; label: string }[] = [
        { value: '18-21', label: '18-21 years old' },
        { value: '22-25', label: '22-25 years old' },
        { value: '26-28', label: '26-28 years old' },
        { value: '29-32', label: '29-32 years old' },
        { value: '33-35', label: '33-35 years old' },
        { value: '36-40', label: '36-40 years old' },
        { value: '41+', label: '41+ years old' },
    ]

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSubmit = async () => {
        if (!selectedBracket) {
            setError('Please select your age bracket')
            return
        }

        if (!hasConsented) {
            setError('Please confirm you understand how your data will be used')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            await onOptIn(selectedBracket)
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to opt in. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            {/* Full-screen container to center the panel */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto max-w-lg w-full bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                    {/* Header - Fixed */}
                    <div className="relative bg-gradient-to-r from-teal-600 to-teal-700 p-5 rounded-t-lg flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>

                        <div className="flex items-center space-x-3">
                            <TrophyIcon className="h-7 w-7 text-amber-400" />
                            <div>
                                <Dialog.Title className="text-xl font-bold text-white">
                                    See How You Rank!
                                </Dialog.Title>
                                <p className="text-teal-100 text-xs mt-0.5">
                                    Compare your net worth to others your age
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="p-5 space-y-4 overflow-y-auto flex-1">
                        {/* Benefits - More Compact */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-start space-x-2">
                                <ChartBarIcon className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">See your rank</p>
                                    <p className="text-xs text-gray-600">Compare to peers</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-2">
                                <TrophyIcon className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">Track progress</p>
                                    <p className="text-xs text-gray-600">Watch rank improve</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-2">
                                <ShieldCheckIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">100% anonymous</p>
                                    <p className="text-xs text-gray-600">Data never shared</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-2">
                                <EyeSlashIcon className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">Opt-in only</p>
                                    <p className="text-xs text-gray-600">Opt out anytime</p>
                                </div>
                            </div>
                        </div>

                        {/* How Rankings Work - SCF Data Disclosure */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-sm">
                            <div className="flex items-start gap-2 mb-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                                        <ChartBarIcon className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 text-sm">How Rankings Work</h4>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        Your rank is compared against:
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 ml-0">
                                {/* Only show Federal Reserve data - hiding Real Guapital Users until we enable user comparisons */}
                                <div className="flex items-start gap-3 bg-white rounded-lg p-2.5 border border-slate-200">
                                    <BuildingLibraryIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-semibold text-slate-900">Federal Reserve Data</p>
                                        <p className="text-xs text-slate-600">6,000+ households surveyed nationally (SCF 2022)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-200">
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                                        <span className="font-medium text-slate-700">Based on Federal Reserve data</span>
                                    </span>
                                    {' '}to ensure consistent, reliable rankings across all users.
                                </p>
                            </div>
                        </div>

                        {/* Age Bracket Selection - Custom Tailwind Dropdown */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                What&apos;s your age?
                            </label>
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left border rounded-md shadow-sm transition-colors ${
                                        selectedBracket
                                            ? 'border-teal-500 bg-white text-gray-900'
                                            : 'border-gray-300 bg-white text-gray-500'
                                    } hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500`}
                                >
                                    <span className={selectedBracket ? 'text-gray-900' : 'text-gray-500'}>
                                        {selectedBracket
                                            ? ageBrackets.find(b => b.value === selectedBracket)?.label
                                            : 'Select your age bracket'}
                                    </span>
                                    <ChevronDownIcon
                                        className={`w-5 h-5 text-gray-400 transition-transform ${
                                            isDropdownOpen ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                {/* Dropdown Menu - Opens Upward */}
                                {isDropdownOpen && (
                                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto z-50">
                                        {ageBrackets.map((bracket) => (
                                            <button
                                                key={bracket.value}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedBracket(bracket.value)
                                                    setIsDropdownOpen(false)
                                                    setError(null)
                                                }}
                                                className={`w-full text-left px-4 py-2.5 transition-colors ${
                                                    selectedBracket === bracket.value
                                                        ? 'bg-teal-50 text-teal-900 font-medium'
                                                        : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {bracket.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="rounded-md bg-red-50 p-2">
                                <p className="text-xs text-red-800">{error}</p>
                            </div>
                        )}

                        {/* Consent Checkbox - GDPR Compliant */}
                        <div className="border-t border-gray-200 pt-3">
                            <label className="flex items-start space-x-2.5 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={hasConsented}
                                    onChange={(e) => {
                                        setHasConsented(e.target.checked)
                                        setError(null)
                                    }}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer flex-shrink-0"
                                />
                                <span className="text-xs text-gray-700 leading-relaxed">
                                    I understand my anonymized net worth data will be used to calculate percentile rankings as described in the{' '}
                                    <a
                                        href="/privacy#percentile-ranking"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-teal-600 underline hover:text-teal-700 font-medium"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Privacy Policy
                                    </a>
                                    . I may withdraw consent anytime.
                                </span>
                            </label>
                        </div>

                        {/* Actions - Fixed at bottom */}
                        <div className="flex space-x-2 pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !selectedBracket || !hasConsented}
                                className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                                    isSubmitting || !selectedBracket || !hasConsented
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-teal-600 text-white hover:bg-teal-700'
                                }`}
                            >
                                {isSubmitting ? 'Loading...' : 'Show Me My Rank'}
                            </button>

                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded-md font-medium text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}
