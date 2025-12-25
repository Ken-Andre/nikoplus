import { Check } from 'lucide-react';
import { SALE_STEPS } from '@/types';
import { cn } from '@/lib/utils';

interface SaleStepperProps {
  currentStep: number;
}

export function SaleStepper({ currentStep }: SaleStepperProps) {
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between">
        {SALE_STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all duration-300',
                    isCompleted && 'bg-success border-success text-success-foreground',
                    isCurrent && 'bg-primary border-primary text-primary-foreground animate-pulse',
                    !isCompleted && !isCurrent && 'border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent && 'text-primary',
                      isCompleted && 'text-success',
                      !isCompleted && !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {/* Connector Line */}
              {index < SALE_STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 transition-all duration-500',
                    isCompleted ? 'bg-success' : 'bg-muted-foreground/20'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
