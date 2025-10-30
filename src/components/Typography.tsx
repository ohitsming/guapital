import clsx from 'clsx'

export function Typography({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('typography', className)} {...props}>
      {children}
    </div>
  )
}
