import Link from 'next/link'
import { type Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Check your email - LocalMoco',
    description: "We've sent a confirmation link to your email address.",
}

export default function CheckEmailPage() {
    return (
        <div className='h-[75vh]'>
            <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
                        Check your email
                    </h2>
                    <p className="mt-4 text-center text-base text-gray-600">
                        We&apos;ve sent a confirmation link to your email address. Please check your inbox and spam folder.
                    </p>
                </div>
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="mt-4 text-center text-md">
                    <Link href="/login" className="font-semibold text-neutral-950 hover:text-neutral-700">
                        Return to login
                    </Link>
                </div>
            </div>
            </div>
        </div>
    )
}
