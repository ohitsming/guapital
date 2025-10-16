'use client'

import React, { useState } from 'react';

interface Step3Props {
    formData: {
        goal_and_description: string;
    };
    handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    prevStep: () => void;
    submitting: boolean;
}

export default function BusinessOnboardingStep3({ formData, handleChange, prevStep, submitting }: Step3Props) {
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission
        if (!formData.goal_and_description.trim()) {
            setError('Please describe your business and what you\'d like to learn.');
            return;
        }
        setError(null);
        // The actual form submission is handled by the parent component
        // This component just needs to ensure its fields are valid before allowing submission
        // The parent\'s handleSubmit will be triggered by the button type="submit"
    };

    const isFormValid = (
        formData.goal_and_description.trim() !== ''
    );

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Tell us about your goals.</h2>
            <div className="mb-4">
                <label htmlFor="goal_and_description" className="block text-sm font-medium text-gray-700">
                    To help us suggest the right templates, briefly describe your business and what you&apos;d like to learn first.
                </label>
                <textarea
                    name="goal_and_description"
                    id="goal_and_description"
                    rows={3}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-neutral-600 sm:text-sm/6"
                    value={formData.goal_and_description}
                    onChange={(e) => {
                        handleChange(e);
                        setError(null); // Clear error on change
                    }}
                    placeholder="e.g., 'We're a B2C subscription box for dog toys, and we want to test new product ideas with pet owners.'"
                />
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="mt-6 flex justify-between">
                <button
                    type="button" // Change to type="button" to prevent nested form submission
                    onClick={prevStep}
                    className="flex justify-center rounded-md border border-transparent bg-gray-300 py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Back
                </button>
                <button
                    type="submit" // Keep as type="submit" to trigger parent form submission
                    className="flex justify-center rounded-md border border-transparent bg-neutral-900 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting || !isFormValid}
                >
                    {submitting ? 'Creating Profile...' : 'Create Business Profile'}
                </button>
            </div>
        </div>
    );
}
