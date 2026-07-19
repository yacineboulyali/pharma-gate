// Filtre une liste de médicaments par texte de recherche et par statut de stock.
export function filterMedicaments(medicaments, search, filtre) {
  const term = search.toLowerCase()
  return medicaments.filter(m => {
    const matchSearch = m.designation.toLowerCase().includes(term)
    const matchFiltre =
      filtre === 'critique' ? m.stock <= (m.seuil_alerte || 5) :
      filtre === 'epuise' ? m.stock === 0 :
      true
    return matchSearch && matchFiltre
  })
}
