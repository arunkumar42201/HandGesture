import React from 'react'

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  }
  return (
    <div
      className={`
        ${sizes[size]} rounded-full border-slate-600 border-t-cyan-500
        animate-spin ${className}
      `}
    />
  )
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-slate-400 text-sm animate-pulse">{message}</p>
    </div>
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`glass-card p-6 animate-pulse ${className}`}>
      <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
      <div className="h-8 bg-slate-700 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-700 rounded w-full" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-800">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-700 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  )
}
