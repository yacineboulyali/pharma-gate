import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Layout from '../../components/Layout'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getDateRangeFilter } from '../../lib/dateRange'

const NAV = [
  { to: '/assistante', label: 'Accueil' },
  { to: '/assistante/sortie', label: 'Enregistrer une sortie' },
  { to: '/assistante/statistiques', label: 'Statistiques' },
  { to: '/assistante/log', label: 'Mon historique' },
]

const FILTRES = [
  { label: "Aujourd'hui", value: 'today' },
  { label: 'Cette semaine', value: 'week' },
  { label: 'Ce mois', value: 'month' },
  { label: 'Date spécifique', value: 'custom' },
]

export default function LogSorties() {
  const { profile } = useAuth()
  const [filtre, setFiltre] = useState('today')
  const [customDate, setCustomDate] = useState('')
  const [sorties, setSorties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSorties() }, [filtre, customDate])

  async function fetchSorties() {
    setLoading(true)
    const { from, to } = getDateRangeFilter(filtre, customDate)

    if (!from) { setSorties([]); setLoading(false); return }

    const query = supabase
      .from('sorties')
      .select('id, quantite, date_sortie, medicaments(designation), patients(nom)')
      .eq('user_id', profile?.id)
      .gte('date_sortie', from)
      .order('date_sortie', { ascending: false })

    if (to) query.lte('date_sortie', to)

    const { data } = await query
    setSorties(data || [])
    setLoading(false)
  }

  const totalQte = sorties.reduce((sum, s) => sum + s.quantite, 0)

  return (
    <Layout navLinks={NAV}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mon historique de sorties</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{sorties.length} sortie{sorties.length > 1 ? 's' : ''} · {totalQte} unités</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTRES.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltre(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filtre === f.value
                ? 'bg-pharmacy-green text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
        {filtre === 'custom' && (
          <input
            type="date"
            className="input-field w-auto"
            value={customDate}
            onChange={e => setCustomDate(e.target.value)}
          />
        )}
      </div>

      {/* Table — desktop */}
      <div className="card overflow-hidden hidden sm:block">
        {loading ? (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Chargement…</div>
        ) : sorties.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Aucune sortie pour cette période</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 dark:bg-gray-900/50 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date & heure</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Médicament</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Patient</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Qté</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {sorties.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {format(parseISO(s.date_sortie), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {s.medicaments?.designation}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {s.patients?.nom || <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="badge-green">{s.quantite}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Cartes — mobile */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="card p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Chargement…</div>
        ) : sorties.length === 0 ? (
          <div className="card p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Aucune sortie pour cette période</div>
        ) : sorties.map(s => (
          <div key={s.id} className="card p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">{s.medicaments?.designation}</span>
              <span className="badge-green flex-shrink-0">{s.quantite}</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
              {format(parseISO(s.date_sortie), 'dd MMM yyyy HH:mm', { locale: fr })}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Patient : <span className="font-medium">{s.patients?.nom || '—'}</span>
            </p>
          </div>
        ))}
      </div>
    </Layout>
  )
}
