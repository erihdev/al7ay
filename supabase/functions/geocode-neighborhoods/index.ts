import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Neighborhood {
  id: string;
  name: string;
  city: string;
  governorate: string | null;
  region: string | null;
  lat: number;
  lng: number;
}

interface GeocodeResult {
  id: string;
  name: string;
  old_lat: number;
  old_lng: number;
  new_lat: number | null;
  new_lng: number | null;
  status: 'updated' | 'not_found' | 'error' | 'unchanged';
  distance_km?: number;
}

async function geocodeLocation(name: string, city: string, region: string | null, mapboxToken: string): Promise<{ lat: number; lng: number } | null> {
  // Build search query with location context
  const searchQuery = `${name}, ${city}, ${region || ''}, السعودية`;
  const encodedQuery = encodeURIComponent(searchQuery);
  
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&country=SA&language=ar&limit=1`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error(`Geocoding error for ${name}:`, error);
    return null;
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { dryRun = true, minDistanceKm = 5 } = await req.json().catch(() => ({}));

    // Fetch all neighborhoods
    const { data: neighborhoods, error } = await supabase
      .from("active_neighborhoods")
      .select("id, name, city, governorate, region, lat, lng")
      .order("name");

    if (error) throw error;

    const results: GeocodeResult[] = [];
    let updatedCount = 0;
    let notFoundCount = 0;
    let unchangedCount = 0;

    for (const neighborhood of neighborhoods as Neighborhood[]) {
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

      const newCoords = await geocodeLocation(
        neighborhood.name,
        neighborhood.city,
        neighborhood.region,
        mapboxToken
      );

      if (!newCoords) {
        results.push({
          id: neighborhood.id,
          name: `${neighborhood.name} - ${neighborhood.city}`,
          old_lat: neighborhood.lat,
          old_lng: neighborhood.lng,
          new_lat: null,
          new_lng: null,
          status: 'not_found'
        });
        notFoundCount++;
        continue;
      }

      const distance = calculateDistance(
        neighborhood.lat,
        neighborhood.lng,
        newCoords.lat,
        newCoords.lng
      );

      // Only update if distance is significant (more than minDistanceKm)
      if (distance >= minDistanceKm) {
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from("active_neighborhoods")
            .update({ lat: newCoords.lat, lng: newCoords.lng })
            .eq("id", neighborhood.id);

          if (updateError) {
            results.push({
              id: neighborhood.id,
              name: `${neighborhood.name} - ${neighborhood.city}`,
              old_lat: neighborhood.lat,
              old_lng: neighborhood.lng,
              new_lat: newCoords.lat,
              new_lng: newCoords.lng,
              status: 'error',
              distance_km: distance
            });
            continue;
          }
        }

        results.push({
          id: neighborhood.id,
          name: `${neighborhood.name} - ${neighborhood.city}`,
          old_lat: neighborhood.lat,
          old_lng: neighborhood.lng,
          new_lat: newCoords.lat,
          new_lng: newCoords.lng,
          status: 'updated',
          distance_km: distance
        });
        updatedCount++;
      } else {
        results.push({
          id: neighborhood.id,
          name: `${neighborhood.name} - ${neighborhood.city}`,
          old_lat: neighborhood.lat,
          old_lng: neighborhood.lng,
          new_lat: newCoords.lat,
          new_lng: newCoords.lng,
          status: 'unchanged',
          distance_km: distance
        });
        unchangedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        minDistanceKm,
        summary: {
          total: neighborhoods.length,
          updated: updatedCount,
          not_found: notFoundCount,
          unchanged: unchangedCount
        },
        results: results.filter(r => r.status !== 'unchanged') // Only show significant results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
