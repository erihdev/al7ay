import { useState, useEffect } from 'react';
import { MapPin, Navigation, RefreshCw, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type PermissionState = 'granted' | 'denied' | 'prompt' | 'loading';

export function ProviderLocationPermission() {
  const [locationPermission, setLocationPermission] = useState<PermissionState>('loading');
  const [showInstructions, setShowInstructions] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(result.state as PermissionState);
        
        result.onchange = () => {
          setLocationPermission(result.state as PermissionState);
        };
      } catch (e) {
        setLocationPermission('prompt');
      }
    } else {
      setLocationPermission('prompt');
    }
  };

  const requestLocation = async () => {
    setLocationPermission('loading');
    
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationPermission('granted');
      },
      (error) => {
        if (error.code === 1) {
          setLocationPermission('denied');
        } else {
          // Try again with lower accuracy for other errors
          navigator.geolocation.getCurrentPosition(
            () => setLocationPermission('granted'),
            () => setLocationPermission('denied'),
            { enableHighAccuracy: false, timeout: 30000, maximumAge: 600000 }
          );
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await requestLocation();
    } finally {
      setIsRetrying(false);
    }
  };

  if (locationPermission === 'granted') {
    return null;
  }

  if (locationPermission === 'denied') {
    return (
      <Card className="bg-destructive/10 border-destructive/20 mb-4">
        <CardContent className="p-3">
          <div className="text-center">
            <MapPin className="h-6 w-6 text-destructive mx-auto mb-1.5" />
            <h3 className="font-bold font-arabic text-sm text-foreground mb-0.5">
              تم رفض الموقع
            </h3>
            <p className="text-xs text-muted-foreground font-arabic mb-2">
              لتفعيل خدمة التوصيل للعملاء، يرجى السماح بالوصول للموقع
            </p>
          </div>

          {/* Retry Button */}
          <div className="flex justify-center gap-2 mb-2">
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              variant="outline"
              size="sm"
              className="font-arabic h-8 text-xs"
            >
              {isRetrying ? (
                <RefreshCw className="h-3.5 w-3.5 ml-1.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 ml-1.5" />
              )}
              حاول مرة أخرى
            </Button>
          </div>

          {/* Toggle Instructions */}
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-primary font-arabic py-1.5 hover:underline"
          >
            <Settings className="h-3.5 w-3.5" />
            كيفية تفعيل الموقع
            {showInstructions ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Instructions */}
          {showInstructions && (
            <div className="mt-2 p-2 bg-background/50 rounded-lg text-right">
              <p className="font-bold text-xs font-arabic mb-1.5 text-foreground">
                📱 على الجوال:
              </p>
              <ol className="text-[10px] text-muted-foreground font-arabic space-y-0.5 list-decimal list-inside mb-2">
                <li>اضغط على أيقونة "aA" أو 🔒 بجانب العنوان</li>
                <li>اختر "إعدادات الموقع"</li>
                <li>فعّل "الموقع الجغرافي"</li>
              </ol>

              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
                size="sm"
                className="w-full mt-2 font-arabic h-7 text-xs"
              >
                <RefreshCw className="h-3 w-3 ml-1.5" />
                إعادة تحميل
              </Button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground font-arabic text-center mt-2">
            💡 الموقع مطلوب لحساب مسافة التوصيل للعملاء
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-primary/5 border-primary/20 mb-4">
      <CardContent className="p-3 text-center">
        <Navigation className="h-6 w-6 text-primary mx-auto mb-1.5" />
        <h3 className="font-bold font-arabic text-sm text-foreground mb-0.5">
          تفعيل الموقع
        </h3>
        <p className="text-xs text-muted-foreground font-arabic mb-2">
          نحتاج موقعك لحساب مسافة التوصيل للعملاء
        </p>
        <Button
          onClick={requestLocation}
          disabled={locationPermission === 'loading'}
          className="font-arabic h-8 text-xs"
          size="sm"
        >
          {locationPermission === 'loading' ? (
            <>جاري التحميل...</>
          ) : (
            <>
              <MapPin className="h-3.5 w-3.5 ml-1.5" />
              السماح بالموقع
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
