'use client'

import { BillingSettings } from '@/components/settings/BillingSettings'

export function BillingPageContent() {
    return (
        <div className="p-4 lg:p-8">
            {/* Header */}
            <div className="mb-6 lg:mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Billing</h1>
                <p className="text-gray-600">Manage your subscription and billing settings</p>
            </div>

            {/* Billing Settings */}
            <BillingSettings />
        </div>
    )
}
