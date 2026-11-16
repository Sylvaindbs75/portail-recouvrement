import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type {
  Dossier,
  Etape,
  Evenement,
  Piece,
  Profil,
  StatutValidation,
  Syndic,
  Validation,
} from './types'

/** Toutes les lectures passent par la clé publique : la base ne renvoie que ce que la RLS autorise. */

function verifier<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

const COLONNES_DOSSIER =
  'id, reference, syndic_id, immeuble, lot, debiteur_ref, solde_centimes, etape, prochaine_echeance, libelle_echeance, mis_a_jour_le'

export const requetes = {
  profil: (userId: string) =>
    queryOptions({
      queryKey: ['profil', userId],
      queryFn: async () =>
        verifier<Profil | null>(
          await supabase
            .from('profils')
            .select('id, email, nom_affiche, role, syndic_id')
            .eq('id', userId)
            .maybeSingle()
        ),
      staleTime: Infinity,
    }),

  syndics: () =>
    queryOptions({
      queryKey: ['syndics'],
      queryFn: async () =>
        verifier<Syndic[]>(await supabase.from('syndics').select('id, nom').order('nom')),
    }),

  dossiers: () =>
    queryOptions({
      queryKey: ['dossiers'],
      queryFn: async () =>
        verifier<Dossier[]>(
          await supabase.from('dossiers').select(COLONNES_DOSSIER).order('reference')
        ),
    }),

  dossier: (reference: string) =>
    queryOptions({
      queryKey: ['dossier', reference],
      queryFn: async () =>
        verifier<Dossier | null>(
          await supabase
            .from('dossiers')
            .select(COLONNES_DOSSIER)
            .eq('reference', reference)
            .maybeSingle()
        ),
    }),

  evenements: (dossierId: string) =>
    queryOptions({
      queryKey: ['evenements', dossierId],
      queryFn: async () =>
        verifier<Evenement[]>(
          await supabase
            .from('evenements')
            .select('id, dossier_id, date_evenement, titre, detail, visible_syndic, cree_le')
            .eq('dossier_id', dossierId)
            .order('date_evenement', { ascending: false })
            .order('cree_le', { ascending: false })
        ),
    }),

  pieces: (dossierId: string) =>
    queryOptions({
      queryKey: ['pieces', dossierId],
      queryFn: async () =>
        verifier<Piece[]>(
          await supabase
            .from('pieces')
            .select('id, dossier_id, nom, chemin, visible_syndic, cree_le')
            .eq('dossier_id', dossierId)
            .order('cree_le', { ascending: false })
        ),
    }),

  validations: (dossierId?: string) =>
    queryOptions({
      queryKey: ['validations', dossierId ?? 'toutes'],
      queryFn: async () => {
        let q = supabase
          .from('validations')
          .select('id, dossier_id, piece_id, objet, statut, commentaire, demande_le, decide_par, decide_le')
          .order('demande_le', { ascending: false })
        if (dossierId) q = q.eq('dossier_id', dossierId)
        return verifier<Validation[]>(await q)
      },
    }),
}

/** Lien de téléchargement signé, valable 60 secondes. Refusé par la base si la pièce n'est pas accessible. */
export async function ouvrirPiece(piece: Pick<Piece, 'chemin' | 'nom'>) {
  const { data, error } = await supabase.storage.from('pieces').createSignedUrl(piece.chemin, 60)
  if (error || !data) {
    toast.error('Fichier indisponible', {
      description: 'Le fichier n’a pas encore été déposé ou vous n’y avez pas accès.',
    })
    return
  }
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
}

function useInvalider() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries()
}

function surErreur(e: Error) {
  toast.error('L’opération n’a pas abouti', { description: e.message })
}

// ---------------------------------------------------------------- syndic

export function useDeciderValidation() {
  const invalider = useInvalider()
  return useMutation({
    mutationFn: async (p: { id: string; decision: Exclude<StatutValidation, 'en_attente'>; commentaire?: string }) =>
      verifier(
        await supabase.rpc('decider_validation', {
          p_validation_id: p.id,
          p_decision: p.decision,
          p_commentaire: p.commentaire ?? null,
        })
      ),
    onSuccess: (_d, p) => {
      toast.success(p.decision === 'validee' ? 'Validation enregistrée' : 'Demande de modification envoyée au cabinet')
      invalider()
    },
    onError: surErreur,
  })
}

