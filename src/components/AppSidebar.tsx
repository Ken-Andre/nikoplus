import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  ShoppingCart,
  Package,
  History,
  User,
  LayoutDashboard,
  Users,
  Truck,
  Bell,
  FileText,
  Settings,
  LogOut,
  Menu,
  Store,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const sellerNavItems = [
  { title: 'Accueil', url: '/vendeur/accueil', icon: Home },
  { title: 'Nouvelle Vente', url: '/vendeur/nouvelle-vente', icon: ShoppingCart },
  { title: 'Historique Ventes', url: '/vendeur/historique-ventes', icon: History },
  { title: 'Consulter Stocks', url: '/vendeur/stocks', icon: Package },
];

const adminNavItems = [
  { title: 'Tableau de Bord', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Produits', url: '/manager/produits', icon: Package },
  { title: 'Catégories', url: '/manager/categories', icon: FolderOpen },
  { title: 'Ventes', url: '/admin/ventes', icon: ShoppingCart },
  { title: 'Stocks', url: '/admin/stocks', icon: Package },
  { title: 'Utilisateurs', url: '/admin/utilisateurs', icon: Users },
  { title: 'Fournisseurs', url: '/admin/fournisseurs', icon: Truck },
  { title: 'Alertes', url: '/admin/alertes', icon: Bell },
  { title: 'Rapports', url: '/admin/rapports', icon: FileText },
  { title: 'Paramètres', url: '/admin/parametres', icon: Settings },
];

const managerNavItems = [
  { title: 'Tableau de Bord', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Produits', url: '/manager/produits', icon: Package },
  { title: 'Catégories', url: '/manager/categories', icon: FolderOpen },
  { title: 'Ventes', url: '/admin/ventes', icon: ShoppingCart },
  { title: 'Stocks', url: '/admin/stocks', icon: Package },
  { title: 'Fournisseurs', url: '/admin/fournisseurs', icon: Truck },
  { title: 'Alertes', url: '/admin/alertes', icon: Bell },
  { title: 'Rapports', url: '/admin/rapports', icon: FileText },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const getNavItems = () => {
    switch (user?.role) {
      case 'admin':
        return adminNavItems;
      case 'manager':
        return managerNavItems;
      default:
        return sellerNavItems;
    }
  };

  const navItems = getNavItems();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display font-bold">
            N+
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display font-semibold text-sidebar-foreground">
                NICKOPLUS
              </span>
              <span className="text-xs text-sidebar-muted">PRO</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Boutique indicator */}
        {user?.boutiqueName && !collapsed && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2">
              <Store className="h-4 w-4 text-sidebar-muted" />
              <span className="text-sm text-sidebar-foreground">{user.boutiqueName}</span>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted">
            {user?.role === 'seller' ? 'Vendeur' : 'Gestion'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted">Compte</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/profil')}
                  tooltip="Mon Profil"
                >
                  <Link to="/profil">
                    <User className="h-4 w-4" />
                    <span>Mon Profil</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!collapsed && user && (
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-foreground">
              {user.firstName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {user.firstName} {user.lastName}
              </span>
              <span className="truncate text-xs text-sidebar-muted capitalize">
                {user.role === 'seller' ? 'Vendeur' : user.role === 'manager' ? 'Gérante' : 'Administrateur'}
              </span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span>Déconnexion</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
