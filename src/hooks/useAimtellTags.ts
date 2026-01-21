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

// Smart retry intervals with exponential backoff
const RETRY_INTERVALS = [500, 1500, 4000, 10000];

/**
 * Hook to register Aimtell attributes AND aliases for targeted push notifications
 * Uses smart retry with exponential backoff instead of fixed intervals
 */
export function useAimtellAttributes(attributes: Record<string, string>) {
  const registeredRef = useRef<Set<string>>(new Set());
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (!attributes || Object.keys(attributes).length === 0) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isUnmounted = false;

    const registerAttributes = () => {
      if (isUnmounted) return;

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
            
            // Register alias using "user" field as per Aimtell documentation
            for (const [key, value] of Object.entries(newAttributes)) {
              window._at.track('alias', { user: value });
              registeredRef.current.add(`${key}:${value}`);
            }
            // Success - reset retry count
            retryCountRef.current = 0;
            return;
          } catch {
            // Silent fail - SDK may not be ready
          }
        } else {
          // All attributes already registered
          return;
        }
      }

      // Schedule retry with exponential backoff
      if (retryCountRef.current < RETRY_INTERVALS.length) {
        const delay = RETRY_INTERVALS[retryCountRef.current];
        retryCountRef.current++;
        timeoutId = setTimeout(registerAttributes, delay);
      }
    };

    // Try immediately
    registerAttributes();

    return () => {
      isUnmounted = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [attributes]);
}

/**
 * Hook to register Aimtell tags for targeted push notifications (legacy support)
 */
export function useAimtellTags(tags: string[]) {
  const registeredRef = useRef<Set<string>>(new Set());
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (!tags || tags.length === 0) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isUnmounted = false;

    const registerTags = () => {
      if (isUnmounted) return;

      if (typeof window._at?.track === 'function') {
        const newTags = tags.filter(tag => !registeredRef.current.has(tag));
        
        if (newTags.length > 0) {
          try {
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
            retryCountRef.current = 0;
            return;
          } catch {
            // Silent fail
          }
        } else {
          return;
        }
      }

      // Retry with backoff
      if (retryCountRef.current < RETRY_INTERVALS.length) {
        const delay = RETRY_INTERVALS[retryCountRef.current];
        retryCountRef.current++;
        timeoutId = setTimeout(registerTags, delay);
      }
    };

    registerTags();

    return () => {
      isUnmounted = true;
      if (timeoutId) clearTimeout(timeoutId);
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
