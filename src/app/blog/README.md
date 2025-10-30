# Blog MDX Layout

This directory contains the blog infrastructure with MDX support for creating content-rich articles.

## Structure

```
src/app/blog/
├── README.md                          # This file
├── page.tsx                           # Blog index page (Server Component)
├── BlogPageContent.tsx                # Client component with search & pagination
├── wrapper.tsx                        # MDX article layout wrapper
└── [slug]/
    └── page.mdx                       # Individual blog posts

src/lib/
└── blog-articles.ts                   # Central article registry & utilities
```

## Features

### Search & Filtering
- **Real-time search**: Searches across title, description, category, and author
- **Category filtering**: Filter by category with clickable badges
- **Results count**: Shows number of matching articles
- **Clear filters**: Quick reset button when no results found

### Pagination
- **10 articles per page** (configurable in `BlogPageContent.tsx`)
- **Page navigation**: Previous/Next buttons + numbered pages
- **Automatic reset**: Filters reset pagination to page 1

### MDX Content
- **Static generation**: All articles pre-rendered at build time for SEO
- **Version controlled**: Articles stored as MDX files in git
- **Easy authoring**: Write in markdown, no database needed

## Creating a New Blog Post

### 1. Add article metadata to the registry

Edit `src/lib/blog-articles.ts` and add your article to the `allArticles` array:

```typescript
export const allArticles: BlogArticle[] = [
  {
    slug: 'your-article-slug',
    title: 'Your Article Title',
    description: 'A compelling description for SEO and social sharing',
    author: 'Guapital Team',
    date: '2025-01-15',
    readingTime: '8 min',
    category: 'Your Category',
  },
  // ... existing articles
]
```

### 2. Create a new directory under `/blog/`

```bash
mkdir -p src/app/blog/your-article-slug
```

### 3. Create `page.mdx` with article metadata

```mdx
export const article = {
  title: 'Your Article Title',
  description: 'A compelling description for SEO and social sharing',
  author: 'Guapital Team',
  date: '2025-01-15',
  readingTime: '8 min',
}

# Your Article Starts Here

Write your content using markdown...

## Subheadings Work Great

- Bullet points
- Are fully supported
- With great styling

### Code Blocks

\`\`\`typescript
const example = "code blocks work too"
\`\`\`

### Tables

| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |

### Blockquotes

> Important insights can be highlighted like this

### Images

![Alt text](/path/to/image.jpg)

## Call to Action

End with a strong CTA to sign up!
```

### 4. Build and test

```bash
npm run build  # Articles automatically indexed from blog-articles.ts
npm run dev    # Test locally
```

The article will automatically appear in:
- Blog index page (sorted by date, newest first)
- Search results (title, description, category, author)
- Category filter (if it's a new category)
- Pagination (if you have 10+ articles)

## Features

### Automatic Layout Wrapping

The `wrapper.tsx` component automatically wraps all blog MDX files with:
- Article header (title, description, author, date, reading time)
- Back to blog link
- Social sharing buttons (Twitter, LinkedIn, Facebook, Copy Link)
- CTA section at the bottom
- Responsive design

### Share Analytics

Social sharing events are tracked in the `share_events` table for analytics:
- Platform tracking (twitter/linkedin/facebook/copy_link)
- Anonymous sharing supported
- Event type tracking (initiated/completed/clicked)

### SEO Optimization

Each blog post automatically gets:
- Proper semantic HTML structure
- Open Graph meta tags
- Twitter Card meta tags
- Structured data for rich snippets
- Mobile-responsive design

### Typography & Styling

The `Prose` component provides beautiful typography with:
- Proper heading hierarchy
- Code syntax highlighting
- Responsive tables
- Styled blockquotes
- Optimized images
- Dark code blocks

## Styling Guide

### Headings
- `# H1` - Article title (auto-generated from metadata)
- `## H2` - Major sections
- `### H3` - Subsections
- `#### H4` - Minor sections

### Text Formatting
- `**bold text**` - Strong emphasis
- `*italic text*` - Emphasis
- `[link text](url)` - Hyperlinks
- `` `inline code` `` - Inline code

### Lists
```markdown
- Unordered list item 1
- Unordered list item 2

1. Ordered list item 1
2. Ordered list item 2
```

### Blockquotes
```markdown
> This is a highlighted quote or important note
```

### Code Blocks
````markdown
```typescript
// Code with syntax highlighting
const example = "hello world"
```
````

### Tables
```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

## Best Practices

### SEO
1. **Title**: 50-60 characters, include primary keyword
2. **Description**: 150-160 characters, compelling summary
3. **Reading Time**: Be accurate - helps set expectations
4. **Images**: Use descriptive alt text, optimize file sizes
5. **Internal Links**: Link to relevant Guapital pages (/signup, /pricing, /dashboard)

### Content
1. **Hook**: Start with a compelling opening paragraph
2. **Structure**: Use clear headings and subheadings
3. **Scannability**: Break up text with lists, tables, blockquotes
4. **CTAs**: Include clear calls-to-action throughout
5. **Value**: Provide actionable insights, not just theory

### Technical
1. **Slug**: Use lowercase, hyphens, descriptive (good: `net-worth-percentile-by-age`)
2. **Date**: Use ISO format `YYYY-MM-DD`
3. **Author**: Consistent naming (`Guapital Team` or individual names)
4. **Category**: Match existing categories for consistency

## Example Articles

See `src/app/blog/net-worth-percentile-by-age/page.mdx` for a complete example demonstrating:
- Metadata structure
- Content organization
- Use of markdown features
- Internal linking
- CTA placement

## Customization

### Modifying the Layout

Edit `src/app/blog/wrapper.tsx` to customize:
- Article header design
- Share button styling
- CTA section content
- Footer elements

### Customizing Typography

Edit `src/components/Prose.tsx` to adjust:
- Font sizes and weights
- Colors and spacing
- Code block styling
- Table appearance

## Deployment

Blog posts are statically generated at build time for optimal performance:

```bash
npm run build  # Generates static HTML for all blog posts
npm start      # Serves the production build
```

## Analytics

Track blog performance with:
- Page views (via Sentry or analytics tool)
- Share events (tracked in `share_events` table)
- Conversion rates (signup CTAs)
- Reading time vs actual engagement

---

**Need help?** Refer to the [Next.js MDX documentation](https://nextjs.org/docs/app/building-your-application/configuring/mdx) for advanced features.
