import { useState, useRef, useCallback, useEffect } from 'react'
import { GestureWebSocket } from '../services/websocket'

const FRAME_INTERVAL_MS = 100 // ~10 fps to backend

const DEFAULT_RESULT = {
  gesture: null,
  confidence: 0,
  handDetected: false,
  numHands: 0,
  probabilities: [],
  landmarks: null,
  boundingBox: null,
  fps: 0,
  status: 'idle',
  message: null,
}

export function useGestureRecognition() {
  // Camera state
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(null)

  // WebSocket state
  const [wsConnected, setWsConnected] = useState(false)
  const [wsReconnecting, setWsReconnecting] = useState(false)
  const [wsError, setWsError] = useState(null)

  // Recognition state
  const [recognitionActive, setRecognitionActive] = useState(false)
  const [result, setResult] = useState(DEFAULT_RESULT)
  const [recentPredictions, setRecentPredictions] = useState([])
  const [sessionId] = useState(() => 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6))

  // Refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const wsRef = useRef(null)
  const frameIntervalRef = useRef(null)
  const recognitionActiveRef = useRef(false)

  // Keep ref in sync
  useEffect(() => {
    recognitionActiveRef.current = recognitionActive
  }, [recognitionActive])

  // ─── WebSocket setup ─────────────────────────────────────────────────────
  useEffect(() => {
    const ws = new GestureWebSocket()
    ws.setSessionId(sessionId)
    wsRef.current = ws

    ws.onConnect = () => {
      setWsConnected(true)
      setWsReconnecting(false)
      setWsError(null)
    }

    ws.onDisconnect = (code, reason) => {
      setWsConnected(false)
      if (code === 1000) setWsError(null)
    }

    ws.onReconnecting = (attempt, delay) => {
      setWsReconnecting(true)
      setWsConnected(false)
    }

    ws.onError = (err) => {
      setWsError(err.message)
      setWsReconnecting(false)
    }

    ws.onPrediction = (data) => {
      const mapped = {
        gesture: data.gesture ?? null,
        confidence: data.confidence ?? 0,
        handDetected: data.hand_detected ?? false,
        numHands: data.num_hands ?? 0,
        probabilities: data.probabilities ?? [],
        landmarks: data.landmarks ?? null,
        boundingBox: data.bounding_box ?? null,
        fps: data.fps ?? 0,
        status: data.status ?? 'success',
        message: data.message ?? null,
      }
      setResult(mapped)

      // Track recent non-trivial predictions
      if (
        mapped.handDetected &&
        mapped.gesture &&
        !['No Hand Detected', 'Uncertain', 'Processing Error', 'Model Unavailable', 'No Frame', 'Decode Error'].includes(mapped.gesture)
      ) {
        setRecentPredictions((prev) => {
          const entry = {
            gesture: mapped.gesture,
            confidence: mapped.confidence,
            timestamp: new Date().toISOString(),
          }
          return [entry, ...prev].slice(0, 20)
        })
      }
    }

    ws.connect()

    return () => {
      ws.disconnect()
    }
  }, [sessionId])

  // ─── Frame capture loop ───────────────────────────────────────────────────
  const captureAndSend = useCallback(() => {
    if (!recognitionActiveRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ws = wsRef.current

    if (!video || !canvas || !ws?.isConnected) return
    if (video.readyState < 2) return // HAVE_CURRENT_DATA

    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const base64 = canvas.toDataURL('image/jpeg', 0.7) // quality 0.7 for speed
    ws.sendFrame(base64)
  }, [])

  // ─── Start Camera ─────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : `Camera error: ${err.message}`
      setCameraError(msg)
      setCameraActive(false)
    }
  }, [])

  // ─── Stop Camera ──────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    stopRecognition()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setResult(DEFAULT_RESULT)
  }, [])

  // ─── Start Recognition ────────────────────────────────────────────────────
  const startRecognition = useCallback(() => {
    if (!cameraActive) return
    setRecognitionActive(true)
    recognitionActiveRef.current = true

    // Start frame capture loop
    frameIntervalRef.current = setInterval(captureAndSend, FRAME_INTERVAL_MS)
  }, [cameraActive, captureAndSend])

  // ─── Stop Recognition ─────────────────────────────────────────────────────
  const stopRecognition = useCallback(() => {
    setRecognitionActive(false)
    recognitionActiveRef.current = false
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current)
      frameIntervalRef.current = null
    }
    setResult((prev) => ({ ...prev, status: 'idle' }))
  }, [])

  // ─── Clear history ────────────────────────────────────────────────────────
  const clearRecentPredictions = useCallback(() => {
    setRecentPredictions([])
  }, [])

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopRecognition()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [stopRecognition])

  return {
    // Refs
    videoRef,
    canvasRef,
    // Camera
    cameraActive,
    cameraError,
    startCamera,
    stopCamera,
    // WebSocket
    wsConnected,
    wsReconnecting,
    wsError,
    // Recognition
    recognitionActive,
    result,
    recentPredictions,
    sessionId,
    startRecognition,
    stopRecognition,
    clearRecentPredictions,
  }
}
