import type { Etape, StatutValidation } from './types'

export const ETAPES: { valeur: Etape; libelle: string }[] = [
  { valeur: 'amiable', libelle: 'Amiable' },
  { valeur: 'mise_en_demeure', libelle: 'Mise en demeure' },
  { valeur: 'assignation_a_valider', libelle: 'Assignation à valider' },
  { valeur: 'assignation_validee', libelle: 'Assignation validée' },
  { valeur: 'audience', libelle: 'Audience' },
  { valeur: 'jugement', libelle: 'Jugement' },
  { valeur: 'execution', libelle: 'Exécution' },
  { valeur: 'cloture', libelle: 'Clôturé' },
]

export function libelleEtape(etape: Etape): string {
  return ETAPES.find((e) => e.valeur === etape)?.libelle ?? etape
}

export function rangEtape(etape: Etape): number {
  return ETAPES.findIndex((e) => e.valeur === etape)
}

/** Regroupements utilisés pour le filtre de la liste (comme sur la maquette). */
export type Famille = 'tous' | 'amiable' | 'procedure' | 'execution' | 'cloture'

export const FAMILLES: { valeur: Famille; libelle: string }[] = [
  { valeur: 'tous', libelle: 'Tous' },
  { valeur: 'amiable', libelle: 'Amiable' },
  { valeur: 'procedure', libelle: 'Procédure' },
  { valeur: 'execution', libelle: 'Exécution' },
  { valeur: 'cloture', libelle: 'Clôturés' },
]

export function familleEtape(etape: Etape): Exclude<Famille, 'tous'> {
  switch (etape) {
    case 'amiable':
    case 'mise_en_demeure':
      return 'amiable'
    case 'assignation_a_valider':
    case 'assignation_validee':
    case 'audience':
    case 'jugement':
      return 'procedure'
    case 'execution':
      return 'execution'
    case 'cloture':
      return 'cloture'
  }
}

/** Grandes étapes affichées sur la frise de la fiche dossier. */
export const FRISE: { libelle: string; etapes: Etape[] }[] = [
  { libelle: 'Phase amiable', etapes: ['amiable', 'mise_en_demeure'] },
  { libelle: 'Assignation', etapes: ['assignation_a_valider', 'assignation_validee'] },
  { libelle: 'Audience', etapes: ['audience'] },
  { libelle: 'Jugement', etapes: ['jugement'] },
  { libelle: 'Exécution', etapes: ['execution', 'cloture'] },
]

export function etatFrise(
  etapeCourante: Etape
): { libelle: string; etat: 'fait' | 'en_cours' | 'a_venir' }[] {
  const indexCourant = FRISE.findIndex((f) => f.etapes.includes(etapeCourante))
  return FRISE.map((f, i) => ({
    libelle: f.libelle,
    etat:
      etapeCourante === 'cloture' || i < indexCourant
        ? 'fait'
        : i === indexCourant
          ? 'en_cours'
          : 'a_venir',
  }))
}

export const LIBELLES_STATUT: Record<StatutValidation, string> = {
  en_attente: 'En attente',
  validee: 'Validée',
  modification_demandee: 'Modification demandée',
}
