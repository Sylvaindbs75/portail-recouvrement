import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, FilePlus2 } from 'lucide-react'
import { requetes } from '@/lib/recouvrement/api'
import { FAMILLES, type Famille } from '@/lib/recouvrement/etapes'
import { aujourdhui, formatDateCourte, formatEuros } from '@/lib/recouvrement/format'
import {
  SEUIL_SANS_MISE_A_JOUR_JOURS,
  filtrerParFamille,
  joursEntre,
  sansMiseAJour,
  soldeTotal,
} from '@/lib/recouvrement/indicateurs'
import type { StatutValidation } from '@/lib/recouvrement/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BadgeEtape, Chargement, Echeance, Erreur, Indicateur, Page } from '@/features/recouvrement/commun'

export function Portefeuille() {
  const [famille, setFamille] = useState<Famille>('tous')
  const dossiers = useQuery(requetes.dossiers())
  const validations = useQuery(requetes.validations())
  const syndics = useQuery(requetes.syndics())

  if (dossiers.isPending || validations.isPending || syndics.isPending)
    return (
      <Page titre='Dossiers du cabinet'>
        <Chargement />
      </Page>
    )
  const erreur = dossiers.error ?? validations.error ?? syndics.error
  if (erreur)
    return (
      <Page titre='Dossiers du cabinet'>
        <Erreur message={erreur.message} />
      </Page>
    )

  const tous = dossiers.data ?? []
  const jour = aujourdhui()
  const nomSyndic = new Map((syndics.data ?? []).map((s) => [s.id, s.nom]))
  const actifs = tous.filter((d) => d.etape !== 'cloture')
  const enRetard = sansMiseAJour(tous, jour)
  const idsEnRetard = new Set(enRetard.map((d) => d.id))

  // Dernier statut de validation par dossier (les validations sont triées de la plus récente à la plus ancienne)
  const derniereValidation = new Map<string, StatutValidation>()
  for (const v of validations.data ?? []) {
    if (!derniereValidation.has(v.dossier_id)) derniereValidation.set(v.dossier_id, v.statut)
  }
  const attenteClient = [...derniereValidation.values()].filter((s) => s === 'en_attente').length

  return (
    <Page
      titre='Dossiers du cabinet'
      sousTitre='Tous syndics confondus'
      actions={
        <Button asChild>
          <Link to='/cabinet/nouveau'>
            <FilePlus2 /> Nouveau dossier
          </Link>
        </Button>
      }
    >
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Indicateur libelle='Dossiers actifs' valeur={actifs.length} detail={`${tous.length} au total`} />
        <Indicateur libelle='En attente de validation client' valeur={attenteClient} />
        <Indicateur libelle='Montant total à recouvrer' valeur={formatEuros(soldeTotal(actifs))} />
        <Indicateur
          libelle={`Sans mise à jour depuis plus de ${SEUIL_SANS_MISE_A_JOUR_JOURS} jours`}
          valeur={enRetard.length}
          accent={enRetard.length > 0}
          detail={enRetard.map((d) => `${d.reference} (${d.jours_sans_mise_a_jour} j)`).join(', ') || undefined}
        />
      </div>

      <Card className='mt-6'>
        <CardHeader className='flex flex-wrap items-center justify-between gap-3'>
          <CardTitle>Portefeuille</CardTitle>
          <Tabs value={famille} onValueChange={(v) => setFamille(v as Famille)}>
            <TabsList className='flex-wrap'>
              {FAMILLES.map((f) => (
                <TabsTrigger key={f.valeur} value={f.valeur}>
                  {f.libelle}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Syndic et dossier</TableHead>
                <TableHead className='text-end'>Solde</TableHead>
                <TableHead>Étape</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Suivi client</TableHead>
                <TableHead>Mis à jour</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrerParFamille(tous, famille).map((d) => {
                const statut = derniereValidation.get(d.id)
                return (
                  <TableRow key={d.id}>
                    <TableCell className='font-medium'>{d.reference}</TableCell>
                    <TableCell>
                      <div className='text-sm text-muted-foreground'>{nomSyndic.get(d.syndic_id)}</div>
                      <div>
                        {d.immeuble} c/ {d.debiteur_ref}
                      </div>
                    </TableCell>
                    <TableCell className='text-end tabular-nums'>{formatEuros(d.solde_centimes)}</TableCell>
                    <TableCell>
                      <BadgeEtape etape={d.etape} />
                    </TableCell>
                    <TableCell>
                      <Echeance dossier={d} />
                    </TableCell>
                    <TableCell>
                      {statut === 'en_attente' ? (
                        <Badge variant='outline' className='border-amber-500 text-amber-700 dark:text-amber-300'>
                          Validation attendue
                        </Badge>
                      ) : statut === 'modification_demandee' ? (
                        <Badge variant='destructive'>Modification demandée</Badge>
                      ) : (
                        <span className='text-sm text-muted-foreground'>À jour</span>
                      )}
                    </TableCell>
                    <TableCell className='tabular-nums'>
                      <span className='flex items-center gap-1'>
                        {idsEnRetard.has(d.id) && (
                          <AlertTriangle
                            className='size-4 text-amber-600'
                            aria-label={`Sans mise à jour depuis ${joursEntre(d.mis_a_jour_le, jour)} jours`}
                          />
                        )}
                        {formatDateCourte(d.mis_a_jour_le)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant='outline' size='sm'>
                        <Link to='/cabinet/dossiers/$reference' params={{ reference: d.reference }}>
                          Mettre à jour
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Page>
  )
}
