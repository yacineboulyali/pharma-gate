import { describe, it, expect } from 'vitest'
import { aggregateTopMedicaments, aggregateTopPatients } from './stats'

const SORTIES = [
  { quantite: 5, medicaments: { designation: 'Amian 200mg 30cp' }, patients: { nom: 'Karim Alaoui' } },
  { quantite: 3, medicaments: { designation: 'Amian 200mg 30cp' }, patients: { nom: 'Karim Alaoui' } },
  { quantite: 2, medicaments: { designation: 'Daflon 1000mg 30 cp' }, patients: { nom: 'Sara Idrissi' } },
  { quantite: 1, medicaments: null, patients: null },
]

describe('aggregateTopMedicaments', () => {
  it('additionne les quantités par médicament et trie du plus au moins vendu', () => {
    const top = aggregateTopMedicaments(SORTIES)
    expect(top[0]).toEqual({ name: 'Amian 200mg', total: 8 })
    expect(top[1]).toEqual({ name: 'Daflon 1000mg', total: 2 })
  })

  it('regroupe les médicaments manquants sous "Inconnu"', () => {
    const top = aggregateTopMedicaments(SORTIES)
    expect(top.some(t => t.name === 'Inconnu')).toBe(true)
  })

  it('respecte la limite et le nombre de mots du nom', () => {
    const top = aggregateTopMedicaments(SORTIES, { limit: 1, nameWords: 1 })
    expect(top).toHaveLength(1)
    expect(top[0].name).toBe('Amian')
  })

  it('gère une liste vide ou undefined sans planter', () => {
    expect(aggregateTopMedicaments([])).toEqual([])
    expect(aggregateTopMedicaments(undefined)).toEqual([])
  })
})

describe('aggregateTopPatients', () => {
  it('compte le nombre de sorties par patient', () => {
    const top = aggregateTopPatients(SORTIES)
    expect(top[0]).toEqual({ name: 'Karim Alaoui', value: 2 })
    expect(top[1]).toEqual({ name: 'Sara Idrissi', value: 1 })
  })

  it('regroupe les sorties sans patient sous "Anonyme"', () => {
    const top = aggregateTopPatients(SORTIES)
    expect(top.some(t => t.name === 'Anonyme')).toBe(true)
  })
})
