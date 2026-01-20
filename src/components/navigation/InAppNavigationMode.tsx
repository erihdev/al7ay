import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation2, 
  X, 
  Volume2, 
  VolumeX,
  ArrowUp,
  RotateCcw,
  MapPin,
  Clock,
  Gauge,
  Target,
  Phone,
  MessageCircle,
  ChefHat,
  CheckCircle2,
  Truck,
  XCircle,
  Loader2,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useUpdateProviderOrder } from '@/hooks/useProviderOrders';
import { toast } from 'sonner';

interface InAppNavigationModeProps {
  map: mapboxgl.Map;
  userLocation: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  destinationName: string;
  heading: number;
  routeInfo: { distance: string; duration: string; durationMinutes?: number } | null;
  onExit: () => void;
  // Provider order management props
  orderId?: string;
  orderStatus?: string;
  orderNumber?: number | string;
  customerPhone?: string;
  onStatusChange?: (newStatus: string) => void;
  isProvider?: boolean;
}

const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string; nextLabel?: string }> = {
  pending: { 
    label: 'جديد', 
    icon: Clock, 
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    nextLabel: 'قبول الطلب'
  },
  preparing: { 
    label: 'قيد التحضير', 
    icon: ChefHat, 
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    nextLabel: 'جاهز للتسليم'
  },
  ready: { 
    label: 'جاهز', 
    icon: CheckCircle2, 
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    nextLabel: 'بدء التوصيل'
  },
  out_for_delivery: { 
    label: 'في الطريق', 
    icon: Truck, 
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    nextLabel: 'تم التسليم'
  },
  completed: { 
    label: 'مكتمل', 
    icon: CheckCircle2, 
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20'
  },
  cancelled: { 
    label: 'ملغي', 
    icon: XCircle, 
    color: 'text-red-400',
    bgColor: 'bg-red-500/20'
  }
};

const statusFlow = ['pending', 'preparing', 'ready', 'out_for_delivery', 'completed'];

