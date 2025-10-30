import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * PATCH /api/assets/[id]/loan-details
 * Update projection config (growth rate, loan term, monthly contribution) for an account
 * Stores in separate account_projection_config table for clean architecture
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { loan_term_years, interest_rate, monthly_contribution } = body

    // Validate inputs
    if (loan_term_years !== undefined && loan_term_years !== null) {
      if (typeof loan_term_years !== 'number' || loan_term_years < 0 || loan_term_years > 50) {
        return NextResponse.json(
          { error: 'loan_term_years must be a number between 0 and 50' },
          { status: 400 }
        )
      }
    }

    if (interest_rate !== undefined && interest_rate !== null) {
      if (typeof interest_rate !== 'number' || interest_rate < -1 || interest_rate > 1) {
        return NextResponse.json(
          { error: 'interest_rate must be a number between -1 and 1 (decimal format)' },
          { status: 400 }
        )
      }
    }

    if (monthly_contribution !== undefined && monthly_contribution !== null) {
      if (typeof monthly_contribution !== 'number' || monthly_contribution < 0) {
        return NextResponse.json(
          { error: 'monthly_contribution must be a non-negative number' },
          { status: 400 }
        )
      }
    }

    // Determine account source by checking which table contains this ID
    let accountSource: 'manual_assets' | 'plaid_accounts' | 'crypto_wallets' | null = null

    // Check manual_assets
    const { data: manualAsset } = await supabase
      .from('manual_assets')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (manualAsset) {
      accountSource = 'manual_assets'
    } else {
      // Check plaid_accounts
      const { data: plaidAccount } = await supabase
        .from('plaid_accounts')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (plaidAccount) {
        accountSource = 'plaid_accounts'
      } else {
        // Check crypto_wallets
        const { data: cryptoWallet } = await supabase
          .from('crypto_wallets')
          .select('id')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (cryptoWallet) {
          accountSource = 'crypto_wallets'
        }
      }
    }

    if (!accountSource) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Upsert projection config
    const { data: config, error: upsertError } = await supabase
      .from('account_projection_config')
      .upsert({
        user_id: user.id,
        account_id: id,
        account_source: accountSource,
        custom_growth_rate: interest_rate !== undefined ? interest_rate : null,
        custom_loan_term_years: loan_term_years !== undefined ? loan_term_years : null,
        monthly_contribution: monthly_contribution !== undefined ? monthly_contribution : null,
        scenario_name: 'default',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,account_id,account_source,scenario_name'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error upserting projection config:', upsertError)
      return NextResponse.json(
        { error: 'Failed to update projection config' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      config,
      account_source: accountSource
    })

  } catch (error) {
    console.error('Projection config update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
