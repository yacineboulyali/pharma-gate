import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Layout from '../../components/Layout'

const NAV = [
  { to: '/assistante', label: 'Accueil' },
  { to: '/assistante/sortie', label: 'Enregistrer une sortie' },
  { to: '/assistante/statistiques', label: 'Statistiques' },
  { to: '/assistante/log', label: 'Mon historique' },
]

export default function AssistanteDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

    const { data: sorties } = await supabase
      .from('sorties')
      .select('id, date_sortie')
      .eq('user_id', profile?.id)
      .gte('date_sortie', startOfMonth)

    if (!sorties) { setLoading(false); return }

    const today_sorties = sorties.filter(s => s.date_sortie >= startOfDay)

    setStats({ total_mois: sorties.length, total_jour: today_sorties.length })
    setLoading(false)
  }

  const prenom = profile?.full_name?.split(' ')[0] || profile?.username

  return (
    <Layout navLinks={NAV}>
      <div className="pb-24 sm:pb-0">
        {/* Bonjour */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Bonjour, {prenom} 👋</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Bouton principal — desktop */}
        <button
          onClick={() => navigate('/assistante/sortie')}
          className="hidden sm:block w-full bg-pharmacy-green text-white rounded-xl px-5 py-[27px] text-left mb-6 hover:bg-pharmacy-green-mid transition-colors group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100 mb-1">Action rapide</p>
              <p className="text-lg font-semibold">Enregistrer une sortie</p>
              <p className="text-sm text-green-100 mt-1">Recherche médicament + patient</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </button>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Sorties aujourd'hui</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{loading ? '—' : stats?.total_jour || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Ce mois-ci</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{loading ? '—' : stats?.total_mois || 0}</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/assistante/statistiques')}
          className="card p-4 text-left hover:border-pharmacy-green/30 hover:shadow-md transition-all w-full"
        >
          <span className="text-2xl">📊</span>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Voir les statistiques</p>
        </button>
      </div>

      {/* Bouton principal — mobile, fixé en bas de l'écran */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-white dark:from-gray-900 via-white/95 dark:via-gray-900/95 to-transparent">
        <button
          onClick={() => navigate('/assistante/sortie')}
          className="w-full bg-pharmacy-green text-white rounded-xl py-[22px] font-semibold shadow-lg flex items-center justify-center gap-2 hover:bg-pharmacy-green-mid transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Enregistrer une sortie
        </button>
      </div>
    </Layout>
  )
}
