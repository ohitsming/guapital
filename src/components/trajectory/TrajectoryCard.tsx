'use client'

import { useEffect, useState } from 'react'
import { apiGet } from '@/utils/api'
import {
  FireIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  SparklesIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import type {
  TrajectoryResponse,
  TrajectoryMilestone,
} from '@/lib/interfaces/trajectory'

/**
 * Trajectory Card Component
 * Displays FIRE calculator results in the dashboard
 * Requires Premium subscription (transactionHistory feature)
 */
export default function TrajectoryCard() {
  const [trajectory, setTrajectory] = useState<TrajectoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchTrajectory()
  }, [])

  const fetchTrajectory = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiGet('/api/trajectory')

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch trajectory data')
      }

      const data: TrajectoryResponse = await response.json()
      setTrajectory(data)

      // Auto-expand if user has no transaction data
      if (data.error) {
        setExpanded(true)
      }
    } catch (err) {
      console.error('Error fetching trajectory:', err)
      setError(err instanceof Error ? err.message : 'Failed to load trajectory')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatYears = (years: number | null): string => {
    if (years === null) return 'N/A'
    if (years === 0) return 'Already FI!'
    if (years < 1) {
      const months = Math.round(years * 12)
      return `${months} ${months === 1 ? 'month' : 'months'}`
    }
    const rounded = Math.round(years * 10) / 10
    return `${rounded} ${rounded === 1 ? 'year' : 'years'}`
  }

  const getMilestoneIcon = (type: string): JSX.Element => {
    const icons: Record<string, JSX.Element> = {
      coast_fire: <span className="text-lg">⛵</span>,
      lean_fire: <span className="text-lg">🎯</span>,
      fire: <span className="text-lg">🔥</span>,
      fat_fire: <span className="text-lg">👑</span>,
    }
    return icons[type] || <span className="text-lg">🎯</span>
  }

  const renderMilestone = (key: string, milestone: TrajectoryMilestone) => {
    return (
      <div
        key={key}
        className={`flex items-center justify-between p-2 rounded-lg ${
          milestone.achieved
            ? 'bg-amber-500/20 border border-amber-500/30'
            : 'bg-white/5 border border-white/10'
        }`}
      >
        <div className="flex items-center gap-2">
          {getMilestoneIcon(key)}
          <div>
            <div className="text-sm font-medium">{milestone.label}</div>
            <div className="text-xs opacity-75">{milestone.description}</div>
          </div>
        </div>
        <div className={`text-sm font-bold ${milestone.achieved ? 'text-amber-400' : 'opacity-50'}`}>
          {milestone.achieved ? '✓' : formatCurrency(milestone.amount)}
        </div>
      </div>
    )
  }

  // Hide panel if user doesn't have Premium (no transaction data available)
  if (!loading && trajectory?.error && trajectory.error.includes('No transaction data')) {
    return (
      <div className="bg-gradient-to-br from-[#004D40] to-[#00695C] rounded-xl p-4 shadow-md text-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            <RocketLaunchIcon className="w-5 h-5" />
            Trajectory
          </h2>
          <span className="text-xs bg-amber-500/20 px-2 py-1 rounded-full text-amber-400">
            Premium
          </span>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <p className="text-sm opacity-90 mb-2">
            Track your path to financial independence
          </p>
          <p className="text-xs opacity-75">
            Sync your accounts to see when you can retire based on your current savings rate.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-[#004D40] to-[#00695C] rounded-xl p-4 shadow-md text-white">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <RocketLaunchIcon className="w-5 h-5" />
          Trajectory
        </h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs opacity-75 hover:opacity-100 transition-opacity"
        >
          <InformationCircleIcon className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="h-8 w-32 bg-white/20 rounded mb-2"></div>
            <div className="h-4 w-24 bg-white/20 rounded"></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/10 rounded-lg p-2">
                <div className="h-3 w-16 bg-white/20 rounded mb-1"></div>
                <div className="h-5 w-20 bg-white/20 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-3 border border-red-500/30">
          <p className="text-sm">{error}</p>
        </div>
      ) : trajectory ? (
        <>
          {/* Main FIRE projection */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {formatYears(trajectory.projections.base_case.years_to_fire)}
                </div>
                <div className="text-sm opacity-90">to Financial Independence</div>
                {trajectory.projections.base_case.projected_date && (
                  <div className="text-xs opacity-75 mt-1">
                    Target: {new Date(trajectory.projections.base_case.projected_date).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                )}
              </div>
              <FireIcon className="w-8 h-8 text-amber-400" />
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>{formatCurrency(trajectory.current_status.current_net_worth)}</span>
                <span>{formatCurrency(trajectory.fire_calculation.fire_number)}</span>
              </div>
              <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-500 h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, trajectory.fire_calculation.progress_percentage)}%`
                  }}
                />
              </div>
              <div className="text-center text-xs mt-1 opacity-75">
                {trajectory.fire_calculation.progress_percentage.toFixed(1)}% to FIRE
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
              <div className="text-xs opacity-75">Savings Rate</div>
              <div className="text-lg font-bold">
                {trajectory.current_status.savings_rate.toFixed(0)}%
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
              <div className="text-xs opacity-75">Monthly</div>
              <div className="text-lg font-bold">
                {formatCurrency(trajectory.current_status.monthly_savings)}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
              <div className="text-xs opacity-75">FIRE #</div>
              <div className="text-lg font-bold">
                {trajectory.fire_calculation.fire_number > 1000000
                  ? `$${(trajectory.fire_calculation.fire_number / 1000000).toFixed(1)}M`
                  : formatCurrency(trajectory.fire_calculation.fire_number)}
              </div>
            </div>
          </div>

          {/* Scenarios */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:bg-white/15 transition-colors"
          >
            <span className="text-sm font-medium flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4" />
              Scenarios & Milestones
            </span>
            {expanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3 animate-in slide-in-from-top duration-300">
              {/* Scenarios */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-xs font-medium mb-2 opacity-75">Market Return Scenarios</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs opacity-75">Conservative (5%)</span>
                    <span className="text-sm font-bold">
                      {formatYears(trajectory.projections.conservative.years_to_fire)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs opacity-75">Base Case (7%)</span>
                    <span className="text-sm font-bold text-amber-400">
                      {formatYears(trajectory.projections.base_case.years_to_fire)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs opacity-75">Aggressive (9%)</span>
                    <span className="text-sm font-bold">
                      {formatYears(trajectory.projections.aggressive.years_to_fire)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <div className="text-xs font-medium opacity-75">FIRE Milestones</div>
                {Object.entries(trajectory.milestones).map(([key, milestone]) =>
                  renderMilestone(key, milestone)
                )}
              </div>

              {/* Insights */}
              {trajectory.insights.optimization_suggestions && (
                <div className="bg-amber-500/10 backdrop-blur-sm rounded-lg p-3 border border-amber-500/30">
                  <div className="flex items-start gap-2">
                    <SparklesIcon className="w-4 h-4 text-amber-400 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-amber-400 mb-1">Suggestions</div>
                      {trajectory.insights.optimization_suggestions.map((suggestion, i) => (
                        <p key={i} className="text-xs opacity-90">
                          {suggestion}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}

      {/* Info modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#004D40] rounded-xl p-6 max-w-md w-full text-white">
            <h3 className="text-lg font-bold mb-3">About Trajectory</h3>
            <div className="space-y-3 text-sm opacity-90">
              <p>
                Trajectory calculates your path to financial independence using the 25x rule:
                save 25 times your annual expenses to retire safely.
              </p>
              <p>
                Based on your current savings rate and net worth, we project when you&apos;ll reach
                different FIRE milestones.
              </p>
              <div className="space-y-2 mt-4">
                <div className="flex gap-2">
                  <span>⛵</span>
                  <div>
                    <div className="font-medium">Coast FIRE</div>
                    <div className="text-xs opacity-75">No more contributions needed</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span>🎯</span>
                  <div>
                    <div className="font-medium">Lean FIRE</div>
                    <div className="text-xs opacity-75">20x expenses (frugal retirement)</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span>🔥</span>
                  <div>
                    <div className="font-medium">FIRE</div>
                    <div className="text-xs opacity-75">25x expenses (4% withdrawal rate)</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span>👑</span>
                  <div>
                    <div className="font-medium">Fat FIRE</div>
                    <div className="text-xs opacity-75">37.5x expenses (luxury retirement)</div>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="mt-4 w-full bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}