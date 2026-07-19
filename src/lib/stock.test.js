import { describe, it, expect } from 'vitest'
import { filterMedicaments } from './stock'

const MEDS = [
  { id: 1, designation: 'Amian 200mg 30cp', stock: 76, seuil_alerte: 5 },
  { id: 2, designation: 'Amep 10 mg 28 cp', stock: 0, seuil_alerte: 5 },
  { id: 3, designation: 'Aldactone 50 mg 20 cp', stock: 4, seuil_alerte: 5 },
  { id: 4, designation: 'Daflon 1000mg 30 cp', stock: 20, seuil_alerte: 10 },
]

describe('filterMedicaments', () => {
  it('retourne tout quand la recherche est vide et le filtre "all"', () => {
    expect(filterMedicaments(MEDS, '', 'all')).toHaveLength(4)
  })

  it('filtre par texte, insensible à la casse', () => {
    const result = filterMedicaments(MEDS, 'amian', 'all')
    expect(result).toEqual([MEDS[0]])
  })

  it('filtre les médicaments en stock critique (<= seuil_alerte, seuil par défaut 5)', () => {
    const result = filterMedicaments(MEDS, '', 'critique')
    expect(result.map(m => m.id)).toEqual([2, 3])
  })

  it('filtre les médicaments épuisés (stock === 0)', () => {
    const result = filterMedicaments(MEDS, '', 'epuise')
    expect(result.map(m => m.id)).toEqual([2])
  })

  it('combine recherche texte et filtre de statut', () => {
    const result = filterMedicaments(MEDS, 'daflon', 'critique')
    expect(result).toHaveLength(0) // Daflon (20/seuil 10) n'est pas critique
  })
})
