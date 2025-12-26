import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Phone,
  Users,
  ShoppingCart,
} from 'lucide-react';
import type { Boutique } from '@/types';

interface BoutiqueWithStats extends Boutique {
  userCount: number;
  salesCount: number;
}

interface BoutiqueFormData {
  name: string;
  address: string;
  phone: string;
}

const initialFormData: BoutiqueFormData = {
  name: '',
  address: '',
  phone: '',
};

export default function GestionBoutiques() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [boutiques, setBoutiques] = useState<BoutiqueWithStats[]>([]);
  const [filteredBoutiques, setFilteredBoutiques] = useState<BoutiqueWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBoutique, setSelectedBoutique] = useState<BoutiqueWithStats | null>(null);
  const [formData, setFormData] = useState<BoutiqueFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchBoutiques();

    // Open create dialog if action=create in URL
    if (searchParams.get('action') === 'create') {
      setIsDialogOpen(true);
    }
  }, [user, navigate, searchParams]);

  useEffect(() => {
    filterBoutiques();
  }, [boutiques, searchTerm]);

  const fetchBoutiques = async () => {
    try {
      // Fetch boutiques
      const { data: boutiquesData, error: boutiquesError } = await supabase
        .from('boutiques')
        .select('*')
        .order('created_at', { ascending: false });

      if (boutiquesError) throw boutiquesError;

      // Fetch user counts per boutique
      const { data: profiles } = await supabase
        .from('profiles')
        .select('boutique_id');

      // Fetch sales counts per boutique
      const { data: sales } = await supabase
        .from('sales')
        .select('boutique_id');

      // Build boutiques with stats
      const boutiquesWithStats: BoutiqueWithStats[] = (boutiquesData || []).map(b => ({
        id: b.id,
        name: b.name,
        address: b.address || '',
        phone: b.phone || '',
        userCount: profiles?.filter(p => p.boutique_id === b.id).length || 0,
        salesCount: sales?.filter(s => s.boutique_id === b.id).length || 0,
      }));

      setBoutiques(boutiquesWithStats);
    } catch (error) {
      console.error('Error fetching boutiques:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les boutiques',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterBoutiques = () => {
    let filtered = [...boutiques];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        b =>
          b.name.toLowerCase().includes(term) ||
          b.address?.toLowerCase().includes(term) ||
          b.phone?.toLowerCase().includes(term)
      );
    }

    setFilteredBoutiques(filtered);
  };

  const handleOpenCreate = () => {
    setSelectedBoutique(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (boutique: BoutiqueWithStats) => {
    setSelectedBoutique(boutique);
    setFormData({
      name: boutique.name,
      address: boutique.address || '',
      phone: boutique.phone || '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (boutique: BoutiqueWithStats) => {
    setSelectedBoutique(boutique);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom de la boutique est obligatoire',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedBoutique) {
        // Update existing boutique
        const { error } = await supabase
          .from('boutiques')
          .update({
            name: formData.name.trim(),
            address: formData.address.trim() || null,
            phone: formData.phone.trim() || null,
          })
          .eq('id', selectedBoutique.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Boutique mise à jour avec succès',
        });
      } else {
        // Create new boutique
        const { error } = await supabase
          .from('boutiques')
          .insert({
            name: formData.name.trim(),
            address: formData.address.trim() || null,
            phone: formData.phone.trim() || null,
          });

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Boutique créée avec succès',
        });
      }

      setIsDialogOpen(false);
      setFormData(initialFormData);
      setSelectedBoutique(null);
      fetchBoutiques();
    } catch (error: any) {
      console.error('Error saving boutique:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBoutique) return;

    // Check if boutique has users
    if (selectedBoutique.userCount > 0) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer une boutique avec des utilisateurs assignés',
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('boutiques')
        .delete()
        .eq('id', selectedBoutique.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Boutique supprimée avec succès',
      });

      setIsDeleteDialogOpen(false);
      setSelectedBoutique(null);
      fetchBoutiques();
    } catch (error: any) {
      console.error('Error deleting boutique:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout title="Gestion des boutiques">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="boutique-search"
                  name="search"
                  placeholder="Rechercher une boutique..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleOpenCreate}>
                <Building2 className="mr-2 h-4 w-4" />
                Nouvelle boutique
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Boutiques Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBoutiques.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Aucune boutique trouvée
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBoutiques.map((boutique) => (
              <Card key={boutique.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                      {boutique.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(boutique)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDelete(boutique)}
                        disabled={boutique.userCount > 0}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {boutique.address && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{boutique.address}</span>
                      </div>
                    )}
                    {boutique.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{boutique.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{boutique.userCount}</span>
                      <span className="text-sm text-muted-foreground">utilisateurs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">{boutique.salesCount}</span>
                      <span className="text-sm text-muted-foreground">ventes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedBoutique ? 'Modifier la boutique' : 'Nouvelle boutique'}
            </DialogTitle>
            <DialogDescription>
              {selectedBoutique 
                ? 'Modifiez les informations de la boutique'
                : 'Créez une nouvelle boutique dans votre réseau'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom de la boutique"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adresse complète"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+237 XXX XXX XXX"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : selectedBoutique ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la boutique{' '}
              <strong>{selectedBoutique?.name}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
