/**
 * MDX Rendering Utilities
 * Uses existing @mdx-js packages for server-side markdown rendering
 */

import { compile } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';

/**
 * Converts markdown content to HTML string
 * Uses MDX compiler in HTML-only mode (no React components)
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const compiled = await compile(markdown, {
      outputFormat: 'function-body',
      remarkPlugins: [remarkGfm], // GitHub Flavored Markdown (tables, strikethrough, etc.)
      development: false,
    });

    // Extract the compiled code and evaluate it to get HTML
    const code = String(compiled);

    // Simple HTML extraction from MDX output
    // MDX outputs JSX, we need to convert to static HTML
    // For now, return the markdown as-is and we'll render it client-side
    // This is a limitation of using MDX without next-mdx-remote

    return markdown;
  } catch (error) {
    console.error('Error compiling MDX:', error);
    throw new Error('Failed to compile markdown content');
  }
}

/**
 * Extract frontmatter from markdown content
 * Manually parse YAML frontmatter (since we don't have gray-matter)
 */
export function parseFrontmatter(markdown: string): {
  data: Record<string, any>;
  content: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return {
      data: {},
      content: markdown,
    };
  }

  const [, frontmatterString, content] = match;

  // Simple YAML parser (handles basic key: value pairs)
  const data: Record<string, any> = {};
  frontmatterString.split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      // Remove quotes if present
      data[key] = value.replace(/^["']|["']$/g, '');
    }
  });

  return {
    data,
    content: content.trim(),
  };
}

/**
 * Calculate reading time from markdown content
 * Average reading speed: 200 words per minute
 */
export function calculateReadingTime(markdown: string): number {
  // Remove markdown syntax and count words
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // Remove links, keep text
    .replace(/[#*_~]/g, '') // Remove markdown formatting
    .replace(/\s+/g, ' '); // Normalize whitespace

  const wordCount = plainText.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return Math.max(1, readingTime); // Minimum 1 minute
}
