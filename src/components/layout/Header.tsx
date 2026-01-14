import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CustomerSoundToggle } from '@/components/notifications/CustomerSoundToggle';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

export function Header() {
  const { storeName, isWithinDeliveryZone, distance, locationPermission } = useLocationContext();
  const { user } = useAuth();

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} متر`;
    }
    return `${(meters / 1000).toFixed(1)} كم`;
  };

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border safe-area-inset-top">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="الحي" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-lg font-bold font-arabic text-foreground">{storeName}</h1>
              <p className="text-xs text-muted-foreground font-arabic">قهوة الحي</p>
            </div>
          </div>

          {/* Location Status & Controls */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {user && <CustomerSoundToggle />}
            {locationPermission === 'granted' && distance !== null && (
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground font-arabic">
                  {formatDistance(distance)}
                </span>
              </div>
            )}
            <Badge
              variant={isWithinDeliveryZone ? 'default' : 'secondary'}
              className="font-arabic text-xs"
            >
              {isWithinDeliveryZone ? 'التوصيل متاح' : 'استلام فقط'}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
