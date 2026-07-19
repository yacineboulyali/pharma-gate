import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Layout from '../../components/Layout'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'

const NAV = [
  { to: '/responsable', label: 'Dashboard' },
  { to: '/responsable/sortie', label: 'Enregistrer une sortie' },
  { to: '/responsable/statistiques', label: 'Statistiques' },
  { to: '/responsable/stock', label: 'Stock' },
  { to: '/responsable/patients', label: 'Patients' },
  { to: '/responsable/assistantes', label: 'Assistantes' },
  { to: '/responsable/historique', label: 'Historique' },
]

export default function ListePatients() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showArchives, setShowArchives] = useState(false)
  const [showAjout, setShowAjout] = useState(false)
  const [nouveauNom, setNouveauNom] = useState('')
  const [editPatient, setEditPatient] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { fetchPatients() }, [])

  async function fetchPatients() {
    const { data } = await supabase
      .from('patients')
      .select(`
        id, nom, active, created_at,
        sorties(id, quantite, date_sortie, medicaments(designation))
      `)
      .order('nom')
    setPatients(data || [])
    setLoading(false)
  }

  async function createPatient() {
    if (!nouveauNom.trim()) return
    setSaving(true)
    setMsg('')

    const { error } = await supabase.from('patients').insert({ nom: nouveauNom.trim() })

    if (error) {
      setMsg(`✗ ${error.message}`)
      setSaving(false)
      setTimeout(() => setMsg(''), 4000)
      return
    }

    setMsg(`✓ ${nouveauNom} ajouté`)
    setNouveauNom('')
    setShowAjout(false)
    setSaving(false)
    await fetchPatients()
    setTimeout(() => setMsg(''), 3000)
  }

  async function saveEditPatient() {
    if (!editPatient || !editPatient.nom.trim()) return
    setSaving(true)
    setMsg('')

    const { error } = await supabase
      .from('patients')
      .update({ nom: editPatient.nom.trim() })
      .eq('id', editPatient.id)

    if (error) {
      setMsg(`✗ ${error.message}`)
      setSaving(false)
      setTimeout(() => setMsg(''), 4000)
      return
    }

    setMsg(`✓ Patient mis à jour`)
    setEditPatient(null)
    setSaving(false)
    await fetchPatients()
    setTimeout(() => setMsg(''), 3000)
  }

  async function toggleActive(patient) {
    setMsg('')
    const { error } = await supabase
      .from('patients')
      .update({ active: !patient.active })
      .eq('id', patient.id)

    if (error) {
      setMsg(`✗ ${error.message}`)
      setTimeout(() => setMsg(''), 4000)
      return
    }
    await fetchPatients()
  }

  async function confirmDeletePatient() {
    if (!deleteTarget) return
    const patient = deleteTarget
    setDeleteTarget(null)
    setMsg('')

    const { error } = await supabase.from('patients').delete().eq('id', patient.id)

    if (error) {
      setMsg(`✗ Suppression impossible (historique de sorties existant) — archivez ce patient à la place.`)
      setTimeout(() => setMsg(''), 5000)
      return
    }

    setMsg(`✓ ${patient.nom} supprimé`)
    await fetchPatients()
    setTimeout(() => setMsg(''), 3000)
  }

  const visibles = patients.filter(p => showArchives ? !p.active : p.active !== false)
  const filtered = visibles.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()))

  return (
    <Layout navLinks={NAV}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Liste des patients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{patients.length} patients enregistrés</p>
        </div>
        <button onClick={() => { setNouveauNom(''); setShowAjout(true) }} className="btn-primary">
          + Nouveau patient
        </button>
      </div>

      {msg && (
        <div className="bg-green-50 text-pharmacy-green text-sm px-4 py-2 rounded-lg border border-green-100 dark:bg-pharmacy-green/10 dark:border-pharmacy-green/20 dark:text-green-400 mb-4">
          {msg}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          className="input-field max-w-xs"
          placeholder="Rechercher un patient…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={() => setShowArchives(a => !a)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            showArchives ? 'bg-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}>
          {showArchives ? '📂 Archivés' : '🗄️ Voir les archivés'}
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="card p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
            {showArchives ? 'Aucun patient archivé' : 'Aucun patient trouvé'}
          </div>
        ) : filtered.map(p => (
          <div key={p.id} className="card p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pharmacy-green-light dark:bg-pharmacy-green/20 flex items-center justify-center text-pharmacy-green dark:text-green-400 font-medium text-sm flex-shrink-0">
                  {p.nom.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{p.nom}</span>
                <span className="badge-green">{p.sorties?.length || 0} sortie{p.sorties?.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setEditPatient({ id: p.id, nom: p.nom })}
                  className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Modifier
                </button>
                <button
                  onClick={() => toggleActive(p)}
                  className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20 transition-colors font-medium"
                >
                  {p.active === false ? 'Désarchiver' : 'Archiver'}
                </button>
                <button
                  onClick={() => setDeleteTarget(p)}
                  className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
            {p.sorties && p.sorties.length > 0 && (
              <div className="mt-2 space-y-1">
                {p.sorties.slice(0, 3).map(s => (
                  <div key={s.id} className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                    <span>{s.medicaments?.designation}</span>
                    <span className="text-gray-400 dark:text-gray-500">{new Date(s.date_sortie).toLocaleDateString('fr-FR')}</span>
                  </div>
                ))}
                {p.sorties.length > 3 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">+{p.sorties.length - 3} autre{p.sorties.length - 3 > 1 ? 's' : ''}…</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal ajout patient */}
      <Modal open={showAjout} onClose={() => setShowAjout(false)} title="Nouveau patient">
        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du patient</label>
            <input
              type="text"
              className="input-field"
              placeholder="Nom complet"
              value={nouveauNom}
              onChange={e => setNouveauNom(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAjout(false)} className="btn-secondary flex-1">Annuler</button>
            <button onClick={createPatient} disabled={saving || !nouveauNom.trim()} className="btn-primary flex-1">
              {saving ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal modification patient */}
      <Modal open={!!editPatient} onClose={() => setEditPatient(null)} title="Modifier le patient">
        {editPatient && (
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du patient</label>
              <input
                type="text"
                className="input-field"
                value={editPatient.nom}
                onChange={e => setEditPatient(f => ({ ...f, nom: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditPatient(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={saveEditPatient} disabled={saving || !editPatient.nom.trim()} className="btn-primary flex-1">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation de suppression */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer ce patient ?"
        message={deleteTarget ? `« ${deleteTarget.nom} » sera définitivement supprimé. Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
        onConfirm={confirmDeletePatient}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  )
}
