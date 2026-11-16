import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock, MessageSquareWarning, Send, Upload } from 'lucide-react'
import {
  requetes,
  useAjouterEvenement,
  useDemanderValidation,
  useDeposerPiece,
  useMettreAJourDossier,
} from '@/lib/recouvrement/api'
import { LIBELLES_STATUT } from '@/lib/recouvrement/etapes'
import { aujourdhui, formatDateCourte, formatEuros, parseEuros } from '@/lib/recouvrement/format'
import type { Dossier, Etape, Piece, Validation } from '@/lib/recouvrement/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Chargement,
  Chronologie,
  DossierIntrouvable,
  EnTeteDossier,
  Erreur,
  Frise,
  LignePiece,
  Page,
  Retour,
} from '@/features/recouvrement/commun'
import { Champ, ChoixEtape } from './champs'

export function FicheDossierCabinet({ reference }: { reference: string }) {
  const dossier = useQuery(requetes.dossier(reference))
  const syndics = useQuery(requetes.syndics())

  if (dossier.isPending)
    return (
      <Page titre={`Dossier ${reference}`}>
        <Chargement />
      </Page>
    )
  if (dossier.isError)
    return (
      <Page titre={`Dossier ${reference}`}>
        <Erreur message={dossier.error.message} />
      </Page>
    )
  const d = dossier.data
  if (!d) return <DossierIntrouvable retour='/cabinet' />

  const nomSyndic = syndics.data?.find((s) => s.id === d.syndic_id)?.nom
  // `key` : réinitialise les formulaires quand le dossier change en base
  return <Fiche key={`${d.id}-${d.mis_a_jour_le}-${d.etape}`} dossier={d} nomSyndic={nomSyndic} />
}

function Fiche({ dossier, nomSyndic }: { dossier: Dossier; nomSyndic?: string }) {
  const evenements = useQuery(requetes.evenements(dossier.id))
  const pieces = useQuery(requetes.pieces(dossier.id))
  const validations = useQuery(requetes.validations(dossier.id))

  return (
    <Page titre=''>
      <Retour to='/cabinet'>Retour aux dossiers</Retour>
      <div className='grid gap-6'>
        <EnTeteDossier dossier={dossier} nomSyndic={nomSyndic} />
        <Frise etape={dossier.etape} />

        <div className='grid gap-6 lg:grid-cols-2'>
          <MiseAJour dossier={dossier} />
          <NouvelleNote dossier={dossier} />
        </div>

        <div className='grid gap-6 lg:grid-cols-2'>
          <Pieces dossier={dossier} pieces={pieces.data ?? []} validations={validations.data ?? []} />
          <Validations validations={validations.data ?? []} pieces={pieces.data ?? []} />
        </div>

        {evenements.data ? <Chronologie evenements={evenements.data} montrerInternes /> : <Chargement />}
      </div>
    </Page>
  )
}

