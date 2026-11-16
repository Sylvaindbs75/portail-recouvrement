import { libelleEtape } from './etapes'
import { formatDateCourte } from './format'
import type { Dossier } from './types'

/** Neutralise les cellules qui seraient interprétées comme des formules par un tableur. */
function cellule(valeur: string): string {
  const sure = /^[=+\-@\t\r]/.test(valeur) ? `'${valeur}` : valeur
  return /[";\n\r]/.test(sure) ? `"${sure.replace(/"/g, '""')}"` : sure
}

/** Montant au format tableur français, sans symbole : 118050 → « 1180,50 » */
function montantTableur(centimes: number): string {
  return (centimes / 100).toFixed(2).replace('.', ',')
}

export const ENTETES_CSV = [
  'Référence',
  'Copropriété',
  'Lot',
  'Débiteur',
  'Solde dû (€)',
  'Étape',
  'Prochaine échéance',
  'Dernière mise à jour',
]

/** CSV séparé par des points-virgules, avec BOM pour un ouverture correcte dans Excel. */
export function dossiersVersCsv(dossiers: Dossier[]): string {
  const lignes = dossiers.map((d) =>
    [
      d.reference,
      d.immeuble,
      d.lot,
      d.debiteur_ref,
      montantTableur(d.solde_centimes),
      libelleEtape(d.etape),
      [d.libelle_echeance, d.prochaine_echeance ? formatDateCourte(d.prochaine_echeance) : '']
        .filter(Boolean)
        .join(' · '),
      formatDateCourte(d.mis_a_jour_le),
    ]
      .map(cellule)
      .join(';')
  )
  return '\uFEFF' + [ENTETES_CSV.join(';'), ...lignes].join('\r\n') + '\r\n'
}
