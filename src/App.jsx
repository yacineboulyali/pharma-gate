import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ThemeProvider } from './hooks/useTheme'

// Pages communes
import LoginPage from './pages/LoginPage'

// Pages assistante
import AssistanteDashboard from './pages/assistante/Dashboard'
import SaiseSortie from './pages/assistante/SaisieSortie'
import LogSorties from './pages/assistante/LogSorties'
import AssistanteStatistiques from './pages/assistante/Statistiques'

// Pages responsable
import ResponsableDashboard from './pages/responsable/Dashboard'
import GestionStock from './pages/responsable/GestionStock'
import ListePatients from './pages/responsable/ListePatients'
import GestionAssistantes from './pages/responsable/GestionAssistantes'
import HistoriqueGlobal from './pages/responsable/HistoriqueGlobal'
import ResponsableStatistiques from './pages/responsable/Statistiques'

function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-pharmacy-green border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Chargement…</p>
      </div>
    </div>
  )

  if (!user || !profile) return <Navigate to="/login" replace />
  if (role && profile.role !== role) {
    return <Navigate to={profile.role === 'responsable' ? '/responsable' : '/assistante'} replace />
  }

  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Routes assistante */}
            <Route path="/assistante" element={
              <ProtectedRoute role="assistante"><AssistanteDashboard /></ProtectedRoute>
            } />
            <Route path="/assistante/sortie" element={
              <ProtectedRoute role="assistante"><SaiseSortie /></ProtectedRoute>
            } />
            <Route path="/assistante/log" element={
              <ProtectedRoute role="assistante"><LogSorties /></ProtectedRoute>
            } />
            <Route path="/assistante/statistiques" element={
              <ProtectedRoute role="assistante"><AssistanteStatistiques /></ProtectedRoute>
            } />

            {/* Routes responsable */}
            <Route path="/responsable" element={
              <ProtectedRoute role="responsable"><ResponsableDashboard /></ProtectedRoute>
            } />
            <Route path="/responsable/sortie" element={
              <ProtectedRoute role="responsable"><SaiseSortie /></ProtectedRoute>
            } />
            <Route path="/responsable/statistiques" element={
              <ProtectedRoute role="responsable"><ResponsableStatistiques /></ProtectedRoute>
            } />
            <Route path="/responsable/stock" element={
              <ProtectedRoute role="responsable"><GestionStock /></ProtectedRoute>
            } />
            <Route path="/responsable/patients" element={
              <ProtectedRoute role="responsable"><ListePatients /></ProtectedRoute>
            } />
            <Route path="/responsable/assistantes" element={
              <ProtectedRoute role="responsable"><GestionAssistantes /></ProtectedRoute>
            } />
            <Route path="/responsable/historique" element={
              <ProtectedRoute role="responsable"><HistoriqueGlobal /></ProtectedRoute>
            } />

            {/* Redirection par défaut */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
