import React from 'react'
import ConfidenceBar from './ConfidenceBar'

/**
 * Gesture information card for the /gestures page.
 */
export default function GestureCard({ gesture }) {
  const { name, emoji, description, posture, typical_confidence, label } = gesture

  return (
    <div className="glass-card p-5 flex flex-col gap-4 hover:border-cyan-500/30 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan-500/5">
      {/* Emoji + Name */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl
                        group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-all duration-300 shrink-0">
          {emoji}
        </div>
        <div>
          <h3 className="font-bold text-slate-100 text-lg leading-tight">{name}</h3>
          <span className="badge-info text-xs mt-1">{label}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>

      {/* Posture tip */}
      <div className="flex items-start gap-2 bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
        <span className="text-cyan-500 mt-0.5 shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <p className="text-slate-400 text-xs leading-relaxed">{posture}</p>
      </div>

      {/* Typical confidence */}
      <div>
        <ConfidenceBar confidence={typical_confidence} size="sm" />
        <p className="text-xs text-slate-500 mt-1">Typical model confidence</p>
      </div>
    </div>
  )
}
