import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Store,
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowRight,
  UserPlus,
  Building2,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalBoutiques: number;
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  unresolvedAlerts: number;
  usersByRole: {
    admin: number;
    manager: number;
    seller: number;
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total boutiques
      const { count: totalBoutiques } = await supabase
        .from('boutiques')
        .select('*', { count: 'exact', head: true });

      // Fetch total sales and revenue
      const { data: salesData } = await supabase
        .from('sales')
        .select('total_amount');

      const totalSales = salesData?.length || 0;
      const totalRevenue = salesData?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;

      // Fetch total products
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch unresolved alerts
      const { count: unresolvedAlerts } = await supabase
        .from('stock_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('is_resolved', false);

      // Fetch users by role
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role');

      const usersByRole = {
        admin: rolesData?.filter(r => r.role === 'admin').length || 0,
        manager: rolesData?.filter(r => r.role === 'manager').length || 0,
        seller: rolesData?.filter(r => r.role === 'seller').length || 0,
      };

      setStats({
        totalUsers: totalUsers || 0,
        totalBoutiques: totalBoutiques || 0,
        totalSales,
        totalRevenue,
        totalProducts: totalProducts || 0,
        unresolvedAlerts: unresolvedAlerts || 0,
        usersByRole,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (value: number): string => {
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    subtitle,
    color = 'primary',
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    subtitle?: string;
    color?: 'primary' | 'success' | 'warning' | 'destructive';
  }) => {
    const colorClasses = {
      primary: 'bg-primary/10 text-primary',
      success: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
      destructive: 'bg-destructive/10 text-destructive',
    };

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
              {subtitle && (
                <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout title="Administration">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                title="Utilisateurs"
                value={stats?.totalUsers || 0}
                icon={Users}
                subtitle={`${stats?.usersByRole.admin || 0} admin, ${stats?.usersByRole.manager || 0} managers, ${stats?.usersByRole.seller || 0} vendeurs`}
              />
              <StatCard
                title="Boutiques"
                value={stats?.totalBoutiques || 0}
                icon={Store}
                color="success"
              />
              <StatCard
                title="Ventes totales"
                value={stats?.totalSales || 0}
                icon={ShoppingCart}
              />
              <StatCard
                title="Chiffre d'affaires"
                value={`${formatAmount(stats?.totalRevenue || 0)} XAF`}
                icon={TrendingUp}
                color="success"
              />
              <StatCard
                title="Produits"
                value={stats?.totalProducts || 0}
                icon={Package}
              />
              <StatCard
                title="Alertes non résolues"
                value={stats?.unresolvedAlerts || 0}
                icon={AlertTriangle}
                color={stats?.unresolvedAlerts ? 'destructive' : 'success'}
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Gestion des utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Créer des comptes, attribuer des rôles et gérer les accès des utilisateurs.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/admin/utilisateurs')}
                >
                  Voir tous
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => navigate('/admin/utilisateurs?action=create')}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nouveau
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="h-5 w-5 text-primary" />
                Gestion des boutiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Ajouter, modifier ou supprimer des boutiques du réseau.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/admin/boutiques')}
                >
                  Voir toutes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => navigate('/admin/boutiques?action=create')}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Nouvelle
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Rapports globaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Consulter les rapports consolidés de toutes les boutiques.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/admin/rapports')}
              >
                Voir les rapports
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Users by Role breakdown */}
        {!isLoading && stats && (
          <Card>
            <CardHeader>
              <CardTitle>Répartition des utilisateurs par rôle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                    <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.usersByRole.admin}</p>
                    <p className="text-sm text-muted-foreground">Administrateurs</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.usersByRole.manager}</p>
                    <p className="text-sm text-muted-foreground">Managers</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.usersByRole.seller}</p>
                    <p className="text-sm text-muted-foreground">Vendeurs</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
