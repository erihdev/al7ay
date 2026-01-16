import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
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

    // Create simple JWT for VAPID
    const createSimpleJwt = async (audience: string): Promise<string> => {
      const header = { alg: 'ES256', typ: 'JWT' };
      const now = Math.floor(Date.now() / 1000);
      const claims = {
        aud: audience,
        exp: now + 12 * 60 * 60,
        sub: 'mailto:admin@al7ay.lovable.app',
      };

      const headerB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
      const claimsB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(claims)));
      const unsignedToken = `${headerB64}.${claimsB64}`;

      try {
        // Convert private key from base64url to raw bytes
        const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
        
        // Import as raw P-256 private key (32 bytes)
        const keyData = await crypto.subtle.importKey(
          'raw',
          privateKeyBytes.buffer as ArrayBuffer,
          { name: 'ECDSA', namedCurve: 'P-256' },
          false,
          ['sign']
        );

        const signature = await crypto.subtle.sign(
          { name: 'ECDSA', hash: 'SHA-256' },
          keyData,
          new TextEncoder().encode(unsignedToken)
        );

        const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signature));
        return `${unsignedToken}.${signatureB64}`;
      } catch (e) {
        console.error('JWT signing failed:', e);
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
            const jwt = await createSimpleJwt(audience);
            authHeader = `vapid t=${jwt}, k=${vapidPublicKey}`;
          } catch (vapidError) {
            console.error('⚠️ VAPID auth failed, trying without:', vapidError);
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
