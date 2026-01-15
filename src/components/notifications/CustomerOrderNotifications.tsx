import { useProviderOrderStatusNotifications } from '@/hooks/useProviderOrderStatusNotifications';
import { useAuth } from '@/contexts/AuthContext';

/**
 * This component initializes real-time order status notifications for customers.
 * It must be rendered inside AuthProvider to access user context.
 * It doesn't render any UI - just sets up the realtime subscription.
 */
export function CustomerOrderNotifications() {
  const { user } = useAuth();
  
  // Only initialize notifications if user is logged in
  useProviderOrderStatusNotifications();

  // This component doesn't render anything visible
  return null;
}
