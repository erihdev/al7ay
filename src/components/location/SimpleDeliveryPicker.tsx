import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, Loader2, Navigation2, CheckCircle, Link2, 
  MapPinned, Sparkles, Truck
} from 'lucide-react';
import { toast } from 'sonner';
import { GoogleMapsGuide } from '@/components/provider/GoogleMapsGuide';

interface SimpleDeliveryPickerProps {
  location: { lat: number; lng: number; address?: string } | null;
  onLocationChange: (location: { lat: number; lng: number; address: string }) => void;
  className?: string;
  storeLocation?: { lat: number; lng: number } | null;
  deliveryRadius?: number; // in meters
}

export function SimpleDeliveryPicker({ 
  location, 
  onLocationChange, 
  className = '',
  storeLocation,
  deliveryRadius = 5000
}: SimpleDeliveryPickerProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [isParsingLink, setIsParsingLink] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Check if location is within delivery zone
  const isWithinDeliveryZone = (lat: number, lng: number): boolean => {
    if (!storeLocation) return true;
    const distance = calculateDistance(lat, lng, storeLocation.lat, storeLocation.lng);
    return distance <= deliveryRadius;
  };

  // Extract coordinates from Google Maps link
  const parseGoogleMapsLink = useCallback((link: string): { lat: number; lng: number } | null => {
    try {
      // Try to extract from @lat,lng pattern
      const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const atMatch = link.match(atPattern);
      if (atMatch) {
        return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
      }

      // Try to extract from ?q=lat,lng pattern
      const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const qMatch = link.match(qPattern);
      if (qMatch) {
        return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
      }

      // Try to extract from /place/lat,lng pattern
      const placePattern = /\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const placeMatch = link.match(placePattern);
      if (placeMatch) {
        return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
      }

      // Try direct coordinates format
      const directPattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
      const directMatch = link.trim().match(directPattern);
      if (directMatch) {
        return { lat: parseFloat(directMatch[1]), lng: parseFloat(directMatch[2]) };
      }

      // Try ll= parameter
      const llPattern = /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const llMatch = link.match(llPattern);
      if (llMatch) {
        return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
      }

      return null;
    } catch {
      return null;
    }
  }, []);

  // Reverse geocode to get address
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Get current location using GPS
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Check if within delivery zone
        if (!isWithinDeliveryZone(newLocation.lat, newLocation.lng)) {
          toast.error('موقعك خارج نطاق التوصيل', {
            description: 'يرجى اختيار موقع داخل منطقة التوصيل أو اختيار الاستلام من المتجر'
          });
          setIsLocating(false);
          return;
        }
        
        const address = await getAddressFromCoordinates(newLocation.lat, newLocation.lng);
        onLocationChange({ ...newLocation, address });
        setIsLocating(false);
        toast.success('تم تحديد موقعك بنجاح! 📍');
      },
      (error) => {
        setIsLocating(false);
        let errorMessage = 'فشل في تحديد الموقع';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'لم يتم السماح بالوصول للموقع';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'خدمة الموقع غير متاحة';
            break;
          case error.TIMEOUT:
            errorMessage = 'انتهت مهلة تحديد الموقع';
            break;
        }
        
        toast.error(errorMessage, {
          description: 'جرب لصق رابط Google Maps'
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [onLocationChange, storeLocation, deliveryRadius]);

  // Handle Google Maps link
  const handleLinkSubmit = useCallback(async () => {
    if (!googleMapsLink.trim()) {
      toast.error('يرجى إدخال رابط Google Maps');
      return;
    }

    setIsParsingLink(true);
    
    const coords = parseGoogleMapsLink(googleMapsLink);
    
    if (coords) {
      // Check if within delivery zone
      if (!isWithinDeliveryZone(coords.lat, coords.lng)) {
        toast.error('الموقع خارج نطاق التوصيل', {
          description: 'يرجى اختيار موقع داخل منطقة التوصيل'
        });
        setIsParsingLink(false);
        return;
      }
      
      const address = await getAddressFromCoordinates(coords.lat, coords.lng);
      onLocationChange({ ...coords, address });
      setGoogleMapsLink('');
      toast.success('تم تحديد الموقع بنجاح! 🎉');
    } else {
      if (googleMapsLink.includes('maps.app.goo.gl') || googleMapsLink.includes('goo.gl')) {
        toast.error('رابط مختصر', {
          description: 'افتح الرابط في المتصفح ثم انسخ الرابط الكامل'
        });
      } else {
        toast.error('تعذر استخراج الموقع من الرابط');
      }
    }
    
    setIsParsingLink(false);
  }, [googleMapsLink, parseGoogleMapsLink, onLocationChange, storeLocation, deliveryRadius]);

  // Handle manual coordinates
  const handleManualSubmit = useCallback(async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('إحداثيات غير صالحة');
      return;
    }

    // Check if within delivery zone
    if (!isWithinDeliveryZone(lat, lng)) {
      toast.error('الموقع خارج نطاق التوصيل');
      return;
    }

    const address = await getAddressFromCoordinates(lat, lng);
    onLocationChange({ lat, lng, address });
    setManualLat('');
    setManualLng('');
    setShowManualEntry(false);
    toast.success('تم حفظ الموقع!');
  }, [manualLat, manualLng, onLocationChange, storeLocation, deliveryRadius]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="font-arabic font-medium flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          موقع التوصيل
        </Label>
        {location && (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1 text-xs">
            <CheckCircle className="h-3 w-3" />
            محدد
          </Badge>
        )}
      </div>

      {/* GPS Button - Primary Action */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 text-primary shrink-0">
              <Navigation2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium font-arabic text-sm">موقعي الحالي</span>
                <Badge variant="secondary" className="text-[10px] gap-0.5 py-0">
                  <Sparkles className="h-2.5 w-2.5" />
                  سريع
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-arabic">
                تحديد موقع التوصيل تلقائياً
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={getCurrentLocation}
              disabled={isLocating}
              className="gap-1.5 shrink-0"
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              {isLocating ? 'جاري...' : 'تحديد'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Google Maps Link */}
      <Card>
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-arabic text-sm">لصق رابط Google Maps</span>
              </div>
              <GoogleMapsGuide />
            </div>
            <div className="flex gap-2">
              <Input
                value={googleMapsLink}
                onChange={(e) => setGoogleMapsLink(e.target.value)}
                placeholder="الصق الرابط هنا..."
                className="flex-1 text-sm h-9"
                dir="ltr"
                onKeyDown={(e) => e.key === 'Enter' && handleLinkSubmit()}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleLinkSubmit}
                disabled={isParsingLink || !googleMapsLink.trim()}
                className="h-9"
              >
                {isParsingLink ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry Toggle */}
      {!showManualEntry ? (
        <button
          type="button"
          onClick={() => setShowManualEntry(true)}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 font-arabic"
        >
          أو أدخل الإحداثيات يدوياً ←
        </button>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-arabic text-xs">إحداثيات يدوية</Label>
              <button
                type="button"
                onClick={() => setShowManualEntry(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                إخفاء
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="خط العرض"
                dir="ltr"
                className="text-xs h-8"
              />
              <Input
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="خط الطول"
                dir="ltr"
                className="text-xs h-8"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleManualSubmit}
              disabled={!manualLat || !manualLng}
              className="w-full h-8 text-xs"
            >
              <CheckCircle className="h-3 w-3 ml-1" />
              حفظ
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Selected Location Display */}
      {location && (
        <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <MapPinned className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-green-700 dark:text-green-400 font-arabic mb-0.5">
                  موقع التوصيل
                </p>
                <p className="text-sm text-foreground font-arabic leading-relaxed truncate">
                  {location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
