import React, { useRef, useEffect } from 'react'
import ConfidenceBar from './ConfidenceBar'

// ─── Landmark connection pairs (MediaPipe hand topology) ──────────────────────
const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],       // Thumb
  [0,5],[5,6],[6,7],[7,8],       // Index
  [0,9],[9,10],[10,11],[11,12],  // Middle
  [0,13],[13,14],[14,15],[15,16],// Ring
  [0,17],[17,18],[18,19],[19,20],// Pinky
  [5,9],[9,13],[13,17],          // Palm base
]

// ─── Overlay Canvas component ─────────────────────────────────────────────────
function LandmarkOverlay({ landmarks, boundingBox, videoRef }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    const canvas = overlayRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const video = videoRef?.current
    if (!video) return

    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (landmarks && landmarks.length > 0) {
      const W = canvas.width
      const H = canvas.height

      // Draw connections
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)'
      ctx.lineWidth = 2
      for (const [a, b] of CONNECTIONS) {
        const lA = landmarks[a]
        const lB = landmarks[b]
        if (!lA || !lB) continue
        ctx.beginPath()
        ctx.moveTo(lA.x * W, lA.y * H)
        ctx.lineTo(lB.x * W, lB.y * H)
        ctx.stroke()
      }

      // Draw joints
      for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i]
        if (!lm) continue
        const x = lm.x * W
        const y = lm.y * H

        // Fingertips (4,8,12,16,20) — larger dot
        const isTip = [4, 8, 12, 16, 20].includes(i)
        ctx.beginPath()
        ctx.arc(x, y, isTip ? 5 : 3, 0, Math.PI * 2)
        ctx.fillStyle = isTip ? 'rgba(250, 204, 21, 0.9)' : 'rgba(6, 182, 212, 0.9)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    // Draw bounding box
    if (boundingBox) {
      const { x_min, y_min, x_max, y_max } = boundingBox
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 5])
      ctx.strokeRect(x_min, y_min, x_max - x_min, y_max - y_min)
      ctx.setLineDash([])
    }
  }, [landmarks, boundingBox, videoRef])

  return (
    <canvas
      ref={overlayRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 2 }}
    />
  )
}

// ─── Main WebcamView component ────────────────────────────────────────────────
export default function WebcamView({
  videoRef,
  canvasRef,
  cameraActive,
  recognitionActive,
  landmarks,
  boundingBox,
  fps,
  numHands,
  status,
}) {
  return (
    <div className="relative video-container bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden aspect-video">
      {/* Hidden capture canvas (not displayed, used for frame grab) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Live video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
        style={{ transform: 'scaleX(-1)', zIndex: 1 }} // Mirror effect
      />

      {/* Landmark overlay */}
      {cameraActive && recognitionActive && (
        <LandmarkOverlay landmarks={landmarks} boundingBox={boundingBox} videoRef={videoRef} />
      )}

      {/* Scan line animation during recognition */}
      {cameraActive && recognitionActive && <div className="scan-line" />}

      {/* No camera placeholder */}
      {!cameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/95">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-slate-300 font-medium">Camera Off</p>
            <p className="text-slate-500 text-sm mt-1">Click "Start Camera" to begin</p>
          </div>
        </div>
      )}

      {/* Status overlays (top-left corner) */}
      {cameraActive && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {/* Camera status */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-slate-700/50 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 record-dot shrink-0" />
            <span className="text-emerald-400 font-medium">LIVE</span>
          </div>

          {/* Recognition status */}
          {recognitionActive && (
            <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-cyan-500/30 text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-500 record-dot shrink-0" />
              <span className="text-cyan-400 font-medium">RECOGNIZING</span>
            </div>
          )}
        </div>
      )}

      {/* FPS + hand count overlay (bottom-left) */}
      {cameraActive && recognitionActive && (
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
          <div className="bg-slate-900/80 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-slate-700/50 text-xs text-slate-300">
            <span className="text-cyan-400 font-mono font-bold">{fps > 0 ? fps.toFixed(1) : '--'}</span>
            <span className="text-slate-500 ml-1">FPS</span>
          </div>
          {numHands > 0 && (
            <div className="bg-slate-900/80 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-slate-700/50 text-xs text-slate-300">
              <span className="text-amber-400 font-bold">{numHands}</span>
              <span className="text-slate-500 ml-1">hand{numHands !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* Corner decorations */}
      {cameraActive && (
        <>
          <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-sm" />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-cyan-500/40 rounded-br-sm" />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-cyan-500/40 rounded-bl-sm" />
        </>
      )}
    </div>
  )
}
