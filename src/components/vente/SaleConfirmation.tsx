import { useEffect, useState } from 'react';
import { CheckCircle, Printer, Plus, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { cn } from '@/lib/utils';

interface SaleConfirmationProps {
  saleReference: string;
  totalAmount: number;
  isOffline: boolean;
  isProcessing: boolean;
  onPrint: () => void;
  onNewSale: () => void;
}

export function SaleConfirmation({
  saleReference,
  totalAmount,
  isOffline,
  isProcessing,
  onPrint,
  onNewSale,
}: SaleConfirmationProps) {
  const { isOnline } = useConnectionStatus();
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (!isProcessing && saleReference) {
      setShowAnimation(true);
    }
  }, [isProcessing, saleReference]);

  if (isProcessing) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary mb-4" />
            <p className="text-lg font-medium text-foreground">
              Enregistrement de la vente...
            </p>
            <p className="text-muted-foreground mt-2">
              Veuillez patienter
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Success Card */}
      <Card className="overflow-hidden">
        <div className={cn(
          'bg-gradient-to-br from-success/20 to-success/5 py-8 text-center',
          showAnimation && 'animate-fade-in'
        )}>
          <div className={cn(
            'inline-flex items-center justify-center h-20 w-20 rounded-full bg-success mb-4',
            showAnimation && 'animate-scale-in'
          )}>
            <CheckCircle className="h-12 w-12 text-success-foreground" />
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Vente Enregistrée !
          </h2>
          
          <p className="text-muted-foreground">
            La transaction a été effectuée avec succès
          </p>
        </div>
        
        <CardContent className="py-6 space-y-4">
          {/* Reference */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Référence</p>
            <p className="text-xl font-mono font-bold text-foreground">
              {saleReference}
            </p>
          </div>
          
          {/* Amount */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Montant Total</p>
            <p className="text-3xl font-bold text-primary">
              {totalAmount.toLocaleString('fr-FR')} XAF
            </p>
          </div>
          
          {/* Sync Status */}
          {isOffline && (
            <div className="flex items-center justify-center gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
              <WifiOff className="h-4 w-4 text-warning" />
              <span className="text-sm text-warning">
                Vente enregistrée localement
              </span>
              <Badge className="bg-warning text-warning-foreground">
                Synchro en attente
              </Badge>
            </div>
          )}
          
          {!isOffline && (
            <div className="flex items-center justify-center gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
              <Wifi className="h-4 w-4 text-success" />
              <span className="text-sm text-success">
                Synchronisé avec le serveur
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={onPrint}
          className="h-14"
        >
          <Printer className="mr-2 h-5 w-5" />
          Imprimer
        </Button>
        
        <Button
          onClick={onNewSale}
          className="h-14 bg-success hover:bg-success/90"
        >
          <Plus className="mr-2 h-5 w-5" />
          Nouvelle Vente
        </Button>
      </div>
    </div>
  );
}
