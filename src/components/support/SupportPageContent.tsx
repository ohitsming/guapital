'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { QuestionMarkCircleIcon, BugAntIcon, SparklesIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { Dropdown } from '@/components/ui/Dropdown'
import { Button } from '@/components/Button'
import type { SupportRequestType } from '@/lib/interfaces/support'
import Link from 'next/link'

interface QuickHelpItem {
  question: string
  answer: string
  icon: React.ComponentType<{ className?: string }>
}

const quickHelpItems: QuickHelpItem[] = [
  {
    question: "Why isn't Plaid/bank auto-sync available?",
    answer: "Plaid auto-sync is a Premium feature. Free users can track unlimited manual accounts. Upgrade to Premium to automatically sync bank accounts, credit cards, and investments.",
    icon: SparklesIcon,
  },
  {
    question: "Can I track more than 2 crypto wallets?",
    answer: "Free users can track up to 2 crypto wallets. Upgrade to Premium for unlimited crypto wallet tracking across Ethereum, Polygon, Base, Arbitrum, and Optimism networks.",
    icon: QuestionMarkCircleIcon,
  },
  {
    question: "Crypto wallet not syncing?",
    answer: "Ensure your wallet address is correct and the wallet is on a supported network (Ethereum, Polygon, Base, Arbitrum, Optimism). Syncing can take 1-2 minutes. Try refreshing your dashboard.",
    icon: BugAntIcon,
  },
  {
    question: "How do I delete my account?",
    answer: "You can delete your account from Settings. Go to Dashboard > Account dropdown > Settings, then scroll to the bottom and click 'Delete Account'. This action is permanent and cannot be undone.",
    icon: UserCircleIcon,
  },
]

export function SupportPageContent() {
  const [expandedItem, setExpandedItem] = useState<number | null>(null)
  const [issueType, setIssueType] = useState<SupportRequestType>('question')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const issueTypeOptions = [
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'account', label: 'Account Issue' },
    { value: 'question', label: 'General Question' },
    { value: 'other', label: 'Other' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitStatus({ type: null, message: '' })

    if (description.length < 10) {
      setSubmitStatus({
        type: 'error',
        message: 'Please provide at least 10 characters in your description.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: issueType,
          description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = data.retryAfter || 60
          setSubmitStatus({
            type: 'error',
            message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          })
        } else {
          setSubmitStatus({
            type: 'error',
            message: data.error || 'Failed to submit support request. Please try again.',
          })
        }
      } else {
        setSubmitStatus({
          type: 'success',
          message: "Thank you! We've received your request and will respond within 24-48 hours.",
        })
        setDescription('')
        setIssueType('question')
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Network error. Please check your connection and try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Support & Feedback</h1>
          <p className="mt-2 text-gray-600">
            Get help, report bugs, or request features for your Guapital account
          </p>
        </div>

        {/* Quick Help Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Help</h2>
          <div className="space-y-3">
            {quickHelpItems.map((item, index) => {
              const isExpanded = expandedItem === index
              const Icon = item.icon

              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedItem(isExpanded ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className="h-5 w-5 text-[#004D40] flex-shrink-0" />
                      <span className="font-medium text-gray-900">{item.question}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-6 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                      <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-8"></div>

        {/* Contact Form */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Still need help?</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Issue Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What can we help you with?
                </label>
                <Dropdown
                  value={issueType}
                  onChange={(value) => setIssueType(value as SupportRequestType)}
                  options={issueTypeOptions}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe your issue or question in detail..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent resize-none"
                  required
                  minLength={10}
                  maxLength={5000}
                />
                <p className="mt-2 text-sm text-gray-500">
                  {description.length}/5000 characters (minimum 10)
                </p>
              </div>

              {/* Status Messages */}
              {submitStatus.type && (
                <div
                  className={`p-4 rounded-lg ${
                    submitStatus.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {submitStatus.message}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">We respond within 24-48 hours</p>
                <Button type="submit" disabled={isSubmitting || description.length < 10}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Useful Links */}
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Useful Links</h3>
          <div className="space-y-2">
            <Link
              href="/privacy"
              className="block text-sm text-[#004D40] hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="block text-sm text-[#004D40] hover:underline"
            >
              Terms of Service
            </Link>
            <Link
              href="/dashboard/settings"
              className="block text-sm text-[#004D40] hover:underline"
            >
              Account Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
