import { Link } from 'react-router-dom';
import { CustomerSoundToggle } from '@/components/notifications/CustomerSoundToggle';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border safe-area-inset-top">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <AnimatedLogo size="md" showText={true} />

          {/* Controls */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {user && <CustomerSoundToggle />}
            {user && (
              <Link to="/profile">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
