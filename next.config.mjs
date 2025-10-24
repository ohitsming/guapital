import rehypeShiki from '@leafac/rehype-shiki'
import nextMDX from '@next/mdx'
import { Parser } from 'acorn'
import jsx from 'acorn-jsx'
import escapeStringRegexp from 'escape-string-regexp'
import * as path from 'path'
import { recmaImportImages } from 'recma-import-images'
import remarkGfm from 'remark-gfm'
import { remarkRehypeWrap } from 'remark-rehype-wrap'
import remarkUnwrapImages from 'remark-unwrap-images'
import shiki from 'shiki'
import { unifiedConditional } from 'unified-conditional'
// import { withSentryConfig } from '@sentry/nextjs' // Disabled for now - using instrumentation hook only

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],

  // Enable instrumentation for Sentry (disabled for development)
  // experimental: {
  //   instrumentationHook: true,
  // },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: '**.tailwindcss.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
    ],
  },
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development'

    const securityHeaders = [
      // Permissions Policy (restrict browser features)
      {
        key: 'Permissions-Policy',
        value: 'fullscreen=(self "https://cdn.plaid.com"), payment=(self "https://cdn.plaid.com"), camera=(self "https://cdn.plaid.com")',
      },

      // Prevent clickjacking attacks
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },

      // Prevent MIME type sniffing
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },

      // Referrer policy (privacy)
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },

      // XSS Protection (legacy but still useful)
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },

      // Content Security Policy (comprehensive protection)
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.plaid.com https://js.stripe.com https://*.sentry.io",
          "connect-src 'self' https://*.supabase.co https://cdn.plaid.com https://production.plaid.com https://sandbox.plaid.com https://api.stripe.com https://*.alchemy.com https://api.coingecko.com https://*.sentry.io",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data:",
          "frame-src 'self' https://cdn.plaid.com https://js.stripe.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          // Only enforce HTTPS upgrade in production
          ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
        ].join('; '),
      },
    ]

    // Only add HSTS in production
    if (!isDevelopment) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      })
    }

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/supabase/auth/callback%7D',
        destination: '/api/supabase/auth/callback',
      },
    ]
  },
}

function remarkMDXLayout(source, metaName) {
  let parser = Parser.extend(jsx())
  let parseOptions = { ecmaVersion: 'latest', sourceType: 'module' }

  return (tree) => {
    let imp = `import _Layout from '${source}'`
    let exp = `export default function Layout(props) {
      return <_Layout {...props} ${metaName}={${metaName}} />
    }`

    tree.children.push(
      {
        type: 'mdxjsEsm',
        value: imp,
        data: { estree: parser.parse(imp, parseOptions) },
      },
      {
        type: 'mdxjsEsm',
        value: exp,
        data: { estree: parser.parse(exp, parseOptions) },
      },
    )
  }
}

export default async function config() {
  let highlighter = await shiki.getHighlighter({
    theme: 'css-variables',
  })

  let withMDX = nextMDX({
    extension: /\.mdx$/,
    options: {
      recmaPlugins: [recmaImportImages],
      rehypePlugins: [
        [rehypeShiki, { highlighter }],
        [
          remarkRehypeWrap,
          {
            node: { type: 'mdxJsxFlowElement', name: 'Typography' },
            start: ':root > :not(mdxJsxFlowElement)',
            end: ':root > mdxJsxFlowElement',
          },
        ],
      ],
      remarkPlugins: [
        remarkGfm,
        remarkUnwrapImages,
        [
          unifiedConditional,
          [
            new RegExp(`^${escapeStringRegexp(path.resolve('src/app/blog'))}`),
            [[remarkMDXLayout, '@/app/blog/wrapper', 'article']],
          ],
          [
            new RegExp(`^${escapeStringRegexp(path.resolve('src/app/work'))}`),
            [[remarkMDXLayout, '@/app/work/wrapper', 'caseStudy']],
          ],
        ],
      ],
    },
  })

  // Return final config
  // Note: Sentry error tracking still works via instrumentation.ts and instrumentation-client.ts
  // We just don't use withSentryConfig wrapper to avoid webpack issues in development
  return withMDX(nextConfig)
}
