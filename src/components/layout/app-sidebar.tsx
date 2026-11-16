import { useQuery } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'
import { FilePlus2, FolderOpen, LayoutDashboard, Scale } from 'lucide-react'
import { requetes } from '@/lib/recouvrement/api'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import type { NavGroup as NavGroupType } from './types'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { profil, user } = useRouteContext({ from: '/_authenticated' })
  const estCabinet = profil?.role === 'cabinet'
  const { data: validations = [] } = useQuery({ ...requetes.validations(), enabled: !!profil })
  const enAttente = validations.filter((v) => v.statut === 'en_attente').length

  const groupes: NavGroupType[] = estCabinet
    ? [
        {
          title: 'Espace cabinet',
          items: [
            { title: 'Dossiers', url: '/cabinet', icon: FolderOpen },
            { title: 'Nouveau dossier', url: '/cabinet/nouveau', icon: FilePlus2 },
          ],
        },
      ]
    : [
        {
          title: 'Espace syndic',
          items: [
            {
              title: 'Tableau de bord',
              url: '/syndic',
              icon: LayoutDashboard,
              badge: enAttente ? String(enAttente) : undefined,
            },
          ],
        },
      ]

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' className='hover:bg-transparent'>
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                <Scale className='size-4' />
              </div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold'>[NOM DU CABINET]</span>
                <span className='truncate text-xs'>{estCabinet ? 'Espace cabinet' : 'Espace syndic'}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groupes.map((g) => (
          <NavGroup key={g.title} {...g} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser nom={profil?.nom_affiche ?? 'Utilisateur'} email={user.email ?? ''} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
