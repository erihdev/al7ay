import { useMemo } from 'react';

interface Location {
  lat: number;
  lng: number;
}

// Haversine formula to calculate distance between two points
function calculateDistance(from: Location, to: Location): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Average speeds for different scenarios (km/h)
const AVERAGE_SPEEDS = {
  walking: 5,
  scooter: 25,
  car: 30, // Urban average considering traffic
};

interface ETAResult {
  distanceMeters: number;
  distanceText: string;
  etaMinutes: number;
  etaText: string;
  progress: number; // 0-100%
}

export function useDeliveryETA(
  driverLocation: Location | null,
  destinationLocation: Location | null,
  storeLocation: Location | null,
  currentSpeed?: number // km/h
): ETAResult | null {
  return useMemo(() => {
    if (!driverLocation || !destinationLocation) {
      return null;
    }

    // Calculate remaining distance
    const remainingDistance = calculateDistance(driverLocation, destinationLocation);
    
    // Calculate total distance from store to destination
    const totalDistance = storeLocation 
      ? calculateDistance(storeLocation, destinationLocation)
      : remainingDistance;
    
    // Calculate progress
    const coveredDistance = totalDistance - remainingDistance;
    const progress = totalDistance > 0 
      ? Math.min(100, Math.max(0, (coveredDistance / totalDistance) * 100))
      : 0;

    // Format distance
    const distanceText = remainingDistance >= 1000
      ? `${(remainingDistance / 1000).toFixed(1)} كم`
      : `${Math.round(remainingDistance)} م`;

    // Calculate ETA based on current speed or average
    const effectiveSpeed = currentSpeed && currentSpeed > 5 
      ? currentSpeed 
      : AVERAGE_SPEEDS.scooter;
    
    // Convert to minutes: distance (m) / (speed (km/h) * 1000 / 60)
    const etaMinutes = (remainingDistance / 1000) / effectiveSpeed * 60;
    
    // Format ETA
    let etaText: string;
    if (etaMinutes < 1) {
      etaText = 'أقل من دقيقة';
    } else if (etaMinutes < 60) {
      etaText = `${Math.ceil(etaMinutes)} دقيقة`;
    } else {
      const hours = Math.floor(etaMinutes / 60);
      const mins = Math.ceil(etaMinutes % 60);
      etaText = `${hours} ساعة و ${mins} دقيقة`;
    }

    return {
      distanceMeters: remainingDistance,
      distanceText,
      etaMinutes,
      etaText,
      progress,
    };
  }, [driverLocation, destinationLocation, storeLocation, currentSpeed]);
}

// Hook to get route history and display on map
export function formatRouteForMap(
  routeHistory: Array<{ lat: number; lng: number; recorded_at: string }>
): GeoJSON.Feature<GeoJSON.LineString> | null {
  if (!routeHistory || routeHistory.length < 2) {
    return null;
  }

  const coordinates = routeHistory
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map(point => [point.lng, point.lat] as [number, number]);

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates,
    },
  };
}
