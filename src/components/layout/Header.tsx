import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { CustomerSoundToggle } from '@/components/notifications/CustomerSoundToggle';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { Button } from '@/components/ui/button';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border pt-[env(safe-area-inset-top)]">
      <div className="container mx-auto px-2 py-1">
        <div className="flex items-center justify-between">
          {/* Logo with link to home */}
          <Link to="/" className="flex items-center gap-2">
            <AnimatedLogo size="sm" showText={true} />
          </Link>

          {/* Controls */}
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9">
              <Link to="/">
                <Home className="h-4 w-4" />
              </Link>
            </Button>
            <ThemeToggle />
            {user && <CustomerSoundToggle />}
          </div>
        </div>
      </div>
    </header>
  );
}
