
'use client'

import { useRouter } from 'next/navigation';
import { Container } from "@/components/Container";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useCampaignForm } from '@/lib/context/CampaignFormContext';
import { useState, useEffect, useCallback } from 'react';
import { InfoTooltip } from '@/components/InfoTooltip';

export default function ReviewCampaign() {
    const router = useRouter();
    const [maxQuota, setMaxQuota] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { state: formData, dispatch } = useCampaignForm();
    const [errors, setErrors] = useState<{
        totalBudget?: string;
        participantQuota?: string;
    }>({});

    useEffect(() => {
        const fetchMaxQuota = async () => {
            try {
                const response = await fetch('/api/supabase/businesses/max-quota');
                if (!response.ok) {
                    throw new Error('Failed to fetch max quota');
                }
                const data = await response.json();
                setMaxQuota(data.max_quota);
            } catch (error) {
                console.error(error);
                // Set a default or handle the error appropriately
                setMaxQuota(200); 
            } finally {
                setIsLoading(false);
            }
        };

        fetchMaxQuota();
    }, []);

    const validateForm = useCallback(() => {
        if (maxQuota === null) return;

        const newErrors: typeof errors = {};
        const budget = parseFloat(formData.totalBudget);
        if (isNaN(budget) || budget < 0) { // Allow 0 budget
            newErrors.totalBudget = 'Total Budget must be a non-negative number.';
        }
        const quota = parseInt(formData.participantQuota);
        if (isNaN(quota) || quota <= 0) {
            newErrors.participantQuota = 'Participant Quota must be a positive integer.';
        } else if (quota > maxQuota) {
            newErrors.participantQuota = `Our recommended maximum number of participants is ${maxQuota}. 
                For campaigns over ${maxQuota}, please contact us.`;
        }
        setErrors(newErrors);
    }, [formData, maxQuota]);

    useEffect(() => {
        validateForm();
    }, [validateForm]);

    const handlePresetClick = (quota: number) => {
        dispatch({ type: 'UPDATE_FIELD', payload: { name: 'participantQuota', value: quota.toString() } });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let sanitizedValue = value;

        if (name === 'totalBudget') {
            // Allow only numbers and a single decimal point
            sanitizedValue = value.replace(/[^0-9.]/g, '');
            const parts = sanitizedValue.split('.');
            if (parts.length > 2) {
                sanitizedValue = parts[0] + '.' + parts.slice(1).join('');
            }
        } else if (name === 'participantQuota') {
            // Allow only integers
            sanitizedValue = value.replace(/[^0-9]/g, '');
        }

        dispatch({ type: 'UPDATE_FIELD', payload: { name: name as keyof typeof formData, value: sanitizedValue } });
    };

    const createTaskPayload = () => {
        if (Object.values(errors).some(e => e)) {
            return null; // Return null if validation fails
        }

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

        return taskPayload;
    };

    const handleFinalizeAndCheckout = () => {
        const taskPayload = createTaskPayload();
        if (taskPayload) {
            // For now, just redirect to a placeholder checkout page.
            // In a real scenario, you might store taskPayload in context/session storage
            // or pass a campaign ID if it's already saved in DB.
            router.push('/dashboard/business/campaigns/new/checkout');
        }
    };

    const getSurveyStrength = (budget: number, quota: number) => {
        if (isNaN(budget) || isNaN(quota) || quota <= 0) {
            return { message: "Enter budget and quota to see survey strength.", color: "text-gray-500", percentage: 0 };
        }
        const payoutPerParticipant = budget / quota;

        let message = "";
        let color = "";
        let percentage = 0; // For the gauge bar

        // Define max payout for 100% bar width (e.g., $5)
        const maxPayoutForGauge = 5;
        percentage = Math.min((payoutPerParticipant / maxPayoutForGauge) * 100, 100);

        if (budget === 0) {
            message = "Very Low - Free surveys may attract limited participants.";
            color = "text-red-500";
        } else if (payoutPerParticipant < 0.50) {
            message = "Low - May attract some participants, but feedback quality might vary.";
            color = "text-orange-500";
        } else if (payoutPerParticipant >= 0.50 && payoutPerParticipant < 1.50) {
            message = "Medium - Good balance, likely to attract participants.";
            color = "text-yellow-500";
        } else if (payoutPerParticipant >= 1.50 && payoutPerParticipant < 3.00) {
            message = "Good - Strong incentive, likely to attract quality participants.";
            color = "text-green-500";
        } else { // payoutPerParticipant >= 3.00
            message = "Excellent - Very strong incentive, likely to attract highly engaged participants.";
            color = "text-blue-500";
        }

        return { message, color, percentage };
    };

    const surveyStrength = getSurveyStrength(parseFloat(formData.totalBudget), parseInt(formData.participantQuota));

    return (
        <Container className="">
            <div className="mx-auto py-12">
                <h1 className="text-3xl font-bold mb-8">Review and Finalize Campaign</h1>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Campaign Details</h2>
                        <div className="space-y-2">
                            <p className="text-gray-700"><strong className="font-medium">Title:</strong> {formData.campaignTitle}</p>
                            <p className="text-gray-700"><strong className="font-medium">Description:</strong> {formData.campaignDescription}</p>
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
                            <p className="text-gray-600">No questions have been added yet. Please go back to the &apos;Questions&apos; step to add them.</p>
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
                <form className="mt-8 space-y-6 bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">Budget and Quota</h2>
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center mb-2 ">
                                <label htmlFor="totalBudget" className="block text-sm font-semibold text-gray-900">Total Campaign Budget ($)</label>
                                <InfoTooltip text="The total amount you want to spend for this entire campaign. This will be distributed among the participants." />
                            </div>
                            <TextField
                                label=""
                                id="totalBudget"
                                name="totalBudget"
                                type="tel"
                                placeholder=""
                                value={formData.totalBudget}
                                onChange={handleChange}
                                required
                                error={errors.totalBudget}
                                className=""
                                min="1"
                            />
                        </div>
                        <div>
                            <div className="flex items-center mb-2 ">
                                <label htmlFor="participantQuota" className="block text-sm font-semibold text-gray-900">Earner Quota</label>
                                <InfoTooltip text="The maximum number of people you want to participate in this task. The budget per participant will be the Total Budget divided by this number." />
                            </div>
                            <p className="text-sm text-gray-500 mb-2">To ensure high quality and rapid turnaround, our recommended maximum number of participants is {maxQuota}.</p>
                            <TextField
                                label=""
                                id="participantQuota"
                                name="participantQuota"
                                type="tel"
                                min="1"
                                placeholder=""
                                value={formData.participantQuota}
                                onChange={handleChange}
                                required
                                error={errors.participantQuota}
                            />
                            <div className="mt-2 flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Presets:</span>
                                <button type="button" onClick={() => handlePresetClick(50)} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-neutral-500">Pulse Check (50)</button>
                                {maxQuota && maxQuota >= 150 && (
                                    <button type="button" onClick={() => handlePresetClick(150)} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-neutral-500">Validation (150)</button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <Button type="button" onClick={handleFinalizeAndCheckout} className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md transition duration-150 ease-in-out" disabled={Object.values(errors).some(e => e !== undefined)}>
                            Finalize and Checkout
                        </Button>
                    </div>
                </form>
            </div>
        </Container>
    );
}
