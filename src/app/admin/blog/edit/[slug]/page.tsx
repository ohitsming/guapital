'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function EditBlogPostPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [post, setPost] = useState<any>(null)

  // Editable fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [isPublished, setIsPublished] = useState(false)

  // Preview
  const [showPreview, setShowPreview] = useState(true)


  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/blog/${params.slug}`)
        if (!response.ok) throw new Error('Failed to fetch post')

        const data = await response.json()
        setPost(data)

        // Populate fields
        setTitle(data.title)
        setDescription(data.description)
        setContent(data.content)
        setCategory(data.category || '')
        setTags(data.tags?.join(', ') || '')
        setIsPublished(!!data.published_at)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [params.slug])

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/blog/${params.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          content,
          category,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          published_at: isPublished ? new Date().toISOString() : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Save failed')
      }

      // Revalidate
      await fetch(`/api/revalidate?path=/blog/${params.slug}`, { method: 'POST' })

      router.push('/admin/blog')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/blog/${params.slug}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Delete failed')
      }

      // Force hard navigation to bypass Next.js cache
      window.location.href = '/admin/blog'
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
    }
  }

  function handlePreviewToggle() {
    setShowPreview(!showPreview)
  }


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error && !post) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
              <p className="mt-2 text-sm text-gray-600">
                Slug: <span className="font-mono">/blog/{params.slug}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviewToggle}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <a
                href={`/admin/blog/preview/${params.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-teal-300 bg-teal-50 px-4 py-2 font-medium text-teal-700 hover:bg-teal-100"
              >
                Full Preview
              </a>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-teal-600 px-6 py-2 font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className={`grid grid-cols-1 gap-6 ${showPreview ? 'lg:grid-cols-2' : ''}`}>
          {/* Editor */}
          <div className="space-y-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Metadata</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Tag1, Tag2, Tag3"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="published"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="published" className="ml-2 text-sm font-medium text-gray-700">
                  Published
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Content (MDX)</h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={25}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="space-y-4">
              <div className="sticky top-4 rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
                  <a
                    href={`/admin/blog/preview/${params.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-teal-600 hover:text-teal-700"
                  >
                    Open full preview →
                  </a>
                </div>

                <div className="prose prose-sm max-w-none overflow-auto rounded-lg border border-gray-200 bg-white p-6">
                  {content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-gray-400 italic">Start typing to see preview...</p>
                  )}
                </div>

                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> This shows basic markdown rendering. Click &quot;Full Preview&quot; to see the complete layout with your blog theme.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
