'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Dialog } from '@headlessui/react'
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { apiPost } from '@/utils/api'

interface ShareModalProps {
  percentile: number
  age: number
  netWorth: number
  onClose: () => void
}

const captionTemplates = [
  "Making progress on my financial journey",
  "Tracking my net worth with Guapital",
  "Celebrating milestones on the path to financial independence",
]

export default function ShareModal({ percentile, age, netWorth, onClose }: ShareModalProps) {
  const [shareType, setShareType] = useState<'static' | 'progress'>('static')
  const [showNetWorth, setShowNetWorth] = useState(false)
  const [anonymous, setAnonymous] = useState(false)
  const [caption, setCaption] = useState(captionTemplates[0])
  const [progressData, setProgressData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Fetch progress data
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch('/api/percentile/progress?period=3mo')
        if (res.ok) {
          const data = await res.json()
          setProgressData(data)
          // If significant progress, default to progress share
          if (data.delta?.isSignificant && data.delta?.trend === 'improving') {
            setShareType('progress')
          }
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProgress()
  }, [])

  const trackShare = useCallback(async (eventType: 'initiated' | 'completed', platform?: string) => {
    try {
      await apiPost('/api/share/track', {
        eventType,
        shareType,
        platform,
        percentile,
        age,
        startPercentile: progressData?.past.percentile,
        endPercentile: progressData?.current.percentile,
        deltaPercentile: progressData?.delta.percentilePoints,
        timePeriod: progressData?.timePeriod,
        netWorthGrowth: progressData?.delta.netWorthGrowth,
        includedNetWorth: showNetWorth,
        anonymous,
        shareCardVariant: 'minimalist'
      })
    } catch (error) {
      console.error('Failed to track share:', error)
    }
  }, [shareType, percentile, age, progressData, showNetWorth, anonymous])

  // Track share initiated
  useEffect(() => {
    trackShare('initiated')
  }, [trackShare])

  const shareUrl = useMemo(() => {
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'https://guapital.com'

    if (shareType === 'progress' && progressData) {
      return `${baseUrl}/api/og/percentile-progress?startPercentile=${progressData.past.percentile}&endPercentile=${progressData.current.percentile}&age=${age}&timePeriod=${progressData.timePeriod}&deltaPoints=${Math.abs(Math.round(progressData.delta.percentilePoints))}`
    }

    return `${baseUrl}/api/og/percentile-static?percentile=${Math.round(percentile)}&age=${age}&showNetWorth=${showNetWorth}&netWorth=${netWorth}`
  }, [shareType, percentile, age, showNetWorth, netWorth, progressData])

  const handleShare = async (platform: 'twitter' | 'linkedin' | 'reddit' | 'copy_link') => {
    await trackShare('completed', platform)

    const encodedCaption = encodeURIComponent(caption)
    const encodedUrl = encodeURIComponent(shareUrl)

    let url = ''
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedCaption}&url=${encodedUrl}`
        window.open(url, '_blank', 'width=600,height=400')
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        window.open(url, '_blank', 'width=600,height=400')
        break
      case 'reddit':
        url = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedCaption}`
        window.open(url, '_blank', 'width=800,height=600')
        break
      case 'copy_link':
        try {
          await navigator.clipboard.writeText(shareUrl)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch (err) {
          alert('Failed to copy link')
        }
        break
    }
  }

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <Dialog.Title className="text-2xl font-bold text-neutral-900">
                Share Your Percentile
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Privacy Warning */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Sharing financial info publicly may pose security risks. Only share what you&apos;re comfortable with.
                </p>
              </div>
            </div>

            {/* Share Type Selection */}
            {!loading && progressData && progressData.delta?.isSignificant && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  What would you like to share?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="shareType"
                      value="static"
                      checked={shareType === 'static'}
                      onChange={(e) => setShareType('static')}
                      className="mr-2 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-neutral-700">Current Percentile</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="shareType"
                      value="progress"
                      checked={shareType === 'progress'}
                      onChange={(e) => setShareType('progress')}
                      className="mr-2 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-neutral-700">
                      Progress (+{Math.abs(Math.round(progressData.delta.percentilePoints))} points)
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Privacy Controls */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700">
                Privacy Settings
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNetWorth}
                  onChange={(e) => setShowNetWorth(e.target.checked)}
                  className="mr-2 text-teal-600 focus:ring-teal-500 rounded"
                />
                <span className="text-sm text-neutral-700">Include net worth amount</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="mr-2 text-teal-600 focus:ring-teal-500 rounded"
                />
                <span className="text-sm text-neutral-700">Share anonymously (no username)</span>
              </label>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-neutral-700">Preview</h3>
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <img
                  src={shareUrl}
                  alt="Share card preview"
                  className="w-full"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Caption Editor */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex flex-wrap gap-2">
                {captionTemplates.map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCaption(template)}
                    className="text-xs px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            {/* Share Buttons */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-neutral-700">Share to</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleShare('twitter')}
                  className="px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Twitter
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                  </svg>
                  LinkedIn
                </button>
                <button
                  onClick={() => handleShare('reddit')}
                  className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                  </svg>
                  Reddit
                </button>
                <button
                  onClick={() => handleShare('copy_link')}
                  className="px-4 py-3 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="w-5 h-5" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
