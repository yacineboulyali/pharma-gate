import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'
import { format, startOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'

const NAV = [
  { to: '/responsable', label: 'Dashboard' },
  { to: '/responsable/sortie', label: 'Enregistrer une sortie' },
  { to: '/responsable/statistiques', label: 'Statistiques' },
  { to: '/responsable/stock', label: 'Stock' },
  { to: '/responsable/patients', label: 'Patients' },
  { to: '/responsable/assistantes', label: 'Assistantes' },
  { to: '/responsable/historique', label: 'Historique' },
]

export default function ResponsableDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel('dashboard-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sorties' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medicaments' }, fetchAll)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchAll() {
    const startMois = startOfMonth(new Date()).toISOString()

    const [{ data: sorties }, { data: meds }, { count: totalPatients }] = await Promise.all([
      supabase.from('sorties').select('id, quantite').gte('date_sortie', startMois),
      supabase.from('medicaments').select('id, stock, seuil_alerte, active').eq('active', true),
      supabase.from('patients').select('id', { count: 'exact', head: true }).eq('active', true),
    ])

    const stockCritiqueCount = meds?.filter(m => m.stock <= (m.seuil_alerte || 5)).length || 0

    setStats({
      totalSorties: sorties?.length || 0,
      totalUnites: sorties?.reduce((s, x) => s + x.quantite, 0) || 0,
      totalPatients: totalPatients || 0,
      stockCritiqueCount,
    })
    setLoading(false)
  }

  return (
    <Layout navLinks={NAV}>
      <div className="pb-24 sm:pb-0">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>

        {/* Bouton principal — desktop */}
        <button
          onClick={() => navigate('/responsable/sortie')}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Sorties ce mois', value: stats?.totalSorties, color: 'text-pharmacy-green' },
            { label: 'Unités distribuées', value: stats?.totalUnites, color: 'text-pharmacy-green' },
            { label: 'Patients actifs', value: stats?.totalPatients, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Stock critique', value: stats?.stockCritiqueCount, color: 'text-red-600 dark:text-red-400', alert: true },
          ].map(kpi => (
            <div key={kpi.label} className={`card p-4 ${kpi.alert && stats?.stockCritiqueCount > 0 ? 'border-red-100 dark:border-red-500/30' : ''}`}>
              <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</p>
              <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>
                {loading ? '—' : kpi.value ?? 0}
              </p>
            </div>
          ))}
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Statistiques', to: '/responsable/statistiques', icon: '📊' },
            { label: 'Gérer le stock', to: '/responsable/stock', icon: '📦' },
            { label: 'Voir les patients', to: '/responsable/patients', icon: '👥' },
            { label: 'Historique global', to: '/responsable/historique', icon: '📋' },
            { label: 'Gérer les assistantes', to: '/responsable/assistantes', icon: '👤' },
          ].map(a => (
            <button key={a.to} onClick={() => navigate(a.to)}
              className="card p-4 text-left hover:border-pharmacy-green/30 hover:shadow-md transition-all">
              <span className="text-2xl">{a.icon}</span>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">{a.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Bouton principal — mobile, fixé en bas de l'écran */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-white dark:from-gray-900 via-white/95 dark:via-gray-900/95 to-transparent">
        <button
          onClick={() => navigate('/responsable/sortie')}
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
