import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, Loader2, Navigation2, CheckCircle, Link2, 
  MapPinned, Copy, ExternalLink, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface SimpleLocationPickerProps {
  location: { lat: number; lng: number } | null;
  onLocationChange: (location: { lat: number; lng: number }) => void;
  className?: string;
}

export function SimpleLocationPicker({ location, onLocationChange, className = '' }: SimpleLocationPickerProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [isParsingLink, setIsParsingLink] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // Extract coordinates from Google Maps link
  const parseGoogleMapsLink = useCallback((link: string): { lat: number; lng: number } | null => {
    try {
      // Pattern 1: https://maps.app.goo.gl/... (short link - need to handle differently)
      // Pattern 2: https://www.google.com/maps/place/.../@24.7136,46.6753,17z
      // Pattern 3: https://maps.google.com/?q=24.7136,46.6753
      // Pattern 4: https://www.google.com/maps?q=24.7136,46.6753
      // Pattern 5: Direct coordinates like "24.7136, 46.6753"

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

      // Try direct coordinates format "24.7136, 46.6753" or "24.7136,46.6753"
      const directPattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
      const directMatch = link.trim().match(directPattern);
      if (directMatch) {
        return { lat: parseFloat(directMatch[1]), lng: parseFloat(directMatch[2]) };
      }

      // Try to extract from ll= parameter
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

  // Validate coordinates are within Saudi Arabia region
  const isValidSaudiCoordinates = (lat: number, lng: number): boolean => {
    return lat >= 15 && lat <= 35 && lng >= 34 && lng <= 56;
  };

  // Get current location using GPS
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع', {
        description: 'يرجى استخدام طريقة أخرى لتحديد موقعك'
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        if (!isValidSaudiCoordinates(newLocation.lat, newLocation.lng)) {
          toast.warning('الموقع خارج نطاق الخدمة', {
            description: 'يبدو أن موقعك خارج المملكة العربية السعودية'
          });
        }
        
        onLocationChange(newLocation);
        setIsLocating(false);
        toast.success('تم تحديد موقعك بنجاح! ✨');
      },
      (error) => {
        setIsLocating(false);
        let errorMessage = 'فشل في تحديد الموقع';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'لم يتم السماح بالوصول للموقع';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'خدمة الموقع غير متاحة حالياً';
            break;
          case error.TIMEOUT:
            errorMessage = 'انتهت مهلة تحديد الموقع';
            break;
        }
        
        toast.error(errorMessage, {
          description: 'جرب لصق رابط Google Maps أو إدخال الإحداثيات يدوياً'
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [onLocationChange]);

  // Handle Google Maps link paste/input
  const handleLinkSubmit = useCallback(() => {
    if (!googleMapsLink.trim()) {
      toast.error('يرجى إدخال رابط Google Maps');
      return;
    }

    setIsParsingLink(true);
    
    const coords = parseGoogleMapsLink(googleMapsLink);
    
    if (coords) {
      if (!isValidSaudiCoordinates(coords.lat, coords.lng)) {
        toast.warning('الموقع خارج نطاق الخدمة', {
          description: 'يبدو أن هذا الموقع خارج المملكة العربية السعودية'
        });
      }
      
      onLocationChange(coords);
      setGoogleMapsLink('');
      toast.success('تم استخراج الموقع من الرابط بنجاح! 🎉');
    } else {
      // Check if it's a short link
      if (googleMapsLink.includes('maps.app.goo.gl') || googleMapsLink.includes('goo.gl')) {
        toast.error('رابط مختصر', {
          description: 'يرجى فتح الرابط في المتصفح أولاً ثم نسخ الرابط الكامل'
        });
      } else {
        toast.error('تعذر استخراج الموقع', {
          description: 'تأكد من لصق رابط صحيح من Google Maps'
        });
      }
    }
    
    setIsParsingLink(false);
  }, [googleMapsLink, parseGoogleMapsLink, onLocationChange]);

  // Handle manual coordinates entry
  const handleManualSubmit = useCallback(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('إحداثيات غير صالحة');
      return;
    }

    if (!isValidSaudiCoordinates(lat, lng)) {
      toast.warning('الموقع خارج نطاق الخدمة');
    }

    onLocationChange({ lat, lng });
    setManualLat('');
    setManualLng('');
    setShowManualEntry(false);
    toast.success('تم حفظ الإحداثيات بنجاح!');
  }, [manualLat, manualLng, onLocationChange]);

  // Copy coordinates to clipboard
  const copyCoordinates = useCallback(() => {
    if (location) {
      navigator.clipboard.writeText(`${location.lat}, ${location.lng}`);
      toast.success('تم نسخ الإحداثيات');
    }
  }, [location]);

  // Open location in Google Maps
  const openInGoogleMaps = useCallback(() => {
    if (location) {
      window.open(
        `https://www.google.com/maps?q=${location.lat},${location.lng}`,
        '_blank'
      );
    }
  }, [location]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <Label className="font-arabic font-medium flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-primary" />
          موقع المتجر
        </Label>
        {location && (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1.5 px-3 py-1">
            <CheckCircle className="h-3.5 w-3.5" />
            محدد
          </Badge>
        )}
      </div>

      {/* Main action - GPS Location (Recommended) */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/20 text-primary shrink-0">
              <Navigation2 className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold font-arabic">تحديد موقعي الحالي</h3>
                <Badge variant="secondary" className="text-xs gap-1">
                  <Sparkles className="h-3 w-3" />
                  الأسهل
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-arabic mb-3">
                اضغط الزر لتحديد موقع متجرك تلقائياً باستخدام GPS
              </p>
              <Button
                type="button"
                onClick={getCurrentLocation}
                disabled={isLocating}
                className="w-full sm:w-auto gap-2"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري التحديد...
                  </>
                ) : (
                  <>
                    <Navigation2 className="h-4 w-4" />
                    تحديد موقعي
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative - Paste Google Maps Link */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-muted text-muted-foreground shrink-0">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h3 className="font-semibold font-arabic text-sm">لصق رابط Google Maps</h3>
                <p className="text-xs text-muted-foreground font-arabic">
                  افتح Google Maps وابحث عن موقعك ثم انسخ الرابط والصقه هنا
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={googleMapsLink}
                  onChange={(e) => setGoogleMapsLink(e.target.value)}
                  placeholder="الصق رابط Google Maps هنا..."
                  className="flex-1 text-sm h-9"
                  dir="ltr"
                  onKeyDown={(e) => e.key === 'Enter' && handleLinkSubmit()}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleLinkSubmit}
                  disabled={isParsingLink || !googleMapsLink.trim()}
                  className="gap-1.5 h-9"
                >
                  {isParsingLink ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  تطبيق
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual entry toggle */}
      {!showManualEntry ? (
        <button
          type="button"
          onClick={() => setShowManualEntry(true)}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2 font-arabic"
        >
          أو أدخل الإحداثيات يدوياً ←
        </button>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-arabic text-sm font-medium">إدخال الإحداثيات يدوياً</Label>
              <button
                type="button"
                onClick={() => setShowManualEntry(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                إخفاء
              </button>
            </div>
            <p className="text-xs text-muted-foreground font-arabic">
              💡 في Google Maps، اضغط مطولاً على موقعك لنسخ الإحداثيات
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-arabic text-muted-foreground">خط العرض</Label>
                <Input
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="مثال: 24.7136"
                  dir="ltr"
                  className="text-sm h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-arabic text-muted-foreground">خط الطول</Label>
                <Input
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="مثال: 46.6753"
                  dir="ltr"
                  className="text-sm h-9"
                />
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleManualSubmit}
              disabled={!manualLat || !manualLng}
              className="w-full gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              حفظ الإحداثيات
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current location display */}
      {location && (
        <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <MapPinned className="h-4 w-4" />
                <span className="text-sm font-semibold font-arabic">الموقع المحدد حالياً</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyCoordinates}
                  className="h-7 w-7 p-0 hover:bg-green-200/50"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={openInGoogleMaps}
                  className="h-7 w-7 p-0 hover:bg-green-200/50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-sm font-mono text-foreground" dir="ltr">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
