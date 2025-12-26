import { WifiOff, CloudOff, Info } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const { status, pendingSyncs } = useConnectionStatus();

  if (status === 'online') return null;

  return (
    <Alert 
      className={cn(
        'border-warning/50 bg-warning/10 text-warning-foreground animate-fade-in',
        className
      )}
    >
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-1">
        <span className="font-medium">
          {status === 'offline' ? 'Mode hors ligne activé' : 'Synchronisation en cours...'}
        </span>
        <span className="text-sm opacity-90">
          {status === 'offline' ? (
            pendingSyncs > 0 
              ? `${pendingSyncs} opération(s) en attente de synchronisation`
              : 'Vos données sont enregistrées localement et seront synchronisées automatiquement.'
          ) : (
            `Synchronisation de ${pendingSyncs} opération(s)...`
          )}
        </span>
      </AlertDescription>
    </Alert>
  );
}
