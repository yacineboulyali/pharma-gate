import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Layout from '../../components/Layout'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { filterMedicaments } from '../../lib/stock'

const NAV = [
  { to: '/responsable', label: 'Dashboard' },
  { to: '/responsable/sortie', label: 'Enregistrer une sortie' },
  { to: '/responsable/statistiques', label: 'Statistiques' },
  { to: '/responsable/stock', label: 'Stock' },
  { to: '/responsable/patients', label: 'Patients' },
  { to: '/responsable/assistantes', label: 'Assistantes' },
  { to: '/responsable/historique', label: 'Historique' },
]

const NOUVEAU_MEDICAMENT = { designation: '', stock: 0, seuil_alerte: 5 }

export default function GestionStock() {
  const { user } = useAuth()
  const [medicaments, setMedicaments] = useState([])
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('all')
  const [loading, setLoading] = useState(true)
  const [livraison, setLivraison] = useState(null) // { id, qte }
  const [lvrQte, setLvrQte] = useState(1)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [showAjout, setShowAjout] = useState(false)
  const [nouveauMed, setNouveauMed] = useState(NOUVEAU_MEDICAMENT)
  const [editMed, setEditMed] = useState(null)
  const [showArchives, setShowArchives] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { fetchMeds() }, [])

  async function fetchMeds() {
    const { data } = await supabase
      .from('medicaments')
      .select('*')
      .order('designation')
    setMedicaments(data || [])
    setLoading(false)
  }

  async function toggleActive(med) {
    setMsg('')
    const { error } = await supabase
      .from('medicaments')
      .update({ active: !med.active })
      .eq('id', med.id)

    if (error) {
      setMsg(`✗ ${error.message}`)
      setTimeout(() => setMsg(''), 4000)
      return
    }
    await fetchMeds()
  }

  async function confirmDeleteMedicament() {
    if (!deleteTarget) return
    const med = deleteTarget
    setDeleteTarget(null)
    setMsg('')

    const { error } = await supabase.from('medicaments').delete().eq('id', med.id)

    if (error) {
      setMsg(`✗ Suppression impossible (historique de sorties/livraisons existant) — archivez ce médicament à la place.`)
      setTimeout(() => setMsg(''), 5000)
      return
    }

    setMsg(`✓ ${med.designation} supprimé`)
    await fetchMeds()
    setTimeout(() => setMsg(''), 3000)
  }

  function findMedicamentExistant(designation) {
    const nom = designation.trim().toLowerCase()
    return medicaments.find(m => m.designation.trim().toLowerCase() === nom)
  }

  async function saveNouveauMedicament() {
    if (!nouveauMed.designation.trim()) return
    setSaving(true)
    setMsg('')

    const existant = findMedicamentExistant(nouveauMed.designation)

    if (existant) {
      const qte = Number(nouveauMed.stock) || 0
      if (qte < 1) {
        setMsg('✗ Quantité invalide')
        setSaving(false)
        setTimeout(() => setMsg(''), 4000)
        return
      }

      const { data, error } = await supabase.rpc('enregistrer_livraison', {
        p_medicament_id: existant.id,
        p_quantite: qte,
        p_user_id: user.id,
      })

      if (error || !data?.success) {
        setMsg(`✗ ${data?.error || error?.message || "Erreur lors de l'enregistrement"}`)
        setSaving(false)
        setTimeout(() => setMsg(''), 4000)
        return
      }

      setMsg(`✓ Stock de ${existant.designation} augmenté de ${qte}`)
      setNouveauMed(NOUVEAU_MEDICAMENT)
      setShowAjout(false)
      setSaving(false)
      await fetchMeds()
      setTimeout(() => setMsg(''), 3000)
      return
    }

    const stockInitial = Number(nouveauMed.stock) || 0

    const { error } = await supabase.from('medicaments').insert({
      designation: nouveauMed.designation.trim(),
      stock: stockInitial,
      qte_livree: stockInitial,
      seuil_alerte: Number(nouveauMed.seuil_alerte) || 5,
    })

    if (error) {
      setMsg(`✗ ${error.message}`)
      setSaving(false)
      setTimeout(() => setMsg(''), 4000)
      return
    }

    setMsg(`✓ ${nouveauMed.designation} ajouté au stock`)
    setNouveauMed(NOUVEAU_MEDICAMENT)
    setShowAjout(false)
    setSaving(false)
    await fetchMeds()
    setTimeout(() => setMsg(''), 3000)
  }

  async function saveEditMedicament() {
    if (!editMed || !editMed.designation.trim()) return
    setSaving(true)
    setMsg('')

    // Toute correction manuelle du stock doit être répercutée sur qte_livree,
    // sinon "Qt Total" (stock + sortie) se désynchronise de "Qt Livré"
    const nouveauStock = Number(editMed.stock) || 0
    const delta = nouveauStock - (Number(editMed.stockOriginal) || 0)
    const nouvelleQteLivree = (Number(editMed.qte_livree) || 0) + delta

    const { error } = await supabase
      .from('medicaments')
      .update({
        designation: editMed.designation.trim(),
        stock: nouveauStock,
        qte_livree: nouvelleQteLivree,
        seuil_alerte: Number(editMed.seuil_alerte) || 5,
      })
      .eq('id', editMed.id)

    if (error) {
      setMsg(`✗ ${error.message}`)
      setSaving(false)
      setTimeout(() => setMsg(''), 4000)
      return
    }

    setMsg(`✓ ${editMed.designation} mis à jour`)
    setEditMed(null)
    setSaving(false)
    await fetchMeds()
    setTimeout(() => setMsg(''), 3000)
  }

  async function saveLivraison() {
    if (!livraison || lvrQte < 1) return
    setSaving(true)
    setMsg('')

    const { data, error } = await supabase.rpc('enregistrer_livraison', {
      p_medicament_id: livraison.id,
      p_quantite: lvrQte,
      p_user_id: user.id,
    })

    if (error || !data?.success) {
      setMsg(`✗ ${data?.error || error?.message || "Erreur lors de l'enregistrement"}`)
      setSaving(false)
      setTimeout(() => setMsg(''), 4000)
      return
    }

    setMsg(`✓ ${lvrQte} unité${lvrQte > 1 ? 's' : ''} ajoutée${lvrQte > 1 ? 's' : ''} pour ${livraison.designation}`)
    setLivraison(null)
    setSaving(false)
    await fetchMeds()
    setTimeout(() => setMsg(''), 3000)
  }

  const visibles = medicaments.filter(m => showArchives ? !m.active : m.active !== false)
  const filtered = filterMedicaments(visibles, search, filtre)
  const nouveauMedExistant = showAjout ? findMedicamentExistant(nouveauMed.designation) : null

  return (
    <Layout navLinks={NAV}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Gestion du stock</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{medicaments.length} médicaments</p>
        </div>
        <button
          onClick={() => { setNouveauMed(NOUVEAU_MEDICAMENT); setShowAjout(true) }}
          className="btn-primary"
        >
          + Ajouter un médicament
        </button>
      </div>

      {msg && (
        <div className="bg-green-50 text-pharmacy-green text-sm px-4 py-2 rounded-lg border border-green-100 dark:bg-pharmacy-green/10 dark:border-pharmacy-green/20 dark:text-green-400 mb-4">
          {msg}
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          className="input-field max-w-xs"
          placeholder="Rechercher un médicament…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {['all', 'critique', 'epuise'].map(f => (
          <button key={f} onClick={() => setFiltre(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filtre === f ? 'bg-pharmacy-green text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}>
            {f === 'all' ? 'Tous' : f === 'critique' ? '⚠️ Critique' : '🔴 Épuisé'}
          </button>
        ))}
        <button onClick={() => setShowArchives(a => !a)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            showArchives ? 'bg-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}>
          {showArchives ? '📂 Archivés' : '🗄️ Voir les archivés'}
        </button>
      </div>

      {/* Tableau — desktop */}
      <div className="card overflow-hidden hidden sm:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 dark:bg-gray-900/50 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Désignation</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Qt Total</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Qt Livré</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sorti</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Qt en Stock</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">Chargement…</td></tr>
            ) : filtered.map(m => (
              <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{m.designation}</td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{m.stock + m.sortie}</td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{m.qte_livree}</td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{m.sortie}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-bold text-sm ${
                    m.stock === 0 ? 'text-red-600 dark:text-red-400' : m.stock <= 5 ? 'text-orange-600 dark:text-orange-400' : 'text-pharmacy-green'
                  }`}>{m.stock}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {!showArchives && (
                      <button
                        onClick={() => { setLivraison(m); setLvrQte(1) }}
                        className="text-xs px-2 py-1 rounded bg-pharmacy-green-light text-pharmacy-green hover:bg-green-200 dark:bg-pharmacy-green/20 dark:text-green-400 dark:hover:bg-pharmacy-green/30 transition-colors font-medium"
                      >
                        + Livraison
                      </button>
                    )}
                    <button
                      onClick={() => setEditMed({ id: m.id, designation: m.designation, stock: m.stock, stockOriginal: m.stock, qte_livree: m.qte_livree, seuil_alerte: m.seuil_alerte })}
                      className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => toggleActive(m)}
                      className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20 transition-colors font-medium"
                    >
                      {m.active === false ? 'Désarchiver' : 'Archiver'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(m)}
                      className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors font-medium"
                    >
                      Supprimer
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
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Aucun médicament trouvé</div>
        ) : filtered.map(m => (
          <div key={m.id} className="card p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="font-medium text-gray-900 dark:text-gray-100">{m.designation}</span>
              <span className={`font-bold text-sm flex-shrink-0 ${
                m.stock === 0 ? 'text-red-600 dark:text-red-400' : m.stock <= 5 ? 'text-orange-600 dark:text-orange-400' : 'text-pharmacy-green'
              }`}>{m.stock} en stock</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3 flex-wrap">
              <span>Qt Total : <span className="font-medium text-gray-700 dark:text-gray-300">{m.stock + m.sortie}</span></span>
              <span>Qt Livré : <span className="font-medium text-gray-700 dark:text-gray-300">{m.qte_livree}</span></span>
              <span>Sorti : <span className="font-medium text-gray-700 dark:text-gray-300">{m.sortie}</span></span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!showArchives && (
                <button
                  onClick={() => { setLivraison(m); setLvrQte(1) }}
                  className="text-xs px-2 py-1 rounded bg-pharmacy-green-light text-pharmacy-green hover:bg-green-200 dark:bg-pharmacy-green/20 dark:text-green-400 dark:hover:bg-pharmacy-green/30 transition-colors font-medium"
                >
                  + Livraison
                </button>
              )}
              <button
                onClick={() => setEditMed({ id: m.id, designation: m.designation, stock: m.stock, stockOriginal: m.stock, qte_livree: m.qte_livree, seuil_alerte: m.seuil_alerte })}
                className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Modifier
              </button>
              <button
                onClick={() => toggleActive(m)}
                className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20 transition-colors font-medium"
              >
                {m.active === false ? 'Désarchiver' : 'Archiver'}
              </button>
              <button
                onClick={() => setDeleteTarget(m)}
                className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal livraison */}
      <Modal open={!!livraison} onClose={() => setLivraison(null)} title="Enregistrer une livraison">
        {livraison && (
          <div className="max-w-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{livraison.designation}</p>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setLvrQte(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">−</button>
              <input type="number" min={1} value={lvrQte}
                onChange={e => setLvrQte(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field text-center text-lg font-medium" />
              <button onClick={() => setLvrQte(q => q + 1)}
                className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">+</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setLivraison(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={saveLivraison} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Enregistrement…' : 'Confirmer'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal ajout d'un nouveau médicament */}
      <Modal open={showAjout} onClose={() => setShowAjout(false)} title="Ajouter un médicament">
        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Désignation</label>
            <input
              type="text"
              className="input-field"
              placeholder="Nom du médicament"
              value={nouveauMed.designation}
              onChange={e => setNouveauMed(f => ({ ...f, designation: e.target.value }))}
              autoFocus
            />
            {nouveauMedExistant && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Ce médicament existe déjà (stock actuel : {nouveauMedExistant.stock}) — la quantité saisie sera ajoutée à son stock.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {nouveauMedExistant ? 'Quantité à ajouter au stock' : 'Stock initial'}
            </label>
            <input
              type="number"
              min={0}
              className="input-field"
              value={nouveauMed.stock}
              onChange={e => setNouveauMed(f => ({ ...f, stock: e.target.value }))}
            />
          </div>
          {!nouveauMedExistant && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seuil d'alerte</label>
              <input
                type="number"
                min={0}
                className="input-field"
                value={nouveauMed.seuil_alerte}
                onChange={e => setNouveauMed(f => ({ ...f, seuil_alerte: e.target.value }))}
              />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAjout(false)} className="btn-secondary flex-1">Annuler</button>
            <button onClick={saveNouveauMedicament} disabled={saving || !nouveauMed.designation.trim()} className="btn-primary flex-1">
              {saving ? 'Enregistrement…' : nouveauMedExistant ? 'Augmenter le stock' : 'Ajouter'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal modification d'un médicament existant */}
      <Modal open={!!editMed} onClose={() => setEditMed(null)} title="Modifier le médicament">
        {editMed && (
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Désignation</label>
              <input
                type="text"
                className="input-field"
                value={editMed.designation}
                onChange={e => setEditMed(f => ({ ...f, designation: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
              <input
                type="number"
                min={0}
                className="input-field"
                value={editMed.stock}
                onChange={e => setEditMed(f => ({ ...f, stock: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seuil d'alerte</label>
              <input
                type="number"
                min={0}
                className="input-field"
                value={editMed.seuil_alerte}
                onChange={e => setEditMed(f => ({ ...f, seuil_alerte: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditMed(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={saveEditMedicament} disabled={saving || !editMed.designation.trim()} className="btn-primary flex-1">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation de suppression */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer ce médicament ?"
        message={deleteTarget ? `« ${deleteTarget.designation} » sera définitivement supprimé. Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
        onConfirm={confirmDeleteMedicament}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  )
}
