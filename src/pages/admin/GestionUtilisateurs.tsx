import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Store,
  Shield,
} from 'lucide-react';
import type { AppRole, Boutique } from '@/types';

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  boutique_id: string | null;
  boutiques: { name: string } | null;
  role: AppRole;
}

interface UserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: AppRole;
  boutiqueId: string;
}

const initialFormData: UserFormData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: 'seller',
  boutiqueId: '',
};

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrateur',
  manager: 'Manager',
  seller: 'Vendeur',
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  seller: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
};

export default function GestionUtilisateurs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, boutiques } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
    
    // Open create dialog if action=create in URL
    if (searchParams.get('action') === 'create') {
      setIsDialogOpen(true);
    }
  }, [user, navigate, searchParams]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      // Fetch profiles with boutique info
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*, boutiques(name)')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const usersWithRoles: UserProfile[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        boutique_id: profile.boutique_id,
        boutiques: profile.boutiques,
        role: (roles?.find(r => r.user_id === profile.id)?.role as AppRole) || 'seller',
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les utilisateurs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.email?.toLowerCase().includes(term) ||
          u.first_name?.toLowerCase().includes(term) ||
          u.last_name?.toLowerCase().includes(term) ||
          u.phone?.toLowerCase().includes(term)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (userToEdit: UserProfile) => {
    setSelectedUser(userToEdit);
    setFormData({
      email: userToEdit.email,
      password: '',
      firstName: userToEdit.first_name || '',
      lastName: userToEdit.last_name || '',
      phone: userToEdit.phone || '',
      role: userToEdit.role,
      boutiqueId: userToEdit.boutique_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (userToDelete: UserProfile) => {
    setSelectedUser(userToDelete);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.email) {
      toast({
        title: 'Erreur',
        description: 'L\'email est obligatoire',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedUser) {
        // Update existing user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            boutique_id: formData.boutiqueId && formData.boutiqueId !== 'none' ? formData.boutiqueId : null,
          })
          .eq('id', selectedUser.id);

        if (profileError) throw profileError;

        // Update role if changed
        if (formData.role !== selectedUser.role) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ role: formData.role })
            .eq('user_id', selectedUser.id);

          if (roleError) throw roleError;
        }

        toast({
          title: 'Succès',
          description: 'Utilisateur mis à jour avec succès',
        });
      } else {
        // Create new user via Supabase Auth
        if (!formData.password || formData.password.length < 6) {
          toast({
            title: 'Erreur',
            description: 'Le mot de passe doit contenir au moins 6 caractères',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
            },
          },
        });

        if (authError) throw authError;

        if (authData.user) {
          // Update profile with additional data
          await supabase
            .from('profiles')
            .update({
              phone: formData.phone,
              boutique_id: formData.boutiqueId && formData.boutiqueId !== 'none' ? formData.boutiqueId : null,
            })
            .eq('id', authData.user.id);

          // Update role if not seller (default)
          if (formData.role !== 'seller') {
            await supabase
              .from('user_roles')
              .update({ role: formData.role })
              .eq('user_id', authData.user.id);
          }
        }

        toast({
          title: 'Succès',
          description: 'Utilisateur créé avec succès',
        });
      }

      setIsDialogOpen(false);
      setFormData(initialFormData);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
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
    if (!selectedUser) return;

    // Prevent deleting yourself
    if (selectedUser.id === user?.id) {
      toast({
        title: 'Erreur',
        description: 'Vous ne pouvez pas supprimer votre propre compte',
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      // Delete user role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id);

      // Delete profile (cascade will handle the rest)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Utilisateur supprimé avec succès',
      });

      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout title="Gestion des utilisateurs">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1 md:max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="user-search"
                    name="search"
                    autoComplete="off"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger id="user-role-filter" className="w-40">
                    <SelectValue placeholder="Filtrer par rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="seller">Vendeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleOpenCreate}>
                <UserPlus className="mr-2 h-4 w-4" />
                Nouvel utilisateur
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Utilisateurs ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Boutique</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.first_name || u.last_name
                            ? `${u.first_name || ''} ${u.last_name || ''}`.trim()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {u.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {u.phone}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {u.boutiques?.name ? (
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-muted-foreground" />
                              {u.boutiques.name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Non assigné</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={roleColors[u.role]}>
                            <Shield className="mr-1 h-3 w-3" />
                            {roleLabels[u.role]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => handleOpenEdit(u)}
                              aria-label={`Modifier ${u.first_name || ''} ${u.last_name || u.email}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => handleOpenDelete(u)}
                              disabled={u.id === user?.id}
                              aria-label={`Supprimer ${u.first_name || ''} ${u.last_name || u.email}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filteredUsers.map((u) => (
                    <Card key={u.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {u.first_name || u.last_name
                                ? `${u.first_name || ''} ${u.last_name || ''}`.trim()
                                : '-'}
                            </p>
                            <Badge className={`${roleColors[u.role]} shrink-0`}>
                              <Shield className="mr-1 h-3 w-3" />
                              {roleLabels[u.role]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </div>
                          {u.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{u.phone}</span>
                            </div>
                          )}
                          {u.boutiques?.name && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Store className="h-3 w-3 shrink-0" />
                              <span>{u.boutiques.name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => handleOpenEdit(u)}
                            aria-label={`Modifier ${u.first_name || ''} ${u.last_name || u.email}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => handleOpenDelete(u)}
                            disabled={u.id === user?.id}
                            aria-label={`Supprimer ${u.first_name || ''} ${u.last_name || u.email}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jean.dupont@example.com"
                disabled={!!selectedUser}
              />
            </div>
            {!selectedUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+237 6XX XXX XXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: AppRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">Vendeur</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="boutique">Boutique</Label>
              <Select
                value={formData.boutiqueId}
                onValueChange={(value) => setFormData({ ...formData, boutiqueId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une boutique" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune boutique</SelectItem>
                  {boutiques.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : selectedUser ? 'Modifier' : 'Créer'}
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
              Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
              <strong>
                {selectedUser?.first_name} {selectedUser?.last_name}
              </strong>{' '}
              ({selectedUser?.email}) ? Cette action est irréversible.
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
