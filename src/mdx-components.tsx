import type { MDXComponents } from 'mdx/types'
import { Typography } from '@/components/Typography'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Typography,
    ...components,
  }
}
