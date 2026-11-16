export type Etape =
  | 'amiable'
  | 'mise_en_demeure'
  | 'assignation_a_valider'
  | 'assignation_validee'
  | 'audience'
  | 'jugement'
  | 'execution'
  | 'cloture'

export type StatutValidation = 'en_attente' | 'validee' | 'modification_demandee'

export type Role = 'cabinet' | 'syndic'

export type Profil = {
  id: string
  email: string
  nom_affiche: string | null
  role: Role
  syndic_id: string | null
}

export type Syndic = { id: string; nom: string }

export type Dossier = {
  id: string
  reference: string
  syndic_id: string
  immeuble: string
  lot: string
  debiteur_ref: string
  solde_centimes: number
  etape: Etape
  prochaine_echeance: string | null // AAAA-MM-JJ
  libelle_echeance: string | null
  mis_a_jour_le: string // AAAA-MM-JJ
}

export type Evenement = {
  id: string
  dossier_id: string
  date_evenement: string
  titre: string
  detail: string | null
  visible_syndic: boolean
  cree_le: string
}

export type Piece = {
  id: string
  dossier_id: string
  nom: string
  chemin: string
  visible_syndic: boolean
  cree_le: string
}

export type Validation = {
  id: string
  dossier_id: string
  piece_id: string | null
  objet: string
  statut: StatutValidation
  commentaire: string | null
  demande_le: string
  decide_par: string | null
  decide_le: string | null
}
