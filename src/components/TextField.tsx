import { useId } from 'react'

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    label: string;
    className?: string;
    error?: string;
    type?: string;
    rows?: number;
    description?: string;
}

export function TextField({ label, className, error, description, ...props }: TextFieldProps) {
    let id = useId()

    return (
        <div className={className}>
            {label && (
                <label
                    htmlFor={id}
                    className="mb-2 block text-sm font-semibold text-gray-900"
                >
                    {label}
                </label>
            )}
            {description && (
                <p className="mt-2 text-sm text-gray-500">{description}</p>
            )}
            {props.type === 'textarea' ? (
                <textarea
                    id={id}
                    {
                    ...props
                    }
                    className={`block w-full rounded-md bg-white px-3 py-3 text-base text-gray-900 outline outline-1 -outline-offset-1 ${error ? 'outline-red-500' : 'outline-gray-300'} placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-neutral-600 sm:text-sm/6`}
                />
            ) : (
                <input
                    id={id}
                    {
                    ...props
                    }
                    className={`block w-full rounded-md bg-white px-3 py-3 text-base text-gray-900 outline outline-1 -outline-offset-1 ${error ? 'outline-red-500' : 'outline-gray-300'} placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-neutral-600 sm:text-sm/6`}
                />
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    )
}