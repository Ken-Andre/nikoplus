import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ConnectionProvider } from "@/hooks/useConnectionStatus";
import { CartProvider } from "@/hooks/useCart";

// Pages
import AuthPage from "./pages/AuthPage";
import VendeurAccueil from "./pages/vendeur/VendeurAccueil";
import NouvelleVente from "./pages/vendeur/NouvelleVente";
import HistoriqueVentes from "./pages/vendeur/HistoriqueVentes";
import VenteDetails from "./pages/vendeur/VenteDetails";
import ConsultationStocks from "./pages/vendeur/ConsultationStocks";
import TicketCaisse from "./pages/vendeur/TicketCaisse";
import GestionProduits from "./pages/manager/GestionProduits";
import GestionCategories from "./pages/manager/GestionCategories";
import GestionStocks from "./pages/manager/GestionStocks";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import GestionFournisseurs from "./pages/manager/GestionFournisseurs";
import AlertesStock from "./pages/manager/AlertesStock";
import GestionObjectifs from "./pages/manager/GestionObjectifs";
import PrevisionsVentes from "./pages/manager/PrevisionsVentes";
import AdminDashboard from "./pages/admin/AdminDashboard";
import GestionUtilisateurs from "./pages/admin/GestionUtilisateurs";
import GestionBoutiques from "./pages/admin/GestionBoutiques";
import RapportsGlobaux from "./pages/admin/RapportsGlobaux";
import ParametresSysteme from "./pages/admin/ParametresSysteme";
import ProfilPage from "./pages/ProfilPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display text-2xl font-bold">
            N+
          </div>
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      
      {/* Default redirect based on role */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {user?.role === 'seller' ? (
              <Navigate to="/vendeur/accueil" replace />
            ) : user?.role === 'manager' ? (
              <Navigate to="/manager" replace />
            ) : (
              <Navigate to="/admin/dashboard" replace />
            )}
          </ProtectedRoute>
        }
      />

      {/* Vendeur Routes */}
      <Route
        path="/vendeur/accueil"
        element={
          <ProtectedRoute>
            <VendeurAccueil />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendeur/nouvelle-vente"
        element={
          <ProtectedRoute>
            <NouvelleVente />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendeur/historique-ventes"
        element={
          <ProtectedRoute>
            <HistoriqueVentes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendeur/vente/:id"
        element={
          <ProtectedRoute>
            <VenteDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendeur/stocks"
        element={
          <ProtectedRoute>
            <ConsultationStocks />
          </ProtectedRoute>
        }
      />

      {/* Ticket printing - requires authentication for security */}
      <Route
        path="/ticket/:id"
        element={
          <ProtectedRoute>
            <TicketCaisse />
          </ProtectedRoute>
        }
      />

      {/* Manager Routes */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/produits"
        element={
          <ProtectedRoute>
            <GestionProduits />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/categories"
        element={
          <ProtectedRoute>
            <GestionCategories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/stocks"
        element={
          <ProtectedRoute>
            <GestionStocks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/fournisseurs"
        element={
          <ProtectedRoute>
            <GestionFournisseurs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/alertes"
        element={
          <ProtectedRoute>
            <AlertesStock />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/objectifs"
        element={
          <ProtectedRoute>
            <GestionObjectifs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/previsions"
        element={
          <ProtectedRoute>
            <PrevisionsVentes />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/utilisateurs"
        element={
          <ProtectedRoute>
            <GestionUtilisateurs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/boutiques"
        element={
          <ProtectedRoute>
            <GestionBoutiques />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/rapports"
        element={
          <ProtectedRoute>
            <RapportsGlobaux />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/parametres"
        element={
          <ProtectedRoute>
            <ParametresSysteme />
          </ProtectedRoute>
        }
      />

      {/* Profile */}
      <Route
        path="/profil"
        element={
          <ProtectedRoute>
            <ProfilPage />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ConnectionProvider>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </ConnectionProvider>
  </QueryClientProvider>
);

export default App;
