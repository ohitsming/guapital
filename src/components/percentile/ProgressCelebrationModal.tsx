'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'
import ShareButton from './ShareButton'

interface ProgressCelebrationModalProps {
  percentile: number
  age: number
  netWorth: number
}

export default function ProgressCelebrationModal({
  percentile,
  age,
  netWorth
}: ProgressCelebrationModalProps) {
  const [show, setShow] = useState(false)
  const [progressData, setProgressData] = useState<any>(null)

  useEffect(() => {
    const checkProgress = async () => {
      try {
        const res = await fetch('/api/percentile/progress?period=3mo')
        if (res.ok) {
          const data = await res.json()

          // Only show if significant improvement
          if (data.delta?.isSignificant && data.delta?.trend === 'improving') {
            // Check if user has seen this celebration before (using localStorage)
            const celebrationKey = `celebration-${data.past.percentile}-${data.current.percentile}`
            const hasSeenCelebration = localStorage.getItem(celebrationKey)

            if (!hasSeenCelebration) {
              setProgressData(data)
              setShow(true)
              localStorage.setItem(celebrationKey, 'true')
            }
          }
        }
      } catch (err) {
        // Silently fail - user can still manually share
        console.error('Failed to check progress:', err)
      }
    }

    checkProgress()
  }, [])

  if (!show || !progressData) return null

  const deltaPoints = Math.abs(Math.round(progressData.delta.percentilePoints))

  return (
    <Dialog open={show} onClose={() => setShow(false)} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-xl p-6">
          <div className="text-center space-y-6">
            {/* Close button */}
            <button
              onClick={() => setShow(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            {/* Celebration icon */}
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Dialog.Title className="text-2xl font-bold text-neutral-900">
                Amazing Progress!
              </Dialog.Title>
              <p className="text-lg text-neutral-700">
                You&apos;ve moved up{' '}
                <span className="font-bold text-emerald-600">
                  {deltaPoints} percentile point{deltaPoints > 1 ? 's' : ''}
                </span>{' '}
                in the last 3 months!
              </p>
            </div>

            {/* Progress stats */}
            <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">3 months ago:</span>
                <span className="font-semibold text-neutral-900">
                  Top {progressData.past.percentile}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Today:</span>
                <span className="font-semibold text-emerald-600">
                  Top {progressData.current.percentile}%
                </span>
              </div>
              {progressData.delta.netWorthGrowth > 0 && (
                <div className="flex justify-between text-sm pt-2 border-t border-neutral-200">
                  <span className="text-neutral-600">Net worth growth:</span>
                  <span className="font-semibold text-neutral-900">
                    +${progressData.delta.netWorthGrowth.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Call to action */}
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">
                Share your progress with friends and celebrate this milestone!
              </p>

              <ShareButton
                percentile={percentile}
                age={age}
                netWorth={netWorth}
                className="w-full justify-center py-3 text-base"
              />

              <button
                onClick={() => setShow(false)}
                className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
