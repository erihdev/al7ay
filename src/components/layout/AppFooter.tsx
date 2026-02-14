import { forwardRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CURRENT_APP_VERSION } from '@/hooks/useAppVersion';

// Pages that have BottomNav - don't show footer on these
const pagesWithBottomNav = ['/app', '/cart', '/orders', '/profile', '/favorites', '/my-store-orders', '/product'];

export const AppFooter = forwardRef<HTMLElement>((_, ref) => {
  const location = useLocation();

  // Don't render footer on pages with BottomNav to avoid overlap
  const hasBottomNav = pagesWithBottomNav.some(page => location.pathname.startsWith(page));

  if (hasBottomNav) {
    return null;
  }

  return (
    <footer ref={ref} className="py-2 text-center text-xs text-muted-foreground/60">
      <div className="flex flex-col gap-1">
        <span>v{CURRENT_APP_VERSION}</span>
        <span className="text-[10px]">
          صنع بواسطة{' '}
          <a
            href="https://divathar.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/60 hover:text-primary transition-colors font-medium"
          >
            divathar.com
          </a>
        </span>
      </div>
    </footer>
  );
});

AppFooter.displayName = 'AppFooter';
