import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Layout from '../../components/Layout'
import { clampQuantite } from '../../lib/quantite'

const ASSISTANTE_NAV = [
  { to: '/assistante', label: 'Accueil' },
  { to: '/assistante/sortie', label: 'Enregistrer une sortie' },
  { to: '/assistante/statistiques', label: 'Statistiques' },
  { to: '/assistante/log', label: 'Mon historique' },
]

const RESPONSABLE_NAV = [
  { to: '/responsable', label: 'Dashboard' },
  { to: '/responsable/sortie', label: 'Enregistrer une sortie' },
  { to: '/responsable/statistiques', label: 'Statistiques' },
  { to: '/responsable/stock', label: 'Stock' },
  { to: '/responsable/patients', label: 'Patients' },
  { to: '/responsable/assistantes', label: 'Assistantes' },
  { to: '/responsable/historique', label: 'Historique' },
]

export default function SaisieSortie() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const isResponsable = profile?.role === 'responsable'
  const NAV = isResponsable ? RESPONSABLE_NAV : ASSISTANTE_NAV
  const logRoute = isResponsable ? '/responsable/historique' : '/assistante/log'

  // État du formulaire
  const [step, setStep] = useState(1) // 1: médicament, 2: patient+qte, 3: confirmation
  const [medSearch, setMedSearch] = useState('')
  const [medResults, setMedResults] = useState([])
  const [selectedMed, setSelectedMed] = useState(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [quantite, setQuantite] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')
  const medInputRef = useRef()

  // Recherche médicament en temps réel
  useEffect(() => {
    if (medSearch.length < 2) { setMedResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('medicaments')
        .select('id, designation, stock')
        .ilike('designation', `%${medSearch}%`)
        .order('designation')
        .limit(10)
      setMedResults(data || [])
    }, 200)
    return () => clearTimeout(timer)
  }, [medSearch])

  // Recherche patient en temps réel
  useEffect(() => {
    if (patientSearch.length < 2) { setPatientResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, nom')
        .ilike('nom', `%${patientSearch}%`)
        .order('nom')
        .limit(8)
      setPatientResults(data || [])
    }, 200)
    return () => clearTimeout(timer)
  }, [patientSearch])

  function selectMed(med) {
    setSelectedMed(med)
    setMedSearch(med.designation)
    setMedResults([])
    setQuantite(q => clampQuantite(q, med.stock))
    setStep(2)
  }

  function selectPatient(patient) {
    setSelectedPatient(patient)
    setPatientSearch(patient.nom)
    setPatientResults([])
  }

  async function handleConfirm() {
    if (!selectedMed || !patientSearch.trim() || quantite < 1 || selectedMed.stock < 1) return
    setLoading(true)
    setError('')

    try {
      const { data, error: fnError } = await supabase
        .rpc('enregistrer_sortie', {
          p_medicament_id: selectedMed.id,
          p_patient_nom: patientSearch.trim(),
          p_quantite: quantite,
          p_user_id: user.id,
        })

      if (fnError) throw fnError
      if (!data.success) throw new Error(data.error)

      setSuccess({
        medicament: selectedMed.designation,
        patient: patientSearch,
        quantite,
        nouveau_stock: data.nouveau_stock,
      })
      setStep(3)
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep(1)
    setMedSearch('')
    setMedResults([])
    setSelectedMed(null)
    setPatientSearch('')
    setPatientResults([])
    setSelectedPatient(null)
    setQuantite(1)
    setSuccess(null)
    setError('')
    setTimeout(() => medInputRef.current?.focus(), 100)
  }

  return (
    <Layout navLinks={NAV}>
      <div className="max-w-lg mx-auto">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Enregistrer une sortie</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Étape {step < 3 ? step : '✓'} sur 2
        </p>

        {/* Indicateur d'étapes */}
        <div className="flex items-center gap-2 mb-8">
          {['Médicament', 'Patient & quantité'].map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                step > i + 1 || step === 3
                  ? 'bg-pharmacy-green text-white'
                  : step === i + 1
                  ? 'bg-pharmacy-green text-white ring-4 ring-pharmacy-green-light dark:ring-pharmacy-green/20'
                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {step > i + 1 || step === 3 ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${step === i + 1 ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                {label}
              </span>
              {i === 0 && <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 mx-2" />}
            </div>
          ))}
        </div>

        {/* ÉTAPE 3 : Succès */}
        {step === 3 && success && (
          <div className="card p-6 text-center">
            <div className="w-14 h-14 bg-green-50 dark:bg-pharmacy-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-pharmacy-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-1">Sortie enregistrée</h2>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mt-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Médicament</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{success.medicament}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Patient</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{success.patient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Quantité</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{success.quantite}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Stock restant</span>
                <span className={`font-medium ${success.nouveau_stock <= 5 ? 'text-orange-600 dark:text-orange-400' : 'text-pharmacy-green'}`}>
                  {success.nouveau_stock}
                  {success.nouveau_stock <= 5 && ' ⚠️'}
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={reset} className="btn-primary flex-1">
                Nouvelle sortie
              </button>
              <button onClick={() => navigate(logRoute)} className="btn-secondary flex-1">
                Voir le log
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 1 : Recherche médicament */}
        {step === 1 && (
          <div className="card p-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rechercher le médicament
            </label>
            <div className="relative">
              <input
                ref={medInputRef}
                type="text"
                className="input-field pr-8"
                placeholder="Tapez le nom… (ex: Amian, Haldol)"
                value={medSearch}
                onChange={e => { setMedSearch(e.target.value); setSelectedMed(null) }}
                autoFocus
              />
              {medSearch && (
                <button
                  onClick={() => { setMedSearch(''); setMedResults([]) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >✕</button>
              )}
            </div>

            {/* Dropdown résultats */}
            {medResults.length > 0 && (
              <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                {medResults.map(med => (
                  <button
                    key={med.id}
                    onClick={() => selectMed(med)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{med.designation}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        med.stock === 0
                          ? 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                          : med.stock <= 5
                          ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
                          : 'bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                      }`}>
                        Stock : {med.stock}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {medSearch.length >= 2 && medResults.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center py-4">
                Aucun médicament trouvé pour « {medSearch} »
              </p>
            )}
          </div>
        )}

        {/* ÉTAPE 2 : Patient + quantité */}
        {step === 2 && selectedMed && (
          <div className="card p-5 space-y-5">
            {/* Récapitulatif médicament */}
            <div className="flex items-center justify-between bg-pharmacy-green-light dark:bg-pharmacy-green/20 rounded-lg px-4 py-3">
              <div>
                <p className="text-xs text-pharmacy-green dark:text-green-400 font-medium">Médicament sélectionné</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{selectedMed.designation}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Stock</p>
                <p className="text-lg font-bold text-pharmacy-green dark:text-green-400">{selectedMed.stock}</p>
              </div>
            </div>

            {/* Recherche patient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom du patient
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Tapez le nom du patient…"
                  value={patientSearch}
                  onChange={e => { setPatientSearch(e.target.value); setSelectedPatient(null) }}
                  autoFocus
                />
              </div>

              {patientResults.length > 0 && (
                <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                  {patientResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => selectPatient(p)}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center gap-2"
                    >
                      <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-xs flex items-center justify-center font-medium">
                        {p.nom.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{p.nom}</span>
                    </button>
                  ))}
                </div>
              )}

              {patientSearch.length >= 2 && patientResults.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Patient inconnu — sera créé automatiquement
                </p>
              )}
            </div>

            {/* Quantité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantité
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantite(q => clampQuantite(q - 1, selectedMed.stock))}
                  className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xl font-light"
                >−</button>
                <input
                  type="number"
                  min={1}
                  max={selectedMed.stock}
                  value={quantite}
                  onChange={e => setQuantite(clampQuantite(e.target.value, selectedMed.stock))}
                  className="input-field text-center w-20 text-lg font-medium"
                />
                <button
                  onClick={() => setQuantite(q => clampQuantite(q + 1, selectedMed.stock))}
                  className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xl font-light"
                >+</button>
                <span className="text-xs text-gray-400 dark:text-gray-500">/ {selectedMed.stock} disponible{selectedMed.stock > 1 ? 's' : ''}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                ← Retour
              </button>
              <button
                onClick={handleConfirm}
                className="btn-primary flex-1"
                disabled={loading || !patientSearch.trim() || quantite < 1 || selectedMed.stock < 1}
              >
                {loading ? 'Enregistrement…' : 'Confirmer la sortie'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