// ---------------------------------------------------------------- cabinet

export type NouveauDossier = Pick<
  Dossier,
  'reference' | 'syndic_id' | 'immeuble' | 'lot' | 'debiteur_ref' | 'solde_centimes' | 'etape' | 'prochaine_echeance' | 'libelle_echeance'
>

export function useCreerDossier() {
  const invalider = useInvalider()
  return useMutation({
    mutationFn: async (d: NouveauDossier) =>
      verifier<{ reference: string }>(await supabase.from('dossiers').insert(d).select('reference').single()),
    onSuccess: (d) => {
      toast.success(`Dossier ${d.reference} créé`)
      invalider()
    },
    onError: (e: Error) =>
      surErreur(e.message.includes('duplicate') ? new Error('Cette référence existe déjà.') : e),
  })
}

export function useMettreAJourDossier() {
  const invalider = useInvalider()
  return useMutation({
    mutationFn: async (p: {
      id: string
      etape: Etape
      solde_centimes: number
      prochaine_echeance: string | null
      libelle_echeance: string | null
    }) => {
      const { id, ...champs } = p
      return verifier(await supabase.from('dossiers').update(champs).eq('id', id).select('id').single())
    },
    onSuccess: () => {
      toast.success('Dossier mis à jour')
      invalider()
    },
    onError: surErreur,
  })
}

export function useAjouterEvenement() {
  const invalider = useInvalider()
  return useMutation({
    mutationFn: async (e: Pick<Evenement, 'dossier_id' | 'titre' | 'detail' | 'visible_syndic' | 'date_evenement'>) =>
      verifier(await supabase.from('evenements').insert(e).select('id').single()),
    onSuccess: (_d, e) => {
      toast.success(e.visible_syndic ? 'Note publiée pour le syndic' : 'Note interne enregistrée')
      invalider()
    },
    onError: surErreur,
  })
}

function nomFichierSur(nom: string): string {
  const base = nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(-80)
  return `${Date.now()}-${base || 'piece'}`
}

/** Dépose un fichier et crée la pièce. Si `pieceExistante` est fournie, remplace son fichier. */
export function useDeposerPiece() {
  const invalider = useInvalider()
  return useMutation({
    mutationFn: async (p: {
      dossier_id: string
      fichier: File
      nom: string
      visible_syndic: boolean
      pieceExistante?: Pick<Piece, 'chemin'>
    }) => {
      const chemin = p.pieceExistante?.chemin ?? `${p.dossier_id}/${nomFichierSur(p.fichier.name)}`
      const envoi = await supabase.storage
        .from('pieces')
        .upload(chemin, p.fichier, { upsert: !!p.pieceExistante, contentType: p.fichier.type })
      if (envoi.error) throw new Error(envoi.error.message)
      if (p.pieceExistante) return { id: null }
      return verifier<{ id: string }>(
        await supabase
          .from('pieces')
          .insert({ dossier_id: p.dossier_id, nom: p.nom, chemin, visible_syndic: p.visible_syndic })
          .select('id')
          .single()
      )
    },
    onSuccess: () => {
      toast.success('Pièce déposée')
      invalider()
    },
    onError: surErreur,
  })
}

export function useDemanderValidation() {
  const invalider = useInvalider()
  return useMutation({
    mutationFn: async (p: { dossier: Pick<Dossier, 'id' | 'etape'>; piece_id: string; objet: string }) => {
      verifier(
        await supabase
          .from('validations')
          .insert({ dossier_id: p.dossier.id, piece_id: p.piece_id, objet: p.objet })
          .select('id')
          .single()
      )
      verifier(
        await supabase.from('evenements').insert({
          dossier_id: p.dossier.id,
          titre: `${p.objet} déposé`,
          detail: 'En attente de votre validation.',
          visible_syndic: true,
        }).select('id').single()
      )
      if (/assignation/i.test(p.objet) && ['amiable', 'mise_en_demeure'].includes(p.dossier.etape)) {
        verifier(
          await supabase
            .from('dossiers')
            .update({ etape: 'assignation_a_valider' })
            .eq('id', p.dossier.id)
            .select('id')
            .single()
        )
      }
      return null
    },
    onSuccess: () => {
      toast.success('Validation demandée au syndic')
      invalider()
    },
    onError: surErreur,
  })
}
