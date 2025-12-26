import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subWeeks, startOfWeek, endOfWeek, subMonths, isAfter, isBefore, differenceInDays } from 'date-fns';
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
  Calendar as CalendarIcon,
  ChevronDown,
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
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { cn } from '@/lib/utils';

type PeriodType = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'custom';

interface DateRange {
  from: Date;
  to: Date;
}

const periodLabels: Record<PeriodType, string> = {
  today: "Aujourd'hui",
  yesterday: 'Hier',
  week: 'Cette semaine',
  month: 'Ce mois',
  last_month: 'Mois dernier',
  custom: 'Période personnalisée',
};

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
  // Previous period comparison
  previousPeriodSalesCount: number;
  previousPeriodSalesAmount: number;
  previousPeriodAvgTicket: number;
  salesCountGrowth: number;
  salesAmountGrowth: number;
  avgTicketGrowth: number;
}

interface SalesEvolution {
  date: string;
  fullDate: string;
  amount: number;
  count: number;
  previousAmount: number;
  previousCount: number;
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
  
  // Period filter state
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const getDateRange = (): DateRange => {
    const today = new Date();
    switch (selectedPeriod) {
      case 'today':
        return { from: startOfDay(today), to: endOfDay(today) };
      case 'yesterday':
        const yesterday = subDays(today, 1);
        return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
      case 'week':
        return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
      case 'month':
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case 'last_month':
        const lastMonth = subMonths(today, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      case 'custom':
        return customDateRange;
      default:
        return { from: startOfMonth(today), to: endOfMonth(today) };
    }
  };

  const getPreviousPeriodRange = (currentRange: DateRange): DateRange => {
    const periodDays = differenceInDays(currentRange.to, currentRange.from) + 1;
    return {
      from: subDays(currentRange.from, periodDays),
      to: subDays(currentRange.from, 1),
    };
  };

  const getPeriodLabel = (): string => {
    if (selectedPeriod === 'custom') {
      return `${format(customDateRange.from, 'dd/MM/yyyy')} - ${format(customDateRange.to, 'dd/MM/yyyy')}`;
    }
    return periodLabels[selectedPeriod];
  };

  const getPreviousPeriodLabel = (): string => {
    const currentRange = getDateRange();
    const previousRange = getPreviousPeriodRange(currentRange);
    return `${format(previousRange.from, 'dd/MM')} - ${format(previousRange.to, 'dd/MM')}`;
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, selectedPeriod, customDateRange]);

  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      setIsCalendarOpen(false);
    }
  };

  const handleCustomDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from) {
      setCustomDateRange({
        from: range.from,
        to: range.to || range.from,
      });
      if (range.to) {
        setIsCalendarOpen(false);
      }
    }
  };

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
      
      // Get selected period date range
      const periodRange = getDateRange();
      const periodStart = startOfDay(periodRange.from).toISOString();
      const periodEnd = endOfDay(periodRange.to).toISOString();
      const periodDays = differenceInDays(periodRange.to, periodRange.from) + 1;
      
      // Get previous period for comparison
      const previousPeriodRange = getPreviousPeriodRange(periodRange);
      const previousPeriodStart = startOfDay(previousPeriodRange.from).toISOString();
      const previousPeriodEnd = endOfDay(previousPeriodRange.to).toISOString();
      
      // Current week and previous week (for comparison)
      const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }).toISOString();
      const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 }).toISOString();
      const previousWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }).toISOString();
      const previousWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }).toISOString();

      // Fetch daily sales (always today for quick reference)
      const { data: dailySales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('boutique_id', boutiqueId)
        .eq('status', 'completed')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd);

      // Fetch period sales (based on selected period)
      const { data: periodSales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('boutique_id', boutiqueId)
        .eq('status', 'completed')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      // Fetch previous period sales for comparison
      const { data: previousPeriodSales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('boutique_id', boutiqueId)
        .eq('status', 'completed')
        .gte('created_at', previousPeriodStart)
        .lte('created_at', previousPeriodEnd);

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
      const periodAmount = periodSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const periodCount = periodSales?.length || 0;
      const currentWeekAmount = currentWeekSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const previousWeekAmount = previousWeekSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const weeklyGrowth = previousWeekAmount > 0 
        ? ((currentWeekAmount - previousWeekAmount) / previousWeekAmount) * 100 
        : currentWeekAmount > 0 ? 100 : 0;

      // Calculate previous period stats
      const previousPeriodAmount = previousPeriodSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const previousPeriodCount = previousPeriodSales?.length || 0;
      const previousPeriodAvgTicket = previousPeriodCount > 0 ? previousPeriodAmount / previousPeriodCount : 0;
      const currentAvgTicket = periodCount > 0 ? periodAmount / periodCount : 0;

      // Calculate growth percentages
      const salesCountGrowth = previousPeriodCount > 0 
        ? ((periodCount - previousPeriodCount) / previousPeriodCount) * 100 
        : periodCount > 0 ? 100 : 0;
      const salesAmountGrowth = previousPeriodAmount > 0 
        ? ((periodAmount - previousPeriodAmount) / previousPeriodAmount) * 100 
        : periodAmount > 0 ? 100 : 0;
      const avgTicketGrowth = previousPeriodAvgTicket > 0 
        ? ((currentAvgTicket - previousPeriodAvgTicket) / previousPeriodAvgTicket) * 100 
        : currentAvgTicket > 0 ? 100 : 0;

      setStats({
        dailySalesCount: dailyCount,
        dailySalesAmount: dailyAmount,
        monthlySalesCount: periodCount,
        monthlySalesAmount: periodAmount,
        outOfStockCount: outOfStock,
        lowStockCount: lowStock,
        unresolvedAlertsCount: unresolvedAlerts || 0,
        avgTicket: currentAvgTicket,
        currentWeekAmount,
        previousWeekAmount,
        weeklyGrowth,
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        previousPeriodSalesCount: previousPeriodCount,
        previousPeriodSalesAmount: previousPeriodAmount,
        previousPeriodAvgTicket,
        salesCountGrowth,
        salesAmountGrowth,
        avgTicketGrowth,
      });

      // Fetch sales evolution based on period with previous period comparison
      const evolutionDays = Math.min(periodDays, 30); // Max 30 days for chart
      const evolutionData: SalesEvolution[] = [];
      
      for (let i = 0; i < evolutionDays; i++) {
        const date = subDays(periodRange.to, evolutionDays - 1 - i);
        if (isBefore(date, periodRange.from)) continue;
        
        const dayStartISO = startOfDay(date).toISOString();
        const dayEndISO = endOfDay(date).toISOString();
        
        // Current period day
        const { data: daySales } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('boutique_id', boutiqueId)
          .eq('status', 'completed')
          .gte('created_at', dayStartISO)
          .lte('created_at', dayEndISO);

        // Previous period equivalent day
        const previousDate = subDays(date, periodDays);
        const previousDayStartISO = startOfDay(previousDate).toISOString();
        const previousDayEndISO = endOfDay(previousDate).toISOString();
        
        const { data: previousDaySales } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('boutique_id', boutiqueId)
          .eq('status', 'completed')
          .gte('created_at', previousDayStartISO)
          .lte('created_at', previousDayEndISO);

        evolutionData.push({
          date: format(date, 'dd/MM', { locale: fr }),
          fullDate: format(date, 'EEEE d MMMM', { locale: fr }),
          amount: daySales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0,
          count: daySales?.length || 0,
          previousAmount: previousDaySales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0,
          previousCount: previousDaySales?.length || 0,
        });
      }
      setSalesEvolution(evolutionData);

      // Fetch payment distribution for selected period
      const { data: paymentData } = await supabase
        .from('sales')
        .select('payment_method, total_amount')
        .eq('boutique_id', boutiqueId)
        .eq('status', 'completed')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

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

      // Fetch top 5 products for selected period
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('product_name, quantity, total_price, product_id, sales!inner(boutique_id, status, created_at)')
        .eq('sales.boutique_id', boutiqueId)
        .eq('sales.status', 'completed')
        .gte('sales.created_at', periodStart)
        .lte('sales.created_at', periodEnd);

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
    previousAmount: { label: "Période préc.", color: "hsl(var(--muted-foreground))" },
    count: { label: "Ventes", color: "hsl(var(--chart-2))" },
    revenue: { label: "CA", color: "hsl(var(--primary))" },
  };

  return (
    <AppLayout title="Tableau de Bord Manager">
      <div className="space-y-6">
        {/* Period Filter & Export Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Période :</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[180px] justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{getPeriodLabel()}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => handlePeriodChange('today')}>
                  Aujourd'hui
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePeriodChange('yesterday')}>
                  Hier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePeriodChange('week')}>
                  Cette semaine
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePeriodChange('month')}>
                  Ce mois
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePeriodChange('last_month')}>
                  Mois dernier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  setSelectedPeriod('custom');
                  setIsCalendarOpen(true);
                }}>
                  Période personnalisée...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Custom Date Range Picker */}
            {selectedPeriod === 'custom' && (
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: customDateRange.from, to: customDateRange.to }}
                    onSelect={handleCustomDateSelect}
                    numberOfMonths={2}
                    disabled={(date) => isAfter(date, new Date())}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Export Button */}
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

        {/* Period Summary with Comparison */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Période sélectionnée : {getPeriodLabel()}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(getDateRange().from, 'EEEE d MMMM yyyy', { locale: fr })} - {format(getDateRange().to, 'EEEE d MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
              {!isLoading && stats && (
                <div className="flex items-center gap-6">
                  {/* Current Period */}
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Période actuelle</p>
                    <p className="text-2xl font-bold text-primary">{stats.monthlySalesCount} ventes</p>
                    <p className="text-sm text-muted-foreground">{stats.monthlySalesAmount.toLocaleString('fr-FR')} XAF</p>
                  </div>
                  {/* Previous Period */}
                  <div className="text-right border-l pl-6">
                    <p className="text-xs text-muted-foreground">Période précédente ({getPreviousPeriodLabel()})</p>
                    <p className="text-lg font-semibold text-muted-foreground">{stats.previousPeriodSalesCount} ventes</p>
                    <p className="text-sm text-muted-foreground">{stats.previousPeriodSalesAmount.toLocaleString('fr-FR')} XAF</p>
                  </div>
                  {/* Growth Indicator */}
                  <div className={`flex items-center gap-1 px-3 py-2 rounded-lg ${stats.salesAmountGrowth >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {stats.salesAmountGrowth >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                    <span className="text-lg font-bold">{stats.salesAmountGrowth > 0 ? '+' : ''}{stats.salesAmountGrowth.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                title={`Ventes (${getPeriodLabel()})`}
                value={stats?.monthlySalesCount || 0}
                subtitle={`${(stats?.monthlySalesAmount || 0).toLocaleString('fr-FR')} XAF`}
                icon={TrendingUp}
                color="text-success"
                trend={stats?.salesCountGrowth}
                trendValue={`vs ${stats?.previousPeriodSalesCount || 0} préc.`}
              />
              <StatCard
                title="Chiffre d'affaires"
                value={`${((stats?.monthlySalesAmount || 0) / 1000).toFixed(0)}k XAF`}
                subtitle={`Préc: ${((stats?.previousPeriodSalesAmount || 0) / 1000).toFixed(0)}k XAF`}
                icon={stats?.salesAmountGrowth && stats.salesAmountGrowth >= 0 ? TrendingUp : TrendingDown}
                color={stats?.salesAmountGrowth && stats.salesAmountGrowth >= 0 ? 'text-success' : 'text-destructive'}
                trend={stats?.salesAmountGrowth}
                trendValue="vs période préc."
              />
              <StatCard
                title="Panier moyen"
                value={`${(stats?.avgTicket || 0).toLocaleString('fr-FR')} XAF`}
                subtitle={`Préc: ${(stats?.previousPeriodAvgTicket || 0).toLocaleString('fr-FR')} XAF`}
                icon={Target}
                color="text-info"
                trend={stats?.avgTicketGrowth}
                trendValue="vs période préc."
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
                Évolution des ventes ({getPeriodLabel()})
              </CardTitle>
              <CardDescription>Montant et nombre de ventes par jour sur la période</CardDescription>
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
                      <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
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
                          const growth = data.previousAmount > 0 
                            ? ((data.amount - data.previousAmount) / data.previousAmount * 100).toFixed(1)
                            : data.amount > 0 ? '+100' : '0';
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-lg">
                              <p className="font-medium capitalize">{data.fullDate}</p>
                              <div className="mt-2 space-y-1">
                                <p className="text-primary font-semibold">{data.amount.toLocaleString('fr-FR')} XAF</p>
                                <p className="text-muted-foreground text-sm">{data.count} vente(s)</p>
                              </div>
                              <div className="mt-2 pt-2 border-t space-y-1">
                                <p className="text-xs text-muted-foreground">Période précédente :</p>
                                <p className="text-muted-foreground">{data.previousAmount.toLocaleString('fr-FR')} XAF</p>
                                <p className="text-muted-foreground text-sm">{data.previousCount} vente(s)</p>
                              </div>
                              <div className={`mt-2 pt-2 border-t text-sm font-medium ${Number(growth) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {Number(growth) >= 0 ? '↑' : '↓'} {growth}% vs période préc.
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    {/* Previous period area (background) */}
                    <Area yAxisId="amount" type="monotone" dataKey="previousAmount" name="Période préc. (XAF)" fill="url(#previousGradient)" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="4 4" />
                    {/* Current period area */}
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
              <CardDescription>Répartition du CA - {getPeriodLabel()}</CardDescription>
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
              <CardDescription>Modes de paiement - {getPeriodLabel()}</CardDescription>
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
                <CardDescription>Par CA - {getPeriodLabel()}</CardDescription>
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
