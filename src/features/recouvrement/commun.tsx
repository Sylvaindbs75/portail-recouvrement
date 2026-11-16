import { Link } from '@tanstack/react-router'
import { ArrowLeft, Check, Download, FileText, Lock } from 'lucide-react'
import { etatFrise, libelleEtape } from '@/lib/recouvrement/etapes'
import { ouvrirPiece } from '@/lib/recouvrement/api'
import { formatDateCourte, formatEuros } from '@/lib/recouvrement/format'
import type { Dossier, Etape, Evenement, Piece } from '@/lib/recouvrement/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'

export function Page({
  titre,
  sousTitre,
  actions,
  children,
}: {
  titre: React.ReactNode
  sousTitre?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <Header>
        <span className='truncate text-sm text-muted-foreground'>Données fictives pour la démonstration</span>
        <div className='ms-auto'>
          <ThemeSwitch />
        </div>
      </Header>
      <Main>
        {(titre || actions) && (
          <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
            <div className='min-w-0'>
              <h1 className='text-2xl font-bold tracking-tight'>{titre}</h1>
              {sousTitre && <p className='text-muted-foreground'>{sousTitre}</p>}
            </div>
            {actions && <div className='flex flex-wrap gap-2'>{actions}</div>}
          </div>
        )}
        {children}
      </Main>
    </>
  )
}

export function Chargement() {
  return (
    <div className='grid gap-4'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className='h-28' />
        ))}
      </div>
      <Skeleton className='h-72' />
    </div>
  )
}

export function Erreur({ message }: { message: string }) {
  return (
    <Card className='border-destructive'>
      <CardHeader>
        <CardTitle>Chargement impossible</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  )
}

export function Indicateur({
  libelle,
  valeur,
  detail,
  accent,
}: {
  libelle: string
  valeur: React.ReactNode
  detail?: React.ReactNode
  accent?: boolean
}) {
  return (
    <Card className={cn('gap-2', accent && 'border-amber-500/60 bg-amber-50 dark:bg-amber-950/30')}>
      <CardHeader>
        <CardDescription>{libelle}</CardDescription>
        <CardTitle className='text-2xl tabular-nums'>{valeur}</CardTitle>
      </CardHeader>
      {detail && <CardContent className='text-sm text-muted-foreground'>{detail}</CardContent>}
    </Card>
  )
}

export function BadgeEtape({ etape }: { etape: Etape }) {
  const variante: Record<Etape, string> = {
    amiable: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
    mise_en_demeure: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
    assignation_a_valider: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    assignation_validee: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200',
    audience: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200',
    jugement: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200',
    execution: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
    cloture: 'bg-muted text-muted-foreground',
  }
  return (
    <Badge variant='outline' className={cn('border-transparent', variante[etape])}>
      {libelleEtape(etape)}
    </Badge>
  )
}

export function Echeance({ dossier }: { dossier: Pick<Dossier, 'libelle_echeance' | 'prochaine_echeance'> }) {
  if (!dossier.libelle_echeance && !dossier.prochaine_echeance) return <span className='text-muted-foreground'>—</span>
  return (
    <span>
      {dossier.libelle_echeance}
      {dossier.libelle_echeance && dossier.prochaine_echeance ? ' · ' : ''}
      {dossier.prochaine_echeance && formatDateCourte(dossier.prochaine_echeance)}
    </span>
  )
}

export function Retour({ to, children }: { to: '/syndic' | '/cabinet'; children: React.ReactNode }) {
  return (
    <Button asChild variant='ghost' size='sm' className='mb-2 -ms-2'>
      <Link to={to}>
        <ArrowLeft />
        {children}
      </Link>
    </Button>
  )
}

