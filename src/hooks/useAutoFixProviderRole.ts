import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to automatically fix missing service_provider role
 * when a user has a service_providers profile but no role
 */
export function useAutoFixProviderRole() {
  const { user } = useAuth();
  const [isFixing, setIsFixing] = useState(false);
  const [hasRole, setHasRole] = useState<boolean | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [checkComplete, setCheckComplete] = useState(false);

  const checkAndFixRole = useCallback(async () => {
    if (!user) {
      setIsChecking(false);
      setHasRole(false);
      setHasProfile(false);
      setCheckComplete(true);
      return;
    }

    setIsChecking(true);
    setCheckComplete(false);

    try {
      // Check if user has service_provider or admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['service_provider', 'admin'])
        .maybeSingle();

      if (roleError) {
        console.error('Error checking role:', roleError);
      }

      const userHasRole = !!roleData;
      
      // Check if user has a service_providers profile
      const { data: providerData, error: providerError } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (providerError) {
        console.error('Error checking provider:', providerError);
      }

      const userHasProfile = !!providerData;
      setHasProfile(userHasProfile);

      // If user has a profile but no role, auto-fix it
      if (userHasProfile && !userHasRole) {
        console.log('Auto-fixing missing service_provider role for user:', user.id);
        setIsFixing(true);

        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'service_provider'
          });

        if (insertError) {
          // Check if it's a duplicate error (role already exists)
          if (insertError.code === '23505') {
            console.log('Role already exists, updating state');
            setHasRole(true);
          } else {
            console.error('Error auto-fixing role:', insertError);
            // Still set hasRole based on profile existence for graceful handling
            setHasRole(false);
          }
        } else {
          console.log('Successfully auto-fixed service_provider role');
          setHasRole(true);
        }

        setIsFixing(false);
      } else {
        setHasRole(userHasRole);
      }
    } catch (error) {
      console.error('Error in useAutoFixProviderRole:', error);
      setHasRole(false);
    } finally {
      setIsChecking(false);
      setIsFixing(false);
      setCheckComplete(true);
    }
  }, [user]);

  useEffect(() => {
    checkAndFixRole();
  }, [checkAndFixRole]);

  return {
    hasRole,
    hasProfile,
    isChecking,
    isFixing,
    isLoading: isChecking || isFixing,
    checkComplete,
    refetch: checkAndFixRole,
  };
}
