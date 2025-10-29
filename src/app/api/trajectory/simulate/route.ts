/**
 * API endpoint for Trajectory what-if simulations
 * Allows users to test different income/expense scenarios
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type {
  TrajectorySimulation,
  TrajectoryResponse,
  TrajectoryStatus,
  FIRECalculation,
  TrajectoryScenarios,
  TrajectoryMilestones,
  TrajectoryInsights,
} from '@/lib/interfaces/trajectory'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body: TrajectorySimulation = await request.json()
    const { monthly_income, monthly_expenses, current_net_worth, expected_return = 0.07 } = body

    // Validate inputs
    if (monthly_income < 0 || monthly_expenses < 0) {
      return NextResponse.json(
        { error: 'Income and expenses must be positive values' },
        { status: 400 }
      )
    }

    if (expected_return < 0 || expected_return > 0.20) {
      return NextResponse.json(
        { error: 'Expected return must be between 0% and 20%' },
        { status: 400 }
      )
    }

    // Get actual current net worth if not provided
    let netWorth = current_net_worth
    if (netWorth === undefined) {
      const { data: netWorthData } = await supabase
        .from('net_worth_snapshots')
        .select('total_assets, total_liabilities')
        .eq('user_id', user.id)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single()

      netWorth = netWorthData
        ? netWorthData.total_assets - netWorthData.total_liabilities
        : 0
    }

    // Get user's age for Coast FIRE calculation
    const { data: demographics } = await supabase
      .from('user_demographics')
      .select('age')
      .eq('user_id', user.id)
      .single()

    const userAge = demographics?.age || null

    // Calculate current status
    const monthlySavings = monthly_income - monthly_expenses
    const savingsRate = monthly_income > 0 ? (monthlySavings / monthly_income) * 100 : 0

    const currentStatus: TrajectoryStatus = {
      monthly_income,
      monthly_expenses,
      monthly_savings: monthlySavings,
      savings_rate: Math.round(savingsRate * 100) / 100,
      current_net_worth: netWorth,
    }

    // Calculate FIRE number
    const annualExpenses = monthly_expenses * 12
    const fireNumber = annualExpenses * 25
    const gap = Math.max(0, fireNumber - netWorth)
    const progressPercentage = fireNumber > 0 ? (netWorth / fireNumber) * 100 : 0

    const fireCalculation: FIRECalculation = {
      annual_expenses: annualExpenses,
      fire_number: fireNumber,
      gap,
      progress_percentage: Math.min(100, Math.round(progressPercentage * 100) / 100),
    }

    // Calculate projections with custom return rate
    const { data: baseProjection } = await supabase.rpc('calculate_trajectory', {
      p_user_id: user.id,
      p_monthly_income: monthly_income,
      p_monthly_expenses: monthly_expenses,
      p_current_net_worth: netWorth,
      p_expected_return: expected_return,
    })

    // Calculate conservative and aggressive scenarios
    const { data: conservativeProjection } = await supabase.rpc('calculate_trajectory', {
      p_user_id: user.id,
      p_monthly_income: monthly_income,
      p_monthly_expenses: monthly_expenses,
      p_current_net_worth: netWorth,
      p_expected_return: Math.max(0, expected_return - 0.02), // 2% lower
    })

    const { data: aggressiveProjection } = await supabase.rpc('calculate_trajectory', {
      p_user_id: user.id,
      p_monthly_income: monthly_income,
      p_monthly_expenses: monthly_expenses,
      p_current_net_worth: netWorth,
      p_expected_return: Math.min(0.20, expected_return + 0.02), // 2% higher
    })

    // Format projections
    const projections: TrajectoryScenarios = {
      base_case: {
        years_to_fire: baseProjection?.[0]?.years_to_fire || null,
        months_to_fire: baseProjection?.[0]?.months_to_fire || null,
        projected_date: baseProjection?.[0]?.projected_date || null,
      },
      conservative: {
        years_to_fire: conservativeProjection?.[0]?.years_to_fire || null,
        months_to_fire: conservativeProjection?.[0]?.months_to_fire || null,
        projected_date: conservativeProjection?.[0]?.projected_date || null,
      },
      aggressive: {
        years_to_fire: aggressiveProjection?.[0]?.years_to_fire || null,
        months_to_fire: aggressiveProjection?.[0]?.months_to_fire || null,
        projected_date: aggressiveProjection?.[0]?.projected_date || null,
      },
    }

    // Calculate milestones
    const { data: milestonesData } = await supabase.rpc('calculate_fire_milestones', {
      p_current_net_worth: netWorth,
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
        description: '20x annual expenses',
      },
      fire: {
        achieved: milestonesData?.[0]?.fire_achieved || false,
        amount: milestonesData?.[0]?.fire_amount || 0,
        label: 'FIRE',
        description: '25x annual expenses',
      },
      fat_fire: {
        achieved: milestonesData?.[0]?.fat_fire_achieved || false,
        amount: milestonesData?.[0]?.fat_fire_amount || 0,
        label: 'Fat FIRE',
        description: '37.5x annual expenses',
      },
    }

    // Calculate insights
    const isOnTrack = savingsRate >= 30 && projections.base_case.years_to_fire !== null

    // Calculate recommended savings rate for FIRE by 50
    const yearsToFifty = userAge ? Math.max(0, 50 - userAge) : 20
    let recommendedSavingsRate = 50

    if (yearsToFifty > 0 && fireNumber > netWorth) {
      // Simplified calculation for recommended savings rate
      const requiredMonthlySavings = (fireNumber - netWorth) / (yearsToFifty * 12)
      recommendedSavingsRate = monthly_income > 0
        ? Math.min(90, Math.round((requiredMonthlySavings / monthly_income) * 100))
        : 50
    }

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

    // Generate optimization suggestions
    const suggestions: string[] = []
    if (savingsRate < 20) {
      suggestions.push('Increase savings rate to at least 20% to accelerate FIRE')
    }
    if (savingsRate < recommendedSavingsRate) {
      suggestions.push(`Target ${recommendedSavingsRate}% savings rate to reach FIRE by 50`)
    }
    if (monthly_expenses > monthly_income * 0.5) {
      suggestions.push('Consider reducing expenses to improve savings rate')
    }

    const insights: TrajectoryInsights = {
      is_on_track: isOnTrack,
      recommended_savings_rate: recommendedSavingsRate,
      time_saved_vs_average: 0, // TODO: Compare with percentile data
      next_milestone: nextMilestone,
      optimization_suggestions: suggestions.length > 0 ? suggestions : undefined,
    }

    // Return simulated response
    const response: TrajectoryResponse = {
      current_status: currentStatus,
      fire_calculation: fireCalculation,
      projections,
      milestones,
      insights,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Trajectory simulation error:', error)
    return NextResponse.json(
      { error: 'Failed to simulate trajectory' },
      { status: 500 }
    )
  }
}