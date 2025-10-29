/**
 * API endpoint for Trajectory (FIRE calculator) feature
 * Calculates path to financial independence based on savings rate
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type {
  TrajectoryResponse,
  TrajectoryStatus,
  FIRECalculation,
  TrajectoryScenarios,
  TrajectoryMilestones,
  TrajectoryInsights,
  TrajectoryMilestone,
} from '@/lib/interfaces/trajectory'
import {
  calculateTotalLiabilityPayments,
  calculateTotalInterestExpense,
} from '@/lib/config/growth-rates'

export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters for optional overrides
    const { searchParams } = new URL(request.url)
    const overrideIncome = searchParams.get('income') ? parseFloat(searchParams.get('income')!) : null
    const overrideExpenses = searchParams.get('expenses') ? parseFloat(searchParams.get('expenses')!) : null

    // Get user's age from demographics (for Coast FIRE calculation)
    const { data: demographics } = await supabase
      .from('user_demographics')
      .select('age')
      .eq('user_id', user.id)
      .single()

    const userAge = demographics?.age || null

    // Get current net worth
    const { data: netWorthData, error: netWorthError } = await supabase
      .from('net_worth_snapshots')
      .select('total_assets, total_liabilities')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single()

    if (netWorthError && netWorthError.code !== 'PGRST116') {
      console.error('Error fetching net worth:', netWorthError)
      return NextResponse.json(
        { error: 'Failed to fetch net worth data' },
        { status: 500 }
      )
    }

    const currentNetWorth = netWorthData
      ? netWorthData.total_assets - netWorthData.total_liabilities
      : 0

    // Fetch user's liabilities to calculate monthly debt payments
    const { data: liabilitiesData } = await supabase
      .from('manual_assets')
      .select('current_value, category, loan_term_years, interest_rate')
      .eq('user_id', user.id)
      .eq('entry_type', 'liability')

    // Also fetch Plaid liabilities
    const { data: plaidLiabilities } = await supabase
      .from('plaid_accounts')
      .select('current_balance, subtype')
      .eq('user_id', user.id)
      .in('type', ['credit', 'loan'])
      .eq('is_active', true)

    // Combine all liabilities for payment calculation
    const allLiabilities = [
      ...(liabilitiesData || []).map(l => ({
        balance: l.current_value,
        category: l.category || 'other_liability',
        loan_term_years: l.loan_term_years,
        interest_rate: l.interest_rate,
      })),
      ...(plaidLiabilities || []).map(l => ({
        balance: l.current_balance,
        category: l.subtype || 'other_liability',
        loan_term_years: null, // Use defaults for Plaid accounts
        interest_rate: null,
      }))
    ]

    // Calculate liability payment breakdown
    const monthlyLiabilityPayments = calculateTotalLiabilityPayments(allLiabilities)
    const monthlyInterestExpense = calculateTotalInterestExpense(allLiabilities)
    const monthlyPrincipalPayment = monthlyLiabilityPayments - monthlyInterestExpense

    // Calculate income and expenses from last 90 days of transactions
    let monthlyIncome = overrideIncome || 0
    let monthlyExpenses = overrideExpenses || 0

    // If using override expenses, add ONLY interest (true expense)
    // Principal payments are not expenses - they're transfers that reduce liabilities
    if (overrideExpenses) {
      monthlyExpenses += monthlyInterestExpense
    }

    if (!overrideIncome || !overrideExpenses) {
      // Fetch Plaid transactions for the last 90 days
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      const { data: transactions, error: transError } = await supabase
        .from('plaid_transactions')
        .select('amount, category')
        .eq('user_id', user.id)
        .gte('date', ninetyDaysAgo.toISOString().split('T')[0])

      if (transError && transError.code !== 'PGRST116') {
        console.error('Error fetching transactions:', transError)
      }

      if (transactions && transactions.length > 0) {
        // Calculate monthly averages
        const totalIncome = transactions
          .filter(t => t.amount < 0) // Negative amounts are income in Plaid
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        const totalExpenses = transactions
          .filter(t => t.amount > 0) // Positive amounts are expenses
          .reduce((sum, t) => sum + t.amount, 0)

        // Convert 90-day totals to monthly averages
        monthlyIncome = overrideIncome || (totalIncome / 3)
        monthlyExpenses = overrideExpenses || (totalExpenses / 3)

        // Add ONLY interest expense to monthly expenses
        // Interest is a true expense, but principal payments are transfers that reduce liabilities
        monthlyExpenses += monthlyInterestExpense
      } else {
        // No transaction data available - return informative response
        return NextResponse.json<TrajectoryResponse>({
          current_status: {
            monthly_income: 0,
            monthly_expenses: 0,
            monthly_savings: 0,
            savings_rate: 0,
            current_net_worth: currentNetWorth,
          },
          fire_calculation: {
            annual_expenses: 0,
            fire_number: 0,
            gap: 0,
            progress_percentage: 0,
          },
          projections: {
            base_case: {
              years_to_fire: null,
              months_to_fire: null,
              projected_date: null,
            },
            conservative: {
              years_to_fire: null,
              months_to_fire: null,
              projected_date: null,
            },
            aggressive: {
              years_to_fire: null,
              months_to_fire: null,
              projected_date: null,
            },
          },
          milestones: {
            coast_fire: {
              achieved: false,
              amount: 0,
              label: 'Coast FIRE',
              description: 'Can coast to retirement by 65',
            },
            lean_fire: {
              achieved: false,
              amount: 0,
              label: 'Lean FIRE',
              description: '20x annual expenses',
            },
            fire: {
              achieved: false,
              amount: 0,
              label: 'FIRE',
              description: '25x annual expenses',
            },
            fat_fire: {
              achieved: false,
              amount: 0,
              label: 'Fat FIRE',
              description: '37.5x annual expenses',
            },
          },
          insights: {
            is_on_track: false,
            recommended_savings_rate: 50,
            time_saved_vs_average: 0,
            next_milestone: 'Sync transactions to see your trajectory',
          },
          error: 'No transaction data available. Please sync your accounts or enter income/expenses manually.',
        })
      }
    }

    // Calculate current status
    // Note: monthlyExpenses includes interest but NOT principal
    // However, for cash flow, we need to subtract FULL liability payment (interest + principal)
    const monthlySavings = monthlyIncome - monthlyExpenses - monthlyPrincipalPayment
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0

    const currentStatus: TrajectoryStatus = {
      monthly_income: monthlyIncome,
      monthly_expenses: monthlyExpenses, // True expenses (includes interest, excludes principal)
      monthly_savings: monthlySavings, // After all cash outflows (expenses + principal payments)
      savings_rate: Math.round(savingsRate * 100) / 100,
      current_net_worth: currentNetWorth,
    }

    // Calculate FIRE number (25x annual expenses)
    const annualExpenses = monthlyExpenses * 12
    const fireNumber = annualExpenses * 25
    const gap = Math.max(0, fireNumber - currentNetWorth)
    const progressPercentage = fireNumber > 0 ? (currentNetWorth / fireNumber) * 100 : 0

    const fireCalculation: FIRECalculation = {
      annual_expenses: annualExpenses,
      fire_number: fireNumber,
      gap,
      progress_percentage: Math.min(100, Math.round(progressPercentage * 100) / 100),
    }

    // Call database functions for projections
    const { data: baseProjection } = await supabase.rpc('calculate_trajectory', {
      p_user_id: user.id,
      p_monthly_income: monthlyIncome,
      p_monthly_expenses: monthlyExpenses,
      p_current_net_worth: currentNetWorth,
      p_expected_return: 0.07, // 7% base case
    })

    const { data: scenarios } = await supabase.rpc('calculate_trajectory_scenarios', {
      p_user_id: user.id,
      p_monthly_income: monthlyIncome,
      p_monthly_expenses: monthlyExpenses,
      p_current_net_worth: currentNetWorth,
    })

    // Format projections
    const projections: TrajectoryScenarios = {
      base_case: {
        years_to_fire: baseProjection?.[0]?.years_to_fire || null,
        months_to_fire: baseProjection?.[0]?.months_to_fire || null,
        projected_date: baseProjection?.[0]?.projected_date || null,
      },
      conservative: {
        years_to_fire: scenarios?.[0]?.conservative_years || null,
        months_to_fire: scenarios?.[0]?.conservative_years
          ? Math.round(scenarios[0].conservative_years * 12)
          : null,
        projected_date: scenarios?.[0]?.conservative_date || null,
      },
      aggressive: {
        years_to_fire: scenarios?.[0]?.aggressive_years || null,
        months_to_fire: scenarios?.[0]?.aggressive_years
          ? Math.round(scenarios[0].aggressive_years * 12)
          : null,
        projected_date: scenarios?.[0]?.aggressive_date || null,
      },
    }

    // Calculate milestones
    const { data: milestonesData } = await supabase.rpc('calculate_fire_milestones', {
      p_current_net_worth: currentNetWorth,
      p_annual_expenses: annualExpenses,
      p_age: userAge,
    })

    const milestones: TrajectoryMilestones = {
      coast_fire: {
        achieved: milestonesData?.[0]?.coast_fire_achieved || false,
        amount: milestonesData?.[0]?.coast_fire_amount || 0,
        label: 'Coast FIRE',
        description: 'Can coast to retirement by 65',
      },
      lean_fire: {
        achieved: milestonesData?.[0]?.lean_fire_achieved || false,
        amount: milestonesData?.[0]?.lean_fire_amount || 0,
        label: 'Lean FIRE',
        description: '20x annual expenses (5% withdrawal)',
      },
      fire: {
        achieved: milestonesData?.[0]?.fire_achieved || false,
        amount: milestonesData?.[0]?.fire_amount || 0,
        label: 'FIRE',
        description: '25x annual expenses (4% withdrawal)',
      },
      fat_fire: {
        achieved: milestonesData?.[0]?.fat_fire_achieved || false,
        amount: milestonesData?.[0]?.fat_fire_amount || 0,
        label: 'Fat FIRE',
        description: '37.5x annual expenses (2.67% withdrawal)',
      },
    }

    // Store milestone achievements if newly achieved
    for (const [key, milestone] of Object.entries(milestones)) {
      if (milestone.achieved) {
        await supabase
          .from('trajectory_milestones')
          .upsert({
            user_id: user.id,
            milestone_type: key,
            achieved_at: new Date().toISOString(),
            net_worth_at_achievement: currentNetWorth,
            annual_expenses_at_achievement: annualExpenses,
          }, {
            onConflict: 'user_id,milestone_type',
            ignoreDuplicates: true,
          })
      }
    }

    // Calculate insights
    const isOnTrack = savingsRate >= 30 && projections.base_case.years_to_fire !== null
    const recommendedSavingsRate = 50 // Default recommendation

    // Determine next milestone
    let nextMilestone = null
    if (!milestones.coast_fire.achieved) {
      nextMilestone = 'Coast FIRE'
    } else if (!milestones.lean_fire.achieved) {
      nextMilestone = 'Lean FIRE'
    } else if (!milestones.fire.achieved) {
      nextMilestone = 'FIRE'
    } else if (!milestones.fat_fire.achieved) {
      nextMilestone = 'Fat FIRE'
    } else {
      nextMilestone = 'Already financially independent!'
    }

    const insights: TrajectoryInsights = {
      is_on_track: isOnTrack,
      recommended_savings_rate: recommendedSavingsRate,
      time_saved_vs_average: 0, // TODO: Compare with percentile data
      next_milestone: nextMilestone,
      optimization_suggestions: savingsRate < 20
        ? ['Increase savings rate to accelerate FIRE timeline']
        : undefined,
    }

    // Store snapshot for historical tracking
    await supabase
      .from('trajectory_snapshots')
      .upsert({
        user_id: user.id,
        snapshot_date: new Date().toISOString().split('T')[0],
        monthly_income: monthlyIncome,
        monthly_expenses: monthlyExpenses,
        monthly_savings: monthlySavings,
        savings_rate: savingsRate,
        current_net_worth: currentNetWorth,
        annual_expenses: annualExpenses,
        fire_number: fireNumber,
        years_to_fire: projections.base_case.years_to_fire,
        months_to_fire: projections.base_case.months_to_fire,
        projected_fire_date: projections.base_case.projected_date,
        conservative_years: projections.conservative.years_to_fire,
        aggressive_years: projections.aggressive.years_to_fire,
      }, {
        onConflict: 'user_id,snapshot_date',
      })

    // Return complete response
    const response: TrajectoryResponse = {
      current_status: currentStatus,
      fire_calculation: fireCalculation,
      projections,
      milestones,
      insights,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Trajectory calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate trajectory' },
      { status: 500 }
    )
  }
}