function MiseAJour({ dossier }: { dossier: Dossier }) {
  const maj = useMettreAJourDossier()
  const [etape, setEtape] = useState<Etape>(dossier.etape)
  const [solde, setSolde] = useState(formatEuros(dossier.solde_centimes))
  const [echeance, setEcheance] = useState(dossier.prochaine_echeance ?? '')
  const [libelle, setLibelle] = useState(dossier.libelle_echeance ?? '')
  const centimes = parseEuros(solde)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mise à jour du dossier</CardTitle>
        <CardDescription>Étape, solde et prochaine échéance, visibles par le syndic.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className='grid gap-4'
          onSubmit={(e) => {
            e.preventDefault()
            if (centimes === null) return
            maj.mutate({
              id: dossier.id,
              etape,
              solde_centimes: centimes,
              prochaine_echeance: echeance || null,
              libelle_echeance: libelle.trim() || null,
            })
          }}
        >
          <Champ id='etape' libelle='Étape'>
            <ChoixEtape id='etape' valeur={etape} onChange={setEtape} />
          </Champ>
          <Champ id='solde' libelle='Solde dû' aide='Saisi par le cabinet. Aucun calcul automatique d’intérêts ni de frais.'>
            <Input
              id='solde'
              inputMode='decimal'
              value={solde}
              onChange={(e) => setSolde(e.target.value)}
              aria-invalid={centimes === null}
            />
          </Champ>
          <div className='grid grid-cols-2 gap-2'>
            <Champ id='echeance' libelle='Prochaine échéance'>
              <Input id='echeance' type='date' value={echeance} onChange={(e) => setEcheance(e.target.value)} />
            </Champ>
            <Champ id='libelle' libelle='Libellé'>
              <Input id='libelle' value={libelle} onChange={(e) => setLibelle(e.target.value)} />
            </Champ>
          </div>
          <div>
            <Button type='submit' disabled={centimes === null || maj.isPending}>
              Enregistrer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function NouvelleNote({ dossier }: { dossier: Dossier }) {
  const ajouter = useAjouterEvenement()
  const [titre, setTitre] = useState('')
  const [detail, setDetail] = useState('')
  const [visible, setVisible] = useState(true)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter à la chronologie</CardTitle>
        <CardDescription>Une note interne n’est jamais visible par le syndic.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className='grid gap-4'
          onSubmit={(e) => {
            e.preventDefault()
            ajouter.mutate(
              {
                dossier_id: dossier.id,
                titre: titre.trim(),
                detail: detail.trim() || null,
                visible_syndic: visible,
                date_evenement: aujourdhui(),
              },
              {
                onSuccess: () => {
                  setTitre('')
                  setDetail('')
                },
              }
            )
          }}
        >
          <Champ id='titre-note' libelle='Titre'>
            <Input id='titre-note' value={titre} onChange={(e) => setTitre(e.target.value)} required maxLength={200} />
          </Champ>
          <Champ id='detail-note' libelle='Détail'>
            <Textarea id='detail-note' value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={4000} />
          </Champ>
          <div className='flex items-center gap-2'>
            <Switch id='visible-note' checked={visible} onCheckedChange={setVisible} />
            <Label htmlFor='visible-note'>{visible ? 'Visible par le syndic' : 'Note interne'}</Label>
          </div>
          <div>
            <Button type='submit' disabled={!titre.trim() || ajouter.isPending}>
              {visible ? 'Publier la mise à jour' : 'Enregistrer la note interne'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Pieces({ dossier, pieces, validations }: { dossier: Dossier; pieces: Piece[]; validations: Validation[] }) {
  const deposer = useDeposerPiece()
  const demander = useDemanderValidation()
  const [fichier, setFichier] = useState<File | null>(null)
  const [nom, setNom] = useState('')
  const [visible, setVisible] = useState(true)
  const champFichier = useRef<HTMLInputElement>(null)
  const [pieceAValider, setPieceAValider] = useState<Piece | null>(null)
  const [objet, setObjet] = useState('')
  const enAttente = new Set(validations.filter((v) => v.statut === 'en_attente').map((v) => v.piece_id))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pièces</CardTitle>
        <CardDescription>PDF, Word ou image, 20 Mo maximum. Stockage privé, liens temporaires.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        {pieces.length ? (
          <ul className='divide-y'>
            {pieces.map((p) => (
              <LignePiece key={p.id} piece={p} montrerInterne>
                <label
                  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'cursor-pointer')}
                  title='Déposer ou remplacer le fichier de cette pièce'
                >
                  <Upload /> Fichier
                  <input
                    type='file'
                    className='sr-only'
                    aria-label={`Fichier de la pièce ${p.nom}`}
                    accept='.pdf,.docx,.png,.jpg,.jpeg'
                    disabled={deposer.isPending}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f)
                        deposer.mutate({
                          dossier_id: dossier.id,
                          fichier: f,
                          nom: p.nom,
                          visible_syndic: p.visible_syndic,
                          pieceExistante: p,
                        })
                      e.target.value = ''
                    }}
                  />
                </label>
                {p.visible_syndic && !enAttente.has(p.id) && (
                  <Button
                    size='sm'
                    variant='secondary'
                    disabled={demander.isPending}
                    onClick={() => {
                      setPieceAValider(p)
                      setObjet(p.nom.replace(/\s*\(PDF\)$/i, ''))
                    }}
                  >
                    <Send /> Demander la validation
                  </Button>
                )}
                {enAttente.has(p.id) && (
                  <Badge variant='outline'>
                    <Clock /> Validation attendue
                  </Badge>
                )}
              </LignePiece>
            ))}
          </ul>
        ) : (
          <p className='text-sm text-muted-foreground'>Aucune pièce.</p>
        )}

        <Dialog open={!!pieceAValider} onOpenChange={(o) => !o && setPieceAValider(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Demander la validation du syndic</DialogTitle>
              <DialogDescription>
                Le syndic verra l’acte dans « En attente de votre validation » et pourra le valider ou demander une
                modification.
              </DialogDescription>
            </DialogHeader>
            <form
              id='form-demande-validation'
              className='grid gap-2'
              onSubmit={(e) => {
                e.preventDefault()
                if (!pieceAValider || !objet.trim()) return
                demander.mutate(
                  { dossier, piece_id: pieceAValider.id, objet: objet.trim() },
                  { onSuccess: () => setPieceAValider(null) }
                )
              }}
            >
              <Label htmlFor='objet-validation'>Objet</Label>
              <Input
                id='objet-validation'
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
                required
                maxLength={200}
                placeholder='Projet d’assignation'
              />
              <p className='text-xs text-muted-foreground'>Pièce : {pieceAValider?.nom}</p>
            </form>
            <DialogFooter>
              <Button variant='outline' onClick={() => setPieceAValider(null)}>
                Annuler
              </Button>
              <Button type='submit' form='form-demande-validation' disabled={!objet.trim() || demander.isPending}>
                <Send /> Envoyer au syndic
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        <form
          className='grid gap-3 rounded-md border p-3'
          onSubmit={(e) => {
            e.preventDefault()
            if (!fichier) return
            deposer.mutate(
              { dossier_id: dossier.id, fichier, nom: nom.trim() || fichier.name, visible_syndic: visible },
              {
                onSuccess: () => {
                  setFichier(null)
                  setNom('')
                  if (champFichier.current) champFichier.current.value = ''
                },
              }
            )
          }}
        >
          <div className='font-medium'>Déposer une pièce</div>
          <Input
            ref={champFichier}
            type='file'
            accept='.pdf,.docx,.png,.jpg,.jpeg'
            onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
          />
          <Input placeholder='Nom affiché (ex. Projet d’assignation)' value={nom} onChange={(e) => setNom(e.target.value)} />
          <div className='flex items-center gap-2'>
            <Switch id='visible-piece' checked={visible} onCheckedChange={setVisible} />
            <Label htmlFor='visible-piece'>{visible ? 'Visible par le syndic' : 'Pièce interne'}</Label>
          </div>
          <div>
            <Button type='submit' disabled={!fichier || deposer.isPending}>
              <Upload /> Déposer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Validations({ validations, pieces }: { validations: Validation[]; pieces: Piece[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Validations du syndic</CardTitle>
      </CardHeader>
      <CardContent>
        {validations.length === 0 ? (
          <p className='text-sm text-muted-foreground'>Aucune validation demandée.</p>
        ) : (
          <ul className='grid gap-3'>
            {validations.map((v) => (
              <li key={v.id} className='rounded-md border p-3 text-sm'>
                <div className='flex flex-wrap items-center gap-2 font-medium'>
                  {v.statut === 'validee' ? (
                    <CheckCircle2 className='size-4 text-emerald-600' />
                  ) : v.statut === 'modification_demandee' ? (
                    <MessageSquareWarning className='size-4 text-destructive' />
                  ) : (
                    <Clock className='size-4 text-amber-600' />
                  )}
                  {v.objet}
                  <Badge variant={v.statut === 'modification_demandee' ? 'destructive' : 'secondary'}>
                    {LIBELLES_STATUT[v.statut]}
                  </Badge>
                </div>
                <div className='text-muted-foreground'>
                  Demandée le {formatDateCourte(v.demande_le)}
                  {v.decide_le && ` · décision du ${formatDateCourte(v.decide_le)}`}
                  {v.piece_id && ` · ${pieces.find((p) => p.id === v.piece_id)?.nom ?? 'pièce'}`}
                </div>
                {v.commentaire && <p className='mt-1 whitespace-pre-line'>« {v.commentaire} »</p>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
