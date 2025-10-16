'use client';

import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { SelectField } from "@/components/SelectField";
import { useCampaignForm } from "@/lib/context/CampaignFormContext";
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { AgeRange, GenderIdentity, HispanicOrigin, RacialBackground, EducationLevel, EmploymentStatus, AnnualHouseholdIncome, MaritalStatus, LocationAreaType, FluentLanguage } from "@/lib/types/earner-onboarding";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

function classNames(...classes: any) {
    return classes.filter(Boolean).join(' ')
}

export default function DemographicsPage() {
    const { state: campaignFormState, dispatch } = useCampaignForm();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let finalValue: any = value;

        if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        } else if (name === 'hispanic_origin') {
            // HispanicOrigin type is a union of strings, so directly assign the value
            finalValue = value as HispanicOrigin;
        } else if (name === 'fluent_languages') {
            // fluent_languages is an array of FluentLanguage
            finalValue = value.split(',').map(lang => lang.trim()) as FluentLanguage[];
        } else if (name === 'household_composition_total' || name === 'household_composition_children') {
            // Convert to number for number inputs
            finalValue = value === '' ? '' : Number(value);
        }
        // Note: gender_identity and racial_background are defined as arrays in EarnerFormData,
        // but the current UI uses single selection. For campaign targeting, we'll treat them
        // as single string values for now. If multi-select is desired, the UI and state
        // management for these fields would need to be updated.

        dispatch({ type: 'UPDATE_FIELD', payload: { name: name as any, value: finalValue } });
    };

    const handleNext = () => {
        router.push('/dashboard/business/campaigns/new/review');
    };

    const ageRangeOptions: AgeRange[] = [
        "18-24 years old",
        "25-34 years old",
        "35-44 years old",
        "45-54 years old",
        "55-64 years old",
        "65 years or older",
    ];

    const genderIdentityOptions: GenderIdentity[] = [
        "Woman",
        "Man",
        "Transgender woman",
        "Transgender man",
        "Non-binary",
        "Genderqueer or gender nonconforming",
        "Agender",
        "Two-spirited",
    ];

    const racialBackgroundOptions: RacialBackground[] = [
        "American Indian or Alaska Native",
        "Asian (e.g., East Asian, South Asian, Southeast Asian)",
        "Black or African American",
        "Native Hawaiian or Other Pacific Islander",
        "White",
        "Middle Eastern or North African",
        "Some other race, ethnicity, or origin",
    ];

    const educationLevelOptions: EducationLevel[] = [
        "Less than high school degree",
        "High school degree or equivalent (e.g., GED)",
        "Some college but no degree",
        "Associate degree",
        "Bachelor's degree",
        "Master's degree",
        "Doctorate degree",
        "Professional degree (e.g., MD, JD)",
    ];

    const employmentStatusOptions: EmploymentStatus[] = [
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
    ];

    const annualHouseholdIncomeOptions: AnnualHouseholdIncome[] = [
        "Less than $25,000",
        "$25,000 - $49,999",
        "$50,000 - $74,999",
        "$75,000 - $99,999",
        "$100,000 - $149,999",
        "$150,000 - $199,999",
        "$200,000 or more",
    ];

    const maritalStatusOptions: MaritalStatus[] = [
        "Single, never married",
        "Married or in a domestic partnership",
        "Widowed",
        "Divorced",
        "Separated",
    ];

    const locationCountryOptions = [
        'United States',
        'Canada',
        'Mexico',
        'United Kingdom',
        'Australia',
        'Other',
    ];

    const locationAreaTypeOptions: LocationAreaType[] = [
        "Urban",
        "Suburban",
        "Rural",
        "Other (please specify)",
    ];

    const primaryLanguageOptions: FluentLanguage[] = [
        "English",
        "Spanish",
        "Chinese",
        "Hindi",
        "Arabic",
        "Bengali",
        "Portuguese",
        "Russian",
        "Japanese",
        "German",
        "French",
        "Korean",
        "Italian",
        "Urdu",
        "Vietnamese",
        "Other",
    ];

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Target Audience Demographics</h1>
            <p className="text-neutral-600 mb-6">Specify the demographic criteria for your ideal respondents. <b>Leave fields blank</b> if you do not have a preference.</p>

            <div className="space-y-6">
                <div>
                    <label htmlFor="age_range" className="mb-2 block text-sm font-semibold text-gray-900">Age Range</label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {campaignFormState.age_range || "Select an age range"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>

                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in max-h-60 overflow-y-auto"
                        >
                            <div className="py-1">
                                <MenuItem>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => handleChange({ target: { name: 'age_range', value: '' } } as React.ChangeEvent<HTMLSelectElement>)}
                                            className={classNames(
                                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                'block px-4 py-2 text-sm'
                                            )}
                                        >
                                            Select an age range
                                        </a>
                                    )}
                                </MenuItem>
                                {ageRangeOptions.map((option) => (
                                    <MenuItem key={option}>
                                        {({ focus }) => (
                                            <a
                                                onClick={() => handleChange({ target: { name: 'age_range', value: option } } as React.ChangeEvent<HTMLSelectElement>)}
                                                className={classNames(
                                                    focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                    'block px-4 py-2 text-sm'
                                                )}
                                            >
                                                {option}
                                            </a>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Menu>
                </div>

                <div>
                    <label htmlFor="gender_identity" className="mb-2 block text-sm font-semibold text-gray-900">Gender Identity</label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {campaignFormState.gender_identity || "Select a gender identity"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>

                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in max-h-60 overflow-y-auto"
                        >
                            <div className="py-1">
                                <MenuItem>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => handleChange({ target: { name: 'gender_identity', value: '' } } as React.ChangeEvent<HTMLSelectElement>)}
                                            className={classNames(
                                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                'block px-4 py-2 text-sm'
                                            )}
                                        >
                                            Select a gender identity
                                        </a>
                                    )}
                                </MenuItem>
                                {genderIdentityOptions.map((option) => (
                                    <MenuItem key={option}>
                                        {({ focus }) => (
                                            <a
                                                onClick={() => handleChange({ target: { name: 'gender_identity', value: option } } as React.ChangeEvent<HTMLSelectElement>)}
                                                className={classNames(
                                                    focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                    'block px-4 py-2 text-sm'
                                                )}
                                            >
                                                {option}
                                            </a>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Menu>
                </div>
                {campaignFormState.gender_identity === 'Other' && (
                    <TextField
                        label="Please specify your gender identity"
                        id="gender_identity_other"
                        name="gender_identity_other"
                        type="text"
                        value={campaignFormState.gender_identity_other || ''}
                        onChange={handleChange}
                    />
                )}

                <div>
                    <label htmlFor="hispanic_origin" className="mb-2 block text-sm font-semibold text-gray-900">Hispanic or Latino Origin</label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {campaignFormState.hispanic_origin || "Select an option"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>

                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in max-h-60 overflow-y-auto"
                        >
                            <div className="py-1">
                                <MenuItem>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => handleChange({ target: { name: 'hispanic_origin', value: '' } } as React.ChangeEvent<HTMLSelectElement>)}
                                            className={classNames(
                                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                'block px-4 py-2 text-sm'
                                            )}
                                        >
                                            Select an option
                                        </a>
                                    )}
                                </MenuItem>
                                <MenuItem>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => handleChange({ target: { name: 'hispanic_origin', value: 'Yes' } } as React.ChangeEvent<HTMLSelectElement>)}
                                            className={classNames(
                                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                'block px-4 py-2 text-sm'
                                            )}
                                        >
                                            Yes
                                        </a>
                                    )}
                                </MenuItem>
                                <MenuItem>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => handleChange({ target: { name: 'hispanic_origin', value: 'No' } } as React.ChangeEvent<HTMLSelectElement>)}
                                            className={classNames(
                                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                'block px-4 py-2 text-sm'
                                            )}
                                        >
                                            No
                                        </a>
                                    )}
                                </MenuItem>
                            </div>
                        </MenuItems>
                    </Menu>
                </div>

                <div>
                    <label htmlFor="racial_background" className="mb-2 block text-sm font-semibold text-gray-900">Racial Background</label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {campaignFormState.racial_background || "Select a racial background"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>

                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in max-h-60 overflow-y-auto"
                        >
                            <div className="py-1">
                                <MenuItem>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => handleChange({ target: { name: 'racial_background', value: '' } } as React.ChangeEvent<HTMLSelectElement>)}
                                            className={classNames(
                                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                'block px-4 py-2 text-sm'
                                            )}
                                        >
                                            Select a racial background
                                        </a>
                                    )}
                                </MenuItem>
                                {racialBackgroundOptions.map((option) => (
                                    <MenuItem key={option}>
                                        {({ focus }) => (
                                            <a
                                                onClick={() => handleChange({ target: { name: 'racial_background', value: option } } as React.ChangeEvent<HTMLSelectElement>)}
                                                className={classNames(
                                                    focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                    'block px-4 py-2 text-sm'
                                                )}
                                            >
                                                {option}
                                            </a>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Menu>
                </div>
                {campaignFormState.racial_background === 'Other' && (
                    <TextField
                        label="Please specify your racial background"
                        id="racial_background_other"
                        name="racial_background_other"
                        type="text"
                        value={campaignFormState.racial_background_other || ''}
                        onChange={handleChange}
                    />
                )}

                <div>
                    <label htmlFor="education_level" className="mb-2 block text-sm font-semibold text-gray-900">Education Level</label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {campaignFormState.education_level || "Select an education level"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>

                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in max-h-60 overflow-y-auto"
                        >
                            <div className="py-1">
                                <MenuItem>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => handleChange({ target: { name: 'education_level', value: '' } } as React.ChangeEvent<HTMLSelectElement>)}
                                            className={classNames(
                                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                'block px-4 py-2 text-sm'
                                            )}
                                        >
                                            Select an education level
                                        </a>
                                    )}
                                </MenuItem>
                                {educationLevelOptions.map((option) => (
                                    <MenuItem key={option}>
                                        {({ focus }) => (
                                            <a
                                                onClick={() => handleChange({ target: { name: 'education_level', value: option } } as React.ChangeEvent<HTMLSelectElement>)}
                                                className={classNames(
                                                    focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                    'block px-4 py-2 text-sm'
                                                )}
                                            >
                                                {option}
                                            </a>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Menu>
                </div>

                <div>
                    <label htmlFor="employment_status" className="mb-2 block text-sm font-semibold text-gray-900">Employment Status</label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {campaignFormState.employment_status || "Select employment status"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>

                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in max-h-60 overflow-y-auto"
                        >
                            <div className="py-1">
                                <MenuItem>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => handleChange({ target: { name: 'employment_status', value: '' } } as React.ChangeEvent<HTMLSelectElement>)}
                                            className={classNames(
                                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                'block px-4 py-2 text-sm'
                                            )}
                                        >
                                            Select employment status
                                        </a>
                                    )}
                                </MenuItem>
                                {employmentStatusOptions.map((option) => (
                                    <MenuItem key={option}>
                                        {({ focus }) => (
                                            <a
                                                onClick={() => handleChange({ target: { name: 'employment_status', value: option } } as React.ChangeEvent<HTMLSelectElement>)}
                                                className={classNames(
                                                    focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                    'block px-4 py-2 text-sm'
                                                )}
                                            >
                                                {option}
                                            </a>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Menu>
                </div>
                {campaignFormState.employment_status === 'Other' && (
                    <TextField
                        label="Please specify your employment status"
                        id="employment_status_other"
                        name="employment_status_other"
                        type="text"
                        value={campaignFormState.employment_status_other || ''}
                        onChange={handleChange}
                    />
                )}

                <div>
                    <label htmlFor="annual_household_income" className="mb-2 block text-sm font-semibold text-gray-900">Annual Household Income</label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {campaignFormState.annual_household_income || "Select income range"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>

                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in max-h-60 overflow-y-auto"
                        >
                            <div className="py-1">
                                <MenuItem>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => handleChange({ target: { name: 'annual_household_income', value: '' } } as React.ChangeEvent<HTMLSelectElement>)}
                                            className={classNames(
                                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                'block px-4 py-2 text-sm'
                                            )}
                                        >
                                            Select income range
                                        </a>
                                    )}
                                </MenuItem>
                                {annualHouseholdIncomeOptions.map((option) => (
                                    <MenuItem key={option}>
                                        {({ focus }) => (
                                            <a
                                                onClick={() => handleChange({ target: { name: 'annual_household_income', value: option } } as React.ChangeEvent<HTMLSelectElement>)}
                                                className={classNames(
                                                    focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                    'block px-4 py-2 text-sm'
                                                )}
                                            >
                                                {option}
                                            </a>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Menu>
                </div>

                <div>
                    <label htmlFor="marital_status" className="mb-2 block text-sm font-semibold text-gray-900">Marital Status</label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {campaignFormState.marital_status || "Select marital status"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>

                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in max-h-60 overflow-y-auto"
                        >
                            <div className="py-1">
                                <MenuItem>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => handleChange({ target: { name: 'marital_status', value: '' } } as React.ChangeEvent<HTMLSelectElement>)}
                                            className={classNames(
                                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                'block px-4 py-2 text-sm'
                                            )}
                                        >
                                            Select marital status
                                        </a>
                                    )}
                                </MenuItem>
                                {maritalStatusOptions.map((option) => (
                                    <MenuItem key={option}>
                                        {({ focus }) => (
                                            <a
                                                onClick={() => handleChange({ target: { name: 'marital_status', value: option } } as React.ChangeEvent<HTMLSelectElement>)}
                                                className={classNames(
                                                    focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                    'block px-4 py-2 text-sm'
                                                )}
                                            >
                                                {option}
                                            </a>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Menu>
                </div>

                <TextField
                    label="Location Zip Code (Optional)"
                    id="location_zip_code"
                    name="location_zip_code"
                    type="text"
                    value={campaignFormState.location_zip_code || ''}
                    onChange={handleChange}
                />

                <div>
                    <label htmlFor="location_country" className="mb-2 block text-sm font-semibold text-gray-900">Location Country</label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {campaignFormState.location_country || "Select a country"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>

                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in max-h-60 overflow-y-auto"
                        >
                            <div className="py-1">
                                <MenuItem>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => handleChange({ target: { name: 'location_country', value: '' } } as React.ChangeEvent<HTMLSelectElement>)}
                                            className={classNames(
                                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                'block px-4 py-2 text-sm'
                                            )}
                                        >
                                            Select a country
                                        </a>
                                    )}
                                </MenuItem>
                                {locationCountryOptions.map((option) => (
                                    <MenuItem key={option}>
                                        {({ focus }) => (
                                            <a
                                                onClick={() => handleChange({ target: { name: 'location_country', value: option } } as React.ChangeEvent<HTMLSelectElement>)}
                                                className={classNames(
                                                    focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                    'block px-4 py-2 text-sm'
                                                )}
                                            >
                                                {option}
                                            </a>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Menu>
                </div>

                <div>
                    <label htmlFor="location_area_type" className="mb-2 block text-sm font-semibold text-gray-900">Location Area Type</label>
                    <Menu as="div" className="relative block text-left w-full">
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {campaignFormState.location_area_type || "Select area type"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>

                        <MenuItems
                            transition
                            className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in max-h-60 overflow-y-auto"
                        >
                            <div className="py-1">
                                <MenuItem>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => handleChange({ target: { name: 'location_area_type', value: '' } } as React.ChangeEvent<HTMLSelectElement>)}
                                            className={classNames(
                                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                'block px-4 py-2 text-sm'
                                            )}
                                        >
                                            Select area type
                                        </a>
                                    )}
                                </MenuItem>
                                {locationAreaTypeOptions.map((option) => (
                                    <MenuItem key={option}>
                                        {({ focus }) => (
                                            <a
                                                onClick={() => handleChange({ target: { name: 'location_area_type', value: option } } as React.ChangeEvent<HTMLSelectElement>)}
                                                className={classNames(
                                                    focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                    'block px-4 py-2 text-sm'
                                                )}
                                            >
                                                {option}
                                            </a>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Menu>
                </div>
                {campaignFormState.location_area_type === 'Other' && (
                    <TextField
                        label="Please specify your location area type"
                        id="location_area_type_other"
                        name="location_area_type_other"
                        type="text"
                        value={campaignFormState.location_area_type_other || ''}
                        onChange={handleChange}
                    />
                )}

                <TextField
                    label="Household Composition (Total Members)"
                    id="household_composition_total"
                    name="household_composition_total"
                    type="number"
                    value={campaignFormState.household_composition_total || ''}
                    onChange={handleChange}
                />

                <TextField
                    label="Household Composition (Children)"
                    id="household_composition_children"
                    name="household_composition_children"
                    type="number"
                    value={campaignFormState.household_composition_children || ''}
                    onChange={handleChange}
                />

                <div>
                    <label htmlFor="primary_language_home" className="mb-2 block text-sm font-semibold text-gray-900">Primary Language</label>
                    <Menu as="div" className="relative block text-left w-full" >
                        <MenuButton className="inline-flex w-full justify-between items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500">
                            {campaignFormState.primary_language_home || "Select a language"}
                            <ChevronDownIcon aria-hidden="true" className="-mr-1 size-5 text-gray-400" />
                        </MenuButton>

                        <MenuItems
                            transition
                            className="absolute z-10 bottom-full right-0 mb-2 w-full origin-bottom-right rounded-md bg-white shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in max-h-60 overflow-y-auto"
                        >
                            <div className="py-1">
                                <MenuItem>
                                    {({ focus }) => (
                                        <a
                                            onClick={() => handleChange({ target: { name: 'primary_language_home', value: '' } } as React.ChangeEvent<HTMLSelectElement>)}
                                            className={classNames(
                                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                'block px-4 py-2 text-sm'
                                            )}
                                        >
                                            Select a language
                                        </a>
                                    )}
                                </MenuItem>
                                {primaryLanguageOptions.map((option) => (
                                    <MenuItem key={option}>
                                        {({ focus }) => (
                                            <a
                                                onClick={() => handleChange({ target: { name: 'primary_language_home', value: option } } as React.ChangeEvent<HTMLSelectElement>)}
                                                className={classNames(
                                                    focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                    'block px-4 py-2 text-sm'
                                                )}
                                            >
                                                {option}
                                            </a>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Menu>
                </div>

                {/* Fluent Languages - This will require a more complex multi-select component */}
                <TextField
                    label="Fluent Languages (Comma-separated, e.g., Spanish, French)"
                    id="fluent_languages"
                    name="fluent_languages"
                    type="text"
                    value={campaignFormState.fluent_languages || ''}
                    onChange={handleChange}
                />
                {campaignFormState.fluent_languages && campaignFormState.fluent_languages.includes('Other') && (
                    <TextField
                        label="Please specify other fluent languages"
                        id="fluent_languages_other"
                        name="fluent_languages_other"
                        type="text"
                        value={campaignFormState.fluent_languages_other || ''}
                        onChange={handleChange}
                    />
                )}

            </div>

            <div className="mt-8">
                <Button type="button" onClick={handleNext} className="px-8 py-3 text-lg">Next</Button>
            </div>
        </div>
    );
}
