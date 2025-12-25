import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ConnectionIndicator() {
  const { status, pendingSyncs } = useConnectionStatus();

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 px-2 py-1 text-xs font-medium transition-colors',
        status === 'online' && 'border-success/50 bg-success/10 text-success',
        status === 'offline' && 'border-destructive/50 bg-destructive/10 text-destructive',
        status === 'syncing' && 'border-warning/50 bg-warning/10 text-warning'
      )}
    >
      {status === 'online' && (
        <>
          <Wifi className="h-3 w-3" />
          <span>En ligne</span>
        </>
      )}
      {status === 'offline' && (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Hors ligne</span>
        </>
      )}
      {status === 'syncing' && (
        <>
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>{pendingSyncs} en attente</span>
        </>
      )}
    </Badge>
  );
}
