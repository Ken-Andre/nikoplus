import { useState, useEffect } from 'react';
import { CreditCard, ArrowRight, ArrowLeft, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { PAYMENT_METHODS } from '@/types';
import { cn } from '@/lib/utils';

type PaymentMethod = 'cash' | 'mobile_money' | 'card' | 'transfer';

interface PaymentFormProps {
  paymentMethod: PaymentMethod;
  amountReceived: number;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onAmountReceivedChange: (amount: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PaymentForm({
  paymentMethod,
  amountReceived,
  onPaymentMethodChange,
  onAmountReceivedChange,
  onNext,
  onBack,
}: PaymentFormProps) {
  const { total } = useCart();
  const [inputValue, setInputValue] = useState(amountReceived > 0 ? amountReceived.toString() : '');
  
  const change = paymentMethod === 'cash' ? Math.max(0, amountReceived - total) : 0;
  const isValid = paymentMethod !== 'cash' || amountReceived >= total;

  useEffect(() => {
    if (paymentMethod !== 'cash') {
      onAmountReceivedChange(total);
      setInputValue(total.toString());
    }
  }, [paymentMethod, total]);

  const handleAmountChange = (value: string) => {
    setInputValue(value);
    const numValue = parseFloat(value) || 0;
    onAmountReceivedChange(numValue);
  };

  const quickAmounts = [
    Math.ceil(total / 1000) * 1000,
    Math.ceil(total / 5000) * 5000,
    Math.ceil(total / 10000) * 10000,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= total);

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Total Display */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground mb-1">Montant Total</p>
          <p className="text-4xl font-bold text-primary">
            {total.toLocaleString('fr-FR')} XAF
          </p>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Mode de Paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((method) => (
              <Button
                key={method.id}
                variant={paymentMethod === method.id ? 'default' : 'outline'}
                className={cn(
                  'h-16 flex flex-col items-center justify-center gap-1',
                  paymentMethod === method.id && 'ring-2 ring-primary ring-offset-2'
                )}
                onClick={() => onPaymentMethodChange(method.id as PaymentMethod)}
              >
                <span className="text-xl">{method.icon}</span>
                <span className="text-sm">{method.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cash Payment - Amount Received */}
      {paymentMethod === 'cash' && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calcul Monnaie
            </CardTitle>
            <CardDescription>
              Entrez le montant reçu du client
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Montant reçu (XAF)</Label>
              <Input
                type="number"
                placeholder="0"
                value={inputValue}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="text-xl h-14 text-center font-semibold"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2 flex-wrap">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAmountChange(amount.toString())}
                >
                  {amount.toLocaleString('fr-FR')}
                </Button>
              ))}
            </div>

            {/* Change Display */}
            {amountReceived >= total && (
              <div className="mt-4 p-4 rounded-lg bg-success/10 border border-success/20">
                <p className="text-muted-foreground text-sm">Monnaie à rendre</p>
                <p className="text-3xl font-bold text-success">
                  {change.toLocaleString('fr-FR')} XAF
                </p>
              </div>
            )}

            {amountReceived > 0 && amountReceived < total && (
              <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-muted-foreground text-sm">Montant insuffisant</p>
                <p className="text-xl font-bold text-destructive">
                  Manque {(total - amountReceived).toLocaleString('fr-FR')} XAF
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        
        <Button
          onClick={onNext}
          className="flex-1 bg-success hover:bg-success/90"
          disabled={!isValid}
        >
          Valider la vente
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
