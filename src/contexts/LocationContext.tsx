import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { toast } from 'sonner';

interface LocationContextType {
  userLocation: { lat: number; lng: number } | null;
  userAddress: string | null;
  storeLocation: { lat: number; lng: number } | null;
  deliveryRadius: number;
  isWithinDeliveryZone: boolean;
  distance: number | null;
  locationPermission: 'granted' | 'denied' | 'prompt' | 'loading';
  requestLocation: () => Promise<void>;
  setUserLocation: (location: { lat: number; lng: number }) => void;
  resolveAddress: (lat: number, lng: number) => Promise<string | null>;
  storeName: string;
  isLoadingAddress: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocationState] = useState<{ lat: number; lng: number } | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [storeLocation, setStoreLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryRadius, setDeliveryRadius] = useState(1000);
  const [storeName, setStoreName] = useState('الحي');
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'loading'>('loading');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const { data: mapboxToken } = useMapboxToken();

  useEffect(() => {
    // Fetch store settings
    const fetchStoreSettings = async () => {
      const { data } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .single();

      if (data) {
        setStoreLocation({
          lat: data.store_location_lat,
          lng: data.store_location_lng,
        });
        setDeliveryRadius(data.delivery_radius_meters);
        setStoreName(data.store_name);
      }
    };

    fetchStoreSettings();

    // Check location permission
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');

        if (result.state === 'granted') {
          getCurrentPosition();
        }
      });
    } else {
      setLocationPermission('prompt');
    }
  }, []);

  // Resolve address when user location changes significantly
  useEffect(() => {
    if (userLocation && !userAddress && mapboxToken) {
      resolveAddress(userLocation.lat, userLocation.lng);
    }
  }, [userLocation, mapboxToken]);

  const resolveAddress = async (lat: number, lng: number): Promise<string | null> => {
    if (!mapboxToken) return null;

    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=ar`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        setUserAddress(address);
        return address;
      }
    } catch (error) {
      console.error('Error resolving address:', error);
    } finally {
      setIsLoadingAddress(false);
    }
    return null;
  };

  const setUserLocation = (location: { lat: number; lng: number }) => {
    setUserLocationState(location);
    // Address will be resolved by the effect or manually if needed
  };

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocationState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationPermission('granted');
      },
      (error) => {
        if (error.code === 1) {
          setLocationPermission('denied');
        } else {
          // Retry logic could go here, but kept simple for now
          // Could implement the retry with lower accuracy fallback like before if needed
          console.warn('Geolocation error', error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  };

  const requestLocation = async () => {
    setLocationPermission('loading');

    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (result.state === 'denied') {
          setLocationPermission('denied');
          toast.error('يرجى تفعيل خدمة الموقع من إعدادات المتصفح');
          return;
        }
      } catch {
        // Ignore
      }
    }

    getCurrentPosition();
  };

  const distance =
    userLocation && storeLocation
      ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        storeLocation.lat,
        storeLocation.lng
      )
      : null;

  const isWithinDeliveryZone = distance !== null && distance <= deliveryRadius;

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        userAddress,
        storeLocation,
        deliveryRadius,
        isWithinDeliveryZone,
        distance,
        locationPermission,
        requestLocation,
        setUserLocation,
        resolveAddress,
        storeName,
        isLoadingAddress,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
