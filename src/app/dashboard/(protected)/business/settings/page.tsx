'use client';

import { useState } from 'react';
import { Container } from '@/components/Container';
import Tabs from '@/components/Tabs';
import AccountSettings from '@/components/settings/AccountSettings';
import BusinessProfileSettings from '@/components/settings/BusinessProfileSettings';
import BillingSettings from '@/components/settings/BillingSettings';

export default function BusinessSettingsPage() {
    const [activeTab, setActiveTab] = useState('account');

    const tabs = [
        { id: 'account', name: 'Your Account' },
        { id: 'profile', name: 'Business Profile' },
        { id: 'billing', name: 'Billing' },
    ];

    return (
        <Container>
            <div className="py-5">
                <h1 className="text-3xl font-bold mb-8">Settings</h1>

                <Tabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />

                <div>
                    {activeTab === 'account' && <AccountSettings />}
                    {activeTab === 'profile' && <BusinessProfileSettings />}
                    {activeTab === 'billing' && <BillingSettings />}
                </div>
            </div>
        </Container>
    );
}