import Image from 'next/image'
import clsx from 'clsx'
import logoImage from '@/images/logo.png'

export function Logomark({
    invert = false,
    filled = false,
    ...props
}: Omit<React.ComponentPropsWithoutRef<'img'>, 'src' | 'alt'> & {
    invert?: boolean
    filled?: boolean
}) {
    return (
        <Image
            src={logoImage}
            width={3148}
            height={1020}
            alt="Guapital"
        />
    )
}

export function Logo({
    className,
    invert = false,
    filled = false,
    fillOnHover = false,
    ...props
}: Omit<React.ComponentPropsWithoutRef<'img'>, 'src' | 'alt'> & {
    invert?: boolean
    filled?: boolean
    fillOnHover?: boolean
}) {
    return (
        <Image
            src={logoImage}
            alt="Guapital"
            className={clsx(fillOnHover && 'group/logo', invert && 'invert', 'w-auto', className)}
            width={3148}
            height={1020}
            style={props.style}
            priority
        />
    )
}