import Link from 'next/link'

export default function AuthConfirmSuccess() {
    return (
        <div className='h-[75vh]'>
            <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
                        Email Confirmed!
                    </h2>
                    <p className="mt-4 text-center text-base text-gray-600">
                        Your email has been successfully confirmed. You can now log in to your account.
                    </p>
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
