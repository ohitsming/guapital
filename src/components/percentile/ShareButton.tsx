'use client'

import { useState } from 'react'
import { ShareIcon } from '@heroicons/react/24/outline'
import ShareModal from './ShareModal'

interface ShareButtonProps {
  percentile: number
  age: number
  netWorth: number
  className?: string
}

export default function ShareButton({
  percentile,
  age,
  netWorth,
  className = ''
}: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600
          text-neutral-900 rounded-lg font-medium transition-colors ${className}`}
      >
        <ShareIcon className="w-5 h-5" />
        Share
      </button>

      {showModal && (
        <ShareModal
          percentile={percentile}
          age={age}
          netWorth={netWorth}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
