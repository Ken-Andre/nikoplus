import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfDay, endOfDay, startOfMonth, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  PackageX,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardStats {
  dailySalesCount: number;
  dailySalesAmount: number;
  monthlySalesCount: number;
  monthlySalesAmount: number;
  outOfStockCount: number;
  lowStockCount: number;
  unresolvedAlertsCount: number;
}

interface SalesEvolution {
  date: string;
  amount: number;
  count: number;
}

interface PaymentDistribution {
  method: string;
  count: number;
  amount: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))'];

const paymentLabels: Record<string, string> = {
  cash: 'Espèces',
  mobile_money: 'Mobile Money',
  card: 'Carte',
  transfer: 'Virement',
};

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesEvolution, setSalesEvolution] = useState<SalesEvolution[]>([]);
  const [paymentDistribution, setPaymentDistribution] = useState<PaymentDistribution[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('boutique_id')
        .eq('id', user.id)
        .maybeSingle();

      const boutiqueId = profile?.boutique_id;
      const today = new Date();
      const dayStart = startOfDay(today).toISOString();
      const dayEnd = endOfDay(today).toISOString();
      const monthStart = startOfMonth(today).toISOString();

      // Fetch daily sales
      const { data: dailySales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('boutique_id', boutiqueId)
        .eq('status', 'completed')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd);

      // Fetch monthly sales
      const { data: monthlySales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('boutique_id', boutiqueId)
        .eq('status', 'completed')
        .gte('created_at', monthStart);

      // Fetch stock alerts
      const { data: stockData } = await supabase
        .from('stock')
        .select('quantity, product_id, products(alert_threshold)')
        .eq('boutique_id', boutiqueId);

      const outOfStock = stockData?.filter(s => s.quantity === 0).length || 0;
      const lowStock = stockData?.filter(s => {
        const threshold = (s.products as any)?.alert_threshold || 5;
        return s.quantity > 0 && s.quantity <= threshold;
      }).length || 0;

      // Fetch unresolved alerts
      const { count: unresolvedAlerts } = await supabase
        .from('stock_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('boutique_id', boutiqueId)
        .eq('is_resolved', false);

      setStats({
        dailySalesCount: dailySales?.length || 0,
        dailySalesAmount: dailySales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0,
        monthlySalesCount: monthlySales?.length || 0,
        monthlySalesAmount: monthlySales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0,
        outOfStockCount: outOfStock,
        lowStockCount: lowStock,
        unresolvedAlertsCount: unresolvedAlerts || 0,
      });

      // Fetch sales evolution (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(today, 6 - i);
        return { date, start: startOfDay(date).toISOString(), end: endOfDay(date).toISOString() };
      });

      const evolutionData: SalesEvolution[] = [];
      for (const day of last7Days) {
        const { data: daySales } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('boutique_id', boutiqueId)
          .eq('status', 'completed')
          .gte('created_at', day.start)
          .lte('created_at', day.end);

        evolutionData.push({
          date: format(day.date, 'EEE', { locale: fr }),
          amount: daySales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0,
          count: daySales?.length || 0,
        });
      }
      setSalesEvolution(evolutionData);

      // Fetch payment distribution
      const { data: paymentData } = await supabase
        .from('sales')
        .select('payment_method, total_amount')
        .eq('boutique_id', boutiqueId)
        .eq('status', 'completed')
        .gte('created_at', monthStart);

      const paymentMap = new Map<string, { count: number; amount: number }>();
      paymentData?.forEach(sale => {
        const existing = paymentMap.get(sale.payment_method) || { count: 0, amount: 0 };
        paymentMap.set(sale.payment_method, {
          count: existing.count + 1,
          amount: existing.amount + Number(sale.total_amount),
        });
      });

      setPaymentDistribution(
        Array.from(paymentMap.entries()).map(([method, data]) => ({
          method: paymentLabels[method] || method,
          ...data,
        }))
      );

      // Fetch top 5 products
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('product_name, quantity, total_price, sales!inner(boutique_id, status, created_at)')
        .eq('sales.boutique_id', boutiqueId)
        .eq('sales.status', 'completed')
        .gte('sales.created_at', monthStart);

      const productMap = new Map<string, { quantity: number; revenue: number }>();
      saleItems?.forEach(item => {
        const existing = productMap.get(item.product_name) || { quantity: 0, revenue: 0 };
        productMap.set(item.product_name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + Number(item.total_price),
        });
      });

      const sortedProducts = Array.from(productMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopProducts(sortedProducts);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick }: any) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout title="Tableau de Bord Manager">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                title="Ventes du jour"
                value={stats?.dailySalesCount || 0}
                subtitle={`${(stats?.dailySalesAmount || 0).toLocaleString('fr-FR')} XAF`}
                icon={ShoppingCart}
                color="text-primary"
              />
              <StatCard
                title="Ventes du mois"
                value={stats?.monthlySalesCount || 0}
                subtitle={`${(stats?.monthlySalesAmount || 0).toLocaleString('fr-FR')} XAF`}
                icon={TrendingUp}
                color="text-success"
              />
              <StatCard
                title="Ruptures de stock"
                value={stats?.outOfStockCount || 0}
                subtitle={`${stats?.lowStockCount || 0} en alerte`}
                icon={PackageX}
                color="text-destructive"
                onClick={() => navigate('/manager/stocks')}
              />
              <StatCard
                title="Alertes non résolues"
                value={stats?.unresolvedAlertsCount || 0}
                icon={AlertTriangle}
                color="text-warning"
                onClick={() => navigate('/manager/alertes')}
              />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sales Evolution */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des ventes (7 jours)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={salesEvolution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [`${value.toLocaleString('fr-FR')} XAF`, 'Montant']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Payment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par paiement</CardTitle>
              <CardDescription>Ce mois</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : paymentDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={paymentDistribution}
                      dataKey="count"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ method, percent }) => `${method} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {paymentDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top 5 Produits</CardTitle>
              <CardDescription>Ce mois par chiffre d'affaires</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/manager/produits')}>
              Voir tout <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString('fr-FR')} XAF`, 'CA']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Aucune vente ce mois
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Button className="h-16" onClick={() => navigate('/manager/produits')}>
            Gérer les produits
          </Button>
          <Button className="h-16" variant="outline" onClick={() => navigate('/manager/fournisseurs')}>
            Gérer les fournisseurs
          </Button>
          <Button className="h-16" variant="outline" onClick={() => navigate('/manager/alertes')}>
            Voir les alertes
            {stats?.unresolvedAlertsCount ? (
              <Badge variant="destructive" className="ml-2">{stats.unresolvedAlertsCount}</Badge>
            ) : null}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
