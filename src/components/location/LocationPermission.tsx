import { useLocation } from '@/contexts/LocationContext';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function LocationPermission() {
  const { locationPermission, requestLocation, isWithinDeliveryZone, storeName } = useLocation();

  if (locationPermission === 'granted') {
    return null;
  }

  if (locationPermission === 'denied') {
    return (
      <Card className="bg-destructive/10 border-destructive/20">
        <CardContent className="p-4 text-center">
          <MapPin className="h-8 w-8 text-destructive mx-auto mb-2" />
          <h3 className="font-bold font-arabic text-foreground mb-1">
            تم رفض الموقع
          </h3>
          <p className="text-sm text-muted-foreground font-arabic mb-3">
            يرجى تفعيل خدمة الموقع من إعدادات المتصفح للاستفادة من خدمة التوصيل
          </p>
          <p className="text-xs text-muted-foreground font-arabic">
            يمكنك الاستلام من {storeName} مباشرة
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="p-4 text-center">
        <Navigation className="h-8 w-8 text-primary mx-auto mb-2" />
        <h3 className="font-bold font-arabic text-foreground mb-1">
          تفعيل الموقع
        </h3>
        <p className="text-sm text-muted-foreground font-arabic mb-3">
          نحتاج موقعك لنعرف إذا كان التوصيل متاحاً لك
        </p>
        <Button
          onClick={requestLocation}
          disabled={locationPermission === 'loading'}
          className="font-arabic"
        >
          {locationPermission === 'loading' ? (
            <>جاري التحميل...</>
          ) : (
            <>
              <MapPin className="h-4 w-4 ml-2" />
              السماح بالموقع
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
