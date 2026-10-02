import React from 'react'

/**
 * Reusable statistics display card.
 */
export default function StatCard({ icon, label, value, sub, colorClass = 'text-cyan-400', bgClass = 'bg-cyan-500/10', borderClass = 'border-cyan-500/20' }) {
  return (
    <div className={`glass-card p-5 border ${borderClass} hover:border-opacity-50 transition-all duration-300`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-2xl font-bold tabular-nums ${colorClass} leading-none`}>{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1.5 truncate">{sub}</p>}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center shrink-0`}>
            <span className={`text-xl ${colorClass}`}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  )
}
