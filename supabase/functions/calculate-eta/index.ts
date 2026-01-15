import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ETARequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mapboxToken = Deno.env.get("MAPBOX_ACCESS_TOKEN");

    if (!mapboxToken) {
      throw new Error("MAPBOX_ACCESS_TOKEN not configured");
    }

    const { origin, destination }: ETARequest = await req.json();

    if (!origin || !destination) {
      throw new Error("Origin and destination are required");
    }

    // Call Mapbox Directions API
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?access_token=${mapboxToken}&geometries=geojson&overview=full`;

    const response = await fetch(directionsUrl);
    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      // Fallback to straight-line calculation
      const distance = calculateHaversineDistance(origin, destination);
      const duration = (distance / 1000) / 30 * 60; // Assume 30 km/h average

      return new Response(
        JSON.stringify({
          distance: distance,
          duration: duration * 60, // seconds
          distanceText: formatDistance(distance),
          durationText: formatDuration(duration * 60),
          geometry: null,
          source: 'fallback'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const route = data.routes[0];

    return new Response(
      JSON.stringify({
        distance: route.distance, // meters
        duration: route.duration, // seconds
        distanceText: formatDistance(route.distance),
        durationText: formatDuration(route.duration),
        geometry: route.geometry,
        source: 'mapbox'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("ETA calculation error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Haversine formula for fallback
function calculateHaversineDistance(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const R = 6371e3; // Earth's radius in meters
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
