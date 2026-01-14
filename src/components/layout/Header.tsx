import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { MapPin, Coffee } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Header() {
  const { storeName, isWithinDeliveryZone, distance, locationPermission } = useLocationContext();

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
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Coffee className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-arabic text-foreground">{storeName}</h1>
              <p className="text-xs text-muted-foreground font-arabic">قهوة الحي</p>
            </div>
          </div>

          {/* Location Status */}
          <div className="flex items-center gap-2">
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
