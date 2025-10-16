'use client'

import React from 'react';
import { EarnerFormData } from '@/lib/types/earner-onboarding';
import { Interest } from '@/lib/types/common';

interface EarnerOnboardingReviewProps {
    formData: EarnerFormData;
    interests: Interest[];
    prevStep: () => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    submitting: boolean;
}

export default function EarnerOnboardingReview({
    formData,
    interests,
    prevStep,
    handleSubmit,
    submitting,
}: EarnerOnboardingReviewProps) {

    const getDisplayValue = (key: keyof EarnerFormData, value: any) => {
        if (Array.isArray(value)) {
            if (value.length === 0) { // If array is empty, treat as not provided
                return null;
            }
            if (key === 'selectedInterests') {
                return value.map(id => interests.find(interest => interest.id === id)?.name || id).join(', ');
            }
            return value.join(', ');
        }
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        if (value === undefined || value === null || value === '') {
            return null; // Return null if value is not provided
        }
        return value;
    };

    const fieldsToDisplay: Array<{ key: keyof EarnerFormData, label: string }> = [
        { key: 'age_range', label: 'Age Range' },
        { key: 'gender_identity', label: 'Gender Identity' },
        { key: 'gender_identity_other', label: 'Other Gender Identity' },
        { key: 'hispanic_origin', label: 'Hispanic Origin' },
        { key: 'racial_background', label: 'Racial Background' },
        { key: 'racial_background_other', label: 'Other Racial Background' },
        { key: 'education_level', label: 'Education Level' },
        { key: 'employment_status', label: 'Employment Status' },
        { key: 'employment_status_other', label: 'Other Employment Status' },
        { key: 'annual_household_income', label: 'Annual Household Income' },
        { key: 'marital_status', label: 'Marital Status' },
        { key: 'location_zip_code', label: 'Zip Code' },
        { key: 'location_country', label: 'Country' },
        { key: 'location_area_type', label: 'Area Type' },
        { key: 'location_area_type_other', label: 'Other Area Type' },
        { key: 'household_composition_total', label: 'Total Household Members' },
        { key: 'household_composition_children', label: 'Children in Household' },
        { key: 'primary_language_home', label: 'Primary Language at Home' },
        { key: 'fluent_languages', label: 'Fluent Languages' },
        { key: 'fluent_languages_other', label: 'Other Fluent Languages' },
        { key: 'selectedInterests', label: 'Interests' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Review Your Information</h2>
                <p className="mt-1 text-sm text-gray-600">Please review your demographic data before submitting.</p>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                <dl className="divide-y divide-gray-200">
                    {fieldsToDisplay.map((field) => {
                        const displayValue = getDisplayValue(field.key, formData[field.key]);
                        return displayValue !== null ? (
                            <div key={field.key} className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                    {displayValue}
                                </dd>
                            </div>
                        ) : null;
                    })}
                </dl>
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
                    type="submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-neutral-600 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? 'Submitting...' : 'Submit'}
                </button>
            </div>
        </div>
    );
}
