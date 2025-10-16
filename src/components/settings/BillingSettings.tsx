'use client';

import { Button } from '@/components/Button';

export default function BillingSettings() {
    return (
        <div className="bg-white p-8 rounded-lg shadow-md border border-neutral-200">
            <h2 className="text-2xl font-semibold mb-6">Billing</h2>
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-medium">Current Plan</h3>
                    <p className="text-gray-600">You are currently on the <span className="font-semibold">Free Plan</span>.</p>
                </div>
                <div>
                    <h3 className="text-lg font-medium">Payment Methods</h3>
                    <p className="text-gray-600">No payment methods on file.</p>
                    <Button type="button" className="mt-2">Add Payment Method</Button>
                </div>
            </div>
        </div>
    );
}
