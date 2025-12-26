import { useState, useEffect } from 'react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, differenceInDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Calendar,
  BarChart3,
  ArrowRight,
  RefreshCw,
  ShoppingCart,
  Target,
  Loader2,
  Store,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ProductForecast {
  productId: string;
  productName: string;
  reference: string;
  currentStock: number;
  alertThreshold: number;
  avgDailySales: number;
  avgWeeklySales: number;
  avgMonthlySales: number;
  predictedDailySales: number;
  daysUntilStockout: number | null;
  recommendedReorder: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  lastMonthSales: number;
  currentMonthSales: number;
}

interface SalesForecast {
  date: string;
  fullDate: string;
  historical: number;
  predicted: number;
  lowerBound: number;
  upperBound: number;
}

interface CategoryForecast {
  categoryId: string;
  categoryName: string;
  lastMonthRevenue: number;
  currentMonthRevenue: number;
  predictedRevenue: number;
  growth: number;
}

interface ForecastStats {
  predictedMonthlyRevenue: number;
  predictedDailySales: number;
  productsAtRisk: number;
  productsNeedReorder: number;
  averageGrowth: number;
}

const FORECAST_DAYS = 14;

export default function PrevisionsVentes() {
  const { user, boutiques } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [boutiqueId, setBoutiqueId] = useState<string | null>(null);
  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState<string>('');
  const [productForecasts, setProductForecasts] = useState<ProductForecast[]>([]);
  const [salesForecast, setSalesForecast] = useState<SalesForecast[]>([]);
  const [categoryForecasts, setCategoryForecasts] = useState<CategoryForecast[]>([]);
  const [forecastStats, setForecastStats] = useState<ForecastStats | null>(null);
  const [forecastPeriod, setForecastPeriod] = useState<'7' | '14' | '30'>('14');
  const [sortBy, setSortBy] = useState<'risk' | 'sales' | 'stock'>('risk');

  const isAdmin = user?.role === 'admin';
  const [boutiquesLoaded, setBoutiquesLoaded] = useState(false);

  // Set default boutique when boutiques are loaded
  useEffect(() => {
    if (boutiques.length > 0 && !boutiquesLoaded) {
      setBoutiquesLoaded(true);
      if (isAdmin && !selectedBoutiqueId) {
        setSelectedBoutiqueId(boutiques[0].id);
      } else if (!isAdmin && user?.boutiqueId && !selectedBoutiqueId) {
        setSelectedBoutiqueId(user.boutiqueId);
      }
    }
  }, [isAdmin, boutiques, user?.boutiqueId, selectedBoutiqueId, boutiquesLoaded]);

  useEffect(() => {
    if (selectedBoutiqueId) {
      fetchForecastData();
    }
  }, [selectedBoutiqueId, forecastPeriod]);

  const fetchForecastData = async () => {
    if (!selectedBoutiqueId) return;
    setIsLoading(true);

    try {
      const boutique_id = selectedBoutiqueId;
      setBoutiqueId(boutique_id);

      const today = new Date();
      const lastMonth = subMonths(today, 1);
      const twoMonthsAgo = subMonths(today, 2);
      const threeMonthsAgo = subMonths(today, 3);

      // Fetch sales data for the last 3 months
      const { data: salesData } = await supabase
        .from('sale_items')
        .select(`
          product_id,
          product_name,
          quantity,
          total_price,
          created_at,
          sales!inner(boutique_id, status, created_at)
        `)
        .eq('sales.boutique_id', boutique_id)
        .eq('sales.status', 'completed')
        .gte('sales.created_at', threeMonthsAgo.toISOString());

      // Fetch current stock levels
      const { data: stockData } = await supabase
        .from('stock')
        .select('product_id, quantity')
        .eq('boutique_id', boutique_id);

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, reference, alert_threshold, category_id, categories(name)')
        .eq('is_active', true);

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name');

      // Create stock map
      const stockMap = new Map(stockData?.map(s => [s.product_id, s.quantity]) || []);

      // Analyze product sales and create forecasts
      const productSalesMap = new Map<string, {
        quantities: number[];
        dates: Date[];
        totalQuantity: number;
        totalRevenue: number;
        lastMonthQuantity: number;
        currentMonthQuantity: number;
      }>();

      salesData?.forEach(item => {
        const date = new Date((item.sales as any).created_at);
        const existing = productSalesMap.get(item.product_id) || {
          quantities: [],
          dates: [],
          totalQuantity: 0,
          totalRevenue: 0,
          lastMonthQuantity: 0,
          currentMonthQuantity: 0,
        };

        existing.quantities.push(item.quantity);
        existing.dates.push(date);
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += Number(item.total_price);

        if (date >= startOfMonth(today) && date <= today) {
          existing.currentMonthQuantity += item.quantity;
        } else if (date >= startOfMonth(lastMonth) && date < startOfMonth(today)) {
          existing.lastMonthQuantity += item.quantity;
        }

        productSalesMap.set(item.product_id, existing);
      });

      // Calculate product forecasts
      const forecasts: ProductForecast[] = [];
      const daysInPeriod = 90; // 3 months

      productsData?.forEach(product => {
        const salesInfo = productSalesMap.get(product.id);
        const currentStock = stockMap.get(product.id) || 0;
        const alertThreshold = product.alert_threshold || 5;

        if (salesInfo) {
          const avgDailySales = salesInfo.totalQuantity / daysInPeriod;
          const avgWeeklySales = avgDailySales * 7;
          const avgMonthlySales = avgDailySales * 30;

          // Calculate trend (compare last month to current month)
          const lastMonthDays = differenceInDays(startOfMonth(today), startOfMonth(lastMonth));
          const currentMonthDays = differenceInDays(today, startOfMonth(today)) + 1;
          
          const lastMonthAvgDaily = salesInfo.lastMonthQuantity / lastMonthDays;
          const currentMonthAvgDaily = salesInfo.currentMonthQuantity / currentMonthDays;
          
          let trend: 'up' | 'down' | 'stable' = 'stable';
          let trendPercent = 0;
          
          if (lastMonthAvgDaily > 0) {
            trendPercent = ((currentMonthAvgDaily - lastMonthAvgDaily) / lastMonthAvgDaily) * 100;
            if (trendPercent > 10) trend = 'up';
            else if (trendPercent < -10) trend = 'down';
          } else if (currentMonthAvgDaily > 0) {
            trend = 'up';
            trendPercent = 100;
          }

          // Predict future sales (weighted average favoring recent data)
          const predictedDailySales = (currentMonthAvgDaily * 0.6 + avgDailySales * 0.4);
          
          // Calculate days until stockout
          const daysUntilStockout = predictedDailySales > 0 
            ? Math.floor(currentStock / predictedDailySales)
            : null;

          // Calculate recommended reorder quantity (2 weeks of safety stock + forecast period)
          const forecastDays = parseInt(forecastPeriod);
          const recommendedReorder = Math.ceil(predictedDailySales * (forecastDays + 14)) - currentStock;

          forecasts.push({
            productId: product.id,
            productName: product.name,
            reference: product.reference,
            currentStock,
            alertThreshold,
            avgDailySales,
            avgWeeklySales,
            avgMonthlySales,
            predictedDailySales,
            daysUntilStockout,
            recommendedReorder: Math.max(0, recommendedReorder),
            trend,
            trendPercent,
            lastMonthSales: salesInfo.lastMonthQuantity,
            currentMonthSales: salesInfo.currentMonthQuantity,
          });
        } else {
          // Product with no sales history
          forecasts.push({
            productId: product.id,
            productName: product.name,
            reference: product.reference,
            currentStock,
            alertThreshold,
            avgDailySales: 0,
            avgWeeklySales: 0,
            avgMonthlySales: 0,
            predictedDailySales: 0,
            daysUntilStockout: null,
            recommendedReorder: 0,
            trend: 'stable',
            trendPercent: 0,
            lastMonthSales: 0,
            currentMonthSales: 0,
          });
        }
      });

      setProductForecasts(forecasts);

      // Generate sales forecast for chart
      const dailySalesMap = new Map<string, number>();
      salesData?.forEach(item => {
        const dateKey = format(new Date((item.sales as any).created_at), 'yyyy-MM-dd');
        dailySalesMap.set(dateKey, (dailySalesMap.get(dateKey) || 0) + Number(item.total_price));
      });

      // Calculate average daily sales for prediction
      let totalDailySales = 0;
      let daysWithSales = 0;
      for (let i = 1; i <= 30; i++) {
        const date = subDays(today, i);
        const dateKey = format(date, 'yyyy-MM-dd');
        const sales = dailySalesMap.get(dateKey) || 0;
        totalDailySales += sales;
        if (sales > 0) daysWithSales++;
      }
      const avgDailySalesRevenue = daysWithSales > 0 ? totalDailySales / daysWithSales : 0;
      const variability = 0.15; // 15% variability

      const forecastData: SalesForecast[] = [];
      const forecastDays = parseInt(forecastPeriod);

      // Historical data (last 14 days)
      for (let i = 14; i >= 1; i--) {
        const date = subDays(today, i);
        const dateKey = format(date, 'yyyy-MM-dd');
        const historical = dailySalesMap.get(dateKey) || 0;
        
        forecastData.push({
          date: format(date, 'dd/MM', { locale: fr }),
          fullDate: format(date, 'EEEE d MMMM', { locale: fr }),
          historical,
          predicted: 0,
          lowerBound: 0,
          upperBound: 0,
        });
      }

      // Today
      const todayKey = format(today, 'yyyy-MM-dd');
      const todaySales = dailySalesMap.get(todayKey) || 0;
      forecastData.push({
        date: format(today, 'dd/MM', { locale: fr }),
        fullDate: format(today, 'EEEE d MMMM', { locale: fr }),
        historical: todaySales,
        predicted: avgDailySalesRevenue,
        lowerBound: avgDailySalesRevenue * (1 - variability),
        upperBound: avgDailySalesRevenue * (1 + variability),
      });

      // Future predictions
      for (let i = 1; i <= forecastDays; i++) {
        const date = addDays(today, i);
        // Add slight randomization for realistic forecast
        const dayOfWeek = date.getDay();
        const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.85 : 1.05;
        const predicted = avgDailySalesRevenue * weekendFactor;
        
        forecastData.push({
          date: format(date, 'dd/MM', { locale: fr }),
          fullDate: format(date, 'EEEE d MMMM', { locale: fr }),
          historical: 0,
          predicted,
          lowerBound: predicted * (1 - variability),
          upperBound: predicted * (1 + variability),
        });
      }

      setSalesForecast(forecastData);

      // Calculate category forecasts
      const categoryStatsMap = new Map<string, {
        lastMonthRevenue: number;
        currentMonthRevenue: number;
      }>();

      salesData?.forEach(item => {
        const product = productsData?.find(p => p.id === item.product_id);
        if (!product?.category_id) return;

        const date = new Date((item.sales as any).created_at);
        const existing = categoryStatsMap.get(product.category_id) || {
          lastMonthRevenue: 0,
          currentMonthRevenue: 0,
        };

        if (date >= startOfMonth(today)) {
          existing.currentMonthRevenue += Number(item.total_price);
        } else if (date >= startOfMonth(lastMonth) && date < startOfMonth(today)) {
          existing.lastMonthRevenue += Number(item.total_price);
        }

        categoryStatsMap.set(product.category_id, existing);
      });

      const catForecasts: CategoryForecast[] = [];
      categoriesData?.forEach(category => {
        const stats = categoryStatsMap.get(category.id);
        if (stats) {
          const growth = stats.lastMonthRevenue > 0 
            ? ((stats.currentMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100
            : stats.currentMonthRevenue > 0 ? 100 : 0;
          
          const daysInCurrentMonth = differenceInDays(today, startOfMonth(today)) + 1;
          const remainingDays = differenceInDays(endOfMonth(today), today);
          const dailyAvg = stats.currentMonthRevenue / daysInCurrentMonth;
          const predictedRevenue = stats.currentMonthRevenue + (dailyAvg * remainingDays);

          catForecasts.push({
            categoryId: category.id,
            categoryName: category.name,
            lastMonthRevenue: stats.lastMonthRevenue,
            currentMonthRevenue: stats.currentMonthRevenue,
            predictedRevenue,
            growth,
          });
        }
      });

      setCategoryForecasts(catForecasts.sort((a, b) => b.predictedRevenue - a.predictedRevenue));

      // Calculate summary stats
      const productsAtRisk = forecasts.filter(f => 
        f.daysUntilStockout !== null && f.daysUntilStockout <= 7 && f.daysUntilStockout > 0
      ).length;
      
      const productsNeedReorder = forecasts.filter(f => 
        f.recommendedReorder > 0 && f.currentStock <= f.alertThreshold
      ).length;

      const forecastDaysNum = parseInt(forecastPeriod);
      const predictedMonthlyRevenue = avgDailySalesRevenue * 30;
      const predictedDailySales = forecasts.reduce((sum, f) => sum + f.predictedDailySales, 0);
      
      const productsWithTrend = forecasts.filter(f => f.lastMonthSales > 0);
      const averageGrowth = productsWithTrend.length > 0
        ? productsWithTrend.reduce((sum, f) => sum + f.trendPercent, 0) / productsWithTrend.length
        : 0;

      setForecastStats({
        predictedMonthlyRevenue,
        predictedDailySales,
        productsAtRisk,
        productsNeedReorder,
        averageGrowth,
      });

    } catch (error) {
      console.error('Error fetching forecast data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedProducts = [...productForecasts].sort((a, b) => {
    switch (sortBy) {
      case 'risk':
        // Products at risk first (low days until stockout)
        const aRisk = a.daysUntilStockout ?? 999;
        const bRisk = b.daysUntilStockout ?? 999;
        return aRisk - bRisk;
      case 'sales':
        return b.avgDailySales - a.avgDailySales;
      case 'stock':
        return a.currentStock - b.currentStock;
      default:
        return 0;
    }
  });

  const chartConfig = {
    historical: { label: 'Historique', color: 'hsl(var(--chart-1))' },
    predicted: { label: 'Prévision', color: 'hsl(var(--primary))' },
    upperBound: { label: 'Limite haute', color: 'hsl(var(--muted))' },
    lowerBound: { label: 'Limite basse', color: 'hsl(var(--muted))' },
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value);

  return (
    <AppLayout title="Prévisions de Ventes" backButton>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-muted-foreground">
              Analyse prédictive basée sur l'historique des 3 derniers mois
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Boutique selector for admin */}
            {isAdmin && boutiques.length > 0 && (
              <Select value={selectedBoutiqueId} onValueChange={setSelectedBoutiqueId}>
                <SelectTrigger className="w-[180px]">
                  <Store className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Boutique" />
                </SelectTrigger>
                <SelectContent>
                  {boutiques.map((boutique) => (
                    <SelectItem key={boutique.id} value={boutique.id}>
                      {boutique.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={forecastPeriod} onValueChange={(v: '7' | '14' | '30') => setForecastPeriod(v)}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="14">14 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchForecastData} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {formatCurrency(forecastStats?.predictedMonthlyRevenue || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">CA prévu (mois)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-2/10">
                      <ShoppingCart className="h-5 w-5 text-chart-2" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {forecastStats?.predictedDailySales.toFixed(0) || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Unités/jour prévues</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">
                        {forecastStats?.productsAtRisk || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Produits à risque</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      (forecastStats?.averageGrowth || 0) >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                    )}>
                      {(forecastStats?.averageGrowth || 0) >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className={cn(
                        "text-2xl font-bold",
                        (forecastStats?.averageGrowth || 0) >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {(forecastStats?.averageGrowth || 0) >= 0 ? '+' : ''}
                        {forecastStats?.averageGrowth.toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Tendance moyenne</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sales Forecast Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Prévisions de Chiffre d'Affaires
                </CardTitle>
                <CardDescription>
                  Historique et projections sur {forecastPeriod} jours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={salesForecast}>
                      <defs>
                        <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        className="text-muted-foreground"
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0].payload as SalesForecast;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium capitalize">{data.fullDate}</p>
                              {data.historical > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Historique: {formatCurrency(data.historical)}
                                </p>
                              )}
                              {data.predicted > 0 && (
                                <>
                                  <p className="text-sm text-primary font-medium">
                                    Prévision: {formatCurrency(data.predicted)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Fourchette: {formatCurrency(data.lowerBound)} - {formatCurrency(data.upperBound)}
                                  </p>
                                </>
                              )}
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="historical"
                        stroke="hsl(var(--chart-1))"
                        fill="url(#colorHistorical)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="upperBound"
                        stroke="transparent"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.1}
                      />
                      <Area
                        type="monotone"
                        dataKey="lowerBound"
                        stroke="transparent"
                        fill="hsl(var(--background))"
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Tabs defaultValue="products" className="space-y-4">
              <TabsList>
                <TabsTrigger value="products">Produits</TabsTrigger>
                <TabsTrigger value="categories">Catégories</TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="space-y-4">
                {/* Products at Risk */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Prévisions par Produit
                        </CardTitle>
                        <CardDescription>
                          Analyse prédictive et recommandations de réapprovisionnement
                        </CardDescription>
                      </div>
                      <Select value={sortBy} onValueChange={(v: 'risk' | 'sales' | 'stock') => setSortBy(v)}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Trier par" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="risk">Risque rupture</SelectItem>
                          <SelectItem value="sales">Ventes moy.</SelectItem>
                          <SelectItem value="stock">Stock actuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead className="text-center hidden sm:table-cell">Stock</TableHead>
                          <TableHead className="text-center hidden md:table-cell">Ventes/jour</TableHead>
                          <TableHead className="text-center">Jours restants</TableHead>
                          <TableHead className="text-center hidden lg:table-cell">Tendance</TableHead>
                          <TableHead className="text-right">Réappro. suggéré</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedProducts.slice(0, 20).map((product) => (
                          <TableRow key={product.productId}>
                            <TableCell>
                              <div>
                                <p className="font-medium truncate max-w-[200px]">{product.productName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{product.reference}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                              <Badge variant={
                                product.currentStock === 0 ? 'destructive' :
                                product.currentStock <= product.alertThreshold ? 'secondary' : 'outline'
                              }>
                                {product.currentStock}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center hidden md:table-cell">
                              {product.avgDailySales.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-center">
                              {product.daysUntilStockout !== null ? (
                                <Badge variant={
                                  product.daysUntilStockout <= 3 ? 'destructive' :
                                  product.daysUntilStockout <= 7 ? 'secondary' : 'outline'
                                }>
                                  {product.daysUntilStockout === 0 ? 'Rupture' : `${product.daysUntilStockout}j`}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center hidden lg:table-cell">
                              <div className="flex items-center justify-center gap-1">
                                {product.trend === 'up' ? (
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : product.trend === 'down' ? (
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                ) : (
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className={cn(
                                  "text-sm",
                                  product.trend === 'up' && "text-green-600",
                                  product.trend === 'down' && "text-red-600"
                                )}>
                                  {product.trendPercent > 0 ? '+' : ''}
                                  {product.trendPercent.toFixed(0)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {product.recommendedReorder > 0 ? (
                                <Badge variant="outline" className="bg-primary/5 text-primary">
                                  +{product.recommendedReorder}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Prévisions par Catégorie</CardTitle>
                    <CardDescription>
                      Performance et projections de revenus par catégorie
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categoryForecasts.map((category) => (
                        <div key={category.categoryId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{category.categoryName}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Mois dernier: {formatCurrency(category.lastMonthRevenue)}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span>Ce mois: {formatCurrency(category.currentMonthRevenue)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(category.predictedRevenue)}</p>
                              <div className="flex items-center justify-end gap-1">
                                {category.growth >= 0 ? (
                                  <TrendingUp className="h-3 w-3 text-green-600" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 text-red-600" />
                                )}
                                <span className={cn(
                                  "text-sm",
                                  category.growth >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  {category.growth >= 0 ? '+' : ''}{category.growth.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <Progress 
                            value={Math.min(100, (category.currentMonthRevenue / category.predictedRevenue) * 100)} 
                            className="h-2"
                          />
                        </div>
                      ))}
                      {categoryForecasts.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          Aucune donnée de catégorie disponible
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
}
