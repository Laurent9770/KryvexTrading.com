import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  country?: string;
  avatar_url?: string;
  account_balance?: number;
  kyc_status?: 'unverified' | 'pending' | 'approved' | 'rejected';
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useUserProfile = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);

      try {
        // Get authenticated user
        const { data: authUser, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser?.user) {
          console.error('Auth error:', authError);
          setLoading(false);
          return;
        }

        setUser(authUser.user);

        // Get user profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authUser.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          // Don't return here, just log the error
        }

        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return { user, profile, loading };
};
