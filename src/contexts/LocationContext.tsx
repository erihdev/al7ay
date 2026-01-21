import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LocationContextType {
  userLocation: { lat: number; lng: number } | null;
  storeLocation: { lat: number; lng: number } | null;
  deliveryRadius: number;
  isWithinDeliveryZone: boolean;
  distance: number | null;
  locationPermission: 'granted' | 'denied' | 'prompt' | 'loading';
  requestLocation: () => Promise<void>;
  storeName: string;
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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [storeLocation, setStoreLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryRadius, setDeliveryRadius] = useState(1000);
  const [storeName, setStoreName] = useState('الحي');
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'loading'>('loading');

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

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationPermission('granted');
      },
      (error) => {
        // Error codes: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        if (error.code === 1) {
          setLocationPermission('denied');
        } else if (error.code === 2) {
          // Position unavailable - try again with lower accuracy
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
              setLocationPermission('granted');
            },
            () => {
              setLocationPermission('denied');
            },
            {
              enableHighAccuracy: false,
              timeout: 30000,
              maximumAge: 600000,
            }
          );
        } else if (error.code === 3) {
          // Timeout - retry with longer timeout
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
              setLocationPermission('granted');
            },
            () => {
              setLocationPermission('denied');
            },
            {
              enableHighAccuracy: false,
              timeout: 60000,
              maximumAge: 600000,
            }
          );
        } else {
          setLocationPermission('denied');
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
    
    // First check permission status
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        
        if (result.state === 'denied') {
          setLocationPermission('denied');
          return;
        }
      } catch {
        // Permission query not supported - continue anyway
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
        storeLocation,
        deliveryRadius,
        isWithinDeliveryZone,
        distance,
        locationPermission,
        requestLocation,
        storeName,
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
