'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function AuthCodeErrorContent() {
    const searchParams = useSearchParams()
    const errorDescription = searchParams.get('error_description')

    return (
        <div className='h-[75vh]'>
            <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
                        Authentication Error
                    </h2>
                    <p className="mt-4 text-center text-base text-gray-600">
                        {errorDescription || 'There was an error authenticating your account. Please try signing in again.'}
                    </p>
                    <div className="mt-4 text-center text-md">
                        <a href="/login" className="font-semibold text-neutral-950 hover:text-neutral-700">
                            Return to login
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function AuthCodeError() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthCodeErrorContent />
        </Suspense>
    )
}