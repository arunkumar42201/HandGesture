import React, { useEffect, useCallback } from 'react'
import WebcamView from '../components/WebcamView'
import PredictionPanel from '../components/PredictionPanel'
import { useGestureRecognition } from '../hooks/useGestureRecognition'
import { useToast } from '../components/Toast'

export default function Recognition() {
  const toast = useToast()
  const {
    videoRef, canvasRef,
    cameraActive, cameraError, startCamera, stopCamera,
    wsConnected, wsReconnecting, wsError,
    recognitionActive, result, recentPredictions,
    startRecognition, stopRecognition, clearRecentPredictions,
  } = useGestureRecognition()

  // Show toast on camera error
  useEffect(() => {
    if (cameraError) toast.error(cameraError)
  }, [cameraError])

  // Show toast on WS error
  useEffect(() => {
    if (wsError) toast.error('WebSocket: ' + wsError, 8000)
  }, [wsError])

  const handleStartCamera = useCallback(async () => {
    await startCamera()
    toast.info('Camera started. Click "Start Recognition" to detect gestures.')
  }, [startCamera])

  const handleStopCamera = useCallback(() => {
    stopCamera()
    toast.info('Camera stopped.')
  }, [stopCamera])

  const handleStartRecognition = useCallback(() => {
    if (!wsConnected) {
      toast.warning('WebSocket not connected yet — please wait a moment.')
      return
    }
    startRecognition()
    toast.success('Gesture recognition started!')
  }, [startRecognition, wsConnected])

  const handleStopRecognition = useCallback(() => {
    stopRecognition()
    toast.info('Recognition paused.')
  }, [stopRecognition])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100">
          🎯 Live Recognition
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Real-time hand gesture detection via WebSocket — MediaPipe + Random Forest
        </p>
      </div>

      {/* Backend offline warning */}
      {!wsConnected && !wsReconnecting && (
        <div className="mb-6 px-4 py-3 bg-amber-900/30 border border-amber-500/40 rounded-xl text-amber-300 text-sm flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <span>Backend WebSocket not connected. Make sure the FastAPI server is running on port 8000.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ─── Left column: Camera (3/5 width on desktop) ─── */}
        <div className="lg:col-span-3 space-y-4">
          <WebcamView
            videoRef={videoRef}
            canvasRef={canvasRef}
            cameraActive={cameraActive}
            recognitionActive={recognitionActive}
            landmarks={result.landmarks}
            boundingBox={result.boundingBox}
            fps={result.fps}
            numHands={result.numHands}
            status={result.status}
          />

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            {!cameraActive ? (
              <button onClick={handleStartCamera} className="btn-primary flex items-center gap-2">
                <span>📷</span> Start Camera
              </button>
            ) : (
              <button onClick={handleStopCamera} className="btn-danger flex items-center gap-2">
                <span>⏹️</span> Stop Camera
              </button>
            )}

            {cameraActive && !recognitionActive && (
              <button onClick={handleStartRecognition} className="btn-success flex items-center gap-2">
                <span className="record-dot w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Start Recognition
              </button>
            )}

            {recognitionActive && (
              <button onClick={handleStopRecognition} className="btn-secondary flex items-center gap-2">
                <span>⏸️</span> Pause Recognition
              </button>
            )}

            {recentPredictions.length > 0 && (
              <button onClick={clearRecentPredictions} className="btn-secondary text-sm flex items-center gap-1 ml-auto">
                🗑️ Clear Recent
              </button>
            )}
          </div>

          {/* Status messages */}
          {recognitionActive && result.gesture === 'No Hand Detected' && (
            <div className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 text-sm flex items-center gap-2">
              <span>👁️</span> No hand detected — show your hand to the camera.
            </div>
          )}

          {recognitionActive && result.gesture === 'Model Unavailable' && (
            <div className="px-4 py-3 bg-red-900/30 border border-red-500/40 rounded-xl text-red-300 text-sm flex items-center gap-2">
              <span>⚠️</span> ML model not loaded. Run <code className="bg-red-900/40 px-1 rounded">python ml/train_model.py</code> in the project root.
            </div>
          )}

          {/* Instructions */}
          {!cameraActive && (
            <div className="glass-card p-5">
              <h3 className="font-semibold text-slate-200 mb-3">Quick Start</h3>
              <ol className="space-y-2 text-slate-400 text-sm">
                <li className="flex items-start gap-2"><span className="text-cyan-400 font-bold shrink-0">1.</span> Click <strong className="text-slate-300">Start Camera</strong> and allow browser camera permission.</li>
                <li className="flex items-start gap-2"><span className="text-cyan-400 font-bold shrink-0">2.</span> Click <strong className="text-slate-300">Start Recognition</strong> to begin real-time detection.</li>
                <li className="flex items-start gap-2"><span className="text-cyan-400 font-bold shrink-0">3.</span> Hold a gesture in front of your camera. Keep your hand well-lit.</li>
                <li className="flex items-start gap-2"><span className="text-cyan-400 font-bold shrink-0">4.</span> Watch the predicted gesture and confidence score on the right.</li>
              </ol>
            </div>
          )}
        </div>

        {/* ─── Right column: Prediction panel (2/5 width on desktop) ─── */}
        <div className="lg:col-span-2">
          <PredictionPanel
            result={result}
            recentPredictions={recentPredictions}
            wsConnected={wsConnected}
            wsReconnecting={wsReconnecting}
          />
        </div>
      </div>
    </div>
  )
}