export function EnTeteDossier({ dossier, nomSyndic }: { dossier: Dossier; nomSyndic?: string }) {
  return (
    <div className='grid gap-4 md:grid-cols-[1fr_auto]'>
      <div>
        <p className='text-sm text-muted-foreground'>
          Dossier {dossier.reference}
          {nomSyndic ? ` · ${nomSyndic}` : ''} · données fictives
        </p>
        <h1 className='text-2xl font-bold tracking-tight'>
          {dossier.immeuble} c/ {dossier.debiteur_ref}
        </h1>
        <p className='text-muted-foreground'>{dossier.lot}</p>
      </div>
      <Card className='gap-1 py-4'>
        <CardHeader className='px-4'>
          <CardDescription>Montant dû</CardDescription>
          <CardTitle className='text-2xl tabular-nums'>{formatEuros(dossier.solde_centimes)}</CardTitle>
        </CardHeader>
        <CardContent className='px-4 text-xs text-muted-foreground'>
          Mis à jour le {formatDateCourte(dossier.mis_a_jour_le)}
        </CardContent>
      </Card>
    </div>
  )
}

export function Frise({ etape }: { etape: Etape }) {
  return (
    <ol className='grid grid-cols-2 gap-3 sm:grid-cols-5' aria-label='Étapes de la procédure'>
      {etatFrise(etape).map((f) => (
        <li
          key={f.libelle}
          className={cn(
            'rounded-lg border p-3 text-sm',
            f.etat === 'fait' && 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30',
            f.etat === 'en_cours' && 'border-primary ring-1 ring-primary'
          )}
          aria-current={f.etat === 'en_cours' ? 'step' : undefined}
        >
          <div className='flex items-center gap-1 font-medium'>
            {f.etat === 'fait' && <Check className='size-4 text-emerald-600' />}
            {f.libelle}
          </div>
          <div className='text-xs text-muted-foreground'>
            {f.etat === 'fait' ? 'Terminé' : f.etat === 'en_cours' ? libelleEtape(etape) : 'À venir'}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function Chronologie({ evenements, montrerInternes }: { evenements: Evenement[]; montrerInternes?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chronologie</CardTitle>
      </CardHeader>
      <CardContent>
        {evenements.length === 0 ? (
          <p className='text-sm text-muted-foreground'>Aucun événement.</p>
        ) : (
          <ol className='relative space-y-4 border-s ps-4'>
            {evenements.map((e) => (
              <li key={e.id}>
                <span className='absolute -start-1.5 mt-1.5 size-3 rounded-full border bg-background' />
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='text-sm text-muted-foreground tabular-nums'>
                    {formatDateCourte(e.date_evenement)}
                  </span>
                  <span className='font-medium'>{e.titre}</span>
                  {montrerInternes && !e.visible_syndic && (
                    <Badge variant='secondary'>
                      <Lock /> Interne
                    </Badge>
                  )}
                </div>
                {/* Texte rendu par React : toujours échappé, jamais interprété comme du HTML. */}
                {e.detail && <p className='text-sm whitespace-pre-line text-muted-foreground'>{e.detail}</p>}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

export function LignePiece({ piece, montrerInterne, children }: { piece: Piece; montrerInterne?: boolean; children?: React.ReactNode }) {
  return (
    <li className='flex flex-wrap items-center gap-2 py-2'>
      <FileText className='size-4 shrink-0 text-muted-foreground' />
      <span className='min-w-0 flex-1 truncate'>{piece.nom}</span>
      {montrerInterne && !piece.visible_syndic && (
        <Badge variant='secondary'>
          <Lock /> Interne
        </Badge>
      )}
      <Button variant='outline' size='sm' onClick={() => ouvrirPiece(piece)}>
        <Download /> Ouvrir
      </Button>
      {children}
    </li>
  )
}

export function DossierIntrouvable({ retour }: { retour: '/syndic' | '/cabinet' }) {
  return (
    <Page titre='Dossier introuvable'>
      <Card>
        <CardHeader>
          <CardDescription>
            Ce dossier n’existe pas ou ne fait pas partie de vos dossiers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant='outline'>
            <Link to={retour}>
              <ArrowLeft /> Retour au tableau de bord
            </Link>
          </Button>
        </CardContent>
      </Card>
    </Page>
  )
}
