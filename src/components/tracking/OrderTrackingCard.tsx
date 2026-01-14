import { useOrderTracking } from '@/hooks/useOrderTracking';
import { OrderTrackingMap } from './OrderTrackingMap';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Navigation, Clock, Truck, CheckCircle, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface OrderTrackingCardProps {
  orderId: string;
}

const statusSteps = [
  { key: 'pending', label: 'جديد', icon: Clock },
  { key: 'preparing', label: 'قيد التحضير', icon: Package },
  { key: 'ready', label: 'جاهز', icon: CheckCircle },
  { key: 'out_for_delivery', label: 'في الطريق', icon: Truck },
  { key: 'completed', label: 'تم التوصيل', icon: CheckCircle },
];

export function OrderTrackingCard({ orderId }: OrderTrackingCardProps) {
  const { order, tracking, isLoading, isDelivery, isOutForDelivery } = useOrderTracking(orderId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-48 mb-4" />
          <Skeleton className="h-6 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!order) return null;

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Map Section */}
        {isDelivery && order.delivery_lat && order.delivery_lng && (
          <OrderTrackingMap
            deliveryLocation={{ lat: order.delivery_lat, lng: order.delivery_lng }}
            driverLocation={
              tracking
                ? { lat: tracking.current_lat, lng: tracking.current_lng, heading: tracking.heading }
                : null
            }
            isActive={isOutForDelivery}
          />
        )}

        <div className="p-4">
          {/* Progress Steps */}
          <div className="mb-4">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {/* Steps */}
              {statusSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div
                    key={step.key}
                    className={`relative z-10 flex flex-col items-center ${
                      isDelivery || step.key !== 'out_for_delivery' ? '' : 'hidden'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    >
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <span
                      className={`text-xs mt-1 ${
                        isCompleted ? 'text-primary font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Info */}
          {isDelivery && order.delivery_address && (
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg mb-3">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">موقع التوصيل</p>
                <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
              </div>
            </div>
          )}

          {/* Live Tracking Info */}
          {isOutForDelivery && tracking && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <Navigation className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">جاري التوصيل</p>
                <p className="text-xs text-muted-foreground">
                  آخر تحديث:{' '}
                  {formatDistanceToNow(new Date(tracking.updated_at), {
                    addSuffix: true,
                    locale: ar,
                  })}
                </p>
              </div>
              {tracking.speed > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(tracking.speed)} كم/س
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
