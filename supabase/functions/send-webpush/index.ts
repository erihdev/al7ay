import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT, importJWK } from "https://deno.land/x/jose@v5.2.0/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert base64url to Uint8Array
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Convert Uint8Array to base64url
function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, title, body, icon, url } = await req.json();
    console.log('📬 Received push request:', { userId, title, body });

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No subscriptions found for user:', userId);
      return new Response(
        JSON.stringify({ success: false, message: 'No subscriptions found for user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📦 Found ${subscriptions.length} subscriptions for user ${userId}`);

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: url || '/' },
    });

    // Create VAPID JWT using jose with JWK
    const createVapidJwt = async (audience: string): Promise<string> => {
      try {
        // Get raw bytes from base64url keys
        const publicKeyBytes = base64UrlToUint8Array(vapidPublicKey);
        const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);

        console.log(`📏 Key lengths - Public: ${publicKeyBytes.length}, Private: ${privateKeyBytes.length}`);

        // Extract x and y coordinates from public key (skip the first byte which is 0x04)
        const x = uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33));
        const y = uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65));
        const d = uint8ArrayToBase64Url(privateKeyBytes);

        // Create JWK for EC P-256 private key
        const jwk = {
          kty: 'EC',
          crv: 'P-256',
          x: x,
          y: y,
          d: d,
        };

        console.log('🔑 Importing JWK...');
        const privateKey = await importJWK(jwk, 'ES256');

        const jwt = await new SignJWT({})
          .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
          .setAudience(audience)
          .setSubject('mailto:admin@al7ay.lovable.app')
          .setExpirationTime('12h')
          .sign(privateKey);

        console.log('✅ JWT created successfully');
        return jwt;
      } catch (e) {
        console.error('JWT creation failed:', e);
        throw e;
      }
    };

    // Send to all user's subscriptions
    const results = await Promise.all(
      subscriptions.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
        try {
          console.log('📤 Sending to:', sub.endpoint.substring(0, 60) + '...');
          
          const endpointUrl = new URL(sub.endpoint);
          const audience = endpointUrl.origin;
          
          let authHeader = '';
          try {
            const jwt = await createVapidJwt(audience);
            authHeader = `vapid t=${jwt}, k=${vapidPublicKey}`;
          } catch (vapidError) {
            console.error('⚠️ VAPID auth failed:', vapidError);
          }

          // Send push notification
          const response = await fetch(sub.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'TTL': '86400',
              ...(authHeader ? { 'Authorization': authHeader } : {}),
            },
            body: payload,
          });

          if (response.ok || response.status === 201) {
            console.log('✅ Push sent successfully');
            return { success: true, subscriptionId: sub.id };
          } else {
            const errorText = await response.text();
            console.error('❌ Push failed:', response.status, errorText);
            
            if (response.status === 410 || response.status === 404) {
              console.log('🗑️ Removing expired subscription:', sub.id);
              await supabase.from('push_subscriptions').delete().eq('id', sub.id);
              return { success: false, subscriptionId: sub.id, removed: true };
            }
            
            return { success: false, subscriptionId: sub.id, error: `${response.status}: ${errorText}` };
          }
        } catch (err: unknown) {
          const error = err as { message?: string };
          console.error('❌ Push error:', error.message);
          return { success: false, subscriptionId: sub.id, error: error.message };
        }
      })
    );

    const successCount = results.filter((r: { success: boolean }) => r.success).length;
    console.log(`📊 Sent ${successCount}/${subscriptions.length} successfully`);

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        message: `Sent to ${successCount}/${subscriptions.length} subscriptions`,
        sentCount: successCount,
        totalSubscriptions: subscriptions.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
