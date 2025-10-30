import clsx from 'clsx'

export function Prose({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        className,
        'prose prose-zinc max-w-none',
        // Headings
        'prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight',
        'prose-h1:text-4xl prose-h1:text-zinc-800 prose-h1:mt-12 prose-h1:mb-6',
        'prose-h2:text-3xl prose-h2:text-zinc-800 prose-h2:mt-10 prose-h2:mb-4',
        'prose-h3:text-2xl prose-h3:text-zinc-800 prose-h3:mt-8 prose-h3:mb-3',
        'prose-h4:text-xl prose-h4:text-zinc-800 prose-h4:mt-6 prose-h4:mb-2',
        // Paragraphs and text
        'prose-p:text-base prose-p:leading-7 prose-p:text-zinc-600 prose-p:mb-4',
        'prose-lead:text-lg prose-lead:text-zinc-600',
        'prose-strong:text-zinc-800 prose-strong:font-semibold',
        'prose-em:text-zinc-600',
        // Links
        'prose-a:text-teal-600 prose-a:no-underline prose-a:font-medium',
        'hover:prose-a:text-teal-700 hover:prose-a:underline',
        // Lists
        'prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6',
        'prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6',
        'prose-li:text-zinc-600 prose-li:mb-2',
        // Blockquotes
        'prose-blockquote:border-l-4 prose-blockquote:border-teal-500',
        'prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-zinc-600',
        'prose-blockquote:bg-teal-50 prose-blockquote:py-2 prose-blockquote:my-6',
        // Code
        'prose-code:text-sm prose-code:text-teal-700 prose-code:bg-teal-50',
        'prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono',
        'prose-code:before:content-[""] prose-code:after:content-[""]',
        'prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:rounded-lg',
        'prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:my-6',
        // Images
        'prose-img:rounded-lg prose-img:shadow-lg prose-img:my-8',
        // Tables
        'prose-table:border-collapse prose-table:w-full prose-table:my-8',
        'prose-thead:border-b prose-thead:border-zinc-300',
        'prose-th:text-left prose-th:font-semibold prose-th:text-zinc-800 prose-th:p-3',
        'prose-td:text-zinc-600 prose-td:p-3 prose-td:border-t prose-td:border-zinc-200',
        // Horizontal rule
        'prose-hr:border-zinc-200 prose-hr:my-8'
      )}
    >
      {children}
    </div>
  )
}
