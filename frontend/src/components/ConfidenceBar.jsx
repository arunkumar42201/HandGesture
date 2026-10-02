import React from 'react'

/**
 * Confidence progress bar with color-coded levels and animated fill.
 * green >= 85%, yellow >= 60%, red < 60%
 */
export default function ConfidenceBar({ confidence = 0, showLabel = true, size = 'md' }) {
  const pct = Math.round(confidence * 100)

  const color =
    pct >= 85
      ? { bar: 'from-emerald-500 to-green-400', text: 'text-emerald-400', glow: 'shadow-emerald-500/40' }
      : pct >= 60
      ? { bar: 'from-amber-500 to-yellow-400', text: 'text-amber-400', glow: 'shadow-amber-500/40' }
      : { bar: 'from-red-500 to-rose-400', text: 'text-red-400', glow: 'shadow-red-500/40' }

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-400 font-medium">Confidence</span>
          <span className={`text-sm font-bold tabular-nums ${color.text}`}>{pct}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} rounded-full bg-gradient-to-r ${color.bar} progress-fill shadow-sm ${pct > 0 ? color.glow : ''}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}
