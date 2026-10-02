import React, { useEffect, useState } from 'react'
import { getSupportedGestures } from '../services/api'
import GestureCard from '../components/GestureCard'
import { PageLoader } from '../components/LoadingSpinner'
import { useToast } from '../components/Toast'

export default function Gestures() {
  const [gestures, setGestures] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const toast = useToast()

  useEffect(() => {
    getSupportedGestures()
      .then(setGestures)
      .catch((err) => toast.error('Failed to load gestures: ' + err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = gestures.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <PageLoader message="Loading gestures..." />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Supported Gestures</h1>
          <p className="text-slate-400 text-sm mt-1">{gestures.length} gestures recognized by the AI model</p>
        </div>
        <input
          className="input-field w-full sm:w-64"
          placeholder="Search gestures..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Count badge */}
      {search && (
        <p className="text-slate-400 text-sm">
          Showing <strong className="text-cyan-400">{filtered.length}</strong> of {gestures.length} gestures
        </p>
      )}

      {/* Cards grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((g) => (
            <GestureCard key={g.label} gesture={g} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-slate-400">No gestures found for "{search}"</p>
          <button onClick={() => setSearch('')} className="btn-secondary mt-4 text-sm">Clear search</button>
        </div>
      )}

      {/* Tips section */}
      <div className="glass-card p-6 border-cyan-500/20">
        <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <span className="text-cyan-400">💡</span> Tips for Best Recognition
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: '💡', tip: 'Use good lighting — avoid backlit situations' },
            { icon: '📏', tip: 'Keep your hand 30-60cm from the camera' },
            { icon: '✋', tip: 'Show one hand at a time for best accuracy' },
            { icon: '🎯', tip: 'Hold each gesture still for 0.5+ seconds' },
          ].map((t) => (
            <div key={t.tip} className="flex items-start gap-2 text-sm text-slate-400">
              <span>{t.icon}</span>
              <span>{t.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
