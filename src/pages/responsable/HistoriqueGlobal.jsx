import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getDateRangeFilter } from '../../lib/dateRange'

const NAV = [
  { to: '/responsable', label: 'Dashboard' },
  { to: '/responsable/sortie', label: 'Enregistrer une sortie' },
  { to: '/responsable/statistiques', label: 'Statistiques' },
  { to: '/responsable/stock', label: 'Stock' },
  { to: '/responsable/patients', label: 'Patients' },
  { to: '/responsable/assistantes', label: 'Assistantes' },
  { to: '/responsable/historique', label: 'Historique' },
]

export default function HistoriqueGlobal() {
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
      .select('id, quantite, date_sortie, medicaments(designation), patients(nom), users(username, full_name)')
      .gte('date_sortie', from)
      .order('date_sortie', { ascending: false })

    if (to) query.lte('date_sortie', to)

    const { data } = await query
    setSorties(data || [])
    setLoading(false)
  }

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape' })
    const titre = filtre === 'today' ? "Bilan du jour" :
                  filtre === 'week' ? "Bilan de la semaine" :
                  filtre === 'month' ? "Bilan du mois" :
                  `Bilan du ${customDate}`

    doc.setFontSize(16)
    doc.setTextColor(26, 127, 75)
    doc.text('Pharma Gate — ' + titre, 14, 16)
    doc.setFontSize(10)
    doc.setTextColor(120)
    doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')} · ${sorties.length} sorties · ${sorties.reduce((s, x) => s + x.quantite, 0)} unités`, 14, 23)

    autoTable(doc, {
      startY: 30,
      head: [['Date & Heure', 'Médicament', 'Patient', 'Assistante', 'Quantité']],
      body: sorties.map(s => [
        format(parseISO(s.date_sortie), 'dd/MM/yyyy HH:mm'),
        s.medicaments?.designation || '',
        s.patients?.nom || '',
        s.users?.full_name || s.users?.username || '',
        s.quantite,
      ]),
      headStyles: { fillColor: [26, 127, 75] },
      alternateRowStyles: { fillColor: [232, 245, 238] },
      styles: { fontSize: 9 },
    })

    doc.save(`pharmagest_${filtre}_${format(new Date(), 'yyyyMMdd')}.pdf`)
  }

  const totalQte = sorties.reduce((s, x) => s + x.quantite, 0)

  return (
    <Layout navLinks={NAV}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Historique global des sorties</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{sorties.length} sortie{sorties.length !== 1 ? 's' : ''} · {totalQte} unités</p>
        </div>
        <button onClick={exportPDF} disabled={sorties.length === 0}
          className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exporter PDF
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: "Aujourd'hui", value: 'today' },
          { label: 'Cette semaine', value: 'week' },
          { label: 'Ce mois', value: 'month' },
          { label: 'Date spécifique', value: 'custom' },
        ].map(f => (
          <button key={f.value} onClick={() => setFiltre(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filtre === f.value ? 'bg-pharmacy-green text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}>
            {f.label}
          </button>
        ))}
        {filtre === 'custom' && (
          <input type="date" className="input-field w-auto" value={customDate}
            onChange={e => setCustomDate(e.target.value)} />
        )}
      </div>

      {/* Tableau — desktop */}
      <div className="card overflow-hidden hidden sm:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 dark:bg-gray-900/50 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date & heure</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Médicament</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Assistante</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qté</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400 dark:text-gray-500">Chargement…</td></tr>
            ) : sorties.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400 dark:text-gray-500">Aucune sortie pour cette période</td></tr>
            ) : sorties.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                  {format(parseISO(s.date_sortie), 'dd MMM yyyy HH:mm', { locale: fr })}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{s.medicaments?.designation}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.patients?.nom || '—'}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{s.users?.full_name || s.users?.username}</td>
                <td className="px-4 py-3 text-right"><span className="badge-green">{s.quantite}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
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
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-0.5">
              <p>Patient : <span className="font-medium">{s.patients?.nom || '—'}</span></p>
              <p>Assistante : <span className="font-medium">{s.users?.full_name || s.users?.username}</span></p>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
