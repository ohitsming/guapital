import { type Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/Button'

export const metadata: Metadata = {
  title: 'Email Confirmed - Guapital',
  description: 'Your email has been confirmed.',
}

export default function EmailConfirmed() {
  return (
    <div className="flex min-h-screen flex-col justify-center sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Email Confirmed!
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your email address has been successfully verified.
          <br />
          You&apos;re all set to start building your wealth with Guapital.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-6 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Account verified
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>You can now access your Guapital dashboard and start tracking your net worth.</p>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/dashboard" className="block">
              <Button className="w-full justify-center rounded-md bg-neutral-950 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950">
                Go to Dashboard
              </Button>
            </Link>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Need help getting started?{' '}
                <Link href="/contact" className="font-medium text-neutral-950 hover:text-neutral-700">
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🎉 Welcome to Guapital - Start building your wealth today
          </p>
        </div>
      </div>
    </div>
  )
}
