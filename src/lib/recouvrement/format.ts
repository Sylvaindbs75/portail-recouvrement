const euros = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** 118050 → « 1 180,50 € » (espaces insécables du format français). */
export function formatEuros(centimes: number): string {
  return euros.format(centimes / 100)
}

/**
 * « 1 180,50 € », « 1180.5 », « 1 180 » → 118050.
 * Renvoie null si la saisie n'est pas un montant positif valide.
 */
export function parseEuros(saisie: string): number | null {
  const nettoye = saisie
    .replace(/\s/g, '') // \s couvre aussi les espaces insécables
    .replace(/€$/, '')
    .replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(nettoye)) return null
  const [entier, decimales = ''] = nettoye.split('.')
  return Number(entier) * 100 + Number(decimales.padEnd(2, '0'))
}

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function decouper(dateIso: string): [number, number, number] {
  const [a, m, j] = dateIso.slice(0, 10).split('-').map(Number)
  return [a, m, j]
}

/** « 2026-12-10 » → « 10 déc. 2026 » */
export function formatDateCourte(dateIso: string): string {
  const [a, m, j] = decouper(dateIso)
  return `${j === 1 ? '1er' : j} ${MOIS_COURTS[m - 1]} ${a}`
}

/** « 2026-12-10 » → « 10 décembre 2026 » */
export function formatDateLongue(dateIso: string): string {
  const [a, m, j] = decouper(dateIso)
  return `${j === 1 ? '1er' : j} ${MOIS_LONGS[m - 1]} ${a}`
}

/** Date du jour au format AAAA-MM-JJ (fuseau du navigateur). */
export function aujourdhui(maintenant: Date = new Date()): string {
  const a = maintenant.getFullYear()
  const m = String(maintenant.getMonth() + 1).padStart(2, '0')
  const j = String(maintenant.getDate()).padStart(2, '0')
  return `${a}-${m}-${j}`
}
