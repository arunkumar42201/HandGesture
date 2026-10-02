import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor for unified error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Unknown error occurred'
    return Promise.reject(new Error(message))
  }
)

// ─── Health ───────────────────────────────────────────────────────────────────
export const checkHealth = () => api.get('/api/health').then((r) => r.data)

// ─── Recognition ─────────────────────────────────────────────────────────────
export const recognizeGesture = (imageBase64, sessionId = 'default', saveHistory = true) =>
  api
    .post('/api/recognize', {
      image: imageBase64,
      session_id: sessionId,
      save_history: saveHistory,
    })
    .then((r) => r.data)

// ─── Gestures ─────────────────────────────────────────────────────────────────
export const getSupportedGestures = () => api.get('/api/gestures').then((r) => r.data)

// ─── History ──────────────────────────────────────────────────────────────────
export const getHistory = (params = {}) =>
  api
    .get('/api/history', {
      params: {
        limit: params.limit ?? 50,
        offset: params.offset ?? 0,
        gesture: params.gesture || undefined,
        search: params.search || undefined,
        sort_by: params.sortBy || 'timestamp',
        sort_order: params.sortOrder || 'desc',
      },
    })
    .then((r) => r.data)

export const savePrediction = (gesture, confidence, sessionId = 'default', handDetected = true) =>
  api
    .post('/api/history', { gesture, confidence, session_id: sessionId, hand_detected: handDetected })
    .then((r) => r.data)

export const deleteHistoryItem = (id) =>
  api.delete(`/api/history/${id}`).then((r) => r.data)

export const clearHistory = () => api.delete('/api/history').then((r) => r.data)

// ─── Statistics ───────────────────────────────────────────────────────────────
export const getStatistics = () => api.get('/api/statistics').then((r) => r.data)

export default api
