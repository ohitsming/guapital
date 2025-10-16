'use client'

import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { EarnerFormData, EducationLevel, EmploymentStatus, AnnualHouseholdIncome } from '@/lib/types/earner-onboarding';

interface EarnerOnboardingStep4Props {
    formData: {
        education_level: EducationLevel | undefined;
        employment_status: EmploymentStatus | undefined;
        employment_status_other: string;
        annual_household_income: AnnualHouseholdIncome | undefined;
    };
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleMultiSelectChange: (name: keyof EarnerFormData, value: string) => void;
    nextStep: () => void;
    prevStep: () => void;
}

export default function EarnerOnboardingStep4({
    formData,
    handleChange,
    handleMultiSelectChange,
    nextStep,
    prevStep,
}: EarnerOnboardingStep4Props) {
    const educationLevels = [
        "Less than high school degree",
        "High school degree or equivalent (e.g., GED)",
        "Some college but no degree",
        "Associate degree",
        "Bachelor's degree",
        "Master's degree",
        "Doctorate degree",
        "Professional degree (e.g., MD, JD)",
        "Prefer not to say",
    ];

    const employmentStatuses = [
        "Employed full-time",
        "Employed part-time",
        "Self-employed",
        "Contract or temporary",
        "Unemployed and looking for work",
        "Unemployed and not currently looking for work",
        "Student",
        "Retired",
        "Homemaker",
        "Unable to work",
        "Other (please specify)",
        "Prefer not to say",
    ];

    const annualHouseholdIncomes = [
        "Less than $25,000",
        "$25,000 - $49,999",
        "$50,000 - $74,999",
        "$75,000 - $99,999",
        "$100,000 - $149,999",
        "$150,000 - $199,999",
        "$200,000 or more",
        "Prefer not to say",
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Education & Employment</h2>
                <p className="mt-1 text-sm text-gray-600">Help us understand your background.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="education_level" className="block text-sm font-medium text-gray-700 pb-2">
                        What is the highest level of education you have completed?
                    </label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {formData.education_level || "Select an education level"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>
                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                        >
                            <div className="py-1">
                                {educationLevels.map((level) => (
                                    <MenuItem key={level}>
                                        {({ focus }) => (
                                            <a
                                                onClick={(e) => {
                                                    handleChange({ target: { name: 'education_level', value: level } } as React.ChangeEvent<HTMLInputElement>);
                                                }}
                                                className={`block px-4 py-2 text-sm ${focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}>
                                                {level}
                                            </a>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Menu>
                </div>

                <div>
                    <label htmlFor="employment_status" className="block text-sm font-medium text-gray-700 pb-2">
                        What is your current employment status?
                    </label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {formData.employment_status || "Select employment status"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>
                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                        >
                            <div className="py-1">
                                {employmentStatuses.map((status) => (
                                    <MenuItem key={status}>
                                        {({ focus }) => (
                                            <a
                                                onClick={(e) => {
                                                    handleChange({ target: { name: 'employment_status', value: status } } as React.ChangeEvent<HTMLInputElement>);
                                                }}
                                                className={`block px-4 py-2 text-sm ${focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}>
                                                {status}
                                            </a>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Menu>
                    {formData.employment_status === "Other (please specify)" && (
                        <input
                            type="text"
                            name="employment_status_other"
                            placeholder="Please specify"
                            value={formData.employment_status_other}
                            onChange={handleChange}
                            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm px-3 py-2"
                            required
                        />
                    )}
                </div>

                <div>
                    <label htmlFor="annual_household_income" className="block text-sm font-medium text-gray-700 pb-2">
                        What is your annual household income?
                    </label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {formData.annual_household_income || "Select income range"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>
                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                        >
                            <div className="py-1">
                                {annualHouseholdIncomes.map((income) => (
                                    <MenuItem key={income}>
                                        {({ focus }) => (
                                            <a
                                                onClick={() => {
                                                    handleChange({ target: { name: 'annual_household_income', value: income } } as React.ChangeEvent<HTMLInputElement>);
                                                }}
                                                className={`block px-4 py-2 text-sm ${focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}>
                                                {income}
                                            </a>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Menu>
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
                >
                    Previous
                </button>
                <button
                    type="button"
                    onClick={nextStep}
                    disabled={!formData.education_level || !formData.employment_status || (formData.employment_status === "Other (please specify)" && !formData.employment_status_other) || !formData.annual_household_income}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-neutral-600 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
