'use client'

import { Tabs, Tab } from '@/components/ui/Tabs'
import { ProfileSettings } from './ProfileSettings'
import { BillingSettings } from './BillingSettings'
import { PrivacySettings } from './PrivacySettings'
import { UserCircleIcon, CreditCardIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

const settingsTabs: Tab[] = [
    {
        id: 'profile',
        label: 'Profile',
        icon: UserCircleIcon,
    },
    {
        id: 'billing',
        label: 'Billing',
        icon: CreditCardIcon,
    },
    {
        id: 'privacy',
        label: 'Privacy',
        icon: ShieldCheckIcon,
    },
]

export function SettingsPageContent() {
    return (
        <div className="p-4 lg:p-8">
            {/* Header */}
            <div className="mb-6 lg:mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Manage your account settings, subscription, and privacy preferences</p>
            </div>

            {/* Tabs */}
            <Tabs tabs={settingsTabs} defaultTab="profile">
                {(activeTab) => (
                    <>
                        {activeTab === 'profile' && <ProfileSettings />}
                        {activeTab === 'billing' && <BillingSettings />}
                        {activeTab === 'privacy' && <PrivacySettings />}
                    </>
                )}
            </Tabs>
        </div>
    )
}
