import { useId } from 'react'

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  className?: string;
  description?: string;
}

export function SelectField({ label, className, description, ...props }: SelectFieldProps) {
  let id = useId()

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-900 mb-1.5"
        >
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}
      <select
        id={id}
        {...props}
        className="block w-full rounded-lg border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors duration-150 focus:ring-2 focus:ring-inset focus:ring-[#004D40] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 hover:bg-gray-50"
      />
    </div>
  )
}