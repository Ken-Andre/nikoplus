import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';

interface CartPanelProps {
  onNextStep: () => void;
}

export function CartPanel({ onNextStep }: CartPanelProps) {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5" />
            Panier
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <ShoppingCart className="mx-auto h-12 w-12 opacity-30" />
            <p className="mt-2">Panier vide</p>
            <p className="text-sm">Ajoutez des produits</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5" />
            Panier ({itemCount})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Vider
          </Button>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.product.id}
              className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {item.product.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.product.sellingPrice.toLocaleString('fr-FR')} XAF
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-semibold text-sm">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    const maxStock = item.product.stock || 0;
                    if (item.quantity < maxStock) {
                      updateQuantity(item.product.id, item.quantity + 1);
                    }
                  }}
                  disabled={item.quantity >= (item.product.stock || 0)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="text-right min-w-[80px]">
                <p className="font-semibold text-sm">
                  {(item.product.sellingPrice * item.quantity).toLocaleString('fr-FR')}
                </p>
                <p className="text-xs text-muted-foreground">XAF</p>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => removeItem(item.product.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <CardFooter className="flex-col gap-3 pt-4 border-t">
        <div className="w-full flex justify-between items-center">
          <span className="text-muted-foreground">Sous-total</span>
          <span className="text-xl font-bold text-foreground">
            {total.toLocaleString('fr-FR')} XAF
          </span>
        </div>
        
        <Button 
          onClick={onNextStep}
          className="w-full h-12 text-lg font-semibold bg-success hover:bg-success/90"
        >
          Continuer
        </Button>
      </CardFooter>
    </Card>
  );
}
