'use client'

import { useState } from 'react'

export default function RevalidateButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleRevalidate = async () => {
    setLoading(true)
    setMessage('')

    try {
      // Fetch all published posts from database
      const postsResponse = await fetch('/api/blog/posts')
      if (!postsResponse.ok) throw new Error('Failed to fetch posts')

      const posts = await postsResponse.json()

      // Build list of paths to revalidate
      const paths = [
        '/blog',
        '/blog/page/1',
        ...posts.map((post: any) => `/blog/${post.slug}`)
      ]

      // Revalidate all paths
      const results = await Promise.all(
        paths.map(path =>
          fetch(`/api/revalidate?path=${encodeURIComponent(path)}`, {
            method: 'POST'
          })
        )
      )

      const allSuccessful = results.every(r => r.ok)

      if (allSuccessful) {
        setMessage(`Successfully revalidated ${paths.length} pages`)
      } else {
        setMessage('Some paths failed to revalidate')
      }
    } catch (error) {
      console.error('Revalidation error:', error)
      setMessage('Error revalidating pages')
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleRevalidate}
        disabled={loading}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Revalidating...' : 'Revalidate Cache'}
      </button>
      {message && (
        <span
          className={`text-sm ${
            message.includes('Successfully')
              ? 'text-green-600'
              : 'text-red-600'
          }`}
        >
          {message}
        </span>
      )}
    </div>
  )
}
