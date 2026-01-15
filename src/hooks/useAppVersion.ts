import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const CURRENT_APP_VERSION = 'v2.7.4';

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
    if (!user || !latestVersion) {
      // Still hide the notification even if we can't save
      setHasUpdate(false);
      return;
    }

    try {
      // Check if record exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('user_app_versions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing version record:', checkError);
        // Still hide the notification even if DB fails
        setHasUpdate(false);
        return;
      }

      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_app_versions')
          .update({ 
            last_seen_version: latestVersion.version,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('Error updating version record:', updateError);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('user_app_versions')
          .insert({
            user_id: user.id,
            last_seen_version: latestVersion.version
          });
        
        if (insertError) {
          console.error('Error inserting version record:', insertError);
        }
      }

      setHasUpdate(false);
    } catch (error) {
      console.error('Error dismissing update:', error);
      // Still hide the notification even on error
      setHasUpdate(false);
    }
  };

  const refreshApp = async () => {
    await dismissUpdate();
    // Clear cache and force reload
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      } catch (e) {
        console.error('Failed to clear cache:', e);
      }
    }
    // Force hard reload to get latest version
    window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
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
