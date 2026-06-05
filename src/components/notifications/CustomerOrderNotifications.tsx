import { useProviderOrderStatusNotifications } from '@/hooks/useProviderOrderStatusNotifications';

/**
 * This component initializes real-time order status notifications for customers.
 * It must be rendered inside AuthProvider to access user context.
 * It doesn't render any UI - just sets up the realtime subscription.
 */
export function CustomerOrderNotifications() {
  // Initialize real-time order status notifications
  useProviderOrderStatusNotifications();

  // This component doesn't render anything visible
  return null;
}
