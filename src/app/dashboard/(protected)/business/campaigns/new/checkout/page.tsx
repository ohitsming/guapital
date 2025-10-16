'use client'

import { useRouter } from 'next/navigation';
import { Container } from "@/components/Container";
import { Button } from "@/components/Button";
import { useCampaignForm } from '@/lib/context/CampaignFormContext';
import { useEffect, useState } from 'react';
import { calculateFees, FeeBreakdown } from '@/lib/stripe/stripeCalculator';

export default function CheckoutPage() {
    const router = useRouter();
    const { state: formData } = useCampaignForm();
    const [fees, setFees] = useState<FeeBreakdown | null>(null);
    const [estimatedPayoutPerEarner, setEstimatedPayoutPerEarner] = useState<number>(0);

    useEffect(() => {
        // Example: If form data is empty, redirect back to review
        if (!formData.campaignTitle) {
            router.push('/dashboard/business/campaigns/new/review');
            return; // Stop execution if redirecting
        }

        const totalWorkerPay = parseFloat(formData.totalBudget);
        const participantQuota = parseInt(formData.participantQuota);

        if (!isNaN(totalWorkerPay) && !isNaN(participantQuota) && participantQuota > 0) {
            const calculatedFees = calculateFees(totalWorkerPay, participantQuota);
            setFees(calculatedFees);
            setEstimatedPayoutPerEarner(totalWorkerPay / participantQuota);
        } else {
            // Reset fees if inputs are invalid
            setFees(null);
            setEstimatedPayoutPerEarner(0);
        }
    }, [formData, router]);


    const handlePaymentSuccess = async () => {
        // This is where you would typically handle Stripe payment confirmation
        // and then call your API to create the campaign.

        const targeting_criteria = {
            age_range: formData.age_range,
            gender_identity: formData.gender_identity,
            gender_identity_other: formData.gender_identity_other,
            hispanic_origin: formData.hispanic_origin,
            racial_background: formData.racial_background,
            racial_background_other: formData.racial_background_other,
            education_level: formData.education_level,
            employment_status: formData.employment_status,
            employment_status_other: formData.employment_status_other,
            annual_household_income: formData.annual_household_income,
            marital_status: formData.marital_status,
            location_zip_code: formData.location_zip_code,
            location_country: formData.location_country,
            location_area_type: formData.location_area_type,
            location_area_type_other: formData.location_area_type_other,
            household_composition_total: formData.household_composition_total,
            household_composition_children: formData.household_composition_children,
            primary_language_home: formData.primary_language_home,
            fluent_languages: formData.fluent_languages,
            fluent_languages_other: formData.fluent_languages_other,
        };

        const taskPayload = {
            title: formData.campaignTitle,
            description: formData.campaignDescription,
            campaign_budget: parseFloat(formData.totalBudget),
            participant_quota: parseInt(formData.participantQuota),
            questions: formData.surveyQuestions,
            targeting_criteria: targeting_criteria,
        };

        try {
            const response = await fetch('/api/supabase/businesses/add-task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskPayload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create campaign.');
            }

            console.log('Campaign created successfully after payment!');
            router.push('/dashboard/business/campaigns'); // Redirect to campaigns list

        } catch (error) {
            console.error('Error creating campaign after payment:', error);
            // Handle error, e.g., display a message to the user
        }
    };

    return (
        <Container className="py-12">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>
            <div className="lg:flex lg:gap-x-20">
                {/* Left Column: Campaign Details */}
                <div className="lg:w-1/2 space-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Campaign Details</h2>
                        <div className="space-y-2">
                            <p className="text-gray-700"><strong className="font-medium">Title:</strong> {formData.campaignTitle}</p>
                            <p className="text-gray-700"><strong className="font-medium">Description:</strong> {formData.campaignDescription}</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Budget and Quota</h2>
                        <div className="space-y-2">
                            <p className="text-gray-700"><strong className="font-medium">Total Campaign Budget ($):</strong> ${formData.totalBudget}</p>
                            <p className="text-gray-700"><strong className="font-medium">Participant Quota:</strong> {formData.participantQuota}</p>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Questions</h2>
                        {formData.surveyQuestions && formData.surveyQuestions.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-2">
                                {formData.surveyQuestions.map((question, index) => (
                                    <li key={index} className="text-gray-700">
                                        <p className="font-medium">{question.text} <span className="text-sm text-gray-500">({question.type})</span></p>
                                        {question.options && question.options.length > 0 && (
                                            <ul className="list-circle pl-5 text-sm text-gray-600">
                                                {question.options.map((option, optIndex) => (
                                                    <li key={optIndex}>{option}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600">No questions have been added yet.</p>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Target Audience Demographics</h2>
                        <div className="space-y-2 text-gray-700">
                            {formData.age_range && <p><strong className="font-medium">Age Range:</strong> {formData.age_range}</p>}
                            {formData.gender_identity && <p><strong className="font-medium">Gender Identity:</strong> {formData.gender_identity}</p>}
                            {formData.gender_identity_other && <p className="ml-4 text-sm text-gray-600">- {formData.gender_identity_other}</p>}
                            {formData.hispanic_origin !== null && <p><strong className="font-medium">Hispanic or Latino Origin:</strong> {formData.hispanic_origin ? 'Yes' : 'No'}</p>}
                            {formData.racial_background && <p><strong className="font-medium">Racial Background:</strong> {formData.racial_background}</p>}
                            {formData.racial_background_other && <p className="ml-4 text-sm text-gray-600">- {formData.racial_background_other}</p>}
                            {formData.education_level && <p><strong className="font-medium">Education Level:</strong> {formData.education_level}</p>}
                            {formData.employment_status && <p><strong className="font-medium">Employment Status:</strong> {formData.employment_status}</p>}
                            {formData.employment_status_other && <p className="ml-4 text-sm text-gray-600">- {formData.employment_status_other}</p>}
                            {formData.annual_household_income && <p><strong className="font-medium">Annual Household Income:</strong> {formData.annual_household_income}</p>}
                            {formData.marital_status && <p><strong className="font-medium">Marital Status:</strong> {formData.marital_status}</p>}
                            {formData.location_zip_code && <p><strong className="font-medium">Location Zip Code:</strong> {formData.location_zip_code}</p>}
                            {formData.location_country && <p><strong className="font-medium">Location Country:</strong> {formData.location_country}</p>}
                            {formData.location_area_type && <p><strong className="font-medium">Location Area Type:</strong> {formData.location_area_type}</p>}
                            {formData.location_area_type_other && <p className="ml-4 text-sm text-gray-600">- {formData.location_area_type_other}</p>}
                            {formData.household_composition_total !== null && <p><strong className="font-medium">Household Members:</strong> {formData.household_composition_total}</p>}
                            {formData.household_composition_children !== null && <p><strong className="font-medium">Household Children:</strong> {formData.household_composition_children}</p>}
                            {formData.primary_language_home && <p><strong className="font-medium">Primary Language:</strong> {formData.primary_language_home}</p>}
                            {formData.fluent_languages && <p><strong className="font-medium">Fluent Languages:</strong> {Array.isArray(formData.fluent_languages) ? formData.fluent_languages.join(', ') : formData.fluent_languages}</p>}
                            {formData.fluent_languages_other && <p className="ml-4 text-sm text-gray-600">- {formData.fluent_languages_other}</p>}
                        </div>
                    </div>
                </div>

                {/* Right Column: Stripe Checkout */}
                <div className="lg:w-1/2 mt-10 lg:mt-0">
                    <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-300">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Payment Information</h2>
                        {fees ? (
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-gray-700">
                                    <span>Total Earners Pay:</span>
                                    <span>${fees.gigWorkerFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-700 ml-6">
                                    <span>Estimated Payout per Earner:</span>
                                    <span>${estimatedPayoutPerEarner.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                    <span>Platform Fee:</span>
                                    <span>${fees.platformFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2 mt-2">
                                    <span>Total Amount Due:</span>
                                    <span>${fees.totalFee.toFixed(2)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 my-4">
                                <p>Enter a valid budget and quota to see the fee breakdown.</p>
                            </div>
                        )}
                        <div className="border border-dashed border-gray-400 p-8 text-center text-gray-500">
                            <p>Stripe Payment Elements would be integrated here.</p>
                            <p className="text-sm mt-2">
                                (Requires `@stripe/react-stripe-js` and `@stripe/stripe-js` dependencies)
                            </p>
                        </div>
                        <div className="mt-8">
                            <Button 
                                onClick={handlePaymentSuccess} 
                                className="px-8 py-3 text-lg bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md transition duration-150 ease-in-out"
                                disabled={!fees}
                            >
                                Pay & Launch Campaign
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
}
