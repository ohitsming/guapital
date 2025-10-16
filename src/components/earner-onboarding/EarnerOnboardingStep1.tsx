'use client'

import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

import { AgeRange } from '@/lib/types/earner-onboarding';

interface EarnerOnboardingStep1Props {
    formData: {
        age_range: AgeRange;
    };
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    nextStep: () => void;
}

export default function EarnerOnboardingStep1({
    formData,
    handleChange,
    nextStep,
}: EarnerOnboardingStep1Props) {
    const ageRanges = [
        "Under 18",
        "18-24 years old",
        "25-34 years old",
        "35-44 years old",
        "45-54 years old",
        "55-64 years old",
        "65 years or older",
        "Prefer not to disclose",
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                <p className="mt-1 text-sm text-gray-600">Tell us a little about yourself to get started.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="age_range" className="block text-sm font-medium text-gray-700 pb-2">
                        What is your age?
                    </label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {formData.age_range || "Select an age range"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>

                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                        >
                            <div className="py-1">
                                {ageRanges.map((range) => (
                                    <MenuItem key={range}>
                                        {({ focus }) => (
                                            <a
                                                onClick={() => {
                                                    handleChange({ target: { name: 'age_range', value: range } } as React.ChangeEvent<HTMLInputElement>);
                                                }}
                                                className={`block px-4 py-2 text-sm ${focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                                            >
                                                {range}
                                            </a>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Menu>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={nextStep}
                    disabled={!formData.age_range}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-neutral-600 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
