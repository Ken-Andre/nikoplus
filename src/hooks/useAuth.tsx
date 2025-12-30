import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { User, AppRole, Boutique } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  boutiques: Boutique[];
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);

  const fetchUserData = async (supabaseUser: SupabaseUser) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, boutiques(id, name)')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      // Fetch roles - get all roles for the user
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id);

      // Check if user is approved (admins are always approved)
      const isApproved = profile?.is_approved ?? false;
      const isAdmin = rolesData?.some(r => r.role === 'admin') ?? false;

      // If user is not approved and not an admin, don't allow login
      if (!isApproved && !isAdmin) {
        console.log('User not approved, signing out');
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      // Determine highest role (admin > manager > seller)
      const rolePriority: Record<string, number> = { admin: 3, manager: 2, seller: 1 };
      const highestRole = rolesData?.reduce((highest, current) => {
        const currentPriority = rolePriority[current.role as string] || 0;
        const highestPriority = rolePriority[highest as string] || 0;
        return currentPriority > highestPriority ? (current.role as AppRole) : highest;
      }, 'seller' as AppRole) || 'seller';

      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        role: highestRole,
        boutiqueId: profile?.boutique_id || undefined,
        boutiqueName: profile?.boutiques?.name || undefined,
        avatarUrl: profile?.avatar_url || undefined,
      };

      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchBoutiques = async () => {
    const { data } = await supabase
      .from('boutiques')
      .select('id, name, address, phone');
    
    if (data) {
      setBoutiques(data);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer Supabase calls
          setTimeout(() => {
            fetchUserData(session.user);
            fetchBoutiques();
          }, 0);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user);
        fetchBoutiques();
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        avatar_url: data.avatarUrl,
        boutique_id: data.boutiqueId,
      })
      .eq('id', user.id);

    if (!error) {
      setUser({ ...user, ...data });
    }

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        boutiques,
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
