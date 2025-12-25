import { useState, useEffect } from 'react';
import { Search, Package, AlertTriangle, Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import type { Product, Category } from '@/types';
import { cn } from '@/lib/utils';

export function ProductSearch() {
  const { user } = useAuth();
  const { addItem, items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user?.boutiqueId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (categoriesData) {
        setCategories(categoriesData.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description || undefined,
        })));
      }

      // Fetch products with stock
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          stock!inner(quantity, boutique_id)
        `)
        .eq('is_active', true)
        .eq('stock.boutique_id', user?.boutiqueId || '')
        .order('name');

      if (productsData) {
        setProducts(productsData.map(p => ({
          id: p.id,
          reference: p.reference,
          name: p.name,
          description: p.description || undefined,
          categoryId: p.category_id || undefined,
          categoryName: p.categories?.name || undefined,
          supplierId: p.supplier_id || undefined,
          purchasePrice: p.purchase_price || 0,
          sellingPrice: p.selling_price,
          alertThreshold: p.alert_threshold || 5,
          imageUrl: p.image_url || undefined,
          isActive: p.is_active ?? true,
          stock: p.stock?.[0]?.quantity || 0,
        })));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.reference.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || product.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCartQuantity = (productId: string) => {
    const item = items.find(i => i.product.id === productId);
    return item?.quantity || 0;
  };

  const handleAddProduct = (product: Product) => {
    const currentInCart = getCartQuantity(product.id);
    const availableStock = (product.stock || 0) - currentInCart;
    
    if (availableStock > 0) {
      addItem(product, 1);
    }
  };

  const getStockBadge = (product: Product) => {
    const stock = product.stock || 0;
    const inCart = getCartQuantity(product.id);
    const available = stock - inCart;
    
    if (available === 0) {
      return <Badge variant="destructive">Épuisé</Badge>;
    }
    if (available <= product.alertThreshold) {
      return <Badge className="bg-warning text-warning-foreground">Stock bas: {available}</Badge>;
    }
    return <Badge variant="secondary">En stock: {available}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">Aucun produit trouvé</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map(product => {
            const inCart = getCartQuantity(product.id);
            const available = (product.stock || 0) - inCart;
            const isOutOfStock = available === 0;
            
            return (
              <Card 
                key={product.id}
                className={cn(
                  'relative overflow-hidden transition-all card-hover',
                  inCart > 0 && 'ring-2 ring-success',
                  isOutOfStock && 'opacity-60'
                )}
              >
                {inCart > 0 && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge className="bg-success text-success-foreground">
                      {inCart} dans le panier
                    </Badge>
                  </div>
                )}
                
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-foreground line-clamp-1">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Réf: {product.reference}
                      </p>
                    </div>
                  </div>
                  
                  {product.categoryName && (
                    <Badge variant="outline" className="mb-2 text-xs">
                      {product.categoryName}
                    </Badge>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-lg font-bold text-primary">
                        {product.sellingPrice.toLocaleString('fr-FR')} XAF
                      </p>
                      {getStockBadge(product)}
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleAddProduct(product)}
                      disabled={isOutOfStock}
                      className={cn(
                        'h-10 w-10 p-0',
                        isOutOfStock && 'cursor-not-allowed'
                      )}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
