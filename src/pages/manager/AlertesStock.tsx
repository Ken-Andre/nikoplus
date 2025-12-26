import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, PackageX, CheckCircle, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface StockAlert {
  id: string;
  product_id: string;
  boutique_id: string;
  alert_type: string;
  message: string | null;
  is_resolved: boolean;
  created_at: string;
  resolved_at: string | null;
  product_name?: string;
  boutique_name?: string;
  current_stock?: number;
}

export default function AlertesStock() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('unresolved');

  useEffect(() => {
    fetchAlerts();
  }, [user, filterType, filterStatus]);

  const fetchAlerts = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('boutique_id')
        .eq('id', user.id)
        .maybeSingle();

      let query = supabase
        .from('stock_alerts')
        .select(`
          *,
          products(name),
          boutiques(name)
        `)
        .order('created_at', { ascending: false });

      if (profile?.boutique_id) {
        query = query.eq('boutique_id', profile.boutique_id);
      }

      if (filterType !== 'all') {
        query = query.eq('alert_type', filterType);
      }

      if (filterStatus === 'unresolved') {
        query = query.eq('is_resolved', false);
      } else if (filterStatus === 'resolved') {
        query = query.eq('is_resolved', true);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      // Get current stock levels
      const productIds = [...new Set(data?.map(a => a.product_id) || [])];
      const { data: stockData } = await supabase
        .from('stock')
        .select('product_id, quantity')
        .in('product_id', productIds)
        .eq('boutique_id', profile?.boutique_id);

      const stockMap = new Map(stockData?.map(s => [s.product_id, s.quantity]) || []);

      setAlerts(
        (data || []).map(alert => ({
          ...alert,
          product_name: (alert.products as any)?.name,
          boutique_name: (alert.boutiques as any)?.name,
          current_stock: stockMap.get(alert.product_id) ?? 0,
        }))
      );
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Erreur lors du chargement des alertes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('stock_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev =>
        prev.map(a =>
          a.id === alertId ? { ...a, is_resolved: true, resolved_at: new Date().toISOString() } : a
        )
      );
      toast.success('Alerte marquée comme résolue');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Erreur lors de la résolution');
    }
  };

  const unresolvedCount = alerts.filter(a => !a.is_resolved).length;
  const outOfStockCount = alerts.filter(a => a.alert_type === 'out_of_stock' && !a.is_resolved).length;
  const lowStockCount = alerts.filter(a => a.alert_type === 'low_stock' && !a.is_resolved).length;

  return (
    <AppLayout title="Alertes de Stock" backButton>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <PackageX className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{outOfStockCount}</p>
                <p className="text-sm text-muted-foreground">Ruptures de stock</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStockCount}</p>
                <p className="text-sm text-muted-foreground">Stocks bas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-muted">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unresolvedCount}</p>
                <p className="text-sm text-muted-foreground">À traiter</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Type d'alerte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="out_of_stock">Rupture</SelectItem>
              <SelectItem value="low_stock">Stock bas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="unresolved">Non résolues</SelectItem>
              <SelectItem value="resolved">Résolues</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des alertes</CardTitle>
            <CardDescription>{alerts.length} alerte{alerts.length !== 1 ? 's' : ''}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Stock actuel</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune alerte trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.product_name || 'Produit inconnu'}</TableCell>
                      <TableCell>
                        <Badge variant={alert.alert_type === 'out_of_stock' ? 'destructive' : 'secondary'}>
                          {alert.alert_type === 'out_of_stock' ? (
                            <><PackageX className="h-3 w-3 mr-1" /> Rupture</>
                          ) : (
                            <><AlertTriangle className="h-3 w-3 mr-1" /> Stock bas</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className={alert.current_stock === 0 ? 'text-destructive font-medium' : ''}>
                          {alert.current_stock}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {alert.is_resolved ? (
                          <Badge variant="outline" className="text-success border-success">
                            <CheckCircle className="h-3 w-3 mr-1" /> Résolu
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-warning border-warning">
                            En attente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!alert.is_resolved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResolve(alert.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/manager/stocks')}
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
