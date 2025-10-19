import { type Metadata } from 'next'
import Link from 'next/link'

import { SignupForm } from '@/components/SignupForm'

export const metadata: Metadata = {
    title: 'Sign Up - Guapital',
    description: 'Sign up for a Guapital account.',
}

export default function Signup() {
    return (
        <div className='h-[75vh]'>
            <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
                        Start building your wealth.<br/> Join Guapital today.
                    </h2>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                    <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
                        <SignupForm />
                    </div>

                    <p className="mt-10 text-center text-sm/6 text-gray-500">
                        Already a member?{' '}
                        <Link href="/login" className="font-semibold text-neutral-950 hover:text-neutral-700">
                            Sign in to your account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
