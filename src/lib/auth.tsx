import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  auth_id: string | null;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
}

export interface OutletContext {
  user: AppUser | null;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { full_name?: string }) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppUser = useCallback(async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle();

      if (data) {
        setUser(data as AppUser);
        return;
      }

      if (error && error.code !== 'PGRST116') {
        console.error('[Vested] Error fetching user profile:', error.message);
      }

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          auth_id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || null,
          role: 'user' as const,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          const { data: existing } = await supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email!)
            .maybeSingle();
          if (existing) {
            setUser(existing as AppUser);
            return;
          }
        }
        console.error('[Vested] Failed to create user profile:', insertError.message);
        return;
      }

      if (newUser) {
        await supabase.from('user_balances').insert({
          user_email: newUser.email,
          balance_usd: 0,
          total_invested: 0,
          total_profit_loss: 0,
        });
        setUser(newUser as AppUser);
      }
    } catch (err) {
      console.error('[Vested] Failed to fetch user profile:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(session);
        if (session?.user) {
          await fetchAppUser(session.user);
        }
      } catch (err) {
        console.error('[Vested] Auth initialization failed:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      setSession(session);

      if (session?.user) {
        await fetchAppUser(session.user);
      } else {
        setUser(null);
      }

      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchAppUser]);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchAppUser(session.user);
    }
  }, [fetchAppUser]);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: redirectUrl,
        },
      });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
  };

  const updateProfile = async (data: { full_name?: string }) => {
    if (!user) return { error: new Error('Not authenticated') };
    try {
      const { error } = await supabase
        .from('users')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (!error) {
        setUser(prev => prev ? { ...prev, ...data } : null);
      }
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signUp, signIn, signOut, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
