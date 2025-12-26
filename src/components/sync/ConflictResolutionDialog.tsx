import { useState } from 'react';
import { AlertTriangle, Check, X, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface ConflictData {
  id: string;
  type: 'sale' | 'stock' | 'product';
  localData: any;
  serverData: any;
  localTimestamp: number;
  serverTimestamp: number;
  description: string;
}

interface ConflictResolutionDialogProps {
  conflict: ConflictData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolve: (conflictId: string, resolution: 'local' | 'server' | 'merge') => Promise<void>;
}

export function ConflictResolutionDialog({
  conflict,
  open,
  onOpenChange,
  onResolve,
}: ConflictResolutionDialogProps) {
  const [selectedResolution, setSelectedResolution] = useState<'local' | 'server'>('server');
  const [isResolving, setIsResolving] = useState(false);

  if (!conflict) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      await onResolve(conflict.id, selectedResolution);
      onOpenChange(false);
    } finally {
      setIsResolving(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sale': return 'Vente';
      case 'stock': return 'Stock';
      case 'product': return 'Produit';
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Conflit de synchronisation détecté
          </DialogTitle>
          <DialogDescription>
            {conflict.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">{getTypeLabel(conflict.type)}</Badge>
            <span className="text-sm text-muted-foreground">ID: {conflict.id}</span>
          </div>

          <RadioGroup
            value={selectedResolution}
            onValueChange={(v) => setSelectedResolution(v as 'local' | 'server')}
            className="space-y-4"
          >
            {/* Local version */}
            <div className="relative">
              <RadioGroupItem value="local" id="local" className="sr-only peer" />
              <Label
                htmlFor="local"
                className={cn(
                  "block cursor-pointer rounded-lg border-2 p-0 transition-colors",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                  selectedResolution === 'local' 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-muted-foreground/50"
                )}
              >
                <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-blue-500" />
                        Version locale
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {formatDate(conflict.localTimestamp)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(conflict.localData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </Label>
            </div>

            {/* Server version */}
            <div className="relative">
              <RadioGroupItem value="server" id="server" className="sr-only peer" />
              <Label
                htmlFor="server"
                className={cn(
                  "block cursor-pointer rounded-lg border-2 p-0 transition-colors",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                  selectedResolution === 'server' 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-muted-foreground/50"
                )}
              >
                <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-green-500" />
                        Version serveur
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {formatDate(conflict.serverTimestamp)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(conflict.serverData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </Label>
            </div>
          </RadioGroup>

          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium mb-1">Recommandation :</p>
            <p className="text-muted-foreground">
              {conflict.type === 'stock' 
                ? "Pour les stocks, la version serveur est généralement plus fiable car elle reflète l'état actuel de la base de données."
                : conflict.type === 'sale'
                  ? "Les ventes locales n'ont pas encore été synchronisées. Choisissez la version locale pour conserver cette vente."
                  : "Comparez les deux versions et choisissez celle qui contient les données les plus récentes ou les plus complètes."
              }
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isResolving}>
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button onClick={handleResolve} disabled={isResolving}>
            {isResolving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Résolution...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Appliquer cette version
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
