import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { FileDown, FileSignature } from 'lucide-react'
import { requetes } from '@/lib/recouvrement/api'
import { dossiersVersCsv } from '@/lib/recouvrement/csv'
import { FAMILLES, type Famille } from '@/lib/recouvrement/etapes'
import { aujourdhui, formatDateCourte, formatEuros } from '@/lib/recouvrement/format'
import { filtrerParFamille, indicateursTableauDeBord } from '@/lib/recouvrement/indicateurs'
import type { Dossier } from '@/lib/recouvrement/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BadgeEtape, Chargement, Echeance, Erreur, Indicateur, Page } from '@/features/recouvrement/commun'

function telechargerCsv(dossiers: Dossier[], nomSyndic: string) {
  const blob = new Blob([dossiersVersCsv(dossiers)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `etat-dossiers-${nomSyndic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${aujourdhui()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function TableauDeBordSyndic() {
  const [famille, setFamille] = useState<Famille>('tous')
  const dossiers = useQuery(requetes.dossiers())
  const validations = useQuery(requetes.validations())
  const syndics = useQuery(requetes.syndics())
  const nomSyndic = syndics.data?.[0]?.nom ?? 'Syndic'

  if (dossiers.isPending || validations.isPending) {
    return (
      <Page titre='Tableau de bord'>
        <Chargement />
      </Page>
    )
  }
  if (dossiers.isError || validations.isError) {
    return (
      <Page titre='Tableau de bord'>
        <Erreur message={(dossiers.error ?? validations.error)?.message ?? ''} />
      </Page>
    )
  }

  const jour = aujourdhui()
  const ind = indicateursTableauDeBord(dossiers.data, validations.data, jour)
  const visibles = filtrerParFamille(dossiers.data, famille)
  const parId = new Map(dossiers.data.map((d) => [d.id, d]))
  const aValider = validations.data.filter((v) => v.statut === 'en_attente')

  return (
    <Page
      titre='Recouvrement de charges'
      sousTitre={nomSyndic}
      actions={
        <Button variant='outline' onClick={() => telechargerCsv(dossiers.data, nomSyndic)}>
          <FileDown /> Exporter pour l’AG (CSV)
        </Button>
      }
    >
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Indicateur libelle='Dossiers en cours' valeur={ind.nombreDossiers} />
        <Indicateur libelle='Montant total à recouvrer' valeur={formatEuros(ind.soldeTotalCentimes)} />
        <Indicateur
          libelle='Actes en attente de votre validation'
          valeur={ind.actionsAValider}
          accent={ind.actionsAValider > 0}
        />
        <Indicateur
          libelle='Prochaine audience'
          valeur={ind.prochaineAudience ? formatDateCourte(ind.prochaineAudience) : '—'}
          detail={ind.audiencesAVenir > 1 ? `${ind.audiencesAVenir} audiences à venir` : undefined}
        />
      </div>

      {aValider.length > 0 && (
        <Card className='mt-6 border-amber-500/60'>
          <CardHeader>
            <CardTitle>En attente de votre validation</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className='divide-y'>
              {aValider.map((v) => {
                const d = parId.get(v.dossier_id)
                if (!d) return null
                return (
                  <li key={v.id} className='flex flex-wrap items-center gap-3 py-3'>
                    <FileSignature className='size-5 text-amber-600' />
                    <div className='min-w-0 flex-1'>
                      <div className='font-medium'>{v.objet}</div>
                      <div className='text-sm text-muted-foreground'>
                        {d.reference} · {d.immeuble}
                      </div>
                    </div>
                    <Button asChild size='sm'>
                      <Link to='/syndic/dossiers/$reference' params={{ reference: d.reference }}>
                        Relire et valider
                      </Link>
                    </Button>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className='mt-6'>
        <CardHeader className='flex flex-wrap items-center justify-between gap-3'>
          <CardTitle>Dossiers par étape</CardTitle>
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
                <TableHead>Copropriété et débiteur</TableHead>
                <TableHead className='text-end'>Montant dû</TableHead>
                <TableHead>Étape</TableHead>
                <TableHead>Prochaine échéance</TableHead>
                <TableHead>Mis à jour</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className='text-center text-muted-foreground'>
                    Aucun dossier à cette étape.
                  </TableCell>
                </TableRow>
              )}
              {visibles.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className='font-medium'>{d.reference}</TableCell>
                  <TableCell>
                    <div>{d.immeuble}</div>
                    <div className='text-sm text-muted-foreground'>
                      {d.debiteur_ref} ({d.lot})
                    </div>
                  </TableCell>
                  <TableCell className='text-end tabular-nums'>{formatEuros(d.solde_centimes)}</TableCell>
                  <TableCell>
                    <BadgeEtape etape={d.etape} />
                  </TableCell>
                  <TableCell>
                    <Echeance dossier={d} />
                  </TableCell>
                  <TableCell className='tabular-nums'>{formatDateCourte(d.mis_a_jour_le)}</TableCell>
                  <TableCell>
                    <Button asChild variant='outline' size='sm'>
                      <Link to='/syndic/dossiers/$reference' params={{ reference: d.reference }}>
                        Ouvrir
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Page>
  )
}
