import { CURRENT_APP_VERSION } from '@/hooks/useAppVersion';

export function AppFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-1 text-center text-xs text-muted-foreground/60 bg-background/80 backdrop-blur-sm z-10 pointer-events-none">
      <span>v{CURRENT_APP_VERSION}</span>
    </footer>
  );
}
