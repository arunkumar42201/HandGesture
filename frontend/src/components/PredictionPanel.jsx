import React, { forwardRef } from 'react'
import ConfidenceBar from './ConfidenceBar'

const GESTURE_EMOJIS = {
  'Hello': '👋', 'Thumbs Up': '👍', 'Thumbs Down': '👎',
  'Victory': '✌️', 'Fist': '✊', 'Open Palm': '✋',
  'Pointing': '☝️', 'Two Fingers': '🤞', 'OK': '👌', 'Love': '🤟',
  'No Hand Detected': '🚫', 'Uncertain': '❓', 'Model Unavailable': '⚠️',
}

const STATUS_STYLES = {
  idle:    'text-slate-500',
  success: 'text-emerald-400',
  error:   'text-red-400',
}

/**
 * Main prediction display panel for the Recognition page.
 */
const PredictionPanel = forwardRef(function PredictionPanel({ result, recentPredictions, wsConnected, wsReconnecting }, ref) {
  const {
    gesture,
    confidence,
    handDetected,
    probabilities,
    fps,
    status,
    message,
  } = result

  const isRecognizing = !!gesture && gesture !== 'idle'
  const isPositive = handDetected && gesture && !['No Hand Detected', 'Uncertain', 'Processing Error', 'Model Unavailable', 'No Frame', 'Decode Error'].includes(gesture)
  const emoji = GESTURE_EMOJIS[gesture] || '🔍'

  const fmtConf = (c) => `${Math.round(c * 100)}%`

  return (
    <div className="flex flex-col gap-4" ref={ref}>
      {/* Connection status */}
      <div className="flex items-center gap-2">
        {wsConnected ? (
          <span className="badge-success">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 record-dot" /> WebSocket Connected
          </span>
        ) : wsReconnecting ? (
          <span className="badge-warning">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Reconnecting...
          </span>
        ) : (
          <span className="badge-error">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Disconnected
          </span>
        )}
        {fps > 0 && (
          <span className="badge-info ml-auto">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {fps.toFixed(1)} FPS
          </span>
        )}
      </div>

      {/* Main gesture display */}
      <div className={`glass-card p-6 text-center transition-all duration-300 ${
        isPositive ? 'border-cyan-500/30 glow-cyan' : 'border-slate-700/50'
      }`}>
        <div className={`text-7xl mb-3 transition-all duration-300 ${isPositive ? 'animate-bounce-gentle' : 'opacity-40'}`}>
          {gesture ? emoji : '✋'}
        </div>

        <div className="text-2xl font-bold text-slate-100 mb-1 min-h-[2rem]">
          {gesture
            ? (gesture === 'No Hand Detected' ? 'No Hand Detected' : gesture)
            : <span className="text-slate-500 text-lg">Waiting for gesture…</span>
          }
        </div>

        {isPositive && (
          <p className="text-slate-400 text-sm">Hand detected and classified</p>
        )}

        {!handDetected && gesture && (
          <p className="text-slate-500 text-sm">Point your hand at the camera</p>
        )}

        {/* Confidence */}
        {isPositive && (
          <div className="mt-5">
            <ConfidenceBar confidence={confidence} />
          </div>
        )}

        {/* Message for errors */}
        {message && status === 'error' && (
          <p className="text-red-400 text-xs mt-3">{message}</p>
        )}
      </div>

      {/* Top probabilities */}
      {probabilities && probabilities.length > 0 && (
        <div className="glass-card p-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Top Predictions</h4>
          <div className="space-y-2">
            {probabilities.slice(0, 5).map((p, i) => (
              <div key={p.gesture} className="flex items-center gap-3">
                <span className="text-base w-6">{GESTURE_EMOJIS[p.gesture] || '🔍'}</span>
                <span className={`text-sm flex-1 truncate ${i === 0 && isPositive ? 'text-slate-100 font-medium' : 'text-slate-400'}`}>
                  {p.gesture}
                </span>
                <div className="flex items-center gap-2 w-20">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full progress-fill ${i === 0 ? 'bg-cyan-500' : 'bg-slate-600'}`}
                      style={{ width: `${Math.round(p.probability * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 tabular-nums w-9 text-right">{fmtConf(p.probability)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent predictions history */}
      {recentPredictions && recentPredictions.length > 0 && (
        <div className="glass-card p-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent</h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {recentPredictions.slice(0, 10).map((p, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <span className="text-sm">{GESTURE_EMOJIS[p.gesture] || '🔍'}</span>
                <span className="text-sm text-slate-300 flex-1 truncate">{p.gesture}</span>
                <span className={`text-xs font-medium tabular-nums ${
                  p.confidence >= 0.85 ? 'text-emerald-400' : p.confidence >= 0.6 ? 'text-amber-400' : 'text-red-400'
                }`}>{fmtConf(p.confidence)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

export default PredictionPanel
