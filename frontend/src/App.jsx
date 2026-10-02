import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import { ToastProvider } from './components/Toast'
import Home from './pages/Home'
import Recognition from './pages/Recognition'
import Dashboard from './pages/Dashboard'
import Gestures from './pages/Gestures'
import History from './pages/History'

function About() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <section className="max-w-3xl">
        <p className="text-cyan-400 text-sm font-semibold uppercase tracking-[0.2em]">About the project</p>
        <h1 className="text-4xl font-bold text-slate-100 mt-3">A local computer-vision pipeline</h1>
        <p className="text-slate-400 text-lg leading-relaxed mt-5">
          HandGesture AI captures frames in your browser, sends them over a WebSocket to FastAPI,
          extracts MediaPipe landmarks, and classifies them with a locally trained machine-learning model.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          {[
            ['React + Vite', 'Responsive interface and camera controls'],
            ['FastAPI', 'REST endpoints and real-time WebSocket transport'],
            ['OpenCV + MediaPipe', 'Frame decoding and 21-point hand landmarks'],
            ['Scikit-learn + SQLite', 'Classification, history, and statistics'],
          ].map(([title, description]) => (
            <div key={title} className="glass-card p-5">
              <h2 className="font-semibold text-slate-100">{title}</h2>
              <p className="text-sm text-slate-400 mt-2">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recognition" element={<Recognition />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/gestures" element={<Gestures />} />
          <Route path="/history" element={<History />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ToastProvider>
  )
}