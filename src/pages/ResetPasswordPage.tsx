import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ArrowLeft, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const requestResetSchema = z.object({
  email: z.string().email('Email invalide'),
});

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type RequestResetFormData = z.infer<typeof requestResetSchema>;
type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  const requestForm = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: '' },
  });

  const updateForm = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  // Check if we're in password update mode (coming from email link)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check for recovery mode in URL hash or session
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      
      if (type === 'recovery' && accessToken) {
        setIsUpdateMode(true);
      } else if (session?.user) {
        // User is already logged in, they can update password
        const urlType = searchParams.get('type');
        if (urlType === 'recovery') {
          setIsUpdateMode(true);
        }
      }
    };
    
    checkSession();
  }, [searchParams]);

  const handleRequestReset = async (data: RequestResetFormData) => {
    setIsLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Email de réinitialisation envoyé !');
    } catch (error: any) {
      console.error('Error requesting reset:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (data: UpdatePasswordFormData) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;

      toast.success('Mot de passe mis à jour avec succès !');
      
      // Sign out and redirect to login
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/20 p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display text-2xl font-bold shadow-lg">
            N+
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            NICKOPLUS PRO
          </h1>
        </div>

        <Card className="shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              {isUpdateMode ? 'Nouveau mot de passe' : 'Mot de passe oublié'}
            </CardTitle>
            <CardDescription>
              {isUpdateMode 
                ? 'Créez un nouveau mot de passe pour votre compte'
                : 'Entrez votre email pour recevoir un lien de réinitialisation'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {emailSent ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Email envoyé !</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vérifiez votre boîte de réception et suivez le lien pour réinitialiser votre mot de passe.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à la connexion
                </Button>
              </div>
            ) : isUpdateMode ? (
              <form onSubmit={updateForm.handleSubmit(handleUpdatePassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...updateForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                      aria-label={showPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {updateForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {updateForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...updateForm.register('confirmPassword')}
                  />
                  {updateForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {updateForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="btn-touch w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    'Mettre à jour le mot de passe'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={requestForm.handleSubmit(handleRequestReset)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="votre@email.com"
                      className="pl-10"
                      {...requestForm.register('email')}
                    />
                  </div>
                  {requestForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {requestForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="btn-touch w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer le lien de réinitialisation'
                  )}
                </Button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-sm text-muted-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Retour à la connexion
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2024 NICKOPLUS PRO - Tous droits réservés
        </p>
      </div>
    </main>
  );
}
