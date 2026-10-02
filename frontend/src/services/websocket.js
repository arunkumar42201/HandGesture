/**
 * WebSocket manager for real-time gesture recognition.
 * Handles connection lifecycle, auto-reconnect with exponential backoff,
 * frame sending, and typed event callbacks.
 */

const defaultHost = typeof window !== 'undefined' && window.location.hostname
  ? window.location.hostname
  : '127.0.0.1'
const WS_URL = import.meta.env.VITE_WS_URL || `ws://${defaultHost}:8000`
const MAX_RECONNECT_ATTEMPTS = 8
const INITIAL_BACKOFF_MS = 1000

export class GestureWebSocket {
  constructor() {
    this.ws = null
    this.sessionId = 'session_' + Math.random().toString(36).slice(2, 10)
    this.reconnectAttempts = 0
    this.reconnectTimer = null
    this.isIntentionallyClosed = false
    this.saveHistory = true

    // Callbacks
    this.onPrediction = null
    this.onConnect = null
    this.onDisconnect = null
    this.onError = null
    this.onReconnecting = null
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }

  get isConnecting() {
    return this.ws?.readyState === WebSocket.CONNECTING
  }

  connect() {
    if (this.isConnected || this.isConnecting) return

    this.isIntentionallyClosed = false
    this._createConnection()
  }

  _createConnection() {
    try {
      const endpoint = `${WS_URL}/ws/recognize`
      this.ws = new WebSocket(endpoint)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.onConnect?.()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.onPrediction?.(data)
        } catch {
          // Ignore malformed messages
        }
      }

      this.ws.onclose = (event) => {
        const reason = event.reason || `connection closed (code ${event.code})`
        this.onDisconnect?.(event.code, reason)
        if (!this.isIntentionallyClosed) {
          this._scheduleReconnect()
        }
      }

      this.ws.onerror = (event) => {
        // Browsers usually emit an error immediately before close code 1006.
        // Reconnect handling below provides a more useful final error.
      }
    } catch (err) {
      this.onError?.(err)
      this._scheduleReconnect()
    }
  }

  _scheduleReconnect() {
    if (this.isIntentionallyClosed) return
    if (this.reconnectTimer) return
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.onError?.(new Error(`WebSocket unavailable after ${MAX_RECONNECT_ATTEMPTS} reconnect attempts`))
      return
    }

    const delay = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++
    this.onReconnecting?.(this.reconnectAttempts, delay)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this._createConnection()
    }, delay)
  }

  /**
   * Send a base64-encoded image frame for gesture recognition.
   * @param {string} base64Image - The base64 image string (with or without data URI prefix)
   */
  sendFrame(base64Image) {
    if (!this.isConnected) return false

    const payload = JSON.stringify({
      image: base64Image,
      session_id: this.sessionId,
      save_history: this.saveHistory,
    })

    try {
      this.ws.send(payload)
      return true
    } catch (err) {
      this.onError?.(err)
      return false
    }
  }

  disconnect() {
    this.isIntentionallyClosed = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected')
      this.ws = null
    }
    this.reconnectAttempts = 0
  }

  setSessionId(id) {
    this.sessionId = id
  }

  setSaveHistory(val) {
    this.saveHistory = val
  }
}

// Export a singleton for the recognition page
export const gestureWebSocket = new GestureWebSocket()
