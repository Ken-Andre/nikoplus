import { Wifi, WifiOff, RefreshCw, Check, CloudOff } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ConnectionIndicator() {
  const { status, pendingSyncs } = useConnectionStatus();

  const getStatusInfo = () => {
    switch (status) {
      case 'online':
        return {
          icon: pendingSyncs === 0 ? <Check className="h-3 w-3" /> : <Wifi className="h-3 w-3" />,
          label: pendingSyncs === 0 ? 'Synchronisé' : 'En ligne',
          tooltip: pendingSyncs === 0 
            ? 'Toutes les données sont synchronisées' 
            : `${pendingSyncs} opération(s) en attente`,
          className: 'border-success/50 bg-success/10 text-success',
        };
      case 'offline':
        return {
          icon: <WifiOff className="h-3 w-3" />,
          label: 'Hors ligne',
          tooltip: pendingSyncs > 0 
            ? `${pendingSyncs} opération(s) seront synchronisées au retour en ligne`
            : 'Pas de connexion internet',
          className: 'border-destructive/50 bg-destructive/10 text-destructive',
        };
      case 'syncing':
        return {
          icon: <RefreshCw className="h-3 w-3 animate-spin" />,
          label: `Sync (${pendingSyncs})`,
          tooltip: `Synchronisation de ${pendingSyncs} opération(s) en cours...`,
          className: 'border-warning/50 bg-warning/10 text-warning',
        };
    }
  };

  const info = getStatusInfo();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'gap-1.5 px-2 py-1 text-xs font-medium transition-all cursor-default',
              info.className
            )}
          >
            {info.icon}
            <span className="hidden sm:inline">{info.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{info.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
