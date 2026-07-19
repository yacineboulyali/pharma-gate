// Agrège les quantités sorties par médicament et retourne le top N,
// avec le nom tronqué à `nameWords` mots pour l'affichage en graphique.
export function aggregateTopMedicaments(sorties, { limit = 5, nameWords = 2 } = {}) {
  const medCount = {}
  ;(sorties || []).forEach(s => {
    const name = s.medicaments?.designation || 'Inconnu'
    medCount[name] = (medCount[name] || 0) + s.quantite
  })
  return Object.entries(medCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, total]) => ({ name: name.split(' ').slice(0, nameWords).join(' '), total }))
}

// Agrège le nombre de sorties par patient et retourne le top N.
export function aggregateTopPatients(sorties, { limit = 5 } = {}) {
  const patCount = {}
  ;(sorties || []).forEach(s => {
    const name = s.patients?.nom || 'Anonyme'
    patCount[name] = (patCount[name] || 0) + 1
  })
  return Object.entries(patCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }))
}
