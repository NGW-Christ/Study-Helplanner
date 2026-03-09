import { supabase } from './supabase';
import { User, Subject } from '@/src/types';

export const createUserProfile = async (user: User): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('users')
      .insert([
        {
          id: user.id,
          email: user.email,
          cycle: user.cycle,
          option: user.option,
          created_at: user.created_at,
        },
      ]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const getUserProfile = async (userId: string): Promise<{ user: User | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return { user: data, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};
