import clsx from 'clsx'

import { Border } from '@/components/Border'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'

export function List({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <FadeInStagger>
      <ul role="list" className={clsx('text-base text-neutral-600', className)}>
        {children}
      </ul>
    </FadeInStagger>
  )
}

export function ListItem({
  children,
  title,
  icon,
}: {
  children: React.ReactNode
  title?: string
  icon?: React.ReactNode
}) {
  return (
    <li className="group mt-10 first:mt-0">
      <FadeIn>
        <Border className="pt-10 group-first:pt-0 group-first:before:hidden group-first:after:hidden">
          <div className="flex">
            {icon && <div className="mr-4 flex-shrink-0">{icon}</div>}
            <div>
              {title && (
                <strong className="font-semibold text-neutral-950">{`${title}. `}</strong>
              )}
              {children}
            </div>
          </div>
        </Border>
      </FadeIn>
    </li>
  )
}
