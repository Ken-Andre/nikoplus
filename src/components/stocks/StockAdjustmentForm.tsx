import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Minus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  adjustmentType: z.enum(['set', 'add', 'subtract']),
  quantity: z.preprocess(
    (val) => (val === '' || val === undefined ? 0 : Number(val)),
    z.number().int().min(0, 'La quantité doit être positive')
  ),
});

type FormValues = z.infer<typeof formSchema>;

interface StockAdjustmentFormProps {
  stockId: string;
  productName: string;
  currentQuantity: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StockAdjustmentForm({
  stockId,
  productName,
  currentQuantity,
  onSuccess,
  onCancel,
}: StockAdjustmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adjustmentType: 'set',
      quantity: currentQuantity,
    },
  });

  const adjustmentType = form.watch('adjustmentType');
  const inputQuantity = form.watch('quantity');

  // Calculate new quantity based on adjustment type
  const getNewQuantity = (): number => {
    // Explicit conversion to avoid string concatenation
    const qty = Number(inputQuantity) || 0;
    const current = Number(currentQuantity) || 0;
    switch (adjustmentType) {
      case 'add':
        return current + qty;
      case 'subtract':
        return Math.max(0, current - qty);
      case 'set':
      default:
        return qty;
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const newQuantity = getNewQuantity();

      const { error } = await supabase
        .from('stock')
        .update({ quantity: newQuantity })
        .eq('id', stockId);

      if (error) throw error;

      toast.success(
        `Stock mis à jour: ${currentQuantity} → ${newQuantity} unités`
      );
      onSuccess();
    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour du stock');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Produit</p>
          <p className="font-medium">{productName}</p>
          <p className="text-sm mt-1">
            Stock actuel:{' '}
            <span className="font-semibold text-primary">{currentQuantity}</span>{' '}
            unités
          </p>
        </div>

        <FormField
          control={form.control}
          name="adjustmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type d'ajustement</FormLabel>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={field.value === 'set' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => field.onChange('set')}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Définir
                </Button>
                <Button
                  type="button"
                  variant={field.value === 'add' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => field.onChange('add')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
                <Button
                  type="button"
                  variant={field.value === 'subtract' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => field.onChange('subtract')}
                >
                  <Minus className="mr-2 h-4 w-4" />
                  Retirer
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {adjustmentType === 'set'
                  ? 'Nouvelle quantité'
                  : adjustmentType === 'add'
                  ? 'Quantité à ajouter'
                  : 'Quantité à retirer'}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {adjustmentType === 'set' && (
                  <>Le stock sera défini à cette valeur</>
                )}
                {adjustmentType === 'add' && (
                  <>Cette quantité sera ajoutée au stock actuel</>
                )}
                {adjustmentType === 'subtract' && (
                  <>Cette quantité sera retirée du stock actuel</>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preview */}
        <div className="p-4 border rounded-lg bg-background">
          <p className="text-sm text-muted-foreground mb-2">Résultat</p>
          <div className="flex items-center gap-3">
            <span className="text-lg">{currentQuantity}</span>
            <span className="text-muted-foreground">→</span>
            <span
              className={cn(
                'text-2xl font-bold',
                getNewQuantity() > currentQuantity
                  ? 'text-green-600'
                  : getNewQuantity() < currentQuantity
                  ? 'text-red-600'
                  : 'text-foreground'
              )}
            >
              {getNewQuantity()}
            </span>
            <span className="text-muted-foreground">unités</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer
          </Button>
        </div>
      </form>
    </Form>
  );
}
