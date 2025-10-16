'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import BusinessOnboardingStep1 from '@/components/business-onboarding/BusinessOnboardingStep1';
import BusinessOnboardingStep2 from '@/components/business-onboarding/BusinessOnboardingStep2';
import BusinessOnboardingStep3 from '@/components/business-onboarding/BusinessOnboardingStep3';

export default function BusinessOnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;
    const progress = (currentStep / totalSteps) * 100;

    const [formData, setFormData] = useState({
        businessName: '',
        industry: '',
        industryOther: '',
        companySize: '',
        yourRole: '',
        goal_and_description: ''
    });

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        if (!formData.businessName || !formData.industry || (formData.industry === "Other" && !formData.industryOther) || !formData.companySize || !formData.yourRole || !formData.goal_and_description) {
            setError('Please fill out all fields.');
            setSubmitting(false);
            return;
        }

        try {
            const response = await fetch('/api/supabase/businesses/add-business', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                router.push('/dashboard/business/create-survey');
            }
        } catch (error: any) {
            setSubmitting(false);
            setError(error.message);
        } 
    };

    return (
        <div className="relative">
            {submitting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-neutral-900"></div>
                        <p className="mt-4 text-neutral-900">Creating your business profile...</p>
                    </div>
                </div>
            )}
            <div className="pb-80 pt-16 sm:pb-40 sm:pt-24 lg:pb-40 lg:pt-40">
                <div className="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8 lg:flex lg:gap-x-20">
                    <div className="sm:max-w-lg lg:w-1/2 lg:pr-8">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                            Create Your LocalMoco Business Profile.
                        </h1>
                        <p className="mt-4 text-xl text-gray-500">
                            Create a business profile to start gathering valuable feedback from our community of earners.
                        </p>
                        <div className="bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-lg p-4 mt-10 text-sm">
                            <p className="font-bold">What happens next?</p>
                            <p>
                                Once you create your profile, you&apos;ll be able to create and manage tasks, view analytics, and connect with earners.
                            </p>
                        </div>
                    </div>
                    <div className="mt-10 lg:mt-5 lg:w-1/2">
                        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                        
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                            <div className="bg-neutral-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>

                        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 border border-gray-300">
                            {currentStep === 1 && (
                                <BusinessOnboardingStep1
                                    formData={formData}
                                    handleChange={handleChange}
                                    nextStep={nextStep}
                                />
                            )}
                            {currentStep === 2 && (
                                <BusinessOnboardingStep2
                                    formData={formData}
                                    handleChange={handleChange}
                                    nextStep={nextStep}
                                    prevStep={prevStep}
                                />
                            )}
                            {currentStep === 3 && (
                                <BusinessOnboardingStep3
                                    formData={formData}
                                    handleChange={handleChange}
                                    prevStep={prevStep}
                                    submitting={submitting}
                                />
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}