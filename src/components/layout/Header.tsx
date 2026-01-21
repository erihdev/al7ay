import { Link } from 'react-router-dom';
import { CustomerSoundToggle } from '@/components/notifications/CustomerSoundToggle';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedLogo } from '@/components/ui/AnimatedLogo';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border pt-[env(safe-area-inset-top)]">
      <div className="container mx-auto px-3 py-1.5">
        <div className="flex items-center justify-between">
          {/* Logo with link to home */}
          <Link to="/" className="flex items-center">
            <AnimatedLogo size="sm" showText={true} />
          </Link>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {user && <CustomerSoundToggle />}
          </div>
        </div>
      </div>
    </header>
  );
}
