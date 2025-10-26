import { type Metadata } from 'next'
import Link from 'next/link'
import { CheckCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
    title: 'Check Your Email - Guapital',
    description: 'Please check your email to confirm your account.',
}

export default function CheckEmail() {
    return (
        <div className='min-h-[75vh]'>
            <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-20 w-20 rounded-full bg-[#004D40]/10 animate-pulse" />
                            </div>
                            <EnvelopeIcon className="h-20 w-20 text-[#004D40] relative z-10" />
                        </div>
                    </div>

                    <h2 className="mt-8 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Check Your Email
                    </h2>
                    <p className="mt-4 text-center text-base text-gray-600">
                        We've sent you a confirmation email to verify your account.
                    </p>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                    <div className="bg-white px-6 py-8 shadow sm:rounded-lg sm:px-12">
                        <div className="space-y-6">
                            {/* Success Icon */}
                            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
                                <p className="text-sm text-green-800">
                                    Account created successfully!
                                </p>
                            </div>

                            {/* Instructions */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Next Steps:
                                </h3>
                                <ol className="list-decimal list-inside space-y-3 text-sm text-gray-600">
                                    <li>Check your email inbox (and spam folder)</li>
                                    <li>Click the confirmation link in the email</li>
                                    <li>You'll be redirected to complete your profile</li>
                                    <li>Start tracking your net worth!</li>
                                </ol>
                            </div>

                            {/* Helpful Info */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                    Didn't receive an email?
                                </h4>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li>• Check your spam or junk folder</li>
                                    <li>• Make sure you entered the correct email address</li>
                                    <li>• Wait a few minutes - emails can take time to arrive</li>
                                    <li>• Contact support if you still don't see it</li>
                                </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Link
                                    href="/login"
                                    className="flex-1 inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004D40]"
                                >
                                    Go to Login
                                </Link>
                                <Link
                                    href="/"
                                    className="flex-1 inline-flex justify-center items-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#004D40] hover:bg-[#00695C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004D40]"
                                >
                                    Back to Home
                                </Link>
                            </div>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-xs text-gray-500">
                        Need help?{' '}
                        <Link href="/contact" className="font-semibold text-[#004D40] hover:text-[#00695C]">
                            Contact Support
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
