import { describe, it, expect } from 'vitest'
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns'
import { getDateRangeFilter } from './dateRange'

const NOW = new Date('2026-07-19T15:30:00.000Z') // dimanche

describe('getDateRangeFilter', () => {
  it("retourne le début de la journée pour le filtre 'today'", () => {
    const { from, to } = getDateRangeFilter('today', '', NOW)
    expect(from).toBe(startOfDay(NOW).toISOString())
    expect(to).toBeNull()
  })

  it("retourne le début de semaine (lundi) pour le filtre 'week'", () => {
    const { from } = getDateRangeFilter('week', '', NOW)
    // 19/07/2026 est un dimanche -> la semaine a commencé le 13/07/2026 (lundi)
    expect(from).toBe(startOfWeek(NOW, { weekStartsOn: 1 }).toISOString())
  })

  it("retourne le début de mois pour le filtre 'month'", () => {
    const { from } = getDateRangeFilter('month', '', NOW)
    expect(from).toBe(startOfMonth(NOW).toISOString())
  })

  it("calcule une plage from/to sur toute la journée pour une date spécifique", () => {
    const { from, to } = getDateRangeFilter('custom', '2026-07-10', NOW)
    expect(from).not.toBeNull()
    expect(to).not.toBeNull()
    expect(new Date(from).getDate()).toBe(10)
    expect(new Date(to).getHours()).toBe(23)
  })

  it("ne retourne aucune borne pour 'custom' sans date choisie", () => {
    const { from, to } = getDateRangeFilter('custom', '', NOW)
    expect(from).toBeNull()
    expect(to).toBeNull()
  })

  it('ne retourne aucune borne pour un filtre inconnu', () => {
    const { from, to } = getDateRangeFilter('bogus', '', NOW)
    expect(from).toBeNull()
    expect(to).toBeNull()
  })
})
