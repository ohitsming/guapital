'use client'

import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { EarnerFormData, MaritalStatus, LocationAreaType } from '@/lib/types/earner-onboarding';

interface EarnerOnboardingStep5Props {
    formData: {
        marital_status: MaritalStatus | undefined;
        location_zip_code: string;
        location_country: string;
        location_area_type: LocationAreaType | undefined;
        location_area_type_other: string;
        household_composition_total: number | string;
        household_composition_children: number | string;
    };
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleMultiSelectChange: (name: keyof EarnerFormData, value: string) => void;
    nextStep: () => void;
    prevStep: () => void;
}

export default function EarnerOnboardingStep5({
    formData,
    handleChange,
    handleMultiSelectChange,
    nextStep,
    prevStep,
}: EarnerOnboardingStep5Props) {
    const maritalStatuses = [
        "Single, never married",
        "Married or in a domestic partnership",
        "Widowed",
        "Divorced",
        "Separated",
        "Prefer not to say",
    ];

    const locationAreaTypes = [
        "Urban",
        "Suburban",
        "Rural",
        "Other (please specify)",
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Household & Location</h2>
                <p className="mt-1 text-sm text-gray-600">Tell us about your living situation.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="marital_status" className="block text-sm font-medium text-gray-700 pb-2">
                        What is your marital status?
                    </label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {formData.marital_status || "Select marital status"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>
                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                        >
                            <div className="py-1">
                                {maritalStatuses.map((status) => (
                                    <MenuItem key={status}>
                                        {({ focus }) => (
                                            <a
                                                onClick={(e) => {
                                                    handleChange({ target: { name: 'marital_status', value: status } } as React.ChangeEvent<HTMLInputElement>);
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
                </div>

                <div>
                    <label htmlFor="location_zip_code" className="block text-sm font-medium text-gray-700 pb-2">
                        What is your ZIP code? (for U.S. residents)
                    </label>
                    <input
                        type="text"
                        id="location_zip_code"
                        name="location_zip_code"
                        value={formData.location_zip_code}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm px-3 py-2"
                    />
                </div>

                <div>
                    <label htmlFor="location_country" className="block text-sm font-medium text-gray-700 pb-2">
                        What country do you reside in?
                    </label>
                    <input
                        type="text"
                        id="location_country"
                        name="location_country"
                        value={formData.location_country}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm px-3 py-2"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="location_area_type" className="block text-sm font-medium text-gray-700 pb-2">
                        What type of area do you live in?
                    </label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {formData.location_area_type || "Select area type"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>
                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                        >
                            <div className="py-1">
                                {locationAreaTypes.map((type) => (
                                    <MenuItem key={type}>
                                        {({ focus }) => (
                                            <a
                                                onClick={() => {
                                                    handleChange({ target: { name: 'location_area_type', value: type } } as React.ChangeEvent<HTMLInputElement>);
                                                }}
                                                className={`block px-4 py-2 text-sm ${focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}`}>
                                                {type}
                                            </a>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Menu>
                    {formData.location_area_type === "Other (please specify)" && (
                        <input
                            type="text"
                            name="location_area_type_other"
                            placeholder="Please specify"
                            value={formData.location_area_type_other}
                            onChange={handleChange}
                            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm px-3 py-2"
                            required
                        />
                    )}
                </div>

                <div>
                    <label htmlFor="household_composition_total" className="block text-sm font-medium text-gray-700 pb-2">
                        Including yourself, how many people live in your household?
                    </label>
                    <input
                        type="number"
                        id="household_composition_total"
                        name="household_composition_total"
                        value={formData.household_composition_total}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm px-3 py-2"
                        min="1"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="household_composition_children" className="block text-sm font-medium text-gray-700 pb-2">
                        How many children (under the age of 18) primarily live in your household?
                    </label>
                    <input
                        type="number"
                        id="household_composition_children"
                        name="household_composition_children"
                        value={formData.household_composition_children}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm px-3 py-2"
                        min="0"
                        required
                    />
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
                >
                    Previous
                </button>
                <button
                    type="button"
                    onClick={nextStep}
                    disabled={!formData.marital_status || !formData.location_country || !formData.location_area_type || (formData.location_area_type === "Other (please specify)" && !formData.location_area_type_other) || formData.household_composition_total === '' || Number(formData.household_composition_total) <= 0 || formData.household_composition_children === ''}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-neutral-600 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
}