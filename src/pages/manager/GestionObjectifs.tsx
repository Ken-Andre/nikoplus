import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Target, Plus, Edit, Loader2, TrendingUp, Users, Store } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  boutiqueId?: string;
}

interface ObjectiveWithProgress {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  month: number;
  year: number;
  boutiqueId: string;
  boutiqueName?: string;
}

interface Boutique {
  id: string;
  name: string;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function GestionObjectifs() {
  const { user, boutiques } = useAuth();
  const [objectives, setObjectives] = useState<ObjectiveWithProgress[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<ObjectiveWithProgress | null>(null);
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState<string>(user?.boutiqueId || '');
  
  const [formData, setFormData] = useState({
    sellerId: '',
    targetAmount: '',
  });

  const isAdmin = user?.role === 'admin';
  const [boutiquesLoaded, setBoutiquesLoaded] = useState(false);

  // Set default boutique when boutiques are loaded
  useEffect(() => {
    if (boutiques.length > 0 && !boutiquesLoaded) {
      setBoutiquesLoaded(true);
      if (isAdmin && !selectedBoutiqueId) {
        setSelectedBoutiqueId(boutiques[0].id);
      } else if (!isAdmin && user?.boutiqueId && !selectedBoutiqueId) {
        setSelectedBoutiqueId(user.boutiqueId);
      }
    }
  }, [isAdmin, boutiques, user?.boutiqueId, selectedBoutiqueId, boutiquesLoaded]);

  useEffect(() => {
    if (selectedBoutiqueId) {
      fetchData();
    }
  }, [selectedBoutiqueId, selectedMonth, selectedYear]);

  const fetchData = async () => {
    if (!selectedBoutiqueId) return;
    setIsLoading(true);

    try {
      // Fetch sellers from this boutique
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, boutique_id')
        .eq('boutique_id', selectedBoutiqueId);

      if (profilesError) throw profilesError;

      // Filter to get only sellers
      const sellersList: Seller[] = [];
      for (const profile of profiles || []) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (roleData?.role === 'seller') {
          sellersList.push({
            id: profile.id,
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            email: profile.email || '',
            boutiqueId: profile.boutique_id || undefined,
          });
        }
      }
      setSellers(sellersList);

      // Fetch objectives for selected month/year
      const { data: objectivesData, error: objectivesError } = await supabase
        .from('sales_objectives')
        .select('*, boutiques(name)')
        .eq('boutique_id', selectedBoutiqueId)
        .eq('month', selectedMonth)
        .eq('year', selectedYear);

      if (objectivesError) throw objectivesError;

      // Calculate progress for each objective
      const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
      const monthEnd = endOfMonth(monthStart);

      const objectivesWithProgress: ObjectiveWithProgress[] = [];

      for (const obj of objectivesData || []) {
        const seller = sellersList.find(s => s.id === obj.seller_id);
        
        // Fetch sales for this seller in the month
        const { data: sales } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('seller_id', obj.seller_id)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        const currentAmount = sales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
        const target = Number(obj.target_amount);
        const progressPercent = target > 0 ? Math.min((currentAmount / target) * 100, 100) : 0;

        objectivesWithProgress.push({
          id: obj.id,
          sellerId: obj.seller_id,
          sellerName: seller ? `${seller.firstName} ${seller.lastName}`.trim() || 'Sans nom' : 'Vendeur inconnu',
          sellerEmail: seller?.email || '',
          targetAmount: target,
          currentAmount,
          progressPercent,
          month: obj.month,
          year: obj.year,
          boutiqueId: obj.boutique_id,
          boutiqueName: (obj as any).boutiques?.name,
        });
      }

      setObjectives(objectivesWithProgress);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.sellerId || !formData.targetAmount) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const targetAmount = parseFloat(formData.targetAmount);
      if (isNaN(targetAmount) || targetAmount <= 0) {
        toast.error('Le montant doit être un nombre positif');
        return;
      }

      if (editingObjective) {
        // Update existing
        const { error } = await supabase
          .from('sales_objectives')
          .update({ target_amount: targetAmount })
          .eq('id', editingObjective.id);

        if (error) throw error;
        toast.success('Objectif mis à jour');
      } else {
        // Create new
        const { error } = await supabase
          .from('sales_objectives')
          .insert({
            seller_id: formData.sellerId,
            boutique_id: selectedBoutiqueId,
            month: selectedMonth,
            year: selectedYear,
            target_amount: targetAmount,
            created_by: user?.id,
          });

        if (error) {
          if (error.code === '23505') {
            toast.error('Un objectif existe déjà pour ce vendeur ce mois');
            return;
          }
          throw error;
        }
        toast.success('Objectif créé');
      }

      setIsDialogOpen(false);
      setEditingObjective(null);
      setFormData({ sellerId: '', targetAmount: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving objective:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const openEditDialog = (objective: ObjectiveWithProgress) => {
    setEditingObjective(objective);
    setFormData({
      sellerId: objective.sellerId,
      targetAmount: objective.targetAmount.toString(),
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingObjective(null);
    setFormData({ sellerId: '', targetAmount: '' });
    setIsDialogOpen(true);
  };

  // Get sellers without objectives
  const sellersWithoutObjective = sellers.filter(
    seller => !objectives.some(obj => obj.sellerId === seller.id)
  );

  // Summary stats
  const totalTarget = objectives.reduce((sum, obj) => sum + obj.targetAmount, 0);
  const totalCurrent = objectives.reduce((sum, obj) => sum + obj.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return (
    <AppLayout title="Gestion des Objectifs">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Objectifs de Vente
            </h2>
            <p className="text-muted-foreground">
              Définissez et suivez les objectifs mensuels des vendeurs
            </p>
          </div>
          <Button onClick={openCreateDialog} disabled={sellersWithoutObjective.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel Objectif
          </Button>
        </div>

        {/* Period & Boutique Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Boutique selector for admin */}
              {isAdmin && boutiques.length > 0 && (
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <Label>Boutique :</Label>
                  <Select value={selectedBoutiqueId} onValueChange={setSelectedBoutiqueId}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {boutiques.map((boutique) => (
                        <SelectItem key={boutique.id} value={boutique.id}>
                          {boutique.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Label>Mois :</Label>
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label>Année :</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Vendeurs avec objectif
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{objectives.length}</p>
              <p className="text-sm text-muted-foreground">sur {sellers.length} vendeurs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Objectif total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {totalTarget.toLocaleString('fr-FR')} <span className="text-lg font-normal">XAF</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Progression globale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-success">
                {overallProgress.toFixed(1)}%
              </p>
              <Progress 
                value={overallProgress} 
                className="mt-2 h-2"
                indicatorClassName={overallProgress >= 100 ? 'bg-success' : 'bg-primary'}
              />
            </CardContent>
          </Card>
        </div>

        {/* Objectives Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Objectifs - {MONTHS[selectedMonth - 1]} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : objectives.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Aucun objectif défini pour cette période</p>
                <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                  Créer un objectif
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendeur</TableHead>
                    <TableHead className="text-right">Objectif</TableHead>
                    <TableHead className="text-right">Réalisé</TableHead>
                    <TableHead className="w-[200px]">Progression</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {objectives.map((obj) => (
                    <TableRow key={obj.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{obj.sellerName}</p>
                          <p className="text-sm text-muted-foreground">{obj.sellerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {obj.targetAmount.toLocaleString('fr-FR')} XAF
                      </TableCell>
                      <TableCell className="text-right">
                        {obj.currentAmount.toLocaleString('fr-FR')} XAF
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress 
                            value={obj.progressPercent} 
                            className="h-2"
                            indicatorClassName={
                              obj.progressPercent >= 100 
                                ? 'bg-success' 
                                : obj.progressPercent >= 75 
                                  ? 'bg-primary' 
                                  : obj.progressPercent >= 50 
                                    ? 'bg-warning' 
                                    : 'bg-destructive'
                            }
                          />
                          <div className="flex justify-between text-xs">
                            <span>{obj.progressPercent.toFixed(1)}%</span>
                            <Badge variant={
                              obj.progressPercent >= 100 
                                ? 'default' 
                                : obj.progressPercent >= 75 
                                  ? 'secondary' 
                                  : 'outline'
                            }>
                              {obj.progressPercent >= 100 ? 'Atteint ✓' : 'En cours'}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(obj)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingObjective ? 'Modifier l\'objectif' : 'Nouvel objectif'}
            </DialogTitle>
            <DialogDescription>
              {editingObjective 
                ? 'Modifiez le montant de l\'objectif de vente mensuel'
                : 'Définissez un nouvel objectif de vente pour un vendeur'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Vendeur</Label>
              {editingObjective ? (
                <Input value={editingObjective.sellerName} disabled />
              ) : (
                <Select value={formData.sellerId} onValueChange={(v) => setFormData({ ...formData, sellerId: v })}>
                  <SelectTrigger id="objective-seller-select">
                    <SelectValue placeholder="Sélectionner un vendeur" />
                  </SelectTrigger>
                  <SelectContent>
                    {sellersWithoutObjective.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {`${seller.firstName} ${seller.lastName}`.trim() || seller.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Objectif mensuel (XAF)</Label>
              <Input
                id="objective-target-amount"
                name="targetAmount"
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="Ex: 500000"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Période : {MONTHS[selectedMonth - 1]} {selectedYear}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              {editingObjective ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
