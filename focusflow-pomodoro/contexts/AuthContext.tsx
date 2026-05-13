import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { signIn as apiSignIn, signUp as apiSignUp, signOut as apiSignOut } from '@/lib/auth-api';
import { Profile, UserPreferences } from '@/types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  preferences: UserPreferences | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!error && data) setProfile(data);
  }, [user]);

  const refreshPreferences = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (!error && data) setPreferences(data);
  }, [user]);

  /**
   * Apply a Supabase session to React state.
   * Supabase handles JWT expiry and auto-refresh automatically.
   */
  const applySession = useCallback((newSession: Session | null) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);
  }, []);

  // Bootstrap: load the persisted session on mount, then subscribe to changes.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      applySession(initialSession);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      applySession(newSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [applySession]);

  // Load profile + preferences whenever the signed-in user changes.
  useEffect(() => {
    if (user) {
      refreshProfile();
      refreshPreferences();
    } else {
      setProfile(null);
      setPreferences(null);
    }
  }, [user, refreshProfile, refreshPreferences]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await apiSignIn(email, password);
    if (!error && data.session) {
      applySession(data.session);
    }
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await apiSignUp(email, password, displayName);
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // 1. Call the API module: revokes server-side, clears local Supabase state,
    //    and wipes storage. The API handles all the heavy lifting.
    await apiSignOut();

    // 2. Force-clear React state immediately so UI updates before any
    //    onAuthStateChange event fires.
    applySession(null);
    setProfile(null);
    setPreferences(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        preferences,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        refreshPreferences,
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
