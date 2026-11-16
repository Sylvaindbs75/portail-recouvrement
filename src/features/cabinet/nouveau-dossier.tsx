import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { requetes, useCreerDossier } from '@/lib/recouvrement/api'
import { parseEuros } from '@/lib/recouvrement/format'
import type { Etape } from '@/lib/recouvrement/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Page, Retour } from '@/features/recouvrement/commun'
import { Champ, ChoixEtape } from './champs'

export function NouveauDossier() {
  const navigate = useNavigate()
  const syndics = useQuery(requetes.syndics())
  const creer = useCreerDossier()
  const [f, setF] = useState({
    reference: '',
    syndic_id: '',
    immeuble: '',
    lot: '',
    debiteur_ref: '',
    solde: '',
    etape: 'mise_en_demeure' as Etape,
    prochaine_echeance: '',
    libelle_echeance: '',
  })
  const solde = parseEuros(f.solde)
  const valide =
    f.reference.trim() && f.syndic_id && f.immeuble.trim() && f.lot.trim() && f.debiteur_ref.trim() && solde !== null
  const maj = (champ: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [champ]: e.target.value })

  return (
    <Page titre=''>
      <Retour to='/cabinet'>Retour aux dossiers</Retour>
      <Card className='max-w-3xl'>
        <CardHeader>
          <CardTitle>Nouveau dossier</CardTitle>
          <CardDescription>Données fictives uniquement tant que le portail est en démonstration.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className='grid gap-4 sm:grid-cols-2'
            onSubmit={(e) => {
              e.preventDefault()
              if (!valide || solde === null) return
              creer.mutate(
                {
                  reference: f.reference.trim(),
                  syndic_id: f.syndic_id,
                  immeuble: f.immeuble.trim(),
                  lot: f.lot.trim(),
                  debiteur_ref: f.debiteur_ref.trim(),
                  solde_centimes: solde,
                  etape: f.etape,
                  prochaine_echeance: f.prochaine_echeance || null,
                  libelle_echeance: f.libelle_echeance.trim() || null,
                },
                {
                  onSuccess: (d) =>
                    navigate({ to: '/cabinet/dossiers/$reference', params: { reference: d.reference } }),
                }
              )
            }}
          >
            <Champ id='syndic' libelle='Syndic'>
              <Select value={f.syndic_id} onValueChange={(v) => setF({ ...f, syndic_id: v })}>
                <SelectTrigger id='syndic' className='w-full'>
                  <SelectValue placeholder='Choisir un syndic' />
                </SelectTrigger>
                <SelectContent>
                  {syndics.data?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Champ>
            <Champ id='reference' libelle='Référence' aide='Par exemple A-004'>
              <Input id='reference' value={f.reference} onChange={maj('reference')} required maxLength={40} />
            </Champ>
            <Champ id='immeuble' libelle='Copropriété'>
              <Input id='immeuble' value={f.immeuble} onChange={maj('immeuble')} required placeholder='SDC …' />
            </Champ>
            <Champ id='lot' libelle='Lot'>
              <Input id='lot' value={f.lot} onChange={maj('lot')} required placeholder='Lot 12' />
            </Champ>
            <Champ id='debiteur' libelle='Débiteur' aide='Une référence plutôt qu’un nom pendant la démonstration'>
              <Input id='debiteur' value={f.debiteur_ref} onChange={maj('debiteur_ref')} required />
            </Champ>
            <Champ id='solde' libelle='Solde dû' aide='Format français accepté : 1 180,50 €'>
              <Input
                id='solde'
                inputMode='decimal'
                value={f.solde}
                onChange={maj('solde')}
                required
                aria-invalid={f.solde !== '' && solde === null}
              />
            </Champ>
            <Champ id='etape' libelle='Étape'>
              <ChoixEtape id='etape' valeur={f.etape} onChange={(etape) => setF({ ...f, etape })} />
            </Champ>
            <div className='grid grid-cols-2 gap-2'>
              <Champ id='echeance' libelle='Prochaine échéance'>
                <Input id='echeance' type='date' value={f.prochaine_echeance} onChange={maj('prochaine_echeance')} />
              </Champ>
              <Champ id='libelle' libelle='Libellé'>
                <Input id='libelle' value={f.libelle_echeance} onChange={maj('libelle_echeance')} placeholder='Relance' />
              </Champ>
            </div>
            <div className='sm:col-span-2'>
              <Button type='submit' disabled={!valide || creer.isPending}>
                Créer le dossier
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Page>
  )
}
