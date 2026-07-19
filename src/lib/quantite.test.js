import { describe, it, expect } from 'vitest'
import { clampQuantite } from './quantite'

describe('clampQuantite', () => {
  it('laisse une valeur valide inchangée', () => {
    expect(clampQuantite(3, 10)).toBe(3)
  })

  it('remonte à 1 une valeur inférieure ou nulle', () => {
    expect(clampQuantite(0, 10)).toBe(1)
    expect(clampQuantite(-5, 10)).toBe(1)
  })

  it('plafonne au stock disponible', () => {
    expect(clampQuantite(99, 5)).toBe(5)
  })

  it('retourne 0 quand le stock est épuisé, peu importe la saisie', () => {
    expect(clampQuantite(1, 0)).toBe(0)
    expect(clampQuantite(50, 0)).toBe(0)
  })

  it('retombe sur 1 pour une saisie non numérique', () => {
    expect(clampQuantite('abc', 10)).toBe(1)
    expect(clampQuantite(NaN, 10)).toBe(1)
  })

  it('parse une chaîne numérique comme le fait un input HTML', () => {
    expect(clampQuantite('7', 10)).toBe(7)
  })
})
