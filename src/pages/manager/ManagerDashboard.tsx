import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfDay, endOfDay, startOfMonth, subDays, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  AlertTriangle,
  PackageX,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Users,
  Target,
  FileSpreadsheet,
  FileText,
  Download,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useExportReports } from '@/hooks/useExportReports';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
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
  Legend,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';

interface DashboardStats {
  dailySalesCount: number;
  dailySalesAmount: number;
  monthlySalesCount: number;
  monthlySalesAmount: number;
  outOfStockCount: number;
  lowStockCount: number;
  unresolvedAlertsCount: number;
  avgTicket: number;
  previousWeekAmount: number;
  currentWeekAmount: number;
  weeklyGrowth: number;
  totalProducts: number;
  activeProducts: number;
}

interface SalesEvolution {
  date: string;
  fullDate: string;
  amount: number;
  count: number;
  previousAmount?: number;
}

interface PaymentDistribution {
  method: string;
  count: number;
  amount: number;
  fill: string;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface CategoryStats {
  name: string;
  revenue: number;
  count: number;
  fill: string;
}

interface HourlyDistribution {
  hour: string;
  count: number;
  amount: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const paymentLabels: Record<string, string> = {
  cash: 'Espèces',
  mobile_money: 'Mobile Money',
  card: 'Carte',
  transfer: 'Virement',
};

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { exportToExcel, exportToPDF } = useExportReports();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesEvolution, setSalesEvolution] = useState<SalesEvolution[]>([]);
  const [paymentDistribution, setPaymentDistribution] = useState<PaymentDistribution[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [hourlyDistribution, setHourlyDistribution] = useState<HourlyDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [boutiqueName, setBoutiqueName] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleExport = (type: 'excel' | 'pdf') => {
    const exportData = {
      stats,
      salesEvolution,
      categoryStats,
      topProducts,
      paymentDistribution,
      hourlyDistribution,
    };

    if (type === 'excel') {
      exportToExcel(exportData, boutiqueName);
    } else {
      exportToPDF(exportData, boutiqueName);
    }
  };

  const fetchDashboardData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('boutique_id, boutiques(name)')
        .eq('id', user.id)
        .maybeSingle();

      const boutiqueId = profile?.boutique_id;
      setBoutiqueName((profile?.boutiques as any)?.name || 'Boutique');
      const today = new Date();
      const dayStart = startOfDay(today).toISOString();
      const dayEnd = endOfDay(today).toISOString();
      const monthStart = startOfMonth(today).toISOString();
      
      // Current week and previous week
      const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
      const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 }).toISOString();
      const previousWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }).toISOString();
      const previousWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }).toISOString();

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

      // Fetch current week sales
      const { data: currentWeekSales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('boutique_id', boutiqueId)
        .eq('status', 'completed')
        .gte('created_at', currentWeekStart)
        .lte('created_at', currentWeekEnd);

      // Fetch previous week sales
      const { data: previousWeekSales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('boutique_id', boutiqueId)
        .eq('status', 'completed')
        .gte('created_at', previousWeekStart)
        .lte('created_at', previousWeekEnd);

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

      // Fetch products count
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: activeProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const dailyAmount = dailySales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const dailyCount = dailySales?.length || 0;
      const monthlyAmount = monthlySales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const currentWeekAmount = currentWeekSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const previousWeekAmount = previousWeekSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const weeklyGrowth = previousWeekAmount > 0 
        ? ((currentWeekAmount - previousWeekAmount) / previousWeekAmount) * 100 
        : currentWeekAmount > 0 ? 100 : 0;

      setStats({
        dailySalesCount: dailyCount,
        dailySalesAmount: dailyAmount,
        monthlySalesCount: monthlySales?.length || 0,
        monthlySalesAmount: monthlyAmount,
        outOfStockCount: outOfStock,
        lowStockCount: lowStock,
        unresolvedAlertsCount: unresolvedAlerts || 0,
        avgTicket: dailyCount > 0 ? dailyAmount / dailyCount : 0,
        currentWeekAmount,
        previousWeekAmount,
        weeklyGrowth,
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
      });

      // Fetch sales evolution (last 14 days with comparison)
      const last14Days = Array.from({ length: 14 }, (_, i) => {
        const date = subDays(today, 13 - i);
        return { date, start: startOfDay(date).toISOString(), end: endOfDay(date).toISOString() };
      });

      const evolutionData: SalesEvolution[] = [];
      for (const day of last14Days) {
        const { data: daySales } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('boutique_id', boutiqueId)
          .eq('status', 'completed')
          .gte('created_at', day.start)
          .lte('created_at', day.end);

        evolutionData.push({
          date: format(day.date, 'dd/MM', { locale: fr }),
          fullDate: format(day.date, 'EEEE d MMMM', { locale: fr }),
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
        Array.from(paymentMap.entries()).map(([method, data], index) => ({
          method: paymentLabels[method] || method,
          fill: COLORS[index % COLORS.length],
          ...data,
        }))
      );

      // Fetch top 5 products
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('product_name, quantity, total_price, product_id, sales!inner(boutique_id, status, created_at)')
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

      // Fetch category stats
      const { data: categories } = await supabase.from('categories').select('id, name');
      const { data: products } = await supabase.from('products').select('id, category_id');
      
      if (saleItems && categories && products) {
        const categoryMap = new Map<string, { revenue: number; count: number }>();
        
        saleItems.forEach(item => {
          const product = products.find(p => p.id === item.product_id);
          if (product?.category_id) {
            const category = categories.find(c => c.id === product.category_id);
            if (category) {
              const existing = categoryMap.get(category.name) || { revenue: 0, count: 0 };
              categoryMap.set(category.name, {
                revenue: existing.revenue + Number(item.total_price),
                count: existing.count + item.quantity,
              });
            }
          }
        });

        setCategoryStats(
          Array.from(categoryMap.entries())
            .map(([name, data], index) => ({ name, fill: COLORS[index % COLORS.length], ...data }))
            .sort((a, b) => b.revenue - a.revenue)
        );
      }

      // Fetch hourly distribution for today
      const { data: todaySales } = await supabase
        .from('sales')
        .select('created_at, total_amount')
        .eq('boutique_id', boutiqueId)
        .eq('status', 'completed')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd);

      const hourlyMap = new Map<number, { count: number; amount: number }>();
      for (let h = 8; h <= 20; h++) {
        hourlyMap.set(h, { count: 0, amount: 0 });
      }

      todaySales?.forEach(sale => {
        const hour = new Date(sale.created_at).getHours();
        if (hourlyMap.has(hour)) {
          const existing = hourlyMap.get(hour)!;
          hourlyMap.set(hour, {
            count: existing.count + 1,
            amount: existing.amount + Number(sale.total_amount),
          });
        }
      });

      setHourlyDistribution(
        Array.from(hourlyMap.entries()).map(([hour, data]) => ({
          hour: `${hour}h`,
          ...data,
        }))
      );

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, trendValue, onClick }: any) => (
    <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>{Math.abs(trend).toFixed(1)}%</span>
                {trendValue && <span className="text-muted-foreground ml-1">{trendValue}</span>}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const chartConfig = {
    amount: { label: "Montant", color: "hsl(var(--primary))" },
    count: { label: "Ventes", color: "hsl(var(--chart-2))" },
    revenue: { label: "CA", color: "hsl(var(--primary))" },
  };

  return (
    <AppLayout title="Tableau de Bord Manager">
      <div className="space-y-6">
        {/* Export Actions */}
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Exporter le rapport
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                Exporter en Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2 text-red-600" />
                Exporter en PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* KPI Cards - Extended */}
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
                title="Croissance hebdo"
                value={`${stats?.weeklyGrowth ? (stats.weeklyGrowth > 0 ? '+' : '') + stats.weeklyGrowth.toFixed(1) : 0}%`}
                subtitle={`${(stats?.currentWeekAmount || 0).toLocaleString('fr-FR')} XAF cette semaine`}
                icon={stats?.weeklyGrowth && stats.weeklyGrowth >= 0 ? TrendingUp : TrendingDown}
                color={stats?.weeklyGrowth && stats.weeklyGrowth >= 0 ? 'text-success' : 'text-destructive'}
              />
              <StatCard
                title="Panier moyen"
                value={`${(stats?.avgTicket || 0).toLocaleString('fr-FR')} XAF`}
                subtitle={`${stats?.dailySalesCount || 0} ventes aujourd'hui`}
                icon={Target}
                color="text-info"
              />
            </>
          )}
        </div>

        {/* Secondary Stats Row */}
        <div className="grid gap-4 md:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
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
                title="Ruptures de stock"
                value={stats?.outOfStockCount || 0}
                subtitle={`${stats?.lowStockCount || 0} produits en alerte`}
                icon={PackageX}
                color="text-destructive"
                onClick={() => navigate('/manager/stocks')}
              />
              <StatCard
                title="Alertes non résolues"
                value={stats?.unresolvedAlertsCount || 0}
                subtitle="Nécessitent une action"
                icon={AlertTriangle}
                color="text-warning"
                onClick={() => navigate('/manager/alertes')}
              />
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Produits actifs</p>
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{stats?.activeProducts || 0} / {stats?.totalProducts || 0}</p>
                  <Progress 
                    value={stats?.totalProducts ? (stats.activeProducts / stats.totalProducts) * 100 : 0} 
                    className="mt-2 h-2" 
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Main Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sales Evolution - Extended to 14 days */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Évolution des ventes (14 jours)
              </CardTitle>
              <CardDescription>Montant et nombre de ventes par jour</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <ChartContainer config={chartConfig} className="h-72 w-full">
                  <ComposedChart data={salesEvolution}>
                    <defs>
                      <linearGradient id="amountGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis yAxisId="amount" orientation="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <YAxis yAxisId="count" orientation="right" className="text-xs" />
                    <ChartTooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as SalesEvolution;
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-lg">
                              <p className="font-medium capitalize">{data.fullDate}</p>
                              <p className="text-primary">{Number(payload[0].value).toLocaleString('fr-FR')} XAF</p>
                              <p className="text-muted-foreground text-sm">{data.count} vente(s)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Area yAxisId="amount" type="monotone" dataKey="amount" name="Montant (XAF)" fill="url(#amountGradient)" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line yAxisId="count" type="monotone" dataKey="count" name="Nb ventes" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: 'hsl(var(--chart-2))' }} />
                  </ComposedChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category and Payment Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Ventes par catégorie</CardTitle>
              <CardDescription>Répartition du chiffre d'affaires ce mois</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : categoryStats.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <BarChart data={categoryStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={100} className="text-xs" />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as CategoryStats;
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-lg">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-primary">{data.revenue.toLocaleString('fr-FR')} XAF</p>
                              <p className="text-muted-foreground text-sm">{data.count} articles vendus</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par paiement</CardTitle>
              <CardDescription>Modes de paiement ce mois</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : paymentDistribution.length > 0 ? (
                <div className="h-64 flex items-center">
                  <ChartContainer config={chartConfig} className="h-full w-1/2">
                    <PieChart>
                      <Pie
                        data={paymentDistribution}
                        dataKey="amount"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                      >
                        {paymentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as PaymentDistribution;
                            return (
                              <div className="rounded-lg border bg-background p-3 shadow-lg">
                                <p className="font-medium">{data.method}</p>
                                <p className="text-primary">{data.amount.toLocaleString('fr-FR')} XAF</p>
                                <p className="text-muted-foreground text-sm">{data.count} transaction(s)</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ChartContainer>
                  <div className="w-1/2 space-y-2">
                    {paymentDistribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                          <span>{item.method}</span>
                        </div>
                        <span className="font-medium">{item.amount.toLocaleString('fr-FR')} XAF</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hourly Distribution and Top Products */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Hourly Sales Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Activité par heure</CardTitle>
              <CardDescription>Distribution des ventes aujourd'hui</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <BarChart data={hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as HourlyDistribution;
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-lg">
                              <p className="font-medium">{data.hour}</p>
                              <p className="text-primary">{data.amount.toLocaleString('fr-FR')} XAF</p>
                              <p className="text-muted-foreground text-sm">{data.count} vente(s)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top 5 Produits</CardTitle>
                <CardDescription>Par chiffre d'affaires ce mois</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/manager/produits')}>
                Voir tout <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : topProducts.length > 0 ? (
                <div className="space-y-4">
                  {topProducts.map((product, index) => {
                    const maxRevenue = topProducts[0].revenue;
                    const percentage = (product.revenue / maxRevenue) * 100;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                              {index + 1}
                            </span>
                            <span className="truncate max-w-[150px]" title={product.name}>{product.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">{product.revenue.toLocaleString('fr-FR')} XAF</span>
                            <span className="text-muted-foreground text-xs ml-2">({product.quantity} vendus)</span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Aucune vente ce mois
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4">
          <Button className="h-14" onClick={() => navigate('/manager/produits')}>
            Gérer les produits
          </Button>
          <Button className="h-14" variant="outline" onClick={() => navigate('/manager/categories')}>
            Gérer les catégories
          </Button>
          <Button className="h-14" variant="outline" onClick={() => navigate('/manager/fournisseurs')}>
            Gérer les fournisseurs
          </Button>
          <Button className="h-14" variant="outline" onClick={() => navigate('/manager/alertes')}>
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
