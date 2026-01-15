import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Location {
  lat: number;
  lng: number;
}

interface ETAResult {
  distanceMeters: number;
  distanceText: string;
  etaSeconds: number;
  etaMinutes: number;
  etaText: string;
  progress: number;
  geometry: GeoJSON.LineString | null;
  source: 'mapbox' | 'fallback';
  isNearby: boolean; // Within 500m
}

export function useAccurateETA(
  driverLocation: Location | null,
  destinationLocation: Location | null,
  storeLocation: Location | null
) {
  const [eta, setEta] = useState<ETAResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchRef = useRef<number>(0);
  const previousNearbyRef = useRef<boolean>(false);

  const fetchETA = useCallback(async () => {
    if (!driverLocation || !destinationLocation) {
      setEta(null);
      return;
    }

    // Throttle requests - max once every 10 seconds
    const now = Date.now();
    if (now - lastFetchRef.current < 10000) {
      return;
    }
    lastFetchRef.current = now;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-eta', {
        body: {
          origin: driverLocation,
          destination: destinationLocation
        }
      });

      if (error) throw error;

      // Calculate progress
      let progress = 0;
      if (storeLocation) {
        const { data: totalData } = await supabase.functions.invoke('calculate-eta', {
          body: {
            origin: storeLocation,
            destination: destinationLocation
          }
        });

        if (totalData && totalData.distance > 0) {
          const covered = totalData.distance - data.distance;
          progress = Math.min(100, Math.max(0, (covered / totalData.distance) * 100));
        }
      }

      const isNearby = data.distance <= 500; // Within 500 meters

      setEta({
        distanceMeters: data.distance,
        distanceText: data.distanceText,
        etaSeconds: data.duration,
        etaMinutes: data.duration / 60,
        etaText: data.durationText,
        progress,
        geometry: data.geometry,
        source: data.source,
        isNearby
      });

    } catch (error) {
      console.error('Failed to fetch ETA:', error);
      // Fallback to local calculation
      const distance = calculateDistance(driverLocation, destinationLocation);
      const duration = (distance / 1000) / 30 * 60; // 30 km/h average
      const isNearby = distance <= 500;

      setEta({
        distanceMeters: distance,
        distanceText: formatDistance(distance),
        etaSeconds: duration * 60,
        etaMinutes: duration,
        etaText: formatDuration(duration * 60),
        progress: 0,
        geometry: null,
        source: 'fallback',
        isNearby
      });
    } finally {
      setIsLoading(false);
    }
  }, [driverLocation, destinationLocation, storeLocation]);

  // Fetch on location change
  useEffect(() => {
    fetchETA();
  }, [fetchETA]);

  return { eta, isLoading, refetch: fetchETA };
}

// Helper functions
function calculateDistance(from: Location, to: Location): number {
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
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} كم`;
  }
  return `${Math.round(meters)} م`;
}

function formatDuration(seconds: number): string {
  const minutes = seconds / 60;
  if (minutes < 1) {
    return 'أقل من دقيقة';
  } else if (minutes < 60) {
    return `${Math.ceil(minutes)} دقيقة`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = Math.ceil(minutes % 60);
    return `${hours} ساعة و ${mins} دقيقة`;
  }
}
