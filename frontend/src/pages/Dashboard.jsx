import React, { useEffect, useState } from 'react'
import { getStatistics } from '../services/api'
import StatCard from '../components/StatCard'
import { GestureDistributionChart, GestureBarChart, ConfidenceTrendChart } from '../components/Charts'
import { PageLoader } from '../components/LoadingSpinner'
import { useToast } from '../components/Toast'

const REFRESH_MS = 30000

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentPredictions, setRecentPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const toast = useToast()

  const loadStats = async (silent = false) => {
    try {
      const data = await getStatistics()
      setStats(data)
      setRecentPredictions(data.recent_predictions || [])
      setLastRefresh(new Date())
    } catch (err) {
      if (!silent) toast.error('Failed to load statistics: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    const interval = setInterval(() => loadStats(true), REFRESH_MS)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <PageLoader message="Loading dashboard..." />

  const statCards = [
    {
      icon: '🎯', label: 'Total Predictions',
      value: stats?.total_predictions?.toLocaleString() ?? '0',
      colorClass: 'text-cyan-400', bgClass: 'bg-cyan-500/10', borderClass: 'border-cyan-500/20',
    },
    {
      icon: '🏆', label: 'Most Recognized',
      value: stats?.most_recognized_gesture ?? 'N/A',
      sub: stats?.most_recognized_count ? `${stats.most_recognized_count} times` : undefined,
      colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20',
    },
    {
      icon: '📈', label: 'Avg Confidence',
      value: `${stats?.average_confidence ?? 0}%`,
      colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20',
    },
    {
      icon: '📱', label: 'Total Sessions',
      value: stats?.total_sessions?.toLocaleString() ?? '0',
      colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/20',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Analytics and recognition statistics</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-slate-500 hidden sm:block">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button onClick={() => loadStats()} className="btn-secondary text-sm py-2">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="font-semibold text-slate-200 mb-4">Gesture Distribution</h2>
          <GestureDistributionChart data={stats?.gesture_distribution ?? []} />
        </div>
        <div className="glass-card p-6">
          <h2 className="font-semibold text-slate-200 mb-4">Prediction Count by Gesture</h2>
          <GestureBarChart data={stats?.gesture_distribution ?? []} />
        </div>
      </div>

      {/* Confidence trend */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-slate-200 mb-4">Recent Confidence Trend</h2>
        <ConfidenceTrendChart data={recentPredictions} />
      </div>

      {/* Recent predictions table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="font-semibold text-slate-200">Recent Predictions</h2>
        </div>
        {recentPredictions.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No predictions yet — start the recognition session.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Gesture</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Confidence</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Session</th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentPredictions.map((p) => (
                  <tr key={p.id} className="table-row-hover">
                    <td className="px-6 py-3 text-sm font-medium text-slate-200">{p.gesture}</td>
                    <td className="px-6 py-3">
                      <span className={`text-sm font-semibold tabular-nums ${
                        p.confidence >= 85 ? 'text-emerald-400' : p.confidence >= 60 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {p.confidence}%
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500 font-mono truncate max-w-[120px]">{p.session_id}</td>
                    <td className="px-6 py-3 text-xs text-slate-500">
                      {p.timestamp ? new Date(p.timestamp).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
