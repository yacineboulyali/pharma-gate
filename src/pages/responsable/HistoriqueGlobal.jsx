import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { PencilIcon, TrashIcon } from '../../components/Icons'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getDateRangeFilter } from '../../lib/dateRange'
import { clampQuantite } from '../../lib/quantite'

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
  const [editSortie, setEditSortie] = useState(null) // { id, quantite, patientNom, medicamentId, medicamentNom, stockDisponible }
  const [editPatientSearch, setEditPatientSearch] = useState('')
  const [editPatientResults, setEditPatientResults] = useState([])
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [msg, setMsg] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchSorties() }, [filtre, customDate])

  async function fetchSorties() {
    setLoading(true)
    const { from, to } = getDateRangeFilter(filtre, customDate)

    if (!from) { setSorties([]); setLoading(false); return }

    const query = supabase
      .from('sorties')
      .select('id, quantite, date_sortie, medicament_id, medicaments(designation, stock), patients(nom), users(username, full_name)')
      .gte('date_sortie', from)
      .order('date_sortie', { ascending: false })

    if (to) query.lte('date_sortie', to)

    const { data } = await query
    setSorties(data || [])
    setLoading(false)
  }

  function openEdit(s) {
    setEditSortie({
      id: s.id,
      quantite: s.quantite,
      medicamentNom: s.medicaments?.designation,
      // Le stock disponible pour cette édition inclut la quantité déjà sortie,
      // puisqu'elle sera "rendue" avant d'appliquer la nouvelle valeur
      stockDisponible: (s.medicaments?.stock || 0) + s.quantite,
    })
    setEditPatientSearch(s.patients?.nom || '')
    setEditPatientResults([])
    setEditError('')
  }

  // Recherche patient en temps réel (édition)
  useEffect(() => {
    if (!editSortie || editPatientSearch.length < 2) { setEditPatientResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, nom')
        .ilike('nom', `%${editPatientSearch}%`)
        .order('nom')
        .limit(8)
      setEditPatientResults(data || [])
    }, 200)
    return () => clearTimeout(timer)
  }, [editPatientSearch, editSortie])

  async function saveEdit() {
    if (!editSortie || !editPatientSearch.trim() || editSortie.quantite < 1) return
    setSaving(true)
    setEditError('')

    const { data, error } = await supabase.rpc('modifier_sortie', {
      p_sortie_id: editSortie.id,
      p_patient_nom: editPatientSearch.trim(),
      p_quantite: editSortie.quantite,
    })

    if (error || !data?.success) {
      setEditError(data?.error || error?.message || "Erreur lors de la modification")
      setSaving(false)
      return
    }

    setSaving(false)
    setEditSortie(null)
    setMsg('✓ Sortie modifiée')
    await fetchSorties()
    setTimeout(() => setMsg(''), 3000)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)

    const { data, error } = await supabase.rpc('supprimer_sortie', {
      p_sortie_id: deleteTarget.id,
    })

    setDeleting(false)
    setDeleteTarget(null)

    if (error || !data?.success) {
      setMsg(`✗ ${data?.error || error?.message || 'Erreur lors de la suppression'}`)
      setTimeout(() => setMsg(''), 4000)
      return
    }

    setMsg('✓ Sortie supprimée et stock rétabli')
    await fetchSorties()
    setTimeout(() => setMsg(''), 3000)
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

      {msg && (
        <div className="bg-green-50 text-pharmacy-green text-sm px-4 py-2 rounded-lg border border-green-100 dark:bg-pharmacy-green/10 dark:border-pharmacy-green/20 dark:text-green-400 mb-4">
          {msg}
        </div>
      )}

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
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400 dark:text-gray-500">Chargement…</td></tr>
            ) : sorties.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400 dark:text-gray-500">Aucune sortie pour cette période</td></tr>
            ) : sorties.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                  {format(parseISO(s.date_sortie), 'dd MMM yyyy HH:mm', { locale: fr })}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{s.medicaments?.designation}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.patients?.nom || '—'}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{s.users?.full_name || s.users?.username}</td>
                <td className="px-4 py-3 text-right"><span className="badge-green">{s.quantite}</span></td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openEdit(s)}
                      title="Modifier"
                      className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(s)}
                      title="Supprimer"
                      className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
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
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => openEdit(s)}
                title="Modifier"
                className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <PencilIcon />
              </button>
              <button
                onClick={() => setDeleteTarget(s)}
                title="Supprimer"
                className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal modification d'une sortie */}
      <Modal open={!!editSortie} onClose={() => setEditSortie(null)} title="Modifier la sortie">
        {editSortie && (
          <div className="max-w-md space-y-4">
            <div className="bg-pharmacy-green-light dark:bg-pharmacy-green/20 rounded-lg px-4 py-3">
              <p className="text-xs text-pharmacy-green dark:text-green-400 font-medium">Médicament</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{editSortie.medicamentNom}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient</label>
              <input
                type="text"
                className="input-field"
                placeholder="Tapez le nom du patient…"
                value={editPatientSearch}
                onChange={e => setEditPatientSearch(e.target.value)}
                autoFocus
              />
              {editPatientResults.length > 0 && (
                <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                  {editPatientResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setEditPatientSearch(p.nom); setEditPatientResults([]) }}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 text-sm text-gray-900 dark:text-gray-100"
                    >
                      {p.nom}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantité</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditSortie(f => ({ ...f, quantite: clampQuantite(f.quantite - 1, f.stockDisponible) }))}
                  className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xl font-light"
                >−</button>
                <input
                  type="number"
                  min={1}
                  max={editSortie.stockDisponible}
                  value={editSortie.quantite}
                  onChange={e => setEditSortie(f => ({ ...f, quantite: clampQuantite(e.target.value, f.stockDisponible) }))}
                  className="input-field text-center w-20 text-lg font-medium"
                />
                <button
                  onClick={() => setEditSortie(f => ({ ...f, quantite: clampQuantite(f.quantite + 1, f.stockDisponible) }))}
                  className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xl font-light"
                >+</button>
                <span className="text-xs text-gray-400 dark:text-gray-500">/ {editSortie.stockDisponible} disponible{editSortie.stockDisponible > 1 ? 's' : ''}</span>
              </div>
            </div>

            {editError && (
              <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                {editError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditSortie(null)} className="btn-secondary flex-1">Annuler</button>
              <button
                onClick={saveEdit}
                className="btn-primary flex-1"
                disabled={saving || !editPatientSearch.trim() || editSortie.quantite < 1}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation de suppression */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer cette sortie ?"
        message={deleteTarget ? `${deleteTarget.quantite} unité${deleteTarget.quantite > 1 ? 's' : ''} de « ${deleteTarget.medicaments?.designation} » sera${deleteTarget.quantite > 1 ? 'nt' : ''} recréditée${deleteTarget.quantite > 1 ? 's' : ''} au stock. Cette action est irréversible.` : ''}
        confirmLabel={deleting ? 'Suppression…' : 'Supprimer'}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  )
}
