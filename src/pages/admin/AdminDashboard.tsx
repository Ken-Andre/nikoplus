import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Store,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowRight,
  UserPlus,
  Building2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  // Previous period comparison
  previousPeriod: {
    totalSales: number;
    totalRevenue: number;
  };
}

interface DailyData {
  date: string;
  revenue: number;
  sales: number;
}

interface BoutiquePerformance {
  id: string;
  name: string;
  revenue: number;
  salesCount: number;
}

interface CriticalAlert {
  id: string;
  productName: string;
  boutiqueName: string;
  alertType: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [topBoutiques, setTopBoutiques] = useState<BoutiquePerformance[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchStats();
    fetchDailyTrends();
    fetchTopBoutiques();
    fetchCriticalAlerts();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const sixtyDaysAgo = subDays(now, 60);

      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total boutiques
      const { count: totalBoutiques } = await supabase
        .from('boutiques')
        .select('*', { count: 'exact', head: true });

      // Fetch current period sales (last 30 days)
      const { data: currentSalesData } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const totalSales = currentSalesData?.length || 0;
      const totalRevenue = currentSalesData?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;

      // Fetch previous period sales (30-60 days ago)
      const { data: previousSalesData } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      const previousTotalSales = previousSalesData?.length || 0;
      const previousTotalRevenue = previousSalesData?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;

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
        previousPeriod: {
          totalSales: previousTotalSales,
          totalRevenue: previousTotalRevenue,
        },
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyTrends = async () => {
    try {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);

      const { data: salesData } = await supabase
        .from('sales')
        .select('created_at, total_amount')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Group by day
      const dailyMap = new Map<string, { revenue: number; sales: number }>();
      
      // Initialize all days in the range
      for (let i = 29; i >= 0; i--) {
        const date = format(subDays(now, i), 'yyyy-MM-dd');
        dailyMap.set(date, { revenue: 0, sales: 0 });
      }

      // Fill with actual data
      salesData?.forEach((sale) => {
        const date = format(new Date(sale.created_at), 'yyyy-MM-dd');
        const existing = dailyMap.get(date) || { revenue: 0, sales: 0 };
        dailyMap.set(date, {
          revenue: existing.revenue + (sale.total_amount || 0),
          sales: existing.sales + 1,
        });
      });

      const result: DailyData[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date: format(new Date(date), 'dd MMM', { locale: fr }),
        revenue: data.revenue,
        sales: data.sales,
      }));

      setDailyData(result);
    } catch (error) {
      console.error('Error fetching daily trends:', error);
    }
  };

  const fetchTopBoutiques = async () => {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30);

      // Fetch boutiques
      const { data: boutiques } = await supabase.from('boutiques').select('id, name');

      // Fetch sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('boutique_id, total_amount')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Calculate per boutique
      const boutiqueStats = new Map<string, { revenue: number; salesCount: number }>();
      
      boutiques?.forEach((b) => {
        boutiqueStats.set(b.id, { revenue: 0, salesCount: 0 });
      });

      salesData?.forEach((sale) => {
        const existing = boutiqueStats.get(sale.boutique_id) || { revenue: 0, salesCount: 0 };
        boutiqueStats.set(sale.boutique_id, {
          revenue: existing.revenue + (sale.total_amount || 0),
          salesCount: existing.salesCount + 1,
        });
      });

      const result: BoutiquePerformance[] = (boutiques || [])
        .map((b) => ({
          id: b.id,
          name: b.name,
          ...boutiqueStats.get(b.id)!,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopBoutiques(result);
    } catch (error) {
      console.error('Error fetching top boutiques:', error);
    }
  };

  const fetchCriticalAlerts = async () => {
    try {
      const { data: alerts } = await supabase
        .from('stock_alerts')
        .select(`
          id,
          alert_type,
          created_at,
          product_id,
          boutique_id
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!alerts?.length) {
        setCriticalAlerts([]);
        return;
      }

      // Fetch product and boutique names
      const productIds = [...new Set(alerts.map(a => a.product_id))];
      const boutiqueIds = [...new Set(alerts.map(a => a.boutique_id))];

      const [{ data: products }, { data: boutiques }] = await Promise.all([
        supabase.from('products').select('id, name').in('id', productIds),
        supabase.from('boutiques').select('id, name').in('id', boutiqueIds),
      ]);

      const productMap = new Map(products?.map(p => [p.id, p.name]) || []);
      const boutiqueMap = new Map(boutiques?.map(b => [b.id, b.name]) || []);

      const result: CriticalAlert[] = alerts.map(a => ({
        id: a.id,
        productName: productMap.get(a.product_id) || 'Produit inconnu',
        boutiqueName: boutiqueMap.get(a.boutique_id) || 'Boutique inconnue',
        alertType: a.alert_type,
        createdAt: a.created_at,
      }));

      setCriticalAlerts(result);
    } catch (error) {
      console.error('Error fetching critical alerts:', error);
    }
  };

  const formatAmount = (value: number): string => {
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const calculateVariation = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    subtitle,
    color = 'primary',
    variation,
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    subtitle?: string;
    color?: 'primary' | 'success' | 'warning' | 'destructive';
    variation?: number;
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
              {variation !== undefined && (
                <div className="mt-1 flex items-center gap-1">
                  {variation >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs font-medium ${variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {variation >= 0 ? '+' : ''}{variation}% vs période précédente
                  </span>
                </div>
              )}
              {subtitle && !variation && (
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

  const salesVariation = stats ? calculateVariation(stats.totalSales, stats.previousPeriod.totalSales) : 0;
  const revenueVariation = stats ? calculateVariation(stats.totalRevenue, stats.previousPeriod.totalRevenue) : 0;

  return (
    <AppLayout title="Administration">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
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
                title="Ventes (30 jours)"
                value={stats?.totalSales || 0}
                icon={ShoppingCart}
                variation={salesVariation}
              />
              <StatCard
                title="CA (30 jours)"
                value={`${formatAmount(stats?.totalRevenue || 0)} XAF`}
                icon={TrendingUp}
                color="success"
                variation={revenueVariation}
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

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tendance du chiffre d'affaires (30 jours)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${formatAmount(value)} XAF`, 'CA']}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Sales Count Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nombre de ventes (30 jours)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Ventes']}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="sales" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Boutiques & Critical Alerts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top 5 Boutiques */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top 5 Boutiques (30 jours)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : topBoutiques.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune donnée disponible</p>
              ) : (
                <div className="space-y-3">
                  {topBoutiques.map((boutique, index) => (
                    <div 
                      key={boutique.id} 
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm
                          ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                            index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                            index === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-muted text-muted-foreground'}`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{boutique.name}</p>
                          <p className="text-xs text-muted-foreground">{boutique.salesCount} ventes</p>
                        </div>
                      </div>
                      <p className="font-semibold text-primary">{formatAmount(boutique.revenue)} XAF</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Critical Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Alertes Critiques</CardTitle>
              {criticalAlerts.length > 0 && (
                <Badge variant="destructive">{stats?.unresolvedAlerts || 0} non résolues</Badge>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : criticalAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                    <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="mt-3 font-medium">Aucune alerte critique</p>
                  <p className="text-sm text-muted-foreground">Tous les stocks sont en ordre</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {criticalAlerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alert.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.boutiqueName} • {alert.alertType === 'out_of_stock' ? 'Rupture de stock' : 'Stock bas'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(alert.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
