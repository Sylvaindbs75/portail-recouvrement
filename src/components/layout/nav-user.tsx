import { ChevronsUpDown, LogOut } from 'lucide-react'
import useDialogState from '@/hooks/use-dialog-state'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { SignOutDialog } from '@/components/sign-out-dialog'

function initiales(nom: string) {
  return (
    nom
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((m) => m[0]?.toUpperCase())
      .join('') || '?'
  )
}

export function NavUser({ nom, email }: { nom: string; email: string }) {
  const { isMobile } = useSidebar()
  const [open, setOpen] = useDialogState()

  const identite = (
    <>
      <Avatar className='h-8 w-8 rounded-lg'>
        <AvatarFallback className='rounded-lg'>{initiales(nom)}</AvatarFallback>
      </Avatar>
      <div className='grid flex-1 text-start text-sm leading-tight'>
        <span className='truncate font-semibold'>{nom}</span>
        <span className='truncate text-xs'>{email}</span>
      </div>
    </>
  )

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                {identite}
                <ChevronsUpDown className='ms-auto size-4' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              side={isMobile ? 'bottom' : 'right'}
              align='end'
              sideOffset={4}
            >
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-start text-sm'>{identite}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant='destructive' onClick={() => setOpen(true)}>
                <LogOut />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
