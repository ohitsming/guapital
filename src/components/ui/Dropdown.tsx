'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'

interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
  className?: string
}

export function Dropdown({ value, onChange, options, placeholder, className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent transition-colors flex items-center justify-between"
      >
        <span className="block truncate text-sm font-medium text-gray-900">
          {selectedOption?.label || placeholder || 'Select...'}
        </span>
        <ChevronDownIcon
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-[#004D40]/5 text-[#004D40] font-medium' : 'text-gray-900'
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && <CheckIcon className="h-5 w-5 text-[#004D40]" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
