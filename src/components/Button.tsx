import Link from 'next/link'
import clsx from 'clsx'

type ButtonProps = {
    variant?: 'solid' | 'outline'
    invert?: boolean
} & (
        | React.ComponentPropsWithoutRef<typeof Link>
        | (React.ComponentPropsWithoutRef<'button'> & { href?: undefined })
    )

export function Button({
    variant = 'solid',
    invert = false,
    className,
    children,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex rounded-full px-4 py-1.5 text-sm font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        solid: invert
            ? 'bg-white text-neutral-950 hover:bg-neutral-200'
            : 'bg-[#E27A70] text-white hover:bg-[#E27A70CC]',
        outline: invert
            ? 'border border-white text-white hover:bg-white hover:text-neutral-950'
            : 'border border-neutral-300 text-neutral-950 hover:bg-neutral-100',
    };

    className = clsx(
        baseStyles,
        variantStyles[variant],
        className
    );

    let inner = <span className="relative top-px">{children}</span>

    if (typeof props.href === 'undefined') {
        return (
            <button className={className} {...props}>
                {inner}
            </button>
        )
    }

    return (
        <Link className={className} {...props}>
            {inner}
        </Link>
    )
}
