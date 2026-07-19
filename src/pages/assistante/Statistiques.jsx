import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Layout from '../../components/Layout'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { aggregateTopMedicaments, aggregateTopPatients } from '../../lib/stats'

const NAV = [
  { to: '/assistante', label: 'Accueil' },
  { to: '/assistante/sortie', label: 'Enregistrer une sortie' },
  { to: '/assistante/statistiques', label: 'Statistiques' },
  { to: '/assistante/log', label: 'Mon historique' },
]

const COLORS = ['#1a7f4b', '#2e9e62', '#4dbd80', '#78d49f', '#a8e6c0']

export default function Statistiques() {
  const { profile } = useAuth()
  const [topMeds, setTopMeds] = useState([])
  const [topPatients, setTopPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

    const { data: sorties } = await supabase
      .from('sorties')
      .select(`
        id, quantite, date_sortie,
        medicaments(designation),
        patients(nom)
      `)
      .eq('user_id', profile?.id)
      .gte('date_sortie', startOfMonth)
      .order('date_sortie', { ascending: false })

    setTopMeds(aggregateTopMedicaments(sorties, { limit: 5, nameWords: 2 }))
    setTopPatients(aggregateTopPatients(sorties, { limit: 5 }))
    setLoading(false)
  }

  return (
    <Layout navLinks={NAV}>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Statistiques</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Top médicaments et patients actifs — ce mois</p>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Chargement…</div>
      ) : topMeds.length === 0 ? (
        <div className="card p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Aucune sortie ce mois-ci</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Top médicaments — ce mois</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topMeds} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Unités']} />
                <Bar dataKey="total" fill="#1a7f4b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {topPatients.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Patients actifs — ce mois</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={topPatients} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`} labelLine fontSize={10}>
                    {topPatients.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
