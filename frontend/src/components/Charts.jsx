import React from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js'
import { Doughnut, Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Filler
)

const CHART_COLORS = [
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f59e0b', '#10b981', '#ef4444', '#f97316',
  '#84cc16', '#14b8a6',
]

const baseTooltip = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  titleColor: '#94a3b8',
  bodyColor: '#f1f5f9',
  borderColor: 'rgba(51, 65, 85, 0.8)',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 8,
}

// ─── Gesture Distribution Doughnut ───────────────────────────────────────────
export function GestureDistributionChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        No data yet — start recognizing gestures!
      </div>
    )
  }

  const labels = data.map((d) => d.gesture)
  const counts = data.map((d) => d.count)

  const chartData = {
    labels,
    datasets: [
      {
        data: counts,
        backgroundColor: CHART_COLORS.map((c) => c + 'cc'),
        borderColor: CHART_COLORS,
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          font: { size: 11 },
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: { ...baseTooltip },
    },
    cutout: '65%',
  }

  return (
    <div style={{ height: 220, position: 'relative' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  )
}

// ─── Gesture Bar Chart ────────────────────────────────────────────────────────
export function GestureBarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        No prediction history yet.
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 10)
  const labels = sorted.map((d) => d.gesture)
  const counts = sorted.map((d) => d.count)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Predictions',
        data: counts,
        backgroundColor: CHART_COLORS.map((c) => c + '99'),
        borderColor: CHART_COLORS,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...baseTooltip },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { color: 'rgba(30,41,59,0.6)' },
      },
      y: {
        ticks: { color: '#64748b', font: { size: 11 } },
        grid: { color: 'rgba(30,41,59,0.6)' },
        beginAtZero: true,
      },
    },
  }

  return (
    <div style={{ height: 220, position: 'relative' }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}

// ─── Confidence Trend Line ─────────────────────────────────────────────────
export function ConfidenceTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        No confidence data to display.
      </div>
    )
  }

  const labels = data.map((d) => {
    try {
      return new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  })
  const values = data.map((d) => Math.round((d.confidence || 0) * 100 * 10) / 10)

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Confidence %',
        data: values,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        borderWidth: 2,
        pointBackgroundColor: '#06b6d4',
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...baseTooltip,
        callbacks: {
          label: (ctx) => `Confidence: ${ctx.parsed.y}%`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 45 },
        grid: { color: 'rgba(30,41,59,0.5)' },
      },
      y: {
        min: 0,
        max: 100,
        ticks: { color: '#64748b', font: { size: 11 }, callback: (v) => `${v}%` },
        grid: { color: 'rgba(30,41,59,0.5)' },
      },
    },
  }

  return (
    <div style={{ height: 220, position: 'relative' }}>
      <Line data={chartData} options={options} />
    </div>
  )
}
