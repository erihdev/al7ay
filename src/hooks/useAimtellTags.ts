import { useEffect, useRef } from 'react';

// Extend window type for Aimtell SDK
declare global {
  interface Window {
    _at?: {
      track?: (event: string, data: string[]) => void;
      trackEvent?: (event: string, data: any) => void;
    };
  }
}

/**
 * Hook to register Aimtell tags for targeted push notifications
 * Tags are used to send notifications to specific users (providers/customers)
 */
export function useAimtellTags(tags: string[]) {
  const registeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!tags || tags.length === 0) return;

    const registerTags = () => {
      // Check if Aimtell SDK is loaded
      if (typeof window._at?.track === 'function') {
        // Filter only new tags that haven't been registered
        const newTags = tags.filter(tag => !registeredRef.current.has(tag));
        
        if (newTags.length > 0) {
          try {
            window._at.track('addTags', newTags);
            newTags.forEach(tag => registeredRef.current.add(tag));
            console.log('Aimtell tags registered:', newTags);
          } catch (error) {
            console.error('Error registering Aimtell tags:', error);
          }
        }
      } else {
        // SDK not loaded yet, retry after a delay
        console.log('Aimtell SDK not ready, retrying...');
      }
    };

    // Try immediately
    registerTags();

    // Also retry after SDK might have loaded
    const retryTimeout = setTimeout(registerTags, 2000);
    const retryTimeout2 = setTimeout(registerTags, 5000);

    return () => {
      clearTimeout(retryTimeout);
      clearTimeout(retryTimeout2);
    };
  }, [tags]);
}

/**
 * Hook to register provider-specific Aimtell tag
 */
export function useProviderAimtellTag(providerId: string | undefined) {
  const tags = providerId ? [`provider:${providerId}`] : [];
  useAimtellTags(tags);
}

/**
 * Hook to register customer-specific Aimtell tag
 */
export function useCustomerAimtellTag(customerId: string | undefined) {
  const tags = customerId ? [`customer:${customerId}`] : [];
  useAimtellTags(tags);
}
