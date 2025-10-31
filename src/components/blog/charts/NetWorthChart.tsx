'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface NetWorthChartProps {
  data?: Array<{ month: string; value: number }>
  title?: string
  currency?: boolean
}

export function NetWorthChart({
  data,
  title = 'Net Worth Over Time',
  currency = true
}: NetWorthChartProps) {
  // Default data if none provided
  const chartData = data || [
    { month: 'Jan', value: 100000 },
    { month: 'Feb', value: 120000 },
    { month: 'Mar', value: 120000 },
    { month: 'Apr', value: 140000 },
    { month: 'May', value: 140000 },
    { month: 'Jun', value: 160000 },
    { month: 'Jul', value: 180000 },
  ]

  const formatValue = (value: number) => {
    if (!currency) return value.toString()
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="my-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '0.875rem' }}
          />
          <YAxis
            tickFormatter={formatValue}
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            style={{ fontSize: '0.875rem' }}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
            }}
            labelStyle={{ color: '#111827', fontWeight: 600, marginBottom: '0.25rem' }}
            itemStyle={{ color: '#0d9488' }}
            formatter={(value: number) => [formatValue(value), 'Net Worth']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0d9488"
            strokeWidth={3}
            dot={{ fill: '#FFC107', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, fill: '#FFC107' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
