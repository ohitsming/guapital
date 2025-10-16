'use client'

import { useRouter } from 'next/navigation';
import { Container } from "@/components/Container";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useCampaignForm } from '@/lib/context/CampaignFormContext';

export default function NewCampaign() {
    const router = useRouter();
    const { state: formData, dispatch } = useCampaignForm();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        dispatch({ type: 'UPDATE_FIELD', payload: { name: name as keyof typeof formData, value } });
        
    };

    

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // For now, just log and navigate. In a real app, you'd send this to an API.
        router.push('/dashboard/business/campaigns/new/questions'); // Navigate to the next step
    };

    return (
        <Container className="">
            <div className="mx-auto py-12">
                <h1 className="text-3xl font-bold mb-8">Create New Campaign</h1>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <TextField
                            label="Campaign Title"
                            id="campaignTitle"
                            name="campaignTitle"
                            type="text"
                            placeholder="e.g., Product Feedback Survey"
                            value={formData.campaignTitle}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            label="Campaign Description"
                            id="campaignDescription"
                            name="campaignDescription"
                            type="textarea"
                            placeholder="e.g., We are a new coffee shop in downtown and want to understand what drinks and food items are most popular with local residents."
                            rows={4}
                            value={formData.campaignDescription}
                            onChange={handleChange}
                            required
                            description="Provide context so earners can give thoughtful feedback. Briefly explain your business/idea and what you hope to learn from their answers."
                        />
                        
                    </div>
                    <div className="mt-8">
                        <Button type="submit" disabled={!formData.campaignTitle || !formData.campaignDescription}>
                            Next
                        </Button>
                    </div>
                </form>
            </div>
        </Container>
    );
}
