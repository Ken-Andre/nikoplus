import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Store,
  TrendingUp,
  Users,
  ShoppingCart,
  Award,
  Calendar,
} from 'lucide-react';
import { useExportReports } from '@/hooks/useExportReports';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BoutiqueStats {
  id: string;
  name: string;
  totalSales: number;
  totalRevenue: number;
  avgTicket: number;
}

interface SellerStats {
  id: string;
  name: string;
  boutiqueName: string;
  totalSales: number;
  totalRevenue: number;
}

interface ProductStats {
  id: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface DailyStats {
  date: string;
  revenue: number;
  sales: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const PERIODS = [
  { value: '7', label: '7 derniers jours' },
  { value: '30', label: '30 derniers jours' },
  { value: 'month', label: 'Ce mois-ci' },
  { value: 'lastMonth', label: 'Mois dernier' },
  { value: '90', label: '3 derniers mois' },
];

export default function RapportsGlobaux() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { exportToPDF, exportToExcel } = useExportReports();
  
  const [period, setPeriod] = useState('30');
  const [isLoading, setIsLoading] = useState(true);
  const [boutiqueStats, setBoutiqueStats] = useState<BoutiqueStats[]>([]);
  const [sellerStats, setSellerStats] = useState<SellerStats[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAllStats();
  }, [user, navigate, period]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (period) {
      case '7':
        startDate = subDays(now, 7);
        break;
      case '30':
        startDate = subDays(now, 30);
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'lastMonth':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case '90':
        startDate = subDays(now, 90);
        break;
      default:
        startDate = subDays(now, 30);
    }

    return { startDate, endDate };
  };

  const fetchAllStats = async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const startStr = startDate.toISOString();
      const endStr = endDate.toISOString();

      // Fetch all boutiques
      const { data: boutiques } = await supabase.from('boutiques').select('*');

      // Fetch all sales in period
      const { data: sales } = await supabase
        .from('sales')
        .select('*, sale_items(*)')
        .gte('created_at', startStr)
        .lte('created_at', endStr)
        .eq('status', 'completed');

      // Fetch profiles for seller names
      const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, boutique_id');

      // Calculate boutique stats
      const boutiqueMap = new Map<string, BoutiqueStats>();
      boutiques?.forEach(b => {
        boutiqueMap.set(b.id, {
          id: b.id,
          name: b.name,
          totalSales: 0,
          totalRevenue: 0,
          avgTicket: 0,
        });
      });

      // Calculate seller stats
      const sellerMap = new Map<string, SellerStats>();
      
      // Calculate daily stats
      const dailyMap = new Map<string, DailyStats>();

      // Calculate product stats
      const productMap = new Map<string, ProductStats>();

      let globalRevenue = 0;
      let globalSales = 0;

      sales?.forEach(sale => {
        globalRevenue += sale.total_amount || 0;
        globalSales++;

        // Boutique stats
        const boutiqueStat = boutiqueMap.get(sale.boutique_id);
        if (boutiqueStat) {
          boutiqueStat.totalSales++;
          boutiqueStat.totalRevenue += sale.total_amount || 0;
        }

        // Seller stats
        const profile = profiles?.find(p => p.id === sale.seller_id);
        const sellerName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Inconnu';
        const boutiqueName = boutiques?.find(b => b.id === sale.boutique_id)?.name || 'Inconnue';
        
        if (!sellerMap.has(sale.seller_id)) {
          sellerMap.set(sale.seller_id, {
            id: sale.seller_id,
            name: sellerName || 'Inconnu',
            boutiqueName,
            totalSales: 0,
            totalRevenue: 0,
          });
        }
        const sellerStat = sellerMap.get(sale.seller_id)!;
        sellerStat.totalSales++;
        sellerStat.totalRevenue += sale.total_amount || 0;

        // Daily stats
        const dateKey = format(new Date(sale.created_at), 'yyyy-MM-dd');
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { date: dateKey, revenue: 0, sales: 0 });
        }
        const dailyStat = dailyMap.get(dateKey)!;
        dailyStat.revenue += sale.total_amount || 0;
        dailyStat.sales++;

