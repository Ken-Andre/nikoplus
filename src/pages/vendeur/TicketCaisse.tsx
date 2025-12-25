import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ArrowLeft, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface SaleItem {
  id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

interface TicketData {
  id: string;
  reference: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  client_name: string | null;
  client_phone: string | null;
  sale_items: SaleItem[];
  boutique: {
    name: string;
    address: string | null;
    phone: string | null;
  };
  seller: {
    first_name: string | null;
    last_name: string | null;
  };
}

const paymentLabels: Record<string, string> = {
  cash: 'Espèces',
  card: 'Carte bancaire',
  transfer: 'Virement',
  check: 'Chèque',
};

export default function TicketCaisse() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasPrinted = useRef(false);

  useEffect(() => {
    if (id) {
      fetchTicketData();
    }
  }, [id]);

  useEffect(() => {
    // Auto-print when data is loaded
    if (ticketData && !hasPrinted.current) {
      hasPrinted.current = true;
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [ticketData]);

  const fetchTicketData = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      // Fetch sale with items
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (saleError) throw saleError;
      if (!saleData) {
        setTicketData(null);
        return;
      }

      // Fetch sale items
      const { data: itemsData } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', id);

      // Fetch boutique
      const { data: boutiqueData } = await supabase
        .from('boutiques')
        .select('name, address, phone')
        .eq('id', saleData.boutique_id)
        .maybeSingle();

      // Fetch seller
      const { data: sellerData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', saleData.seller_id)
        .maybeSingle();

      setTicketData({
        ...saleData,
        sale_items: itemsData || [],
        boutique: boutiqueData || { name: 'NICKOPLUS PRO', address: null, phone: null },
        seller: sellerData || { first_name: null, last_name: null },
      });
    } catch (error) {
      console.error('Error fetching ticket data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate(`/vendeur/vente/${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="space-y-4 w-full max-w-xs">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (!ticketData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Vente introuvable</p>
          <Button variant="outline" onClick={() => navigate('/vendeur/historique-ventes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const sellerName = [ticketData.seller.first_name, ticketData.seller.last_name]
    .filter(Boolean)
    .join(' ') || 'Vendeur';

  return (
    <div className="min-h-screen bg-background">
      {/* Control buttons - hidden on print */}
      <div className="fixed top-4 left-4 right-4 flex gap-2 print:hidden z-10">
        <Button variant="outline" onClick={handleBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button onClick={handlePrint} className="flex-1">
          <Printer className="mr-2 h-4 w-4" />
          Imprimer
        </Button>
      </div>

      {/* Ticket container */}
      <div className="flex justify-center py-20 px-4 print:py-0 print:px-0">
        <div className="ticket-container bg-white text-black w-[80mm] p-4 print:p-2 shadow-lg print:shadow-none">
          
          {/* Header - Logo */}
          <div className="ticket-header text-center border-b-2 border-dashed border-black pb-3 mb-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Store className="h-6 w-6" />
              <span className="text-xl font-bold tracking-wide">NICKOPLUS PRO</span>
            </div>
            <div className="text-sm space-y-0.5">
              <p className="font-semibold">{ticketData.boutique.name}</p>
              {ticketData.boutique.address && (
                <p className="text-xs">{ticketData.boutique.address}</p>
              )}
              {ticketData.boutique.phone && (
                <p className="text-xs">Tél: {ticketData.boutique.phone}</p>
              )}
            </div>
          </div>

          {/* Sale info */}
          <div className="ticket-info text-xs border-b border-dashed border-black pb-2 mb-2 space-y-1">
            <div className="flex justify-between">
              <span>Réf:</span>
              <span className="font-mono font-bold">{ticketData.reference}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{format(new Date(ticketData.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}</span>
            </div>
            <div className="flex justify-between">
              <span>Vendeur:</span>
              <span>{sellerName}</span>
            </div>
            {ticketData.client_name && (
              <div className="flex justify-between">
                <span>Client:</span>
                <span>{ticketData.client_name}</span>
              </div>
            )}
          </div>

          {/* Items header */}
          <div className="ticket-items-header text-xs font-bold flex border-b border-black pb-1 mb-1">
            <span className="w-8 text-center">Qté</span>
            <span className="flex-1">Produit</span>
            <span className="w-20 text-right">Total</span>
          </div>

          {/* Items list */}
          <div className="ticket-items text-xs border-b border-dashed border-black pb-2 mb-2">
            {ticketData.sale_items.map((item) => (
              <div key={item.id} className="flex py-0.5">
                <span className="w-8 text-center">{item.quantity}</span>
                <span className="flex-1 truncate pr-1">{item.product_name}</span>
                <span className="w-20 text-right font-mono">
                  {item.total_price.toLocaleString('fr-FR')}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="ticket-total text-center py-2 border-b border-dashed border-black mb-3">
            <p className="text-xs text-gray-600 mb-1">TOTAL À PAYER</p>
            <p className="text-2xl font-bold">
              {ticketData.total_amount.toLocaleString('fr-FR')} XAF
            </p>
            <p className="text-xs mt-1">
              Payé par: {paymentLabels[ticketData.payment_method] || ticketData.payment_method}
            </p>
          </div>

          {/* QR Code */}
          <div className="ticket-qr text-center py-3">
            <QRCodeSVG
              value={ticketData.reference}
              size={80}
              level="M"
              className="mx-auto"
            />
            <p className="text-xs font-mono mt-1">{ticketData.reference}</p>
          </div>

          {/* Thank you message */}
          <div className="ticket-thanks text-center pt-2 border-t border-dashed border-black">
            <p className="text-sm">✨ Merci de votre visite ! ✨</p>
            <p className="text-xs text-gray-600 mt-1">À bientôt chez NICKOPLUS</p>
          </div>

        </div>
      </div>
    </div>
  );
}
