import { supabase } from '@/lib/supabase'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Se déconnecter'
      desc='Vous devrez saisir à nouveau vos identifiants pour accéder au portail.'
      confirmText='Se déconnecter'
      cancelBtnText='Annuler'
      destructive
      // La redirection vers la connexion est gérée dans main.tsx (événement SIGNED_OUT).
      handleConfirm={() => supabase.auth.signOut()}
      className='sm:max-w-sm'
    />
  )
}
