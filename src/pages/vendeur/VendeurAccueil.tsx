import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  History, 
  User,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function VendeurAccueil() {
  const { user } = useAuth();

  // TODO: Fetch real data
  const todayStats = {
    salesCount: 0,
    totalAmount: 0,
    lastSaleTime: null as string | null,
  };

  return (
    <AppLayout title="Accueil">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Bonjour, {user?.firstName || 'Vendeur'} 👋
          </h2>
          <p className="text-muted-foreground">
            Bienvenue sur votre espace de vente
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
              <p className="text-3xl font-bold text-foreground">
                {todayStats.salesCount}
              </p>
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
              <p className="text-3xl font-bold text-foreground">
                {todayStats.totalAmount.toLocaleString('fr-FR')} XAF
              </p>
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
              <p className="text-lg font-medium text-foreground">
                {todayStats.lastSaleTime || 'Aucune vente'}
              </p>
            </CardContent>
          </Card>
        </div>

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
