import { type Metadata } from 'next'
import Link from 'next/link'

import { LoginForm } from '@/components/LoginForm'

export const metadata: Metadata = {
    title: 'Login - Guapital',
    description: 'Log in to your Guapital account.',
}

export default function Login() {
    return (
        <div className='min-h-[600px]'>
            <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
                        Welcome back to Guapital.
                    </h2>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                    <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
                        <LoginForm />
                    </div>

                    <p className="mt-10 text-center text-sm/6 text-gray-500">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="font-semibold text-neutral-950 hover:text-neutral-700">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
