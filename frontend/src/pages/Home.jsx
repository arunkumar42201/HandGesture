import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStatistics, checkHealth } from '../services/api'

const TECH_STACK = [
  { name: 'React', desc: 'Modern UI with hooks and context', icon: '⚛️', color: 'text-cyan-400' },
  { name: 'FastAPI', desc: 'High-performance Python web framework', icon: '🚀', color: 'text-green-400' },
  { name: 'OpenCV', desc: 'Computer vision & image processing', icon: '📷', color: 'text-blue-400' },
  { name: 'MediaPipe', desc: 'ML-powered hand landmark detection', icon: '🤚', color: 'text-purple-400' },
  { name: 'Scikit-learn', desc: 'Random Forest gesture classification', icon: '🧠', color: 'text-amber-400' },
  { name: 'WebSocket', desc: 'Real-time bidirectional communication', icon: '⚡', color: 'text-rose-400' },
]

const GESTURES = [
  { emoji: '👋', name: 'Hello' },    { emoji: '👍', name: 'Thumbs Up' },
  { emoji: '👎', name: 'Thumbs Down' }, { emoji: '✌️', name: 'Victory' },
  { emoji: '✊', name: 'Fist' },     { emoji: '✋', name: 'Open Palm' },
  { emoji: '☝️', name: 'Pointing' }, { emoji: '🤞', name: 'Two Fingers' },
  { emoji: '👌', name: 'OK' },       { emoji: '🤟', name: 'Love' },
]

const PIPELINE_STEPS = [
  { icon: '📷', label: 'Webcam Capture' },
  { icon: '🖼️', label: 'OpenCV Frame Processing' },
  { icon: '🤚', label: 'MediaPipe Hand Detection' },
  { icon: '📍', label: '21 Landmark Extraction' },
  { icon: '📐', label: 'Feature Normalization' },
  { icon: '🌲', label: 'Random Forest Model' },
  { icon: '✅', label: 'Gesture Prediction' },
  { icon: '📊', label: 'Confidence Score' },
]

export default function Home() {
  const [stats, setStats] = useState(null)
  const [backendOnline, setBackendOnline] = useState(null)

  useEffect(() => {
    checkHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false))

    getStatistics()
      .then(setStats)
      .catch(() => {})
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">

      {/* ── Hero ── */}
      <section className="text-center space-y-6 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-sm mb-4">
          <span className="w-2 h-2 rounded-full bg-cyan-500 record-dot" />
          AI-Powered • Real-Time • WebSocket
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight">
          <span className="text-gradient">Hand Gesture</span>
          <br />
          <span className="text-slate-100">Recognition AI</span>
        </h1>

        <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
          Real-time gesture detection using your webcam. Powered by{' '}
          <span className="text-cyan-400">MediaPipe</span>,{' '}
          <span className="text-emerald-400">OpenCV</span>, and a trained{' '}
          <span className="text-purple-400">ML model</span> — all running locally.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link to="/recognition" className="btn-primary text-base px-8 py-3">
            🎯 Start Recognition
          </Link>
          <Link to="/dashboard" className="btn-secondary text-base px-8 py-3">
            📊 View Dashboard
          </Link>
        </div>

        {/* Backend status banner */}
        <div className="flex justify-center mt-4">
          {backendOnline === null ? (
            <span className="badge-info animate-pulse">Checking backend...</span>
          ) : backendOnline ? (
            <span className="badge-success">✓ Backend online &amp; ready</span>
          ) : (
            <span className="badge-error">✗ Backend offline — start FastAPI server</span>
          )}
        </div>
      </section>

      {/* ── Stats preview ── */}
      {stats && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-up">
          {[
            { label: 'Total Predictions', value: stats.total_predictions.toLocaleString(), icon: '🎯' },
            { label: 'Top Gesture', value: stats.most_recognized_gesture || 'N/A', icon: '🏆' },
            { label: 'Avg Confidence', value: `${stats.average_confidence}%`, icon: '📈' },
            { label: 'Total Sessions', value: stats.total_sessions, icon: '📱' },
          ].map((s) => (
            <div key={s.label} className="glass-card p-5 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-cyan-400 tabular-nums">{s.value}</div>
              <div className="text-slate-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </section>
      )}

      {/* ── Gestures grid ── */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-title">Supported Gestures</h2>
            <p className="text-slate-400 text-sm mt-1">10 gestures recognized in real-time</p>
          </div>
          <Link to="/gestures" className="btn-secondary text-sm">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {GESTURES.map((g) => (
            <div key={g.name} className="glass-card p-4 text-center hover:border-cyan-500/30 hover:bg-slate-800/60 transition-all duration-200 cursor-default group">
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">{g.emoji}</div>
              <div className="text-sm font-medium text-slate-300">{g.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it Works pipeline ── */}
      <section>
        <div className="text-center mb-10">
          <h2 className="section-title">How It Works</h2>
          <p className="text-slate-400 text-sm mt-2">End-to-end computer vision pipeline</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {PIPELINE_STEPS.map((step, i) => (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center gap-1 glass-card px-4 py-3 min-w-[110px]">
                <span className="text-2xl">{step.icon}</span>
                <span className="text-xs text-slate-400 text-center leading-tight">{step.label}</span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="flex items-center text-slate-600 text-lg self-center">→</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section>
        <div className="text-center mb-8">
          <h2 className="section-title">Technology Stack</h2>
          <p className="text-slate-400 text-sm mt-2">Built with production-grade tools</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TECH_STACK.map((tech) => (
            <div key={tech.name} className="glass-card p-5 flex items-start gap-4 hover:border-slate-600 transition-colors">
              <span className="text-3xl">{tech.icon}</span>
              <div>
                <h3 className={`font-bold ${tech.color}`}>{tech.name}</h3>
                <p className="text-slate-400 text-sm mt-0.5">{tech.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="text-center glass-card p-12 gradient-border">
        <h2 className="text-3xl font-bold text-slate-100 mb-4">Ready to try it?</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">Allow camera access, click Start Camera, and let the AI recognize your hand gestures in real time.</p>
        <Link to="/recognition" className="btn-primary text-lg px-10 py-3">
          🎯 Launch Recognition →
        </Link>
      </section>

    </div>
  )
}
