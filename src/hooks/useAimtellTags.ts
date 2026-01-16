import { useEffect, useRef } from 'react';

// Extend window type for Aimtell SDK
declare global {
  interface Window {
    _at?: {
      track?: (event: string, data: any) => void;
      trackEvent?: (event: string, data: any) => void;
      push?: (args: any[]) => void;
    };
    _aimtellPushQueue?: any[];
  }
}

/**
 * Hook to register Aimtell attributes for targeted push notifications
 * Attributes are used to target specific users (providers/customers) via the Aimtell API
 */
export function useAimtellAttributes(attributes: Record<string, string>) {
  const registeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!attributes || Object.keys(attributes).length === 0) return;

    const registerAttributes = () => {
      // Check if Aimtell SDK is loaded
      if (typeof window._at?.track === 'function') {
        // Filter only new attributes that haven't been registered
        const newAttributes: Record<string, string> = {};
        let hasNew = false;
        
        for (const [key, value] of Object.entries(attributes)) {
          const attrKey = `${key}:${value}`;
          if (!registeredRef.current.has(attrKey)) {
            newAttributes[key] = value;
            hasNew = true;
          }
        }
        
        if (hasNew) {
          try {
            // Register attributes using Aimtell SDK
            window._at.track('attribute', newAttributes);
            
            // Also set alias for unique identification
            for (const [key, value] of Object.entries(newAttributes)) {
              registeredRef.current.add(`${key}:${value}`);
            }
            
            console.log('Aimtell attributes registered:', newAttributes);
          } catch (error) {
            console.error('Error registering Aimtell attributes:', error);
          }
        }
      } else {
        // SDK not loaded yet, retry after a delay
        console.log('Aimtell SDK not ready, will retry...');
      }
    };

    // Try immediately
    registerAttributes();

    // Also retry after SDK might have loaded - multiple times to ensure registration
    const retryTimeout1 = setTimeout(registerAttributes, 1000);
    const retryTimeout2 = setTimeout(registerAttributes, 2500);
    const retryTimeout3 = setTimeout(registerAttributes, 5000);
    const retryTimeout4 = setTimeout(registerAttributes, 10000);

    return () => {
      clearTimeout(retryTimeout1);
      clearTimeout(retryTimeout2);
      clearTimeout(retryTimeout3);
      clearTimeout(retryTimeout4);
    };
  }, [attributes]);
}

/**
 * Hook to register Aimtell tags for targeted push notifications (legacy support)
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
            // Convert tags to attributes format for Aimtell
            // e.g., "provider:abc123" becomes { provider_id: "abc123" }
            const attributes: Record<string, string> = {};
            newTags.forEach(tag => {
              const [type, id] = tag.split(':');
              if (type && id) {
                attributes[`${type}_id`] = id;
              }
            });
            
            if (Object.keys(attributes).length > 0) {
              window._at.track('attribute', attributes);
            }
            
            newTags.forEach(tag => registeredRef.current.add(tag));
            console.log('Aimtell tags registered as attributes:', attributes);
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
    const retryTimeout1 = setTimeout(registerTags, 1000);
    const retryTimeout2 = setTimeout(registerTags, 2500);
    const retryTimeout3 = setTimeout(registerTags, 5000);
    const retryTimeout4 = setTimeout(registerTags, 10000);

    return () => {
      clearTimeout(retryTimeout1);
      clearTimeout(retryTimeout2);
      clearTimeout(retryTimeout3);
      clearTimeout(retryTimeout4);
    };
  }, [tags]);
}

/**
 * Hook to register provider-specific Aimtell attribute
 */
export function useProviderAimtellTag(providerId: string | undefined) {
  useAimtellAttributes(providerId ? { provider_id: providerId } : {});
}

/**
 * Hook to register customer-specific Aimtell attribute
 */
export function useCustomerAimtellTag(customerId: string | undefined) {
  useAimtellAttributes(customerId ? { customer_id: customerId } : {});
}
