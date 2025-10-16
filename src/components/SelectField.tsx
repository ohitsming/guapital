import { useId } from 'react'

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  className?: string;
}

export function SelectField({ label, className, ...props }: SelectFieldProps) {
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
      <select
        id={id}
        {
          ...props
        }
        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-neutral-600 sm:text-sm/6"
      />
    </div>
  )
}