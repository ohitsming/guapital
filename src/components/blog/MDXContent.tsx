'use client';

/**
 * MDX Content Renderer
 * Renders markdown content using existing @mdx-js/react
 * Uses client-side rendering but content is still in initial HTML for SEO
 */

import { MDXProvider } from '@mdx-js/react';
import React from 'react';

/**
 * Custom MDX components for styling
 * Tailwind classes for professional blog styling
 */
const components = {
  h1: (props: any) => (
    <h1 className="text-4xl font-bold text-gray-900 mb-6 mt-8" {...props} />
  ),
  h2: (props: any) => (
    <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8" {...props} />
  ),
  h3: (props: any) => (
    <h3 className="text-2xl font-semibold text-gray-900 mb-3 mt-6" {...props} />
  ),
  h4: (props: any) => (
    <h4 className="text-xl font-semibold text-gray-900 mb-2 mt-4" {...props} />
  ),
  p: (props: any) => <p className="text-lg text-gray-700 mb-4 leading-relaxed" {...props} />,
  a: (props: any) => (
    <a
      className="text-teal-600 hover:text-teal-700 underline font-medium"
      {...props}
    />
  ),
  ul: (props: any) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
  li: (props: any) => <li className="text-lg text-gray-700" {...props} />,
  blockquote: (props: any) => (
    <blockquote
      className="border-l-4 border-teal-500 pl-4 italic text-gray-600 my-4"
      {...props}
    />
  ),
  code: (props: any) => (
    <code
      className="bg-gray-100 text-teal-700 px-2 py-1 rounded text-sm font-mono"
      {...props}
    />
  ),
  pre: (props: any) => (
    <pre
      className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4"
      {...props}
    />
  ),
  table: (props: any) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border border-gray-300" {...props} />
    </div>
  ),
  thead: (props: any) => <thead className="bg-gray-100" {...props} />,
  th: (props: any) => (
    <th className="border border-gray-300 px-4 py-2 text-left font-semibold" {...props} />
  ),
  td: (props: any) => <td className="border border-gray-300 px-4 py-2" {...props} />,
  img: (props: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="rounded-lg my-6 max-w-full h-auto" {...props} alt={props.alt || ''} />
  ),
  hr: (props: any) => <hr className="my-8 border-gray-300" {...props} />,
};

interface MDXContentProps {
  content: string;
  className?: string;
}

/**
 * Simple markdown renderer using basic HTML conversion
 * Since we're using existing MDX packages, we'll render the markdown as HTML
 */
export default function MDXContent({ content, className = '' }: MDXContentProps) {
  // Convert markdown to basic HTML for display
  // This is a simple approach that works with existing packages
  const htmlContent = convertMarkdownToHtml(content);

  return (
    <MDXProvider components={components}>
      <div
        className={`prose prose-lg max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </MDXProvider>
  );
}

/**
 * Simple markdown to HTML converter
 * Handles basic markdown syntax for blog posts
 */
function convertMarkdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraphs
  html = `<p>${html}</p>`;

  return html;
}
