import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Printer, XCircle, ArrowLeft, Banknote, CreditCard, Building2, FileCheck, User, Phone, Clock, Hash, CheckCircle2, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

interface SaleDetails {
  id: string;
  reference: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  status: string;
  is_synced: boolean;
  client_name: string | null;
  client_phone: string | null;
  seller_id: string;
  sale_items: SaleItem[];
  sellerName?: string;
}

const paymentIcons: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-5 w-5" />,
  card: <CreditCard className="h-5 w-5" />,
  transfer: <Building2 className="h-5 w-5" />,
  check: <FileCheck className="h-5 w-5" />,
};

const paymentLabels: Record<string, string> = {
  cash: 'Espèces',
  card: 'Carte bancaire',
  transfer: 'Virement bancaire',
  check: 'Chèque',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  completed: { label: 'Terminée', variant: 'default', icon: <CheckCircle2 className="h-4 w-4" /> },
  cancelled: { label: 'Annulée', variant: 'destructive', icon: <XCircle className="h-4 w-4" /> },
  pending_sync: { label: 'En attente synchro', variant: 'secondary', icon: <WifiOff className="h-4 w-4" /> },
};

export default function VenteDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<SaleDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSaleDetails();
    }
  }, [id]);

  const fetchSaleDetails = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      // Fetch sale data
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (saleError) throw saleError;
      if (!saleData) {
        setSale(null);
        return;
      }

      // Fetch sale items
      const { data: itemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', id);

      if (itemsError) throw itemsError;

      // Fetch seller profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', saleData.seller_id)
        .maybeSingle();

      const sellerName = profileData
        ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Inconnu'
        : 'Inconnu';

      setSale({
        ...saleData,
        sale_items: itemsData || [],
        sellerName,
      });
    } catch (error) {
      console.error('Error fetching sale details:', error);
      toast.error('Erreur lors du chargement de la vente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSale = async () => {
    if (!sale) return;

    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('sales')
        .update({ status: 'cancelled' })
        .eq('id', sale.id);

      if (error) throw error;

      // Restore stock for each item
      for (const item of sale.sale_items) {
        const { data: stockData } = await supabase
          .from('stock')
          .select('id, quantity')
          .eq('product_id', item.id)
          .maybeSingle();

        if (stockData) {
          await supabase
            .from('stock')
            .update({ quantity: stockData.quantity + item.quantity })
            .eq('id', stockData.id);
        }
      }

      toast.success('Vente annulée avec succès');
      setSale({ ...sale, status: 'cancelled' });
    } catch (error) {
      console.error('Error cancelling sale:', error);
      toast.error("Erreur lors de l'annulation");
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <AppLayout title="Détails de la vente" backButton>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!sale) {
    return (
      <AppLayout title="Vente introuvable" backButton>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Cette vente n'existe pas ou a été supprimée.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/vendeur/historique-ventes')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'historique
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Détails de la vente" backButton>
      <div className="space-y-4 print:space-y-2">
        {/* Header with reference and status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold font-mono">{sale.reference}</h2>
            <Badge variant={statusConfig[sale.status]?.variant || 'outline'} className="flex items-center gap-1">
              {statusConfig[sale.status]?.icon}
              {statusConfig[sale.status]?.label || sale.status}
            </Badge>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
            {sale.status === 'completed' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isCancelling}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Annuler
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Annuler cette vente ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Le stock sera restauré pour chaque produit.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Non, garder</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelSale} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Oui, annuler la vente
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Sale info card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date et heure</p>
                  <p className="font-medium">
                    {format(new Date(sale.created_at), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Vendeur</p>
                  <p className="font-medium">{sale.sellerName || 'Inconnu'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {paymentIcons[sale.payment_method]}
                <div>
                  <p className="text-sm text-muted-foreground">Mode de paiement</p>
                  <p className="font-medium">{paymentLabels[sale.payment_method] || sale.payment_method}</p>
                </div>
              </div>

              {sale.client_name && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{sale.client_name}</p>
                    {sale.client_phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {sale.client_phone}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Produits ({sale.sale_items.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Prix unit.</TableHead>
                  <TableHead className="text-center">Qté</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.sale_items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell className="text-right">{item.unit_price.toLocaleString('fr-FR')} XAF</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right font-medium">{item.total_price.toLocaleString('fr-FR')} XAF</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Total */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Total</span>
              <span className="text-2xl font-bold text-primary">
                {sale.total_amount.toLocaleString('fr-FR')} XAF
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Sync status */}
        {!sale.is_synced && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <WifiOff className="h-4 w-4" />
            <span>Cette vente n'a pas encore été synchronisée avec le serveur</span>
          </div>
        )}

        {/* Back button (mobile) */}
        <Button
          variant="outline"
          className="w-full sm:hidden print:hidden"
          onClick={() => navigate('/vendeur/historique-ventes')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'historique
        </Button>
      </div>
    </AppLayout>
  );
}