function InAppNavigationModeComponent({
  map,
  userLocation,
  destination,
  destinationName,
  heading,
  routeInfo,
  onExit,
  orderId,
  orderStatus = 'pending',
  orderNumber,
  customerPhone,
  onStatusChange,
  isProvider = false
}: InAppNavigationModeProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [distanceToDestination, setDistanceToDestination] = useState<number | null>(null);
  const [isControlsExpanded, setIsControlsExpanded] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const lastUpdateRef = useRef<number>(Date.now());
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  
  const updateOrderMutation = useUpdateProviderOrder();

  // Calculate distance using Haversine formula
  const calculateDistance = useCallback((from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    const R = 6371e3;
    const φ1 = (from.lat * Math.PI) / 180;
    const φ2 = (to.lat * Math.PI) / 180;
    const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
    const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Calculate speed from position changes
  useEffect(() => {
    if (!lastPositionRef.current) {
      lastPositionRef.current = userLocation;
      return;
    }

    const now = Date.now();
    const timeDelta = (now - lastUpdateRef.current) / 1000; // seconds
    
    if (timeDelta > 0.5) {
      const distance = calculateDistance(lastPositionRef.current, userLocation);
      const speed = (distance / timeDelta) * 3.6; // km/h
      
      // Smooth speed updates
      setCurrentSpeed(prev => Math.round((prev * 0.7) + (speed * 0.3)));
      
      lastPositionRef.current = userLocation;
      lastUpdateRef.current = now;
    }

    // Calculate distance to destination
    const distToDest = calculateDistance(userLocation, destination);
    setDistanceToDestination(distToDest);
  }, [userLocation, destination, calculateDistance]);

  // Enter navigation mode on mount
  useEffect(() => {
    if (!map) return;

    // Enable 3D terrain-like perspective
    map.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 18,
      pitch: 65,
      bearing: heading,
      duration: 1000
    });

    return () => {
      // Reset on unmount
      map.flyTo({
        zoom: 14,
        pitch: 0,
        bearing: 0,
        duration: 500
      });
    };
  }, []);

  // Follow user location with smooth bearing updates
  useEffect(() => {
    if (!map) return;

    map.easeTo({
      center: [userLocation.lng, userLocation.lat],
      bearing: heading,
      duration: 300,
      easing: (t) => t
    });
  }, [userLocation, heading, map]);

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} م`;
    }
    return `${(meters / 1000).toFixed(1)} كم`;
  };

  // Get direction indicator based on bearing difference
  const getDirectionIndicator = () => {
    if (!distanceToDestination) return null;
    
    const bearingToDest = Math.atan2(
      destination.lng - userLocation.lng,
      destination.lat - userLocation.lat
    ) * (180 / Math.PI);
    
    let diff = bearingToDest - heading;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    if (Math.abs(diff) < 30) return 'استمر للأمام';
    if (diff > 0 && diff < 90) return 'انعطف يميناً قليلاً';
    if (diff >= 90) return 'انعطف يميناً';
    if (diff < 0 && diff > -90) return 'انعطف يساراً قليلاً';
    return 'انعطف يساراً';
  };

  const recenterMap = () => {
    map.flyTo({
      center: [userLocation.lng, userLocation.lat],
      bearing: heading,
      zoom: 18,
      pitch: 65,
      duration: 500
    });
  };

  // Get next status in flow
  const getNextStatus = useCallback(() => {
    const currentIndex = statusFlow.indexOf(orderStatus);
    if (currentIndex >= 0 && currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  }, [orderStatus]);

  // Handle status change
  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!orderId) return;
    
    setIsUpdatingStatus(true);
    try {
      await updateOrderMutation.mutateAsync({ 
        orderId, 
        status: newStatus 
      });
      toast.success('تم تحديث حالة الطلب');
      onStatusChange?.(newStatus);
      
      // Auto exit if order completed
      if (newStatus === 'completed') {
        setTimeout(() => onExit(), 1500);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الحالة');
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [orderId, updateOrderMutation, onStatusChange, onExit]);

  // Handle cancel order
  const handleCancelOrder = useCallback(async () => {
    if (!orderId) return;
    
    setIsUpdatingStatus(true);
    try {
      await updateOrderMutation.mutateAsync({ 
        orderId, 
        status: 'cancelled' 
      });
      toast.success('تم إلغاء الطلب');
      onStatusChange?.('cancelled');
      onExit();
    } catch (error) {
      toast.error('حدث خطأ أثناء إلغاء الطلب');
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [orderId, updateOrderMutation, onStatusChange, onExit]);

  const currentStatus = statusConfig[orderStatus] || statusConfig.pending;
  const StatusIcon = currentStatus.icon;
  const nextStatus = getNextStatus();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 pointer-events-none"
      >
        {/* Top Navigation Bar - Professional dark theme */}
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/80 to-transparent p-4 pb-8 pointer-events-auto"
        >
          {/* Direction instruction */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <ArrowUp 
                  className="h-7 w-7 text-primary-foreground" 
                  style={{ transform: `rotate(${heading}deg)` }}
                />
              </div>
              <div>
                <p className="text-white font-bold text-lg">{getDirectionIndicator()}</p>
                <p className="text-white/70 text-sm">نحو {destinationName}</p>
              </div>
            </div>
            
            {/* Exit button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
              onClick={onExit}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Distance remaining badge */}
          {distanceToDestination && (
            <Badge className="bg-primary/20 text-primary border-0 px-4 py-1.5 text-base font-bold">
              <Target className="h-4 w-4 ml-2" />
              {formatDistance(distanceToDestination)} متبقية
            </Badge>
          )}
        </motion.div>

        {/* Provider Order Controls - Expandable panel */}
        {isProvider && orderId && orderStatus !== 'completed' && orderStatus !== 'cancelled' && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="absolute bottom-0 left-0 right-0 pointer-events-auto"
          >
            <div className="bg-gradient-to-t from-black/95 via-black/90 to-black/80 backdrop-blur-xl rounded-t-3xl">
              {/* Handle bar */}
              <button
                className="w-full py-3 flex justify-center"
                onClick={() => setIsControlsExpanded(!isControlsExpanded)}
              >
                <div className="w-12 h-1.5 rounded-full bg-white/30" />
              </button>

              <AnimatePresence mode="wait">
                {isControlsExpanded ? (
                  <motion.div
                    key="expanded"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-8 space-y-4"
                  >
                    {/* Order Info Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${currentStatus.bgColor} flex items-center justify-center`}>
                          <StatusIcon className={`h-6 w-6 ${currentStatus.color}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white">
                            طلب #{orderNumber || orderId?.slice(-4).toUpperCase()}
                          </h3>
                          <Badge className={`${currentStatus.bgColor} ${currentStatus.color} border-0`}>
                            {currentStatus.label}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Quick Contact */}
                      {customerPhone && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white"
                            onClick={() => window.location.href = `tel:${customerPhone}`}
                          >
                            <Phone className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 rounded-full bg-green-500/20 hover:bg-green-500/30 text-green-400"
                            onClick={() => window.location.href = `https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}`}
                          >
                            <MessageCircle className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Status Progress Timeline */}
                    <div className="flex items-center justify-between px-2 py-2">
                      {statusFlow.slice(0, -1).map((status, index) => {
                        const config = statusConfig[status];
                        const Icon = config.icon;
                        const currentIndex = statusFlow.indexOf(orderStatus);
                        const isActive = index <= currentIndex;
                        const isCurrent = status === orderStatus;
                        
                        return (
                          <div key={status} className="flex items-center">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center transition-all
                              ${isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-black' : ''}
                              ${isActive ? config.bgColor : 'bg-white/10'}
                            `}>
                              <Icon className={`h-5 w-5 ${isActive ? config.color : 'text-white/40'}`} />
                            </div>
                            {index < statusFlow.length - 2 && (
                              <div className={`w-6 h-1 mx-1 rounded ${isActive && index < currentIndex ? 'bg-primary' : 'bg-white/20'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-around bg-white/5 rounded-2xl p-3">
                      <div className="flex flex-col items-center">
                        <Gauge className="h-4 w-4 text-primary mb-1" />
                        <p className="text-white font-bold text-xl">{currentSpeed}</p>
                        <p className="text-white/50 text-[10px]">كم/س</p>
                      </div>
                      <div className="w-px h-10 bg-white/20" />
                      <div className="flex flex-col items-center">
                        <Clock className="h-4 w-4 text-blue-400 mb-1" />
                        <p className="text-white font-bold text-xl">{routeInfo?.duration || '--'}</p>
                        <p className="text-white/50 text-[10px]">الوقت</p>
                      </div>
                      <div className="w-px h-10 bg-white/20" />
                      <div className="flex flex-col items-center">
                        <MapPin className="h-4 w-4 text-green-400 mb-1" />
                        <p className="text-white font-bold text-xl">{routeInfo?.distance || '--'}</p>
                        <p className="text-white/50 text-[10px]">المسافة</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      {nextStatus && (
                        <Button
                          size="lg"
                          className="h-14 text-base font-bold gap-2 bg-primary hover:bg-primary/90 rounded-xl"
                          onClick={() => handleStatusChange(nextStatus)}
                          disabled={isUpdatingStatus}
                        >
                          {isUpdatingStatus ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              {(() => {
                                const NextIcon = statusConfig[nextStatus]?.icon;
                                return NextIcon ? <NextIcon className="h-5 w-5" /> : null;
                              })()}
                              {currentStatus.nextLabel}
                            </>
                          )}
                        </Button>
                      )}
                      
                      {orderStatus === 'pending' ? (
                        <Button
                          size="lg"
                          variant="outline"
                          className="h-14 text-base gap-2 text-red-400 hover:bg-red-500/20 border-red-500/30 rounded-xl bg-transparent"
                          onClick={handleCancelOrder}
                          disabled={isUpdatingStatus}
                        >
                          <XCircle className="h-5 w-5" />
                          رفض الطلب
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          variant="outline"
                          className="h-14 text-base gap-2 text-white/70 hover:bg-white/10 border-white/20 rounded-xl bg-transparent"
                          onClick={onExit}
                        >
                          <X className="h-5 w-5" />
                          تصغير
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="collapsed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-4 pb-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={`${currentStatus.bgColor} ${currentStatus.color} border-0 px-3 py-1`}>
                          <StatusIcon className="h-3.5 w-3.5 ml-1" />
                          {currentStatus.label}
                        </Badge>
                        <span className="text-white/60 text-sm">
                          #{orderNumber || orderId?.slice(-4).toUpperCase()}
                        </span>
                      </div>
                      
                      {nextStatus && (
                        <Button
                          size="sm"
                          className="gap-1.5 rounded-full bg-primary hover:bg-primary/90"
                          onClick={() => handleStatusChange(nextStatus)}
                          disabled={isUpdatingStatus}
                        >
                          {isUpdatingStatus ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              {currentStatus.nextLabel}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Customer Bottom Stats Panel */}
        {!isProvider && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/85 to-transparent pointer-events-auto"
          >
            {/* Stats row */}
            <div className="px-4 pt-6 pb-3">
              <div className="flex items-center justify-around bg-white/10 backdrop-blur-xl rounded-2xl p-4 mb-4">
                {/* Speed */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-primary mb-1">
                    <Gauge className="h-4 w-4" />
                  </div>
                  <p className="text-white font-bold text-2xl">{currentSpeed}</p>
                  <p className="text-white/60 text-xs">كم/س</p>
                </div>

                {/* Divider */}
                <div className="w-px h-12 bg-white/20" />

                {/* ETA */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-blue-400 mb-1">
                    <Clock className="h-4 w-4" />
                  </div>
                  <p className="text-white font-bold text-2xl">{routeInfo?.duration || '--'}</p>
                  <p className="text-white/60 text-xs">الوقت المتوقع</p>
                </div>

                {/* Divider */}
                <div className="w-px h-12 bg-white/20" />

                {/* Distance */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1 text-green-400 mb-1">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <p className="text-white font-bold text-2xl">{routeInfo?.distance || '--'}</p>
                  <p className="text-white/60 text-xs">المسافة الكلية</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                {/* Mute button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>

                {/* End navigation button */}
                <Button
                  className="flex-1 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-base gap-2"
                  onClick={onExit}
                >
                  <X className="h-5 w-5" />
                  إنهاء الملاحة
                </Button>

                {/* Recenter button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  onClick={recenterMap}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Safe area padding for iPhone */}
            <div className="h-6 bg-black" />
          </motion.div>
        )}

        {/* Compass indicator */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-28 right-4 w-14 h-14 rounded-full bg-black/80 backdrop-blur-xl flex items-center justify-center pointer-events-auto"
        >
          <div 
            className="relative w-10 h-10"
            style={{ transform: `rotate(${-heading}deg)` }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-l-transparent border-r-transparent border-b-red-500" />
            </div>
            <div className="absolute inset-0 flex items-end justify-center">
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[12px] border-l-transparent border-r-transparent border-t-white/50" />
            </div>
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-red-400">N</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export const InAppNavigationMode = memo(InAppNavigationModeComponent);
