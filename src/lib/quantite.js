// Ramène une quantité saisie dans les bornes [1, stock].
// Si le stock est à 0, la quantité minimale valide reste 0 (rien à prélever).
export function clampQuantite(value, stock) {
  const n = Number.isFinite(value) ? value : parseInt(value, 10) || 1
  if (stock <= 0) return 0
  return Math.max(1, Math.min(stock, n))
}
