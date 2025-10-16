'use client'

import React, { useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

interface Step1Props {
    formData: {
        businessName: string;
        industry: string;
        industryOther?: string; // Add optional field for 'Other' industry
    };
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    nextStep: () => void;
}

export default function BusinessOnboardingStep1({ formData, handleChange, nextStep }: Step1Props) {
    const [error, setError] = useState<string | null>(null);

    const industries = [
        "Technology",
        "E-commerce",
        "Healthcare",
        "Finance",
        "Education",
        "Retail",
        "Food & Beverage",
        "Media & Entertainment",
        "Manufacturing",
        "Consulting",
        "Other",
    ];

    const handleNext = () => {
        if (!formData.businessName.trim() || !formData.industry.trim()) {
            setError('Please fill out all fields.');
            return;
        }
        if (formData.industry === "Other" && !formData.industryOther?.trim()) {
            setError('Please specify your industry.');
            return;
        }
        setError(null);
        nextStep();
    };

    const isFormValid = (
        formData.businessName.trim() !== '' &&
        formData.industry.trim() !== '' &&
        (formData.industry !== "Other" || (formData.industry === "Other" && formData.industryOther?.trim() !== ''))
    );

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Welcome! Let&apos;s start with the basics.</h2>
            <div className="mb-4">
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                    Business Name
                </label>
                <input
                    type="text"
                    name="businessName"
                    id="businessName"
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-neutral-600 sm:text-sm/6"
                    value={formData.businessName}
                    onChange={(e) => {
                        handleChange(e);
                        setError(null); // Clear error on change
                    }}
                />
            </div>
            <div className="mb-4">
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 pb-2">
                    Industry
                </label>
                <Menu as="div" className="relative block text-left w-full">
                    <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                        {formData.industry || "Select an industry"}
                        <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                    </MenuButton>

                    <MenuItems
                        transition
                        className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                    >
                        <div className="py-1">
                            {industries.map((industryOption) => (
                                <MenuItem key={industryOption}>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => {
                                                handleChange({ target: { name: 'industry', value: industryOption } } as React.ChangeEvent<HTMLInputElement>);
                                                if (industryOption !== "Other") {
                                                    handleChange({ target: { name: 'industryOther', value: '' } } as React.ChangeEvent<HTMLInputElement>);
                                                }
                                                setError(null); // Clear error on change
                                            }}
                                            className={`block px-4 py-2 text-sm ${focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}
                                        >
                                            {industryOption}
                                        </a>
                                    )}
                                </MenuItem>
                            ))}
                        </div>
                    </MenuItems>
                </Menu>
                {formData.industry === "Other" && (
                    <div className="mt-4">
                        <label htmlFor="industryOther" className="block text-sm font-medium text-gray-700">
                            Please specify
                        </label>
                        <input
                            type="text"
                            name="industryOther"
                            id="industryOther"
                            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-neutral-600 sm:text-sm/6"
                            value={formData.industryOther || ''}
                            onChange={(e) => {
                                handleChange(e);
                                setError(null); // Clear error on change
                            }}
                        />
                    </div>
                )}
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
                onClick={handleNext}
                disabled={!isFormValid}
                className="mt-10 flex w-full justify-center rounded-md border border-transparent bg-neutral-900 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
            </button>
        </div>
    );
}
