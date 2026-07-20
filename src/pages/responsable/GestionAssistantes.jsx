import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Layout from '../../components/Layout'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { PencilIcon, TrashIcon, ArchiveIcon, ArchiveRestoreIcon } from '../../components/Icons'

const NAV = [
  { to: '/responsable', label: 'Dashboard' },
  { to: '/responsable/sortie', label: 'Enregistrer une sortie' },
  { to: '/responsable/statistiques', label: 'Statistiques' },
  { to: '/responsable/stock', label: 'Stock' },
  { to: '/responsable/patients', label: 'Patients' },
  { to: '/responsable/assistantes', label: 'Assistantes' },
  { to: '/responsable/historique', label: 'Historique' },
]

export default function GestionAssistantes() {
  const { user } = useAuth()
  const [assistantes, setAssistantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', full_name: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [editAssistante, setEditAssistante] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { fetchAssistantes() }, [])

  async function fetchAssistantes() {
    const { data } = await supabase
      .from('users')
      .select('id, username, full_name, active, created_at')
      .eq('role', 'assistante')
      .order('created_at', { ascending: false })
    setAssistantes(data || [])
    setLoading(false)
  }

  async function createAssistante() {
    setSaving(true)
    setError('')
    try {
      // La création via admin.createUser nécessite une clé service_role, indisponible côté client.
      // En attendant une Edge Function dédiée, on utilise signUp côté client.
      const email = `${form.username.toLowerCase()}@pharmagest.local`
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: form.password })

      if (authError) throw authError

      const userId = authData.user?.id
      if (!userId) throw new Error('Impossible de créer le compte')

      await supabase.from('users').insert({
        id: userId,
        username: form.username,
        full_name: form.full_name,
        role: 'assistante',
        created_by: user.id,
      })

      setMsg(`✓ Compte créé pour ${form.username}`)
      setForm({ username: '', full_name: '', password: '' })
      setShowForm(false)
      await fetchAssistantes()
      setTimeout(() => setMsg(''), 4000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(assistante) {
    await supabase.from('users').update({ active: !assistante.active }).eq('id', assistante.id)
    await fetchAssistantes()
  }

  async function saveEditAssistante() {
    if (!editAssistante || !editAssistante.username.trim()) return
    setSaving(true)
    setError('')

    const { error } = await supabase
      .from('users')
      .update({
        username: editAssistante.username.trim(),
        full_name: editAssistante.full_name.trim(),
      })
      .eq('id', editAssistante.id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    setMsg(`✓ ${editAssistante.username} mis à jour`)
    setEditAssistante(null)
    setSaving(false)
    await fetchAssistantes()
    setTimeout(() => setMsg(''), 3000)
  }

  async function confirmDeleteAssistante() {
    if (!deleteTarget) return
    const assistante = deleteTarget
    setDeleteTarget(null)
    setMsg('')

    const { error } = await supabase.from('users').delete().eq('id', assistante.id)

    if (error) {
      setMsg(`✗ ${error.message}`)
      setTimeout(() => setMsg(''), 4000)
      return
    }

    setMsg(`✓ Compte ${assistante.username} supprimé`)
    await fetchAssistantes()
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <Layout navLinks={NAV}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Gestion des assistantes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{assistantes.length} assistante{assistantes.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setError(''); setShowForm(!showForm) }} className="btn-primary">
          + Nouvelle assistante
        </button>
      </div>

      {msg && <div className="bg-green-50 text-pharmacy-green dark:bg-pharmacy-green/10 dark:text-green-400 text-sm px-4 py-2 rounded-lg mb-4">{msg}</div>}

      {/* Formulaire création */}
      {showForm && (
        <div className="card p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Créer un compte assistante</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Identifiant *</label>
              <input className="input-field" placeholder="ex: sara.benali" value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom complet</label>
              <input className="input-field" placeholder="Sara Benali" value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mot de passe *</label>
              <input type="password" className="input-field" placeholder="••••••••" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
            <button onClick={createAssistante} disabled={saving || !form.username || !form.password}
              className="btn-primary">
              {saving ? 'Création…' : 'Créer le compte'}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            ℹ️ La création de compte depuis l'app client nécessite une Edge Function Supabase en production. En développement, utilisez le dashboard Supabase &gt; Authentication.
          </p>
        </div>
      )}

      {/* Liste — desktop */}
      <div className="card overflow-hidden hidden sm:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 dark:bg-gray-900/50 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Identifiant</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400 dark:text-gray-500">Chargement…</td></tr>
            ) : assistantes.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400 dark:text-gray-500">Aucune assistante créée</td></tr>
            ) : assistantes.map(a => (
              <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{a.username}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.full_name || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={a.active ? 'badge-green' : 'badge-red'}>
                    {a.active ? 'Active' : 'Archivée'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => { setError(''); setEditAssistante({ id: a.id, username: a.username, full_name: a.full_name || '' }) }}
                      title="Modifier"
                      className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      <PencilIcon />
                    </button>
                    <button onClick={() => toggleActive(a)}
                      title={a.active ? 'Archiver' : 'Désarchiver'}
                      className={`p-1.5 rounded transition-colors ${
                        a.active
                          ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20'
                          : 'bg-green-50 text-pharmacy-green hover:bg-green-100 dark:bg-pharmacy-green/10 dark:text-green-400 dark:hover:bg-pharmacy-green/20'
                      }`}>
                      {a.active ? <ArchiveIcon /> : <ArchiveRestoreIcon />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(a)}
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
        ) : assistantes.length === 0 ? (
          <div className="card p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Aucune assistante créée</div>
        ) : assistantes.map(a => (
          <div key={a.id} className="card p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{a.username}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{a.full_name || '—'}</p>
              </div>
              <span className={a.active ? 'badge-green' : 'badge-red'}>
                {a.active ? 'Active' : 'Archivée'}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setError(''); setEditAssistante({ id: a.id, username: a.username, full_name: a.full_name || '' }) }}
                title="Modifier"
                className="p-1.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <PencilIcon />
              </button>
              <button onClick={() => toggleActive(a)}
                title={a.active ? 'Archiver' : 'Désarchiver'}
                className={`p-1.5 rounded transition-colors ${
                  a.active
                    ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20'
                    : 'bg-green-50 text-pharmacy-green hover:bg-green-100 dark:bg-pharmacy-green/10 dark:text-green-400 dark:hover:bg-pharmacy-green/20'
                }`}>
                {a.active ? <ArchiveIcon /> : <ArchiveRestoreIcon />}
              </button>
              <button
                onClick={() => setDeleteTarget(a)}
                title="Supprimer"
                className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal modification assistante */}
      <Modal open={!!editAssistante} onClose={() => setEditAssistante(null)} title="Modifier l'assistante">
        {editAssistante && (
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Identifiant</label>
              <input
                type="text"
                className="input-field"
                value={editAssistante.username}
                onChange={e => setEditAssistante(f => ({ ...f, username: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom complet</label>
              <input
                type="text"
                className="input-field"
                value={editAssistante.full_name}
                onChange={e => setEditAssistante(f => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditAssistante(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={saveEditAssistante} disabled={saving || !editAssistante.username.trim()} className="btn-primary flex-1">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation de suppression */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer ce compte ?"
        message={deleteTarget ? `Le compte « ${deleteTarget.username} » sera définitivement supprimé. Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
        onConfirm={confirmDeleteAssistante}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  )
}
