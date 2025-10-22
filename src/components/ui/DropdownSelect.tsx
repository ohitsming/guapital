'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'

interface DropdownOption {
  value: string
  label: string
}

interface DropdownSelectProps {
  label: string
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  description?: string
  className?: string
}

export function DropdownSelect({
  label,
  options,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select an option',
  description,
  className = '',
}: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-1.5">
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}

      <div className="relative" ref={dropdownRef}>
        {/* Dropdown Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            relative w-full rounded-lg bg-white px-3.5 py-2.5 text-left text-sm
            shadow-sm ring-1 ring-inset ring-gray-300 transition-all duration-150
            ${disabled
              ? 'cursor-not-allowed bg-gray-50 text-gray-500 ring-gray-200'
              : 'hover:bg-gray-50 focus:ring-2 focus:ring-[#004D40]'
            }
            ${isOpen && !disabled ? 'ring-2 ring-[#004D40]' : ''}
          `}
        >
          <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDownIcon
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </span>
        </button>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div className="absolute z-10 bottom-full mb-1 w-full rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in-up">
            <ul className="max-h-60 overflow-auto rounded-lg py-1 text-sm">
              {options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`
                      relative w-full cursor-pointer select-none py-2.5 pl-10 pr-4 text-left transition-colors duration-150
                      ${option.value === value
                        ? 'bg-[#004D40]/10 text-[#004D40] font-medium'
                        : 'text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="block truncate">{option.label}</span>
                    {option.value === value && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#004D40]">
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
