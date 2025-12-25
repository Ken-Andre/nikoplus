import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(50, 'Maximum 50 caractères'),
  description: z.string().max(200, 'Maximum 200 caractères').optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  categoryId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CategoryForm({ categoryId, onSuccess, onCancel }: CategoryFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const isEditing = !!categoryId;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  const fetchCategory = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;

      if (data) {
        form.reset({
          name: data.name,
          description: data.description || '',
        });
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      toast.error('Erreur lors du chargement de la catégorie');
    } finally {
      setIsFetching(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: values.name,
            description: values.description || null,
          })
          .eq('id', categoryId);

        if (error) throw error;
        toast.success('Catégorie modifiée avec succès');
      } else {
        const { error } = await supabase.from('categories').insert({
          name: values.name,
          description: values.description || null,
        });

        if (error) {
          if (error.code === '23505') {
            toast.error('Une catégorie avec ce nom existe déjà');
            return;
          }
          throw error;
        }
        toast.success('Catégorie créée avec succès');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Rideaux" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description de la catégorie..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
