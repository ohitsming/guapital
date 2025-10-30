import { URL, WEB_NAME, WEB_LONG_DESC } from '@/lib/constant'

interface StructuredDataProps {
  type?: 'website' | 'article' | 'product'
  data?: {
    title?: string
    description?: string
    datePublished?: string
    dateModified?: string
    author?: string
    image?: string
    slug?: string
  }
}

export function StructuredData({ type = 'website', data }: StructuredDataProps) {
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: WEB_NAME,
    description: WEB_LONG_DESC,
    url: URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${URL}/blog?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: WEB_NAME,
    url: URL,
    logo: `${URL}/assets/logo.png`,
    description: WEB_LONG_DESC,
    sameAs: [
      'https://twitter.com/guapital',
      'https://www.linkedin.com/company/guapital',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'help.guapital@gmail.com',
    },
  }

  const softwareAppData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: WEB_NAME,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: WEB_LONG_DESC,
    offers: {
      '@type': 'Offer',
      price: '99.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '100',
      bestRating: '5',
      worstRating: '1',
    },
  }

  if (type === 'article' && data) {
    const articleData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.title || WEB_NAME,
      description: data.description || WEB_LONG_DESC,
      image: data.image || `${URL}/og-image.jpg`,
      datePublished: data.datePublished || new Date().toISOString(),
      dateModified: data.dateModified || new Date().toISOString(),
      author: {
        '@type': 'Organization',
        name: data.author || WEB_NAME,
        url: URL,
      },
      publisher: {
        '@type': 'Organization',
        name: WEB_NAME,
        logo: {
          '@type': 'ImageObject',
          url: `${URL}/assets/logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': data.slug ? `${URL}/blog/${data.slug}` : URL,
      },
    }

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
      </>
    )
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(baseStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppData) }}
      />
    </>
  )
}
