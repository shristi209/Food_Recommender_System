import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';
import { User } from '@/app/types';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    async function loadProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }

    loadProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(data);
    return data;
  };

  return {
    profile,
    loading,
    updateProfile,
  };
}