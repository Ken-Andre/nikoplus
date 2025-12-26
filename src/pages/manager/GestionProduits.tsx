import { useState, useEffect } from 'react';
import { Search, Plus, Package, Pencil, Trash2, MoreVertical, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { ProductForm } from '@/components/products/ProductForm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  reference: string;
  name: string;
  description: string | null;
  category_id: string | null;
  category_name: string | null;
  supplier_id: string | null;
  purchase_price: number;
  selling_price: number;
  alert_threshold: number;
  image_url: string | null;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function GestionProduits() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showActiveOnly, setShowActiveOnly] = useState<string>('all');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    setCategories(data || []);
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('name');

      if (error) throw error;

      setProducts(
        (data || []).map((p) => ({
          id: p.id,
          reference: p.reference,
          name: p.name,
          description: p.description,
          category_id: p.category_id,
          category_name: p.categories?.name || null,
          supplier_id: p.supplier_id,
          purchase_price: p.purchase_price || 0,
          selling_price: p.selling_price,
          alert_threshold: p.alert_threshold || 5,
          image_url: p.image_url,
          is_active: p.is_active ?? true,
        }))
      );
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setEditingProductId(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (productId: string) => {
    setEditingProductId(productId);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deletingProductId);

      if (error) throw error;

      toast.success('Produit supprimé');
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      if (error.code === '23503') {
        toast.error('Impossible de supprimer : produit utilisé dans des ventes');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingProductId(null);
    fetchProducts();
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.reference.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || product.category_id === selectedCategory;

    const matchesActive =
      showActiveOnly === 'all' ||
      (showActiveOnly === 'active' && product.is_active) ||
      (showActiveOnly === 'inactive' && !product.is_active);

    return matchesSearch && matchesCategory && matchesActive;
  });

  return (
    <AppLayout title="Gestion des produits" backButton>
      <div className="space-y-4">
        {/* Header with add button */}
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            {products.length} produit{products.length !== 1 ? 's' : ''}
          </p>
          <Button onClick={handleCreateProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau produit
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="products-search"
              name="search"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="products-category-filter" className="w-full sm:w-[180px]">
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
          <Select value={showActiveOnly} onValueChange={setShowActiveOnly}>
            <SelectTrigger id="products-status-filter" className="w-full sm:w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products list */}
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun produit trouvé</p>
                <Button variant="link" onClick={handleCreateProduct}>
                  Créer un produit
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={cn(
                  'overflow-hidden transition-opacity',
                  !product.is_active && 'opacity-60'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Product image */}
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">{product.name}</h3>
                          <p className="text-sm text-muted-foreground font-mono">
                            {product.reference}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {product.category_name && (
                              <Badge variant="outline" className="text-xs">
                                {product.category_name}
                              </Badge>
                            )}
                            {!product.is_active && (
                              <Badge variant="secondary" className="text-xs">
                                Inactif
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditProduct(product.id)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletingProductId(product.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Prices */}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          Achat: {product.purchase_price.toLocaleString('fr-FR')} XAF
                        </span>
                        <span className="font-medium text-primary">
                          Vente: {product.selling_price.toLocaleString('fr-FR')} XAF
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Product Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProductId ? 'Modifier le produit' : 'Nouveau produit'}
            </DialogTitle>
            <DialogDescription>
              {editingProductId 
                ? 'Modifiez les informations du produit'
                : 'Ajoutez un nouveau produit à votre catalogue'}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            productId={editingProductId || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProductId} onOpenChange={() => setDeletingProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
