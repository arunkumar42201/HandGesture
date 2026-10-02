import React, { useEffect, useState, useCallback } from 'react'
import { getHistory, deleteHistoryItem, clearHistory, getSupportedGestures } from '../services/api'
import { SkeletonRow } from '../components/LoadingSpinner'
import { useToast } from '../components/Toast'

const GESTURE_EMOJIS = {
  'Hello': '👋', 'Thumbs Up': '👍', 'Thumbs Down': '👎',
  'Victory': '✌️', 'Fist': '✊', 'Open Palm': '✋',
  'Pointing': '☝️', 'Two Fingers': '🤞', 'OK': '👌', 'Love': '🤟',
}

const PAGE_SIZES = [10, 25, 50, 100]

export default function History() {
  const toast = useToast()
  const [history, setHistory] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [gestureOptions, setGestureOptions] = useState([])

  // Filters & pagination
  const [search, setSearch] = useState('')
  const [filterGesture, setFilterGesture] = useState('')
  const [sortBy, setSortBy] = useState('timestamp')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  // Confirmation modal state
  const [confirmClear, setConfirmClear] = useState(false)

  const totalPages = Math.ceil(total / pageSize)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getHistory({
        limit: pageSize,
        offset: page * pageSize,
        gesture: filterGesture || undefined,
        search: search || undefined,
        sortBy,
        sortOrder,
      })
      setHistory(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      toast.error('Failed to load history: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filterGesture, search, sortBy, sortOrder])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    getSupportedGestures()
      .then((gs) => setGestureOptions(gs.map((g) => g.name)))
      .catch(() => {})
  }, [])

  const handleDelete = async (id) => {
    try {
      await deleteHistoryItem(id)
      toast.success('Record deleted.')
      load()
    } catch (err) {
      toast.error('Delete failed: ' + err.message)
    }
  }

  const handleClearAll = async () => {
    try {
      await clearHistory()
      toast.success('History cleared.')
      setConfirmClear(false)
      setPage(0)
      load()
    } catch (err) {
      toast.error('Clear failed: ' + err.message)
    }
  }

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortOrder('desc')
    }
    setPage(0)
  }

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span className="text-slate-600 ml-1">↕</span>
    return <span className="text-cyan-400 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setPage(0)
  }

  const handleFilterGesture = (e) => {
    setFilterGesture(e.target.value)
    setPage(0)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Prediction History</h1>
          <p className="text-slate-400 text-sm mt-1">
            {total.toLocaleString()} total records
          </p>
        </div>
        {total > 0 && (
          <button onClick={() => setConfirmClear(true)} className="btn-danger text-sm">
            🗑️ Clear All History
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <input
          className="input-field flex-1 min-w-[180px]"
          placeholder="Search gestures or sessions..."
          value={search}
          onChange={handleSearch}
        />
        <select
          className="input-field min-w-[140px]"
          value={filterGesture}
          onChange={handleFilterGesture}
        >
          <option value="">All Gestures</option>
          {gestureOptions.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select
          className="input-field w-24"
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}
        >
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / page</option>)}
        </select>
        <button onClick={load} className="btn-secondary text-sm">↻ Refresh</button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th
                  className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-200 transition-colors"
                  onClick={() => toggleSort('gesture')}
                >
                  Gesture <SortIcon col="gesture" />
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-200 transition-colors"
                  onClick={() => toggleSort('confidence')}
                >
                  Confidence <SortIcon col="confidence" />
                </th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Session ID
                </th>
                <th
                  className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-200 transition-colors"
                  onClick={() => toggleSort('timestamp')}
                >
                  Date &amp; Time <SortIcon col="timestamp" />
                </th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading
                ? [...Array(pageSize > 10 ? 10 : pageSize)].map((_, i) => <SkeletonRow key={i} />)
                : history.length > 0
                ? history.map((item) => {
                    const conf = Math.round(item.confidence * 100)
                    const ts = item.timestamp ? new Date(item.timestamp) : null
                    return (
                      <tr key={item.id} className="table-row-hover">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{GESTURE_EMOJIS[item.gesture] || '🔍'}</span>
                            <span className="text-sm font-medium text-slate-200">{item.gesture}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold tabular-nums ${
                            conf >= 85 ? 'text-emerald-400' : conf >= 60 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {conf}%
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-slate-500 font-mono truncate block max-w-[120px]">{item.session_id || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          {ts ? (
                            <div>
                              <div className="text-xs text-slate-300">{ts.toLocaleDateString()}</div>
                              <div className="text-xs text-slate-500">{ts.toLocaleTimeString()}</div>
                            </div>
                          ) : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-slate-600 hover:text-red-400 transition-colors text-sm"
                            title="Delete record"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    )
                  })
                : (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-slate-500">
                      No history records found. Start recognizing gestures!
                    </td>
                  </tr>
                )
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {page + 1} of {totalPages} • {total.toLocaleString()} total records
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="btn-secondary text-xs py-1.5 px-2.5 disabled:opacity-30"
              >«</button>
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="btn-secondary text-xs py-1.5 px-2.5 disabled:opacity-30"
              >‹</button>
              <span className="text-xs text-slate-400 px-2">{page + 1}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="btn-secondary text-xs py-1.5 px-2.5 disabled:opacity-30"
              >›</button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className="btn-secondary text-xs py-1.5 px-2.5 disabled:opacity-30"
              >»</button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm clear modal */}
      {confirmClear && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-8 max-w-sm w-full mx-4 animate-fade-in">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Clear All History?</h3>
            <p className="text-slate-400 text-sm mb-6">
              This will permanently delete all {total.toLocaleString()} prediction records. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={handleClearAll} className="btn-danger flex-1">Yes, Delete All</button>
              <button onClick={() => setConfirmClear(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
