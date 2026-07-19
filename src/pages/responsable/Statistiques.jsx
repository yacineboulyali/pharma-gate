import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { startOfMonth } from 'date-fns'
import { aggregateTopMedicaments } from '../../lib/stats'

const NAV = [
  { to: '/responsable', label: 'Dashboard' },
  { to: '/responsable/sortie', label: 'Enregistrer une sortie' },
  { to: '/responsable/statistiques', label: 'Statistiques' },
  { to: '/responsable/stock', label: 'Stock' },
  { to: '/responsable/patients', label: 'Patients' },
  { to: '/responsable/assistantes', label: 'Assistantes' },
  { to: '/responsable/historique', label: 'Historique' },
]

export default function Statistiques() {
  const navigate = useNavigate()
  const [topMeds, setTopMeds] = useState([])
  const [stockCritique, setStockCritique] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const startMois = startOfMonth(new Date()).toISOString()

    const [{ data: sorties }, { data: meds }] = await Promise.all([
      supabase.from('sorties').select('id, quantite, medicaments(designation)').gte('date_sortie', startMois),
      supabase.from('medicaments').select('id, designation, stock, seuil_alerte').order('stock'),
    ])

    setTopMeds(aggregateTopMedicaments(sorties, { limit: 8, nameWords: 3 }))
    setStockCritique(meds?.filter(m => m.stock <= (m.seuil_alerte || 5)).slice(0, 10) || [])
    setLoading(false)
  }

  return (
    <Layout navLinks={NAV}>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Statistiques</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Top médicaments et stock critique — ce mois</p>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Chargement…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top médicaments */}
          <div className="card p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Top médicaments — ce mois</h3>
            {topMeds.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topMeds} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [v, 'Unités']} />
                  <Bar dataKey="total" fill="#1a7f4b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">Aucune sortie ce mois-ci</p>
            )}
          </div>

          {/* Stock critique */}
          <div className="card p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Stock critique (≤ seuil alerte)
            </h3>
            {stockCritique.length > 0 ? (
              <>
                <div className="space-y-2">
                  {stockCritique.map(m => (
                    <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{m.designation}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        m.stock === 0 ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
                      }`}>
                        {m.stock === 0 ? 'Épuisé' : `${m.stock} restant${m.stock > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/responsable/stock')}
                  className="mt-3 text-xs text-pharmacy-green hover:underline">
                  Gérer le stock →
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">Aucun médicament en stock critique</p>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
