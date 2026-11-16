import { describe, expect, it } from 'vitest'
import { dossiersVersCsv } from './csv'
import { etatFrise, familleEtape } from './etapes'
import { formatDateCourte, formatEuros, parseEuros } from './format'
import {
  filtrerParFamille,
  indicateursTableauDeBord,
  joursEntre,
  sansMiseAJour,
  soldeTotal,
} from './indicateurs'
import type { Dossier, Validation } from './types'

// Recette PRD §10 — date de référence fixée.
const AUJOURDHUI = '2026-11-16'
const ALPHA = 'syndic-alpha'
const BETA = 'syndic-beta'

function dossier(p: Partial<Dossier> & Pick<Dossier, 'reference' | 'syndic_id' | 'solde_centimes' | 'etape' | 'mis_a_jour_le'>): Dossier {
  return {
    id: p.reference,
    immeuble: 'SDC fictif',
    lot: 'Lot',
    debiteur_ref: 'Débiteur fictif',
    prochaine_echeance: null,
    libelle_echeance: null,
    ...p,
  }
}

const DOSSIERS: Dossier[] = [
  dossier({ reference: 'A-001', syndic_id: ALPHA, lot: 'Lot 12', solde_centimes: 325000, etape: 'mise_en_demeure', mis_a_jour_le: '2026-11-02' }),
  dossier({ reference: 'A-002', syndic_id: ALPHA, lot: 'Lot 4 (parking)', solde_centimes: 118050, etape: 'assignation_a_valider', mis_a_jour_le: '2026-11-10' }),
  dossier({ reference: 'A-003', syndic_id: ALPHA, lot: 'Lot 7', solde_centimes: 642000, etape: 'audience', prochaine_echeance: '2026-12-10', mis_a_jour_le: '2026-10-05' }),
  dossier({ reference: 'B-001', syndic_id: BETA, lot: 'Lot 2', solde_centimes: 250000, etape: 'amiable', mis_a_jour_le: '2026-11-12' }),
  dossier({ reference: 'B-002', syndic_id: BETA, lot: 'Lot 9', solde_centimes: 987025, etape: 'execution', mis_a_jour_le: '2026-09-01' }),
]
const VALIDATIONS_ALPHA: Pick<Validation, 'statut'>[] = [{ statut: 'en_attente' }]

const alpha = DOSSIERS.filter((d) => d.syndic_id === ALPHA)
const beta = DOSSIERS.filter((d) => d.syndic_id === BETA)

/** Remplace les espaces insécables du format français par des espaces simples. */
const texte = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ')

describe('format des montants', () => {
  it('affiche 1 180,50 €', () => {
    expect(texte(formatEuros(118050))).toBe('1 180,50 €')
  })
  it('reconnaît les saisies françaises', () => {
    expect(parseEuros('1 180,50 €')).toBe(118050)
    expect(parseEuros('1\u202f180,50\u00a0€')).toBe(118050)
    expect(parseEuros('1180.5')).toBe(118050)
    expect(parseEuros('3250')).toBe(325000)
    expect(parseEuros('0,07')).toBe(7)
  })
  it('refuse les saisies invalides', () => {
    expect(parseEuros('')).toBeNull()
    expect(parseEuros('-12')).toBeNull()
    expect(parseEuros('12,345')).toBeNull()
    expect(parseEuros('douze')).toBeNull()
  })
})

describe('dates', () => {
  it('formate en français', () => {
    expect(formatDateCourte('2026-12-10')).toBe('10 déc. 2026')
    expect(formatDateCourte('2026-09-01')).toBe('1er sept. 2026')
  })
  it('compte les jours', () => {
    expect(joursEntre('2026-10-05', AUJOURDHUI)).toBe(42)
    expect(joursEntre('2026-09-01', AUJOURDHUI)).toBe(76)
  })
})

describe('recette PRD §10', () => {
  it('tableau de bord Syndic Alpha', () => {
    const i = indicateursTableauDeBord(alpha, VALIDATIONS_ALPHA, AUJOURDHUI)
    expect(i.nombreDossiers).toBe(3)
    expect(texte(formatEuros(i.soldeTotalCentimes))).toBe('10 850,50 €')
    expect(i.actionsAValider).toBe(1)
    expect(i.audiencesAVenir).toBe(1)
    expect(i.prochaineAudience).toBe('2026-12-10')
  })

  it('tableau de bord Syndic Beta', () => {
    const i = indicateursTableauDeBord(beta, [], AUJOURDHUI)
    expect(i.nombreDossiers).toBe(2)
    expect(texte(formatEuros(i.soldeTotalCentimes))).toBe('12 370,25 €')
    expect(i.actionsAValider).toBe(0)
  })

  it('espace cabinet', () => {
    expect(DOSSIERS).toHaveLength(5)
    expect(texte(formatEuros(soldeTotal(DOSSIERS)))).toBe('23 220,75 €')
    const retard = sansMiseAJour(DOSSIERS, AUJOURDHUI)
    expect(retard.map((d) => [d.reference, d.jours_sans_mise_a_jour])).toEqual([
      ['B-002', 76],
      ['A-003', 42],
    ])
  })

  it('seuil de relance réglable', () => {
    expect(sansMiseAJour(DOSSIERS, AUJOURDHUI, 13).map((d) => d.reference)).toEqual(['B-002', 'A-003', 'A-001'])
  })

  it('export CSV Alpha : 3 lignes, aucune ligne Beta', () => {
    const csv = dossiersVersCsv(alpha)
    const lignes = csv.replace(/^\uFEFF/, '').trim().split('\r\n')
    expect(lignes).toHaveLength(4) // en-tête + 3 dossiers
    expect(csv).not.toContain('B-00')
    expect(lignes[2]).toContain('1180,50')
  })
})

describe('filtres et étapes', () => {
  it('filtre par famille comme la maquette', () => {
    expect(filtrerParFamille(DOSSIERS, 'amiable').map((d) => d.reference)).toEqual(['A-001', 'B-001'])
    expect(filtrerParFamille(DOSSIERS, 'procedure').map((d) => d.reference)).toEqual(['A-002', 'A-003'])
    expect(filtrerParFamille(DOSSIERS, 'execution').map((d) => d.reference)).toEqual(['B-002'])
    expect(filtrerParFamille(DOSSIERS, 'tous')).toHaveLength(5)
    expect(familleEtape('cloture')).toBe('cloture')
  })

  it('frise de la fiche dossier', () => {
    expect(etatFrise('assignation_a_valider').map((f) => f.etat)).toEqual([
      'fait',
      'en_cours',
      'a_venir',
      'a_venir',
      'a_venir',
    ])
    expect(etatFrise('cloture').every((f) => f.etat === 'fait')).toBe(true)
  })
})

describe('sécurité de l’export', () => {
  it('neutralise les formules et échappe les séparateurs', () => {
    const piege = dossier({
      reference: 'X-1',
      syndic_id: ALPHA,
      solde_centimes: 100,
      etape: 'amiable',
      mis_a_jour_le: AUJOURDHUI,
      debiteur_ref: '=HYPERLINK("http://exemple.invalid")',
      immeuble: 'SDC "Les Pins"; bât. A',
    })
    const ligne = dossiersVersCsv([piege]).trim().split('\r\n')[1]
    expect(ligne).toContain(`"'=HYPERLINK(""http://exemple.invalid"")"`)
    expect(ligne).toContain('"SDC ""Les Pins""; bât. A"')
  })
})
