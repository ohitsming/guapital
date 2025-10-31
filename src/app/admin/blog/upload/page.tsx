'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import matter from 'gray-matter'

type UploadMode = 'file' | 'text'

export default function BlogUploadPage() {
  const router = useRouter()
  const [mode, setMode] = useState<UploadMode>('file')
  const [file, setFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{
    frontmatter: any
    content: string
  } | null>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)

    // Parse and preview
    try {
      const content = await selectedFile.text()
      const { data: frontmatter, content: mdxContent } = matter(content)
      setPreview({ frontmatter, content: mdxContent })
    } catch (err) {
      setError('Failed to parse MDX file. Check frontmatter format.')
      console.error(err)
    }
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value
    setTextContent(text)
    setError(null)

    // Parse and preview
    try {
      const { data: frontmatter, content: mdxContent } = matter(text)
      setPreview({ frontmatter, content: mdxContent })
    } catch (err) {
      setError('Failed to parse MDX content. Check frontmatter format.')
      console.error(err)
    }
  }

  function handleModeChange(newMode: UploadMode) {
    setMode(newMode)
    setFile(null)
    setTextContent('')
    setPreview(null)
    setError(null)
  }

  async function handleUpload() {
    if (!preview) return

    setLoading(true)
    setError(null)

    try {
      let response

      if (mode === 'file' && file) {
        const formData = new FormData()
        formData.append('file', file)

        response = await fetch('/api/blog/upload', {
          method: 'POST',
          body: formData,
        })
      } else if (mode === 'text' && textContent) {
        // Create a Blob from text content and upload as file
        const blob = new Blob([textContent], { type: 'text/markdown' })
        const fileName = `${preview.frontmatter.slug || 'untitled'}.mdx`
        const formData = new FormData()
        formData.append('file', blob, fileName)

        response = await fetch('/api/blog/upload', {
          method: 'POST',
          body: formData,
        })
      } else {
        throw new Error('No content to upload')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      // Success - redirect to blog list
      router.push('/admin/blog')
    } catch (err: any) {
      setError(err.message || 'Upload failed')
      console.error(err)
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Upload Blog Post</h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload an MDX file or paste content directly to create a new blog post
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="mb-6 flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => handleModeChange('file')}
            className={`px-6 py-3 font-medium transition ${
              mode === 'file'
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => handleModeChange('text')}
            className={`px-6 py-3 font-medium transition ${
              mode === 'text'
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Paste Text
          </button>
        </div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* File Upload or Text Input */}
          <div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                {mode === 'file' ? 'Select MDX File' : 'Paste MDX Content'}
              </h2>

              {mode === 'file' ? (
                <div className="mb-6">
                  <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pb-6 pt-5">
                      <svg
                        className="mb-3 h-10 w-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">MDX files only</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".mdx"
                      onChange={handleFileSelect}
                    />
                  </label>

                  {file && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: <span className="font-medium">{file.name}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="mb-6">
                  <textarea
                    value={textContent}
                    onChange={handleTextChange}
                    placeholder="Paste your MDX content here (including frontmatter)..."
                    className="h-96 w-full rounded-lg border border-gray-300 p-4 font-mono text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Content will be auto-parsed and previewed on the right
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h3 className="mb-2 font-semibold text-amber-900">
                  Required Frontmatter
                </h3>
                <pre className="text-xs text-amber-800">
{`---
title: "Post Title"
slug: "post-slug"
description: "SEO description"
author: "Guapital Team"
date: "2025-01-01"
readingTime: "6 min"
category: "Category Name"
tags: ["Tag1", "Tag2"]
published: true
---`}
                </pre>
              </div>

              <button
                onClick={handleUpload}
                disabled={!preview || loading}
                className="mt-6 w-full rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading ? 'Uploading...' : 'Upload & Publish'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Preview</h2>

              {preview ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Title</h3>
                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {preview.frontmatter.title || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Slug</h3>
                    <p className="mt-1 font-mono text-sm text-gray-600">
                      /blog/{preview.frontmatter.slug || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Description</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {preview.frontmatter.description || 'N/A'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Author</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {preview.frontmatter.author || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Date</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {preview.frontmatter.date || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Category</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {preview.frontmatter.category || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Tags</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {preview.frontmatter.tags?.map((tag: string) => (
                        <span
                          key={tag}
                          className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Status</h3>
                    <p className="mt-1 text-sm">
                      {preview.frontmatter.published ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                          Will Publish
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                          Save as Draft
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Content Length</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {preview.content.split(' ').length} words
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500">
                  Upload a file to see preview
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
