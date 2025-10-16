'use client'

import React, { useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

interface Step2Props {
    formData: {
        companySize: string;
        yourRole: string;
    };
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    nextStep: () => void;
    prevStep: () => void;
}

export default function BusinessOnboardingStep2({ formData, handleChange, nextStep, prevStep }: Step2Props) {
    const [error, setError] = useState<string | null>(null);

    const companySizes = [
        "1-10 employees",
        "11-50 employees",
        "51-200 employees",
        "201-500 employees",
        "500+ employees",
    ];

    const yourRoles = [
        "Founder/Owner",
        "Marketing",
        "Product Manager",
        "UX Researcher",
        "Other",
    ];

    const handleNext = () => {
        if (!formData.companySize || !formData.yourRole) {
            setError('Please select both company size and your role.');
            return;
        }
        setError(null);
        nextStep();
    };

    const isFormValid = (
        formData.companySize.trim() !== '' &&
        formData.yourRole.trim() !== ''
    );

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Tell us a bit more about your company.</h2>
            <div className="mb-4">
                <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 pb-2">
                    Company Size
                </label>
                <Menu as="div" className="relative block text-left w-full">
                    <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                        {formData.companySize || "Select a company size"}
                        <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                    </MenuButton>

                    <MenuItems
                        transition
                        className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                    >
                        <div className="py-1">
                            {companySizes.map((size) => (
                                <MenuItem key={size}>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => {
                                                handleChange({ target: { name: 'companySize', value: size } } as React.ChangeEvent<HTMLInputElement>);
                                                setError(null); // Clear error on change
                                            }}
                                            className={`block px-4 py-2 text-sm ${focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                                        >
                                            {size}
                                        </a>
                                    )}
                                </MenuItem>
                            ))}
                        </div>
                    </MenuItems>
                </Menu>
            </div>
            <div className="mb-4">
                <label htmlFor="yourRole" className="block text-sm font-medium text-gray-700 pb-2">
                    Your Role
                </label>
                <Menu as="div" className="relative block text-left w-full">
                    <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                        {formData.yourRole || "Select your role"}
                        <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                    </MenuButton>

                    <MenuItems
                        transition
                        className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                    >
                        <div className="py-1">
                            {yourRoles.map((role) => (
                                <MenuItem key={role}>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => {
                                                handleChange({ target: { name: 'yourRole', value: role } } as React.ChangeEvent<HTMLInputElement>);
                                                setError(null); // Clear error on change
                                            }}
                                            className={`block px-4 py-2 text-sm ${focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                                        >
                                            {role}
                                        </a>
                                    )}
                                </MenuItem>
                            ))}
                        </div>
                    </MenuItems>
                </Menu>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="mt-6 flex justify-between">
                <button
                    onClick={prevStep}
                    className="flex justify-center rounded-md border border-transparent bg-gray-300 py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Back
                </button>
                <button
                    onClick={handleNext}
                    disabled={!isFormValid}
                    className="flex justify-center rounded-md border border-transparent bg-neutral-900 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
