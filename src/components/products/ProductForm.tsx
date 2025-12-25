import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, Loader2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const productSchema = z.object({
  reference: z.string().min(1, 'Référence requise'),
  name: z.string().min(1, 'Nom requis').max(100, 'Nom trop long'),
  description: z.string().max(500, 'Description trop longue').optional(),
  category_id: z.string().optional(),
  supplier_id: z.string().optional(),
  purchase_price: z.coerce.number().min(0, 'Prix invalide'),
  selling_price: z.coerce.number().min(1, 'Prix de vente requis'),
  alert_threshold: z.coerce.number().min(0, 'Seuil invalide').default(5),
  is_active: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface ProductFormProps {
  productId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ productId, onSuccess, onCancel }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!productId;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      reference: '',
      name: '',
      description: '',
      category_id: '',
      supplier_id: '',
      purchase_price: 0,
      selling_price: 0,
      alert_threshold: 5,
      is_active: true,
    },
  });

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
    if (productId) {
      fetchProduct(productId);
    }
  }, [productId]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    setCategories(data || []);
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('id, name').order('name');
    setSuppliers(data || []);
  };

  const fetchProduct = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        form.reset({
          reference: data.reference,
          name: data.name,
          description: data.description || '',
          category_id: data.category_id || '',
          supplier_id: data.supplier_id || '',
          purchase_price: data.purchase_price || 0,
          selling_price: data.selling_price,
          alert_threshold: data.alert_threshold || 5,
          is_active: data.is_active ?? true,
        });
        if (data.image_url) {
          setImageUrl(data.image_url);
          setImagePreview(data.image_url);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Erreur lors du chargement du produit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Le fichier doit être une image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 Mo');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast.success('Image téléchargée');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erreur lors du téléchargement de l\'image');
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    try {
      const productData = {
        reference: data.reference.trim(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
        category_id: data.category_id || null,
        supplier_id: data.supplier_id || null,
        purchase_price: data.purchase_price,
        selling_price: data.selling_price,
        alert_threshold: data.alert_threshold,
        is_active: data.is_active,
        image_url: imageUrl,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId);

        if (error) throw error;
        toast.success('Produit modifié avec succès');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success('Produit créé avec succès');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving product:', error);
      if (error.code === '23505') {
        toast.error('Cette référence existe déjà');
      } else {
        toast.error('Erreur lors de l\'enregistrement');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Image Upload */}
        <div className="space-y-2">
          <FormLabel>Image du produit</FormLabel>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'relative h-32 w-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-colors',
                'hover:border-primary hover:bg-muted/50',
                imagePreview ? 'border-primary' : 'border-muted-foreground/30'
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center p-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-1">Cliquer pour ajouter</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            {imagePreview && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemoveImage}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Reference & Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Référence *</FormLabel>
                <FormControl>
                  <Input placeholder="REF-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du produit *</FormLabel>
                <FormControl>
                  <Input placeholder="Rideau velours" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description détaillée du produit..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category & Supplier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supplier_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fournisseur</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers.map((sup) => (
                      <SelectItem key={sup.id} value={sup.id}>
                        {sup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Prices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchase_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix d'achat (XAF)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="selling_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix de vente (XAF) *</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Alert Threshold & Active */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="alert_threshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seuil d'alerte</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormDescription>
                  Alerte si le stock tombe en dessous
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Produit actif</FormLabel>
                  <FormDescription>
                    Visible pour les vendeurs
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
