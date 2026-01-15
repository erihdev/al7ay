import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const CURRENT_APP_VERSION = '1.1.0';

interface AppVersion {
  id: string;
  version: string;
  release_notes: string | null;
  is_current: boolean;
  created_at: string;
}

export function useAppVersion() {
  const { user } = useAuth();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState<AppVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const checkVersion = async () => {
      try {
        // Get the current app version from database
        const { data: versionData, error: versionError } = await supabase
          .from('app_versions')
          .select('*')
          .eq('is_current', true)
          .single();

        if (versionError || !versionData) {
          setIsLoading(false);
          return;
        }

        setLatestVersion(versionData);

        // Check user's last seen version
        const { data: userVersionData, error: userVersionError } = await supabase
          .from('user_app_versions')
          .select('last_seen_version')
          .eq('user_id', user.id)
          .maybeSingle();

        if (userVersionError) {
          console.error('Error checking user version:', userVersionError);
          setIsLoading(false);
          return;
        }

        // If user hasn't seen any version or has seen an older version
        if (!userVersionData || userVersionData.last_seen_version !== versionData.version) {
          setHasUpdate(true);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error in version check:', error);
        setIsLoading(false);
      }
    };

    checkVersion();
  }, [user]);

  const dismissUpdate = async () => {
    if (!user || !latestVersion) return;

    try {
      // Check if record exists
      const { data: existingRecord } = await supabase
        .from('user_app_versions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingRecord) {
        // Update existing record
        await supabase
          .from('user_app_versions')
          .update({ 
            last_seen_version: latestVersion.version,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Insert new record
        await supabase
          .from('user_app_versions')
          .insert({
            user_id: user.id,
            last_seen_version: latestVersion.version
          });
      }

      setHasUpdate(false);
    } catch (error) {
      console.error('Error dismissing update:', error);
    }
  };

  const refreshApp = () => {
    dismissUpdate();
    window.location.reload();
  };

  return {
    hasUpdate,
    latestVersion,
    isLoading,
    dismissUpdate,
    refreshApp,
    currentVersion: CURRENT_APP_VERSION
  };
}
