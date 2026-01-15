import { useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { MapPin, Navigation, RefreshCw, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function LocationPermission() {
  const { locationPermission, requestLocation, storeName } = useLocation();
  const [showInstructions, setShowInstructions] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

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
      <Card className="bg-destructive/10 border-destructive/20">
        <CardContent className="p-4">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-destructive mx-auto mb-2" />
            <h3 className="font-bold font-arabic text-foreground mb-1">
              تم رفض الموقع
            </h3>
            <p className="text-sm text-muted-foreground font-arabic mb-3">
              لتفعيل خدمة التوصيل، يرجى السماح بالوصول للموقع
            </p>
          </div>

          {/* Retry Button */}
          <div className="flex justify-center gap-2 mb-3">
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              variant="outline"
              size="sm"
              className="font-arabic"
            >
              {isRetrying ? (
                <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 ml-2" />
              )}
              حاول مرة أخرى
            </Button>
          </div>

          {/* Toggle Instructions */}
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full flex items-center justify-center gap-2 text-sm text-primary font-arabic py-2 hover:underline"
          >
            <Settings className="h-4 w-4" />
            كيفية تفعيل الموقع من الإعدادات
            {showInstructions ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Instructions */}
          {showInstructions && (
            <div className="mt-3 p-3 bg-background/50 rounded-lg text-right">
              <p className="font-bold text-sm font-arabic mb-2 text-foreground">
                📱 على الجوال (Safari/Chrome):
              </p>
              <ol className="text-xs text-muted-foreground font-arabic space-y-1 list-decimal list-inside mb-3">
                <li>اضغط على أيقونة "aA" أو 🔒 بجانب شريط العنوان</li>
                <li>اختر "إعدادات الموقع" أو "Website Settings"</li>
                <li>فعّل "الموقع الجغرافي" أو "Location"</li>
                <li>أعد تحميل الصفحة</li>
              </ol>
              
              <p className="font-bold text-sm font-arabic mb-2 text-foreground">
                💻 على الكمبيوتر:
              </p>
              <ol className="text-xs text-muted-foreground font-arabic space-y-1 list-decimal list-inside">
                <li>اضغط على أيقونة 🔒 بجانب شريط العنوان</li>
                <li>ابحث عن "الموقع الجغرافي" أو "Location"</li>
                <li>غيّرها إلى "السماح" أو "Allow"</li>
                <li>أعد تحميل الصفحة</li>
              </ol>

              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
                size="sm"
                className="w-full mt-3 font-arabic"
              >
                <RefreshCw className="h-4 w-4 ml-2" />
                إعادة تحميل الصفحة
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground font-arabic text-center mt-3">
            💡 يمكنك الاستلام من {storeName} مباشرة بدون تفعيل الموقع
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
