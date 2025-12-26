import { useState, useEffect } from 'react';
import { Search, Package, AlertTriangle, XCircle, CheckCircle2, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StockItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    reference: string;
    selling_price: number;
    alert_threshold: number;
    category_id: string | null;
    image_url: string | null;
  };
}

interface Category {
  id: string;
  name: string;
}

type StockStatus = 'ok' | 'low' | 'out';

const stockStatusConfig: Record<StockStatus, { label: string; color: string; icon: React.ReactNode; bgClass: string }> = {
  ok: { 
    label: 'En stock', 
    color: 'text-green-600', 
    icon: <CheckCircle2 className="h-4 w-4" />,
    bgClass: 'bg-green-500'
  },
  low: { 
    label: 'Stock bas', 
    color: 'text-amber-600', 
    icon: <AlertTriangle className="h-4 w-4" />,
    bgClass: 'bg-amber-500'
  },
  out: { 
    label: 'Rupture', 
    color: 'text-red-600', 
    icon: <XCircle className="h-4 w-4" />,
    bgClass: 'bg-red-500'
  },
};

function getStockStatus(quantity: number, threshold: number): StockStatus {
  if (quantity === 0) return 'out';
  if (quantity <= threshold) return 'low';
  return 'ok';
}

function getStockProgress(quantity: number, threshold: number): number {
  if (quantity === 0) return 0;
  // Progress is relative to 2x threshold as "full"
  const maxDisplay = threshold * 3;
  return Math.min(100, (quantity / maxDisplay) * 100);
}

export default function ConsultationStocks() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (user) {
      fetchStocks();
    }
  }, [user]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    setCategories(data || []);
  };

  const fetchStocks = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get user's boutique
      const { data: profile } = await supabase
        .from('profiles')
        .select('boutique_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.boutique_id) {
        setStocks([]);
        return;
      }

      // Fetch stocks with products
      const { data: stockData, error } = await supabase
        .from('stock')
        .select('id, quantity, product_id')
        .eq('boutique_id', profile.boutique_id);

      if (error) throw error;

      // Fetch products for these stocks
      const productIds = stockData?.map(s => s.product_id) || [];
      
      if (productIds.length === 0) {
        setStocks([]);
        return;
      }

      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, reference, selling_price, alert_threshold, category_id, image_url')
        .in('id', productIds)
        .eq('is_active', true);

      // Combine stock and product data
      const combinedData: StockItem[] = (stockData || []).map(stock => {
        const product = productsData?.find(p => p.id === stock.product_id);
        return {
          id: stock.id,
          quantity: stock.quantity,
          product: product || {
            id: stock.product_id,
            name: 'Produit inconnu',
            reference: '',
            selling_price: 0,
            alert_threshold: 5,
            category_id: null,
            image_url: null,
          }
        };
      }).filter(item => item.product.name !== 'Produit inconnu');

      setStocks(combinedData);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter stocks
  const filteredStocks = stocks.filter(stock => {
    // Search filter
    const matchesSearch = !searchQuery || 
      stock.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.product.reference.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = selectedCategory === 'all' || 
      stock.product.category_id === selectedCategory;

    // Status filter
    if (selectedStatus !== 'all') {
      const status = getStockStatus(stock.quantity, stock.product.alert_threshold || 5);
      if (status !== selectedStatus) return false;
    }

    return matchesSearch && matchesCategory;
  });

  // Stats
  const stats = {
    total: stocks.length,
    ok: stocks.filter(s => getStockStatus(s.quantity, s.product.alert_threshold || 5) === 'ok').length,
    low: stocks.filter(s => getStockStatus(s.quantity, s.product.alert_threshold || 5) === 'low').length,
    out: stocks.filter(s => getStockStatus(s.quantity, s.product.alert_threshold || 5) === 'out').length,
  };

  return (
    <AppLayout title="Stocks" backButton>
      <div className="space-y-4">
        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedStatus('all')}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={cn(
              "cursor-pointer hover:bg-muted/50 transition-colors",
              selectedStatus === 'ok' && "ring-2 ring-green-500"
            )} 
            onClick={() => setSelectedStatus(selectedStatus === 'ok' ? 'all' : 'ok')}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.ok}</p>
                  <p className="text-xs text-muted-foreground">En stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={cn(
              "cursor-pointer hover:bg-muted/50 transition-colors",
              selectedStatus === 'low' && "ring-2 ring-amber-500"
            )}
            onClick={() => setSelectedStatus(selectedStatus === 'low' ? 'all' : 'low')}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.low}</p>
                  <p className="text-xs text-muted-foreground">Stock bas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={cn(
              "cursor-pointer hover:bg-muted/50 transition-colors",
              selectedStatus === 'out' && "ring-2 ring-red-500"
            )}
            onClick={() => setSelectedStatus(selectedStatus === 'out' ? 'all' : 'out')}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.out}</p>
                  <p className="text-xs text-muted-foreground">Rupture</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="stock-search"
              name="search"
              autoComplete="off"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="consultation-category-filter" className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          {filteredStocks.length} produit{filteredStocks.length !== 1 ? 's' : ''}
        </p>

        {/* Stock list */}
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredStocks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun produit trouvé</p>
              </CardContent>
            </Card>
          ) : (
            filteredStocks.map((stock) => {
              const status = getStockStatus(stock.quantity, stock.product.alert_threshold || 5);
              const config = stockStatusConfig[status];
              const progress = getStockProgress(stock.quantity, stock.product.alert_threshold || 5);
              const category = categories.find(c => c.id === stock.product.category_id);

              return (
                <Card key={stock.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Product image or placeholder */}
                      <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        {stock.product.image_url ? (
                          <img 
                            src={stock.product.image_url} 
                            alt={stock.product.name}
                            className="h-full w-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-medium truncate">{stock.product.name}</h3>
                            <p className="text-sm text-muted-foreground font-mono">{stock.product.reference}</p>
                            {category && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {category.name}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Quantity badge */}
                          <div className="text-right shrink-0">
                            <div className={cn("flex items-center gap-1 font-semibold", config.color)}>
                              {config.icon}
                              <span className="text-lg">{stock.quantity}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Seuil: {stock.product.alert_threshold || 5}
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3">
                          <Progress 
                            value={progress} 
                            className="h-2"
                            style={{
                              '--progress-background': status === 'ok' 
                                ? 'rgb(34 197 94)' 
                                : status === 'low' 
                                  ? 'rgb(245 158 11)' 
                                  : 'rgb(239 68 68)'
                            } as React.CSSProperties}
                          />
                        </div>

                        {/* Price */}
                        <p className="text-sm text-muted-foreground mt-2">
                          Prix: <span className="font-medium text-foreground">{stock.product.selling_price.toLocaleString('fr-FR')} XAF</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
