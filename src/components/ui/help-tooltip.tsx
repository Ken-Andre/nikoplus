import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  iconClassName?: string;
}

export function HelpTooltip({ 
  children, 
  className,
  side = 'top',
  iconClassName,
}: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full p-0.5",
              "text-muted-foreground hover:text-foreground transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className
            )}
            aria-label="Aide"
          >
            <HelpCircle className={cn("h-4 w-4", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-xs text-sm"
        >
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface HelpTextProps {
  children: React.ReactNode;
  label: string;
  className?: string;
}

export function HelpText({ children, label, className }: HelpTextProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span>{label}</span>
      <HelpTooltip>{children}</HelpTooltip>
    </div>
  );
}
