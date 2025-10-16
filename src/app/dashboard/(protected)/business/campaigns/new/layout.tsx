'use client'

import { CampaignFormProvider, useCampaignForm } from '@/lib/context/CampaignFormContext';
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

function CampaignFormChecker({ children }: { children: React.ReactNode }) {
    const { state: campaignFormState } = useCampaignForm();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const isNewCampaignPage = pathname === '/dashboard/business/campaigns/new';

        // Only redirect if not on the initial new campaign page AND title/description are missing
        if (!isNewCampaignPage && (!campaignFormState.campaignTitle || !campaignFormState.campaignDescription)) {
            router.replace('/dashboard/business/campaigns/new');
        }
    }, [campaignFormState.campaignTitle, campaignFormState.campaignDescription, pathname, router]);

    return <>{children}</>;
}

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
    return (
        <CampaignFormProvider>
            <CampaignFormChecker>
                {children}
            </CampaignFormChecker>
        </CampaignFormProvider>
    );
}
