import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUpdateProviderDeliveryLocation } from '@/hooks/useProviderOrderTracking';
import { Navigation2, MapPin, Loader2, Check, X, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ProviderDeliveryTrackerProps {
  orderId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string | null;
  onDeliveryComplete?: () => void;
}

export function ProviderDeliveryTracker({
  orderId,
  customerName,
  customerPhone,
  deliveryAddress,
  onDeliveryComplete
}: ProviderDeliveryTrackerProps) {
  const { updateLocation, stopTracking } = useUpdateProviderDeliveryLocation();
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Start location tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setIsTracking(true);
    toast.success('تم تفعيل تتبع الموقع');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, speed, accuracy } = position.coords;
        
        setCurrentPosition({ lat: latitude, lng: longitude });
        setAccuracy(accuracy);

        // Update location in database
        updateLocation(
          orderId,
          latitude,
          longitude,
          heading || 0,
          (speed || 0) * 3.6 // Convert m/s to km/h
        ).catch((error) => {
          console.error('Failed to update location:', error);
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('خطأ في تحديد الموقع: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );
  }, [orderId, updateLocation]);

  // Stop location tracking
  const stopTrackingHandler = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    stopTracking(orderId).catch(console.error);
    setIsTracking(false);
    setCurrentPosition(null);
    toast.info('تم إيقاف التتبع');
  }, [orderId, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Open navigation app
  const openNavigation = useCallback(() => {
    if (!deliveryAddress) {
      toast.error('عنوان التوصيل غير متوفر');
      return;
    }
    
    const encodedAddress = encodeURIComponent(deliveryAddress);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open(`http://maps.apple.com/?daddr=${encodedAddress}&dirflg=d`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`, '_blank');
    }
  }, [deliveryAddress]);

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Navigation2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">تتبع التوصيل</h4>
              <p className="text-xs text-muted-foreground">{customerName}</p>
            </div>
          </div>
          
          {isTracking && (
            <Badge variant="default" className="bg-green-500 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white mr-2" />
              جاري التتبع
            </Badge>
          )}
        </div>

        {/* Delivery Address */}
        {deliveryAddress && (
          <div className="flex items-start gap-2 p-3 bg-background rounded-lg">
            <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{deliveryAddress}</p>
            </div>
          </div>
        )}

        {/* Current Position Info */}
        {currentPosition && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">موقعك الحالي:</span>
              <span className="font-mono text-xs">
                {currentPosition.lat.toFixed(5)}, {currentPosition.lng.toFixed(5)}
              </span>
            </div>
            {accuracy && (
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>دقة الموقع:</span>
                <span>{Math.round(accuracy)} متر</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {!isTracking ? (
            <Button 
              onClick={startTracking} 
              className="col-span-2 gap-2"
            >
              <Navigation2 className="h-4 w-4" />
              بدء تتبع الموقع
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={stopTrackingHandler}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                إيقاف التتبع
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  stopTrackingHandler();
                  onDeliveryComplete?.();
                }}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
                تم التوصيل
              </Button>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={openNavigation}
          >
            <MapPin className="h-4 w-4" />
            فتح الملاحة
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => window.location.href = `tel:${customerPhone}`}
          >
            <Phone className="h-4 w-4" />
            اتصل بالعميل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
