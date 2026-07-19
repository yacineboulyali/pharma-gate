import { startOfDay, startOfWeek, startOfMonth } from 'date-fns'

// Calcule la borne de début (et fin, pour une date spécifique) d'une période de filtre.
// Retourne { from, to } en ISO string, ou { from: null, to: null } si non déterminable
// (ex: filtre "custom" sans date choisie).
export function getDateRangeFilter(filtre, customDate, now = new Date()) {
  let from = null
  let to = null

  if (filtre === 'today') {
    from = startOfDay(now).toISOString()
  } else if (filtre === 'week') {
    from = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
  } else if (filtre === 'month') {
    from = startOfMonth(now).toISOString()
  } else if (filtre === 'custom' && customDate) {
    from = startOfDay(new Date(customDate)).toISOString()
    const end = new Date(customDate)
    end.setHours(23, 59, 59, 999)
    to = end.toISOString()
  }

  return { from, to }
}
