import { ETAPES } from '@/lib/recouvrement/etapes'
import type { Etape } from '@/lib/recouvrement/types'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function Champ({ id, libelle, aide, children }: { id: string; libelle: string; aide?: string; children: React.ReactNode }) {
  return (
    <div className='grid gap-1.5'>
      <Label htmlFor={id}>{libelle}</Label>
      {children}
      {aide && <p className='text-xs text-muted-foreground'>{aide}</p>}
    </div>
  )
}

export function ChoixEtape({ id, valeur, onChange }: { id: string; valeur: Etape; onChange: (e: Etape) => void }) {
  return (
    <Select value={valeur} onValueChange={(v) => onChange(v as Etape)}>
      <SelectTrigger id={id} className='w-full'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ETAPES.map((e) => (
          <SelectItem key={e.valeur} value={e.valeur}>
            {e.libelle}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
