import { familleEtape, type Famille } from './etapes'
import type { Dossier, Validation } from './types'

export const SEUIL_SANS_MISE_A_JOUR_JOURS = 30

/** Nombre de jours entiers entre deux dates AAAA-MM-JJ (b - a). */
export function joursEntre(a: string, b: string): number {
  const ms = Date.UTC(...ymd(b)) - Date.UTC(...ymd(a))
  return Math.round(ms / 86_400_000)
}

function ymd(d: string): [number, number, number] {
  const [y, m, j] = d.slice(0, 10).split('-').map(Number)
  return [y, m - 1, j]
}

export function soldeTotal(dossiers: Pick<Dossier, 'solde_centimes'>[]): number {
  return dossiers.reduce((total, d) => total + d.solde_centimes, 0)
}

export function filtrerParFamille<T extends Pick<Dossier, 'etape'>>(dossiers: T[], famille: Famille): T[] {
  if (famille === 'tous') return dossiers
  return dossiers.filter((d) => familleEtape(d.etape) === famille)
}

export type DossierEnRetard<T> = T & { jours_sans_mise_a_jour: number }

export function sansMiseAJour<T extends Pick<Dossier, 'mis_a_jour_le' | 'etape'>>(
  dossiers: T[],
  dateDuJour: string,
  seuil = SEUIL_SANS_MISE_A_JOUR_JOURS
): DossierEnRetard<T>[] {
  return dossiers
    .filter((d) => d.etape !== 'cloture')
    .map((d) => ({ ...d, jours_sans_mise_a_jour: joursEntre(d.mis_a_jour_le, dateDuJour) }))
    .filter((d) => d.jours_sans_mise_a_jour > seuil)
    .sort((a, b) => b.jours_sans_mise_a_jour - a.jours_sans_mise_a_jour)
}

export function audiencesAVenir<T extends Pick<Dossier, 'etape' | 'prochaine_echeance'>>(
  dossiers: T[],
  dateDuJour: string
): T[] {
  return dossiers
    .filter((d) => d.etape === 'audience' && d.prochaine_echeance && d.prochaine_echeance >= dateDuJour)
    .sort((a, b) => (a.prochaine_echeance ?? '').localeCompare(b.prochaine_echeance ?? ''))
}

export function validationsEnAttente<T extends Pick<Validation, 'statut'>>(validations: T[]): T[] {
  return validations.filter((v) => v.statut === 'en_attente')
}

export type Indicateurs = {
  nombreDossiers: number
  soldeTotalCentimes: number
  actionsAValider: number
  prochaineAudience: string | null
  audiencesAVenir: number
}

export function indicateursTableauDeBord(
  dossiers: Dossier[],
  validations: Pick<Validation, 'statut'>[],
  dateDuJour: string
): Indicateurs {
  const audiences = audiencesAVenir(dossiers, dateDuJour)
  return {
    nombreDossiers: dossiers.length,
    soldeTotalCentimes: soldeTotal(dossiers),
    actionsAValider: validationsEnAttente(validations).length,
    prochaineAudience: audiences[0]?.prochaine_echeance ?? null,
    audiencesAVenir: audiences.length,
  }
}