        // Product stats
        sale.sale_items?.forEach((item: any) => {
          if (!productMap.has(item.product_id)) {
            productMap.set(item.product_id, {
              id: item.product_id,
              name: item.product_name,
              totalQuantity: 0,
              totalRevenue: 0,
            });
          }
          const productStat = productMap.get(item.product_id)!;
          productStat.totalQuantity += item.quantity;
          productStat.totalRevenue += item.total_price;
        });
      });

      // Calculate avg ticket for boutiques
      boutiqueMap.forEach(b => {
        b.avgTicket = b.totalSales > 0 ? b.totalRevenue / b.totalSales : 0;
      });

      setBoutiqueStats(Array.from(boutiqueMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue));
      setSellerStats(Array.from(sellerMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10));
      setTopProducts(Array.from(productMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 10));
      setDailyStats(Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)));
      setTotalRevenue(globalRevenue);
      setTotalSales(globalSales);
    } catch (error) {
      console.error('Error fetching global stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (value: number): string => {
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleExportPDF = () => {
    const data = {
      title: 'Rapport Global des Ventes',
      period: PERIODS.find(p => p.value === period)?.label || '',
      stats: {
        totalRevenue,
        totalSales,
        avgTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
      },
      boutiques: boutiqueStats,
      topProducts,
      topSellers: sellerStats,
    };
    
    exportToPDF(
      boutiqueStats.map(b => ({
        Boutique: b.name,
        'Nombre de ventes': b.totalSales,
        'Chiffre d\'affaires': `${formatAmount(b.totalRevenue)} XAF`,
        'Panier moyen': `${formatAmount(b.avgTicket)} XAF`,
      })),
      `rapport-global-${format(new Date(), 'yyyy-MM-dd')}`
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      boutiqueStats.map(b => ({
        Boutique: b.name,
        'Nombre de ventes': b.totalSales,
        'Chiffre d\'affaires (XAF)': b.totalRevenue,
        'Panier moyen (XAF)': Math.round(b.avgTicket),
      })),
      `rapport-global-${format(new Date(), 'yyyy-MM-dd')}`
    );
  };

  return (
    <AppLayout title="Rapports Globaux">
      <div className="space-y-6">
        {/* Header with filters and export */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chiffre d'affaires total</p>
                  <p className="text-2xl font-bold">{formatAmount(totalRevenue)} XAF</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3 text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre de ventes</p>
                  <p className="text-2xl font-bold">{totalSales}</p>
                </div>
                <div className="rounded-lg bg-green-100 p-3 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Panier moyen</p>
                  <p className="text-2xl font-bold">
                    {formatAmount(totalSales > 0 ? totalRevenue / totalSales : 0)} XAF
                  </p>
                </div>
                <div className="rounded-lg bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                  <Store className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="boutiques" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="boutiques">Boutiques</TabsTrigger>
            <TabsTrigger value="evolution">Évolution</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="sellers">Vendeurs</TabsTrigger>
          </TabsList>

          {/* Boutiques Comparison */}
          <TabsContent value="boutiques" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Comparaison des boutiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={boutiqueStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => [`${formatAmount(value)} XAF`, 'CA']}
                        labelFormatter={(label) => `Boutique: ${label}`}
                      />
                      <Bar dataKey="totalRevenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Boutiques Table */}
            <Card>
              <CardHeader>
                <CardTitle>Détail par boutique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">Boutique</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Ventes</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Chiffre d'affaires</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Panier moyen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boutiqueStats.map((b, i) => (
                        <tr key={b.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                          <td className="px-4 py-3 font-medium">{b.name}</td>
                          <td className="px-4 py-3 text-right">{b.totalSales}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatAmount(b.totalRevenue)} XAF</td>
                          <td className="px-4 py-3 text-right">{formatAmount(b.avgTicket)} XAF</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evolution Chart */}
          <TabsContent value="evolution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Évolution du chiffre d'affaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => format(new Date(v), 'dd/MM', { locale: fr })}
                        className="text-xs"
                      />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => [`${formatAmount(value)} XAF`, 'CA']}
                        labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy', { locale: fr })}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nombre de ventes par jour</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => format(new Date(v), 'dd/MM', { locale: fr })}
                        className="text-xs"
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [value, 'Ventes']}
                        labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy', { locale: fr })}
                      />
                      <Bar dataKey="sales" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Products */}
          <TabsContent value="products" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Top 10 produits (quantité)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={120}
                          className="text-xs"
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip formatter={(value: number) => [value, 'Quantité vendue']} />
                        <Bar dataKey="totalQuantity" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top 10 produits (CA)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topProducts.map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.totalQuantity} vendus</p>
                        </div>
                        <span className="text-sm font-medium">{formatAmount(p.totalRevenue)} XAF</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Top Sellers */}
          <TabsContent value="sellers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Classement des vendeurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Vendeur</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Boutique</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Ventes</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">CA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerStats.map((s, i) => (
                        <tr key={s.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                          <td className="px-4 py-3">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                              i === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              i === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                              i === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">{s.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.boutiqueName}</td>
                          <td className="px-4 py-3 text-right">{s.totalSales}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatAmount(s.totalRevenue)} XAF</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
