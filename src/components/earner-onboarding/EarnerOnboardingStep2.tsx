
'use client'

import React from 'react';
import { EarnerFormData, GenderIdentity } from '@/lib/types/earner-onboarding';

interface EarnerOnboardingStep2Props {
  formData: {
    gender_identity: GenderIdentity[];
    gender_identity_other: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleMultiSelectChange: (name: keyof EarnerFormData, value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export default function EarnerOnboardingStep2({
  formData,
  handleChange,
  handleMultiSelectChange,
  nextStep,
  prevStep,
}: EarnerOnboardingStep2Props) {
  const genderIdentities = [
    "Woman",
    "Man",
    "Transgender woman",
    "Transgender man",
    "Non-binary",
    "Genderqueer or gender nonconforming",
    "Agender",
    "Two-spirited",
    "An identity not listed",
    "Prefer not to disclose",
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gender Identity</h2>
        <p className="mt-1 text-sm text-gray-600">Help us understand our earner community better.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 pb-2">
            Which of the following gender identities do you most identify with? (Select all that apply)
          </label>
          <div className="mt-1 flex flex-wrap gap-2">
            {genderIdentities.map((identity) => (
              <button
                key={identity}
                type="button"
                className={`px-4 py-2 rounded-full border text-sm font-medium
                  ${formData.gender_identity.includes(identity)
                    ? 'bg-neutral-600 text-white border-neutral-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                onClick={() => handleMultiSelectChange('gender_identity', identity)}
              >
                {identity}
              </button>
            ))}
            {formData.gender_identity.includes("An identity not listed") && (
              <input
                type="text"
                name="gender_identity_other"
                placeholder="Please specify"
                value={formData.gender_identity_other}
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
          disabled={formData.gender_identity.length === 0 || (formData.gender_identity.includes("An identity not listed") && !formData.gender_identity_other)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-neutral-600 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
