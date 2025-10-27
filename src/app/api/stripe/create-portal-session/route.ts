import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-09-30.clover' as any,
})

export async function POST(request: Request) {
    try {
        const supabase = createClient()

        // Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's Stripe customer ID from user_settings
        const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single()

        if (settingsError || !settings?.stripe_customer_id) {
            console.error('Settings error or no customer ID:', { settingsError, settings })
            return NextResponse.json(
                { error: 'No active subscription found' },
                { status: 404 }
            )
        }

        console.log('Creating portal session for customer:', settings.stripe_customer_id)

        // Create Stripe customer portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: settings.stripe_customer_id,
            return_url: `${process.env.APP_URL || process.env.NEXT_PUBLIC_ENV_URL || 'http://localhost:3000'}/dashboard/billing`,
        })

        console.log('Portal session created successfully:', session.url)
        return NextResponse.json({ url: session.url })
    } catch (error) {
        console.error('Error creating portal session:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Error details:', errorMessage)
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        )
    }
}
