import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, FileText, MessageSquareWarning } from 'lucide-react'
import { ouvrirPiece, requetes, useDeciderValidation } from '@/lib/recouvrement/api'
import { LIBELLES_STATUT } from '@/lib/recouvrement/etapes'
import { formatDateCourte } from '@/lib/recouvrement/format'
import type { Dossier, Piece, Validation } from '@/lib/recouvrement/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/confirm-dialog'
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

export function FicheDossierSyndic({ reference }: { reference: string }) {
  const dossier = useQuery(requetes.dossier(reference))

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
  // La base ne renvoie rien pour un dossier d'un autre syndic : même écran que pour un dossier inexistant.
  if (!dossier.data) return <DossierIntrouvable retour='/syndic' />

  return <Fiche dossier={dossier.data} />
}

function Fiche({ dossier }: { dossier: Dossier }) {
  const evenements = useQuery(requetes.evenements(dossier.id))
  const pieces = useQuery(requetes.pieces(dossier.id))
  const validations = useQuery(requetes.validations(dossier.id))
  const enAttente = validations.data?.filter((v) => v.statut === 'en_attente') ?? []
  const traitees = validations.data?.filter((v) => v.statut !== 'en_attente') ?? []

  return (
    <Page titre=''>
      <Retour to='/syndic'>Retour au tableau de bord</Retour>
      <div className='grid gap-6'>
        <EnTeteDossier dossier={dossier} />
        <Frise etape={dossier.etape} />

        {enAttente.map((v) => (
          <EncartValidation key={v.id} validation={v} piece={pieces.data?.find((p) => p.id === v.piece_id)} />
        ))}

        <div className='grid gap-6 lg:grid-cols-[3fr_2fr]'>
          {evenements.data ? <Chronologie evenements={evenements.data} /> : <Chargement />}
          <div className='grid content-start gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Pièces</CardTitle>
              </CardHeader>
              <CardContent>
                {pieces.data?.length ? (
                  <ul className='divide-y'>
                    {pieces.data.map((p) => (
                      <LignePiece key={p.id} piece={p} />
                    ))}
                  </ul>
                ) : (
                  <p className='text-sm text-muted-foreground'>Aucune pièce partagée.</p>
                )}
              </CardContent>
            </Card>
            {traitees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Vos décisions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className='grid gap-3'>
                    {traitees.map((v) => (
                      <DecisionLectureSeule key={v.id} validation={v} />
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Page>
  )
}

function DecisionLectureSeule({ validation: v }: { validation: Validation }) {
  return (
    <li className='rounded-md border p-3 text-sm'>
      <div className='flex items-center gap-2 font-medium'>
        {v.statut === 'validee' ? (
          <CheckCircle2 className='size-4 text-emerald-600' />
        ) : (
          <MessageSquareWarning className='size-4 text-amber-600' />
        )}
        {v.objet} : {LIBELLES_STATUT[v.statut]}
      </div>
      {v.decide_le && <div className='text-muted-foreground'>Le {formatDateCourte(v.decide_le)}</div>}
      {v.commentaire && <p className='mt-1 whitespace-pre-line'>« {v.commentaire} »</p>}
    </li>
  )
}

function EncartValidation({ validation, piece }: { validation: Validation; piece?: Piece }) {
  const decider = useDeciderValidation()
  const [confirmer, setConfirmer] = useState(false)
  const [modifier, setModifier] = useState(false)
  const [commentaire, setCommentaire] = useState('')

  return (
    <Alert className='border-amber-500/60 bg-amber-50 dark:bg-amber-950/30'>
      <FileText />
      <AlertTitle>Votre validation est attendue</AlertTitle>
      <AlertDescription>
        <p>
          Le {validation.objet.toLowerCase()} est prêt. Relisez le décompte et le projet, puis validez pour que le
          cabinet le fasse délivrer par commissaire de justice.
        </p>
        <div className='mt-3 flex flex-wrap gap-2'>
          <Button onClick={() => setConfirmer(true)} disabled={decider.isPending}>
            Valider
          </Button>
          <Button variant='outline' onClick={() => setModifier(true)} disabled={decider.isPending}>
            Demander une modification
          </Button>
          {piece && (
            <Button variant='ghost' onClick={() => ouvrirPiece(piece)}>
              Lire le projet
            </Button>
          )}
        </div>
      </AlertDescription>

      <ConfirmDialog
        open={confirmer}
        onOpenChange={setConfirmer}
        title={`Valider : ${validation.objet}`}
        desc='Votre décision sera enregistrée à votre nom, datée, et ne pourra plus être modifiée.'
        confirmText='Je valide'
        cancelBtnText='Annuler'
        isLoading={decider.isPending}
        handleConfirm={() =>
          decider.mutate({ id: validation.id, decision: 'validee' }, { onSuccess: () => setConfirmer(false) })
        }
      />

      <Dialog open={modifier} onOpenChange={setModifier}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander une modification</DialogTitle>
            <DialogDescription>
              Expliquez au cabinet ce qui doit être corrigé (par exemple un règlement reçu).
            </DialogDescription>
          </DialogHeader>
          <form
            id='form-modification'
            onSubmit={(e) => {
              e.preventDefault()
              decider.mutate(
                { id: validation.id, decision: 'modification_demandee', commentaire },
                { onSuccess: () => setModifier(false) }
              )
            }}
            className='grid gap-2'
          >
            <Label htmlFor='commentaire'>Votre commentaire</Label>
            <Textarea
              id='commentaire'
              required
              maxLength={2000}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder='Virement reçu le 12 novembre…'
            />
          </form>
          <DialogFooter>
            <Button variant='outline' onClick={() => setModifier(false)}>
              Annuler
            </Button>
            <Button type='submit' form='form-modification' disabled={!commentaire.trim() || decider.isPending}>
              Envoyer au cabinet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Alert>
  )
}
