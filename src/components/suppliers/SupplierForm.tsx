import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

const supplierSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  contact_name: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: z.string().max(200).optional(),
  specialty: z.string().max(100).optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  supplier?: {
    id: string;
    name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    specialty: string | null;
  } | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SupplierForm({ supplier, onSuccess, onCancel }: SupplierFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name || '',
      contact_name: supplier?.contact_name || '',
      phone: supplier?.phone || '',
      email: supplier?.email || '',
      address: supplier?.address || '',
      specialty: supplier?.specialty || '',
    },
  });

  const onSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        contact_name: data.contact_name || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        specialty: data.specialty || null,
      };

      if (supplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(payload)
          .eq('id', supplier.id);
        if (error) throw error;
        toast.success('Fournisseur modifié');
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert(payload);
        if (error) throw error;
        toast.success('Fournisseur créé');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <Input placeholder="Nom du fournisseur" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personne contact</FormLabel>
              <FormControl>
                <Input placeholder="Nom du contact" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <Input placeholder="+237 6XX XXX XXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemple.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse</FormLabel>
              <FormControl>
                <Input placeholder="Adresse du fournisseur" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Spécialité</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Électronique, Accessoires..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Enregistrement...' : supplier ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
