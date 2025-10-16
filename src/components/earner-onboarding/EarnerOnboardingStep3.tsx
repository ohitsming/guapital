'use client'

import React from 'react';
import { EarnerFormData, HispanicOrigin, RacialBackground } from '@/lib/types/earner-onboarding';

interface EarnerOnboardingStep3Props {
    formData: {
        hispanic_origin: HispanicOrigin | undefined;
        racial_background: RacialBackground[];
        racial_background_other: string;
    };
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleMultiSelectChange: (name: keyof EarnerFormData, value: string) => void;
    nextStep: () => void;
    prevStep: () => void;
}

export default function EarnerOnboardingStep3({
    formData,
    handleChange,
    handleMultiSelectChange,
    nextStep,
    prevStep,
}: EarnerOnboardingStep3Props) {
    const racialBackgrounds = [
        "American Indian or Alaska Native",
        "Asian (e.g., East Asian, South Asian, Southeast Asian)",
        "Black or African American",
        "Native Hawaiian or Other Pacific Islander",
        "White",
        "Middle Eastern or North African",
        "Some other race, ethnicity, or origin",
        "Prefer not to say",
    ] as const;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Race & Ethnicity</h2>
                <p className="mt-1 text-sm text-gray-600">Help us understand our earner community better.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 pb-2">
                        Are you of Hispanic, Latino, or of Spanish origin?
                    </label>
                    <div className="mt-1 space-y-2">
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="hispanic_yes"
                                name="hispanic_origin"
                                value="Yes"
                                checked={formData.hispanic_origin === 'Yes'}
                                onChange={() => handleChange({ target: { name: 'hispanic_origin', value: 'Yes' } } as any)}
                                className="h-4 w-5 text-neutral-600 focus:ring-neutral-500 border-gray-300"
                            />
                            <label htmlFor="hispanic_yes" className="ml-3 block text-sm text-gray-900">
                                Yes
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="hispanic_no"
                                name="hispanic_origin"
                                value="No"
                                checked={formData.hispanic_origin === 'No'}
                                onChange={() => handleChange({ target: { name: 'hispanic_origin', value: 'No' } } as any)}
                                className="h-4 w-5 text-neutral-600 focus:ring-neutral-500 border-gray-300"
                            />
                            <label htmlFor="hispanic_no" className="ml-3 block text-sm text-gray-900">
                                No
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="hispanic_prefer_not_say"
                                name="hispanic_origin"
                                value=""
                                checked={formData.hispanic_origin === undefined}
                                onChange={() => handleChange({ target: { name: 'hispanic_origin', value: undefined } } as any)}
                                className="h-4 w-5 text-neutral-600 focus:ring-neutral-500 border-gray-300"
                            />
                            <label htmlFor="hispanic_prefer_not_say" className="ml-3 block text-sm text-gray-900">
                                Prefer not to say
                            </label>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 pb-2">
                        How would you describe your racial background? (Select all that apply)
                    </label>
                    <div className="mt-1 flex flex-wrap gap-2">
                        {racialBackgrounds.map((background) => (
                            <button
                                key={background}
                                type="button"
                                className={`px-4 py-2 rounded-full border text-sm font-medium
                  ${formData.racial_background.includes(background)
                                        ? 'bg-neutral-600 text-white border-neutral-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                onClick={() => handleMultiSelectChange('racial_background', background)}
                            >
                                {background}
                            </button>
                        ))}
                        {formData.racial_background.includes("Some other race, ethnicity, or origin") && (
                            <input
                                type="text"
                                name="racial_background_other"
                                placeholder="Please specify"
                                value={formData.racial_background_other}
                                onChange={handleChange}
                                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm px-3 py-2"
                                required
                            />
                        )}
                    </div>
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
                    disabled={formData.racial_background.length === 0 || (formData.racial_background.includes("Some other race, ethnicity, or origin") && !formData.racial_background_other)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-neutral-600 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
}