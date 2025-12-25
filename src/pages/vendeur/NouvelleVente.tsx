import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { SaleStepper } from '@/components/vente/SaleStepper';
import { ProductSearch } from '@/components/vente/ProductSearch';
import { CartPanel } from '@/components/vente/CartPanel';
import { ClientForm } from '@/components/vente/ClientForm';
import { PaymentForm } from '@/components/vente/PaymentForm';
import { SaleConfirmation } from '@/components/vente/SaleConfirmation';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check';

export default function NouvelleVente() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const { isOnline } = useConnectionStatus();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState(0);
  const [saleReference, setSaleReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOfflineSale, setIsOfflineSale] = useState(false);

  const generateReference = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.getTime().toString().slice(-4);
    return `V-${dateStr}-${timeStr}`;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && items.length === 0) {
      toast.error('Ajoutez au moins un produit au panier');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleValidateSale = async () => {
    if (currentStep === 3) {
      setCurrentStep(4);
      setIsProcessing(true);
      
      try {
        const reference = generateReference();
        
        // Insert sale
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .insert({
            reference,
            boutique_id: user?.boutiqueId,
            seller_id: user?.id,
            client_name: clientName || null,
            client_phone: clientPhone || null,
            total_amount: total,
            payment_method: paymentMethod,
            status: 'completed',
            is_synced: isOnline,
          })
          .select()
          .single();

        if (saleError) throw saleError;

        // Insert sale items
        const saleItems = items.map(item => ({
          sale_id: saleData.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.sellingPrice,
          total_price: item.product.sellingPrice * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) throw itemsError;

        // Update stock for each item
        for (const item of items) {
          // Get current stock
          const { data: stockData } = await supabase
            .from('stock')
            .select('quantity')
            .eq('product_id', item.product.id)
            .eq('boutique_id', user?.boutiqueId)
            .single();
          
          if (stockData) {
            await supabase
              .from('stock')
              .update({ quantity: Math.max(0, stockData.quantity - item.quantity) })
              .eq('product_id', item.product.id)
              .eq('boutique_id', user?.boutiqueId);
          }
        }

        setSaleReference(reference);
        setIsOfflineSale(!isOnline);
        toast.success('Vente enregistrée avec succès !');
        
      } catch (error) {
        console.error('Error creating sale:', error);
        toast.error('Erreur lors de l\'enregistrement de la vente');
        setCurrentStep(3);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handlePrint = () => {
    // Navigate to print page
    window.open(`/ticket/${saleReference}`, '_blank');
  };

  const handleNewSale = () => {
    clearCart();
    setCurrentStep(1);
    setClientName('');
    setClientPhone('');
    setPaymentMethod('cash');
    setAmountReceived(0);
    setSaleReference('');
    setIsOfflineSale(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ProductSearch />
            </div>
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-4">
                <CartPanel onNextStep={handleNextStep} />
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <ClientForm
            clientName={clientName}
            clientPhone={clientPhone}
            onClientNameChange={setClientName}
            onClientPhoneChange={setClientPhone}
            onNext={handleNextStep}
            onBack={handlePrevStep}
          />
        );
      
      case 3:
        return (
          <PaymentForm
            paymentMethod={paymentMethod}
            amountReceived={amountReceived}
            onPaymentMethodChange={setPaymentMethod}
            onAmountReceivedChange={setAmountReceived}
            onNext={handleValidateSale}
            onBack={handlePrevStep}
          />
        );
      
      case 4:
        return (
          <SaleConfirmation
            saleReference={saleReference}
            totalAmount={total}
            isOffline={isOfflineSale}
            isProcessing={isProcessing}
            onPrint={handlePrint}
            onNewSale={handleNewSale}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <AppLayout 
      title="Nouvelle Vente"
      backButton={
        currentStep === 1 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/vendeur/accueil')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6 animate-fade-in">
        {/* Stepper */}
        <SaleStepper currentStep={currentStep} />
        
        {/* Step Content */}
        {renderStepContent()}
      </div>
    </AppLayout>
  );
}
