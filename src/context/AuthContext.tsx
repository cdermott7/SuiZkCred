'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabaseClient';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const setData = async () => {
      // Check if we should skip authentication (demo mode)
      const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === 'true';
      
      if (skipAuth) {
        console.log('Demo mode: Using fake authentication');
        // Create a fake user for demo mode
        const fakeUser = {
          id: 'demo-user-id',
          email: 'demo@example.com',
          user_metadata: {
            full_name: 'Demo User'
          }
        } as User;
        
        const fakeSession = {
          user: fakeUser,
          access_token: 'fake-token',
          refresh_token: 'fake-refresh-token',
          expires_at: Date.now() + 3600000
        } as Session;
        
        setSession(fakeSession);
        setUser(fakeUser);
        setIsLoading(false);
        return;
      }
      
      // Normal authentication flow
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error(error);
          setIsLoading(false);
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      } catch (error) {
        console.error('Error getting session:', error);
        setIsLoading(false);
      }
    };

    // Setup auth state change listener (only if not in demo mode)
    let subscription: { unsubscribe: () => void } | null = null;
    
    if (process.env.NEXT_PUBLIC_SKIP_AUTH !== 'true') {
      try {
        const response = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        });
        subscription = response.data.subscription;
      } catch (error) {
        console.error('Error setting up auth state change listener:', error);
      }
    }

    setData();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Check if we should skip authentication (demo mode)
    if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
      console.log('Demo mode: Simulating login with', email);
      // Create a fake user for demo mode
      const fakeUser = {
        id: 'demo-user-id',
        email: email,
        user_metadata: {
          full_name: 'Demo User'
        }
      } as User;
      
      const fakeSession = {
        user: fakeUser,
        access_token: 'fake-token',
        refresh_token: 'fake-refresh-token',
        expires_at: Date.now() + 3600000
      } as Session;
      
      setSession(fakeSession);
      setUser(fakeUser);
      router.push('/dashboard');
      return;
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      }
    });
    if (error) {
      throw error;
    }
    router.push('/dashboard');
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    router.push('/login');
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}