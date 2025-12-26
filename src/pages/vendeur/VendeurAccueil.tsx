import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  History, 
  User,
  TrendingUp,
  Clock,
  Store,
  Loader2,
  Target,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TodayStats {
  salesCount: number;
  totalAmount: number;
  lastSaleTime: string | null;
}

interface MonthlyObjective {
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
}

export default function VendeurAccueil() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TodayStats>({
    salesCount: 0,
    totalAmount: 0,
    lastSaleTime: null,
  });
  const [objective, setObjective] = useState<MonthlyObjective | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        // Get start of today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        // Get month boundaries
        const monthStart = startOfMonth(new Date());
        const monthEnd = endOfMonth(new Date());
        const currentMonth = monthStart.getMonth() + 1;
        const currentYear = monthStart.getFullYear();

        // Fetch today's sales for current user
        const { data: todaySales, error: todayError } = await supabase
          .from('sales')
          .select('id, total_amount, created_at')
          .eq('seller_id', user.id)
          .gte('created_at', todayISO)
          .order('created_at', { ascending: false });

        if (todayError) throw todayError;

        const salesCount = todaySales?.length || 0;
        const totalAmount = todaySales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
        const lastSaleTime = todaySales?.[0]?.created_at 
          ? format(new Date(todaySales[0].created_at), 'HH:mm', { locale: fr })
          : null;

        setStats({
          salesCount,
          totalAmount,
          lastSaleTime,
        });

        // Fetch monthly objective
        const { data: objectiveData } = await supabase
          .from('sales_objectives')
          .select('target_amount')
          .eq('seller_id', user.id)
          .eq('month', currentMonth)
          .eq('year', currentYear)
          .maybeSingle();

        if (objectiveData && objectiveData.target_amount > 0) {
          // Fetch monthly sales
          const { data: monthlySales } = await supabase
            .from('sales')
            .select('total_amount')
            .eq('seller_id', user.id)
            .gte('created_at', monthStart.toISOString())
            .lte('created_at', monthEnd.toISOString());

          const monthlyAmount = monthlySales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
          const target = Number(objectiveData.target_amount);
          const progressPercent = Math.min((monthlyAmount / target) * 100, 100);

          setObjective({
            targetAmount: target,
            currentAmount: monthlyAmount,
            progressPercent,
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  return (
    <AppLayout title="Accueil">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Bonjour, {user?.firstName || 'Vendeur'} 👋
          </h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Store className="h-4 w-4" />
            {user?.boutiqueName || 'Boutique non assignée'}
          </p>
        </div>

        {/* Main Action */}
        <Card className="border-2 border-success/20 bg-gradient-to-br from-success/5 to-success/10 card-hover">
          <CardContent className="p-6">
            <Link to="/vendeur/nouvelle-vente">
              <Button
                size="lg"
                className="h-20 w-full text-lg font-semibold bg-success hover:bg-success/90"
              >
                <ShoppingCart className="mr-3 h-7 w-7" />
                Nouvelle Vente
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Today Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Ventes du jour
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-3xl font-bold text-foreground">
                  {stats.salesCount}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Montant total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-3xl font-bold text-success">
                  {stats.totalAmount.toLocaleString('fr-FR')} <span className="text-lg font-normal">XAF</span>
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Dernière vente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-lg font-medium text-foreground">
                  {stats.lastSaleTime ? `Aujourd'hui à ${stats.lastSaleTime}` : 'Aucune vente'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Objective Progress */}
        {objective && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Objectif du mois
              </CardTitle>
              <CardDescription>
                {format(new Date(), 'MMMM yyyy', { locale: fr })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-muted-foreground">Réalisé</p>
                  <p className="text-2xl font-bold text-primary">
                    {objective.currentAmount.toLocaleString('fr-FR')} <span className="text-sm font-normal">XAF</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Objectif</p>
                  <p className="text-lg font-semibold text-foreground">
                    {objective.targetAmount.toLocaleString('fr-FR')} <span className="text-sm font-normal">XAF</span>
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Progress 
                  value={objective.progressPercent} 
                  className="h-3"
                  indicatorClassName={
                    objective.progressPercent >= 100 
                      ? 'bg-success' 
                      : objective.progressPercent >= 75 
                        ? 'bg-primary' 
                        : objective.progressPercent >= 50 
                          ? 'bg-warning' 
                          : 'bg-destructive'
                  }
                />
                <div className="flex justify-between text-sm">
                  <span className={
                    objective.progressPercent >= 100 
                      ? 'text-success font-semibold' 
                      : 'text-muted-foreground'
                  }>
                    {objective.progressPercent.toFixed(1)}% atteint
                  </span>
                  <span className="text-muted-foreground">
                    Reste: {Math.max(0, objective.targetAmount - objective.currentAmount).toLocaleString('fr-FR')} XAF
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Link to="/vendeur/historique-ventes">
            <Card className="cursor-pointer card-hover h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                  <History className="h-6 w-6 text-info" />
                </div>
                <CardTitle className="text-base">Historique Ventes</CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Voir vos ventes passées
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link to="/vendeur/stocks">
            <Card className="cursor-pointer card-hover h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                  <Package className="h-6 w-6 text-warning" />
                </div>
                <CardTitle className="text-base">Consulter Stocks</CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Vérifier la disponibilité
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link to="/profil">
            <Card className="cursor-pointer card-hover h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">Mon Profil</CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Gérer mon compte
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
