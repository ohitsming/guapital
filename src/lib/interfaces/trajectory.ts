/**
 * TypeScript interfaces for the Trajectory feature
 * Calculates path to financial independence based on savings rate and 25x expenses rule
 */

/**
 * Current financial status metrics
 */
export interface TrajectoryStatus {
  monthly_income: number
  monthly_expenses: number
  monthly_savings: number
  savings_rate: number // Percentage (0-100)
  current_net_worth: number
}

/**
 * FIRE calculation details
 */
export interface FIRECalculation {
  annual_expenses: number
  fire_number: number // 25x annual expenses
  gap: number // fire_number - current_net_worth
  progress_percentage: number // (current_net_worth / fire_number) * 100
}

/**
 * Projection for a single scenario
 */
export interface TrajectoryProjection {
  years_to_fire: number | null
  months_to_fire: number | null
  projected_date: string | null
  monthly_savings_required?: number // Optional, for target scenarios
}

/**
 * Multiple scenario projections (conservative, base, aggressive)
 */
export interface TrajectoryScenarios {
  base_case: TrajectoryProjection // 7% return
  conservative: TrajectoryProjection // 5% return
  aggressive: TrajectoryProjection // 9% return
}

/**
 * FIRE milestone definition
 */
export interface TrajectoryMilestone {
  achieved: boolean
  amount: number
  label: string
  description: string
  icon?: string // Optional icon identifier
}

/**
 * Collection of FIRE milestones
 */
export interface TrajectoryMilestones {
  coast_fire: TrajectoryMilestone // Can coast to retirement by 65
  lean_fire: TrajectoryMilestone // 20x expenses (5% withdrawal)
  fire: TrajectoryMilestone // 25x expenses (4% withdrawal)
  fat_fire: TrajectoryMilestone // 37.5x expenses (2.67% withdrawal)
}

/**
 * Insights and recommendations
 */
export interface TrajectoryInsights {
  is_on_track: boolean // Based on age and typical retirement goals
  recommended_savings_rate: number // Percentage to reach FIRE by 50
  time_saved_vs_average: number // Months ahead/behind 50th percentile
  next_milestone: string | null // Next achievable milestone
  optimization_suggestions?: string[] // Optional improvement suggestions
}

/**
 * Main response from the Trajectory API endpoint
 */
export interface TrajectoryResponse {
  current_status: TrajectoryStatus
  fire_calculation: FIRECalculation
  projections: TrajectoryScenarios
  milestones: TrajectoryMilestones
  insights: TrajectoryInsights
  error?: string // Error message if calculation fails
}

/**
 * Historical trajectory snapshot
 */
export interface TrajectorySnapshot {
  id?: string
  user_id?: string
  snapshot_date: string
  monthly_income: number
  monthly_expenses: number
  monthly_savings: number
  savings_rate: number
  current_net_worth: number
  annual_expenses: number
  fire_number: number
  years_to_fire: number | null
  months_to_fire: number | null
  projected_fire_date: string | null
  conservative_years: number | null
  aggressive_years: number | null
  created_at?: string
}

/**
 * Historical trajectory data with trends
 */
export interface TrajectoryHistory {
  snapshots: TrajectorySnapshot[]
  trends: {
    savings_rate_change_30d: number // Percentage point change
    fire_date_shift_30d: number // Days earlier (positive) or later (negative)
    net_worth_growth_30d: number // Dollar amount change
    progress_change_30d: number // Percentage point change toward FIRE
  }
}

/**
 * What-if simulation request
 */
export interface TrajectorySimulation {
  monthly_income: number
  monthly_expenses: number
  current_net_worth?: number // Optional, defaults to actual
  expected_return?: number // Optional, defaults to 0.07 (7%)
}

/**
 * Milestone achievement record
 */
export interface MilestoneAchievement {
  id: string
  user_id: string
  milestone_type: 'coast_fire' | 'lean_fire' | 'fire' | 'fat_fire'
  achieved_at: string
  net_worth_at_achievement: number
  annual_expenses_at_achievement: number
  created_at: string
}

/**
 * Chart data point for visualization
 */
export interface TrajectoryChartPoint {
  date: string
  value: number
  label?: string
  projected?: boolean // True for future projections
}

/**
 * Chart data for Recharts visualization
 */
export interface TrajectoryChartData {
  historical: TrajectoryChartPoint[]
  projected: {
    conservative: TrajectoryChartPoint[]
    base: TrajectoryChartPoint[]
    aggressive: TrajectoryChartPoint[]
  }
  milestones: TrajectoryChartPoint[] // Milestone markers
}

/**
 * Type guards
 */
export const isTrajectoryError = (response: TrajectoryResponse): boolean => {
  return !!response.error
}

export const isFinanciallyIndependent = (response: TrajectoryResponse): boolean => {
  return response.milestones.fire.achieved
}

export const hasPositiveSavingsRate = (status: TrajectoryStatus): boolean => {
  return status.savings_rate > 0
}

/**
 * Utility functions
 */
export const formatYearsToFire = (years: number | null): string => {
  if (years === null) return 'N/A'
  if (years === 0) return 'Already FI!'
  if (years < 1) {
    const months = Math.round(years * 12)
    return `${months} ${months === 1 ? 'month' : 'months'}`
  }
  const rounded = Math.round(years * 10) / 10
  return `${rounded} ${rounded === 1 ? 'year' : 'years'}`
}

export const formatSavingsRate = (rate: number): string => {
  return `${Math.round(rate)}%`
}

export const getMilestoneIcon = (type: string): string => {
  const icons: Record<string, string> = {
    coast_fire: '⛵', // Sailboat for coasting
    lean_fire: '🎯', // Target for lean/minimal
    fire: '🔥', // Fire for standard FIRE
    fat_fire: '👑', // Crown for luxury
  }
  return icons[type] || '🎯'
}

export const getMilestoneColor = (achieved: boolean): string => {
  return achieved ? 'text-amber-500' : 'text-gray-400'
}