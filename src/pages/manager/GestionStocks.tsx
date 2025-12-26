import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search,
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Filter,
  Loader2,
  Settings2,
  Store,
  Plus,
} from 'lucide-react';
import StockAdjustmentForm from '@/components/stocks/StockAdjustmentForm';
import { cn } from '@/lib/utils';

interface Boutique {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  reference: string;
  selling_price: number;
  alert_threshold: number;
  category_id: string | null;
  image_url: string | null;
  is_active: boolean;
}

interface StockItem {
  id: string;
  quantity: number;
  boutique_id: string;
  product_id: string;
  product: Product;
}

type StockStatus = 'ok' | 'low' | 'out';

const stockStatusConfig: Record<
  StockStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  ok: {
    label: 'En stock',
    color: 'text-green-600',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  low: {
    label: 'Stock bas',
    color: 'text-amber-600',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  out: {
    label: 'Rupture',
    color: 'text-red-600',
    icon: <XCircle className="h-4 w-4" />,
  },
};

function getStockStatus(quantity: number, threshold: number): StockStatus {
  if (quantity === 0) return 'out';
  if (quantity <= threshold) return 'low';
  return 'ok';
}

function getStockProgress(quantity: number, threshold: number): number {
  if (quantity === 0) return 0;
  const maxDisplay = threshold * 3;
  return Math.min(100, (quantity / maxDisplay) * 100);
}

export default function GestionStocks() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedBoutique, setSelectedBoutique] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [adjustingStock, setAdjustingStock] = useState<StockItem | null>(null);
  const [isCreatingStock, setIsCreatingStock] = useState(false);
  const [selectedProductForCreate, setSelectedProductForCreate] = useState<string>('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedBoutique) {
      fetchStocks();
    }
  }, [selectedBoutique]);

  const fetchInitialData = async () => {
    try {
      const [boutiquesRes, categoriesRes, productsRes] = await Promise.all([
        supabase.from('boutiques').select('id, name').order('name'),
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('products').select('*').eq('is_active', true).order('name'),
      ]);

      setBoutiques(boutiquesRes.data || []);
      setCategories(categoriesRes.data || []);
      setProducts(productsRes.data || []);

      // Auto-select first boutique
      if (boutiquesRes.data && boutiquesRes.data.length > 0) {
        setSelectedBoutique(boutiquesRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const fetchStocks = async () => {
    if (!selectedBoutique) return;

    setIsLoading(true);
    try {
      const { data: stockData, error } = await supabase
        .from('stock')
        .select('id, quantity, boutique_id, product_id')
        .eq('boutique_id', selectedBoutique);

      if (error) throw error;

      // Map stocks with product info
      const stocksWithProducts: StockItem[] = (stockData || [])
        .map((stock) => {
          const product = products.find((p) => p.id === stock.product_id);
          if (!product) return null;
          return {
            ...stock,
            product,
          };
        })
        .filter((s): s is StockItem => s !== null);

      setStocks(stocksWithProducts);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      toast.error('Erreur lors du chargement des stocks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStock = async () => {
    if (!selectedBoutique || !selectedProductForCreate) return;

    try {
      // Check if stock already exists
      const { data: existing } = await supabase
        .from('stock')
        .select('id')
        .eq('boutique_id', selectedBoutique)
        .eq('product_id', selectedProductForCreate)
        .maybeSingle();

      if (existing) {
        toast.error('Ce produit existe déjà dans le stock de cette boutique');
        return;
      }

      const { error } = await supabase.from('stock').insert({
        boutique_id: selectedBoutique,
        product_id: selectedProductForCreate,
        quantity: 0,
      });

      if (error) throw error;

      toast.success('Produit ajouté au stock');
      setIsCreatingStock(false);
      setSelectedProductForCreate('');
      fetchStocks();
    } catch (error: any) {
      console.error('Error creating stock:', error);
      toast.error(error.message || 'Erreur lors de la création du stock');
    }
  };

  // Get products not yet in stock for this boutique
  const productsNotInStock = products.filter(
    (p) => !stocks.some((s) => s.product_id === p.id)
  );

  // Filter stocks
  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      !searchQuery ||
      stock.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.product.reference.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || stock.product.category_id === selectedCategory;

    if (selectedStatus !== 'all') {
      const status = getStockStatus(
        stock.quantity,
        stock.product.alert_threshold || 5
      );
      if (status !== selectedStatus) return false;
    }

    return matchesSearch && matchesCategory;
  });

  // Stats
  const stats = {
    total: stocks.length,
    ok: stocks.filter(
      (s) => getStockStatus(s.quantity, s.product.alert_threshold || 5) === 'ok'
    ).length,
    low: stocks.filter(
      (s) => getStockStatus(s.quantity, s.product.alert_threshold || 5) === 'low'
    ).length,
    out: stocks.filter(
      (s) => getStockStatus(s.quantity, s.product.alert_threshold || 5) === 'out'
    ).length,
  };

  const currentBoutique = boutiques.find((b) => b.id === selectedBoutique);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Gestion des Stocks
            </h1>
            <p className="text-muted-foreground">
              Ajustez les quantités par boutique
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Boutique selector */}
            <Select value={selectedBoutique} onValueChange={setSelectedBoutique}>
              <SelectTrigger className="w-[200px]">
                <Store className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sélectionner une boutique" />
              </SelectTrigger>
              <SelectContent>
                {boutiques.map((boutique) => (
                  <SelectItem key={boutique.id} value={boutique.id}>
                    {boutique.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsCreatingStock(true)} disabled={!selectedBoutique}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter produit
            </Button>
          </div>
        </div>

        {!selectedBoutique ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Store className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Sélectionnez une boutique
              </h3>
              <p className="text-muted-foreground text-center">
                Choisissez une boutique pour gérer son stock
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedStatus('all')}
              >
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
                  'cursor-pointer hover:bg-muted/50 transition-colors',
                  selectedStatus === 'ok' && 'ring-2 ring-green-500'
                )}
                onClick={() =>
                  setSelectedStatus(selectedStatus === 'ok' ? 'all' : 'ok')
                }
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
                  'cursor-pointer hover:bg-muted/50 transition-colors',
                  selectedStatus === 'low' && 'ring-2 ring-amber-500'
                )}
                onClick={() =>
                  setSelectedStatus(selectedStatus === 'low' ? 'all' : 'low')
                }
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
                  'cursor-pointer hover:bg-muted/50 transition-colors',
                  selectedStatus === 'out' && 'ring-2 ring-red-500'
                )}
                onClick={() =>
                  setSelectedStatus(selectedStatus === 'out' ? 'all' : 'out')
                }
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
                <SelectTrigger id="stock-category-filter" className="w-full sm:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground">
              {filteredStocks.length} produit{filteredStocks.length !== 1 ? 's' : ''}{' '}
              dans {currentBoutique?.name}
            </p>

            {/* Stock list */}
            <div className="space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredStocks.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun produit trouvé</p>
                    {productsNotInStock.length > 0 && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setIsCreatingStock(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter un produit au stock
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredStocks.map((stock) => {
                  const status = getStockStatus(
                    stock.quantity,
                    stock.product.alert_threshold || 5
                  );
                  const config = stockStatusConfig[status];
                  const progress = getStockProgress(
                    stock.quantity,
                    stock.product.alert_threshold || 5
                  );
                  const category = categories.find(
                    (c) => c.id === stock.product.category_id
                  );

                  return (
                    <Card key={stock.id} className="overflow-hidden group">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Product image */}
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
                                <h3 className="font-medium truncate">
                                  {stock.product.name}
                                </h3>
                                <p className="text-sm text-muted-foreground font-mono">
                                  {stock.product.reference}
                                </p>
                                {category && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    {category.name}
                                  </Badge>
                                )}
                              </div>

                              {/* Quantity and actions */}
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <div
                                    className={cn(
                                      'flex items-center gap-1 font-semibold',
                                      config.color
                                    )}
                                  >
                                    {config.icon}
                                    <span className="text-lg">{stock.quantity}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Seuil: {stock.product.alert_threshold || 5}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setAdjustingStock(stock)}
                                >
                                  <Settings2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-3">
                              <Progress
                                value={progress}
                                className="h-2"
                                style={
                                  {
                                    '--progress-background':
                                      status === 'ok'
                                        ? 'rgb(34 197 94)'
                                        : status === 'low'
                                        ? 'rgb(245 158 11)'
                                        : 'rgb(239 68 68)',
                                  } as React.CSSProperties
                                }
                              />
                            </div>

                            {/* Price */}
                            <p className="text-sm text-muted-foreground mt-2">
                              Prix:{' '}
                              <span className="font-medium text-foreground">
                                {stock.product.selling_price.toLocaleString('fr-FR')}{' '}
                                XAF
                              </span>
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Stock Adjustment Dialog */}
      <Dialog open={!!adjustingStock} onOpenChange={() => setAdjustingStock(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuster le stock</DialogTitle>
          </DialogHeader>
          {adjustingStock && (
            <StockAdjustmentForm
              stockId={adjustingStock.id}
              productName={adjustingStock.product.name}
              currentQuantity={adjustingStock.quantity}
              onSuccess={() => {
                setAdjustingStock(null);
                fetchStocks();
              }}
              onCancel={() => setAdjustingStock(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Product to Stock Dialog */}
      <Dialog open={isCreatingStock} onOpenChange={setIsCreatingStock}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un produit au stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Boutique</p>
              <p className="font-medium">{currentBoutique?.name}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Produit</label>
              <Select
                value={selectedProductForCreate}
                onValueChange={setSelectedProductForCreate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {productsNotInStock.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Tous les produits sont déjà en stock
                    </div>
                  ) : (
                    productsNotInStock.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.reference})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreatingStock(false);
                  setSelectedProductForCreate('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateStock}
                disabled={!selectedProductForCreate}
              >
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
