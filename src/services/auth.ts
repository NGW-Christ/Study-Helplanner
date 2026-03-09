import { supabase } from './supabase';
import { User } from '@/src/types';

export interface AuthResponse {
  user: User | null;
  error: Error | null;
}

export const signUp = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    const user: User | null = data.user ? {
      id: data.user.id,
      email: data.user.email!,
      cycle: 'O_LEVEL', // Default values, will be updated during onboarding
      option: 'SCIENCE',
      created_at: data.user.created_at,
    } : null;

    return { user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const user: User | null = data.user ? {
      id: data.user.id,
      email: data.user.email!,
      cycle: 'O_LEVEL', // Will be loaded from user metadata
      option: 'SCIENCE',
      created_at: data.user.created_at,
    } : null;

    return { user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

export const signOut = async (): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;

    const userData: User | null = user ? {
      id: user.id,
      email: user.email!,
      cycle: user.user_metadata?.cycle || 'O_LEVEL',
      option: user.user_metadata?.option || 'SCIENCE',
      created_at: user.created_at,
    } : null;

    return { user: userData, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

export const updateUserProfile = async (cycle: 'O_LEVEL' | 'A_LEVEL', option: 'SCIENCE' | 'ARTS'): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        cycle,
        option,
      },
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        cycle: session.user.user_metadata?.cycle || 'O_LEVEL',
        option: session.user.user_metadata?.option || 'SCIENCE',
        created_at: session.user.created_at,
      };
      callback(user);
    } else {
      callback(null);
    }
  });
};
