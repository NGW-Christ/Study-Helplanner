import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { onAuthStateChange } from '../services/auth';
import { ProfileService, UserProfile } from '../services/profile';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  cycle: 'O_LEVEL' | 'A_LEVEL';
  option: 'SCIENCE' | 'ARTS';
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        await onAuthStateChange((authUser) => {
          if (!mounted) return;

          if (authUser) {
            // Fetch user profile from Supabase
            ProfileService.getProfile().then((profile) => {
              if (mounted) {
                if (profile) {
                  setUser({
                    id: profile.id,
                    email: profile.email,
                    full_name: profile.full_name,
                    cycle: profile.cycle,
                    option: profile.option,
                  });
                } else {
                  // Profile doesn't exist, create basic user object
                  setUser({
                    id: authUser.id,
                    email: authUser.email!,
                    cycle: 'O_LEVEL', // Default values
                    option: 'SCIENCE',
                  });
                }
                setLoading(false);
              }
            });
          } else {
            if (mounted) {
              setUser(null);
              setLoading(false);
            }
          }
        });

        return () => {
          mounted = false;
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, []);

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      const updatedProfile = await ProfileService.updateProfile(updates);
      if (updatedProfile && user) {
        setUser({
          ...user,
          ...updates,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  };

  return {
    user,
    loading,
    updateUserProfile,
  };
};
