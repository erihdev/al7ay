import { useLocation } from 'react-router-dom';
import { CURRENT_APP_VERSION } from '@/hooks/useAppVersion';

// Pages that have BottomNav - don't show footer on these
const pagesWithBottomNav = ['/app', '/cart', '/orders', '/profile', '/favorites', '/my-store-orders', '/product'];

export function AppFooter() {
  const location = useLocation();
  
  // Don't render footer on pages with BottomNav to avoid overlap
  const hasBottomNav = pagesWithBottomNav.some(page => location.pathname.startsWith(page));
  
  if (hasBottomNav) {
    return null;
  }

  return (
    <footer className="py-2 text-center text-xs text-muted-foreground/60">
      <span>v{CURRENT_APP_VERSION}</span>
    </footer>
  );
}
