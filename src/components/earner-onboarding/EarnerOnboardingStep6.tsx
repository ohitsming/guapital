'use client'

import React from 'react';
import { EarnerFormData, FluentLanguage } from '@/lib/types/earner-onboarding';
import { Interest } from '@/lib/types/common';
import LoadingOverlay from '@/components/LoadingOverlay';

interface EarnerOnboardingStep6Props {
    formData: {
        primary_language_home: string | undefined;
        fluent_languages: FluentLanguage[];
        fluent_languages_other: string;
        selectedInterests: string[];
    };
    interests: Interest[];
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleMultiSelectChange: (name: keyof EarnerFormData, value: string) => void;
    handleInterestChange: (interestId: string) => void;
    prevStep: () => void;
    loading: boolean;
    submitting: boolean;
    nextStep: () => void;
}

export default function EarnerOnboardingStep6({
    formData,
    interests,
    handleChange,
    handleMultiSelectChange,
    handleInterestChange,
    prevStep,
    loading,
    submitting,
    nextStep,
}: EarnerOnboardingStep6Props) {
    const commonLanguages = [
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
    ] as const;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Language & Interests</h2>
                <p className="mt-1 text-sm text-gray-600">Help us understand your language preferences and interests.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="primary_language_home" className="block text-sm font-medium text-gray-700 pb-2">
                        What is the primary language spoken in your home?
                    </label>
                    <input
                        type="text"
                        id="primary_language_home"
                        name="primary_language_home"
                        value={formData.primary_language_home}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm px-3 py-2"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 pb-2">
                        Which languages do you speak fluently? (Select all that apply)
                    </label>
                    <div className="mt-1 flex flex-wrap gap-2">
                        {commonLanguages.map((language) => (
                            <button
                                key={language}
                                type="button"
                                className={`px-4 py-2 rounded-full border text-sm font-medium
                                        ${formData.fluent_languages.includes(language)
                                        ? 'bg-neutral-600 text-white border-neutral-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                onClick={() => handleMultiSelectChange('fluent_languages', language)}
                            >
                                {language}
                            </button>
                        ))}
                        {formData.fluent_languages.includes("Other") && (
                            <input
                                type="text"
                                name="fluent_languages_other"
                                placeholder="Please specify other languages"
                                value={formData.fluent_languages_other}
                                onChange={handleChange}
                                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm px-3 py-2"
                                required
                            />
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 pb-2">
                        What are your interests? (Select all that apply)
                    </label>
                    {loading ? (
                        <div>Loading interests...</div>
                    ) : (
                        <div className="mt-1 flex flex-wrap gap-2">
                            {interests.map((interest: any) => (
                                <button
                                    key={interest.id}
                                    type="button"
                                    className={`px-4 py-2 rounded-full border text-sm font-medium
                    ${formData.selectedInterests.includes(interest.id)
                                            ? 'bg-neutral-600 text-white border-neutral-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    onClick={() => handleInterestChange(interest.id)}
                                >
                                    {interest.name}
                                </button>
                            ))}
                        </div>
                    )}
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
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-neutral-600 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
                >
                    Review
                </button>
            </div>
            
        </div>
    );
}