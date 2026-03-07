import { useEffect, useCallback, useRef } from 'react';
import { useCart } from '@/hooks/useCart';
import { useLocalNotifications } from './useLocalNotifications';

const CART_REMINDER_KEY = 'cart_last_activity';
const CART_REMINDER_SENT_KEY = 'cart_reminder_sent';
const REMINDER_DELAY_MS = 60 * 60 * 1000; // 1 hour

export function useCartReminder(itemCount: number) {
  const { notifyCartReminder, permission } = useLocalNotifications();
  const reminderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update last activity when cart changes
  const updateLastActivity = useCallback(() => {
    if (itemCount > 0) {
      localStorage.setItem(CART_REMINDER_KEY, Date.now().toString());
      localStorage.removeItem(CART_REMINDER_SENT_KEY);
      
      // Clear any existing timeout
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
      }
      
      // Set new reminder timeout
      if (permission === 'granted') {
        reminderTimeoutRef.current = setTimeout(() => {
          const currentItemCount = parseInt(localStorage.getItem('cart_item_count') || '0');
          if (currentItemCount > 0 && !localStorage.getItem(CART_REMINDER_SENT_KEY)) {
            notifyCartReminder(currentItemCount);
            localStorage.setItem(CART_REMINDER_SENT_KEY, 'true');
          }
        }, REMINDER_DELAY_MS);
      }
    } else {
      // Cart is empty, clear everything
      localStorage.removeItem(CART_REMINDER_KEY);
      localStorage.removeItem(CART_REMINDER_SENT_KEY);
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
      }
    }
  }, [itemCount, notifyCartReminder, permission]);

  // Check for abandoned cart on mount
  useEffect(() => {
    const lastActivity = localStorage.getItem(CART_REMINDER_KEY);
    const reminderSent = localStorage.getItem(CART_REMINDER_SENT_KEY);
    
    if (lastActivity && !reminderSent && itemCount > 0 && permission === 'granted') {
      const timeSinceActivity = Date.now() - parseInt(lastActivity);
      
      if (timeSinceActivity >= REMINDER_DELAY_MS) {
        // Enough time has passed, send reminder immediately
        notifyCartReminder(itemCount);
        localStorage.setItem(CART_REMINDER_SENT_KEY, 'true');
      } else {
        // Set timeout for remaining time
        const remainingTime = REMINDER_DELAY_MS - timeSinceActivity;
        reminderTimeoutRef.current = setTimeout(() => {
          const currentItemCount = parseInt(localStorage.getItem('cart_item_count') || '0');
          if (currentItemCount > 0 && !localStorage.getItem(CART_REMINDER_SENT_KEY)) {
            notifyCartReminder(currentItemCount);
            localStorage.setItem(CART_REMINDER_SENT_KEY, 'true');
          }
        }, remainingTime);
      }
    }

    return () => {
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
      }
    };
  }, [itemCount, notifyCartReminder, permission]);

  // Update activity when item count changes
  useEffect(() => {
    // Store current item count for the timeout callback
    localStorage.setItem('cart_item_count', itemCount.toString());
    updateLastActivity();
  }, [itemCount, updateLastActivity]);

  // Function to manually reset the reminder (e.g., after checkout)
  const resetReminder = useCallback(() => {
    localStorage.removeItem(CART_REMINDER_KEY);
    localStorage.removeItem(CART_REMINDER_SENT_KEY);
    localStorage.removeItem('cart_item_count');
    if (reminderTimeoutRef.current) {
      clearTimeout(reminderTimeoutRef.current);
    }
  }, []);

  return { resetReminder };
}
