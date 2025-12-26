import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, Search, MoreVertical, Pencil, Trash2, FolderOpen, Loader2 } from 'lucide-react';
import CategoryForm from '@/components/categories/CategoryForm';

interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface CategoryWithCount extends Category {
  productCount: number;
}

export default function GestionCategories() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | undefined>();
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch product counts
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('category_id');

      if (productsError) throw productsError;

      // Count products per category
      const productCounts: Record<string, number> = {};
      productsData?.forEach((product) => {
        if (product.category_id) {
          productCounts[product.category_id] = (productCounts[product.category_id] || 0) + 1;
        }
      });

      // Merge data
      const categoriesWithCounts = (categoriesData || []).map((cat) => ({
        ...cat,
        productCount: productCounts[cat.id] || 0,
      }));

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deletingCategory.id);

      if (error) {
        if (error.code === '23503') {
          toast.error('Impossible de supprimer cette catégorie car elle contient des produits');
          return;
        }
        throw error;
      }

      toast.success('Catégorie supprimée avec succès');
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingCategory(null);
    }
  };

  const openEditDialog = (categoryId: string) => {
    setEditingCategoryId(categoryId);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCategoryId(undefined);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCategoryId(undefined);
  };

  const handleFormSuccess = () => {
    handleDialogClose();
    fetchCategories();
  };

  // Filter categories
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Gestion des Catégories
            </h1>
            <p className="text-muted-foreground">
              {categories.length} catégorie{categories.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle catégorie
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="category-search"
            name="search"
            placeholder="Rechercher une catégorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery ? 'Aucune catégorie trouvée' : 'Aucune catégorie'}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery
                  ? 'Essayez de modifier votre recherche'
                  : 'Commencez par créer votre première catégorie'}
              </p>
              {!searchQuery && (
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une catégorie
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
                        <h3 className="font-medium text-foreground truncate">
                          {category.name}
                        </h3>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {category.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {category.productCount} produit{category.productCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(category.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingCategory(category)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategoryId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </DialogTitle>
            <DialogDescription>
              {editingCategoryId 
                ? 'Modifiez les informations de la catégorie'
                : 'Créez une nouvelle catégorie pour organiser vos produits'}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            categoryId={editingCategoryId}
            onSuccess={handleFormSuccess}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la catégorie "{deletingCategory?.name}" ?
              Cette action est irréversible.
              {deletingCategory && categories.find(c => c.id === deletingCategory.id)?.productCount ? (
                <span className="block mt-2 text-destructive">
                  Attention : cette catégorie contient des produits et ne pourra pas être supprimée.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
