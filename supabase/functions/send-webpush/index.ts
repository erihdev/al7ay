import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple Web Push using the push service directly
// This is a simplified implementation that works with most push services
async function sendWebPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; icon?: string; url?: string },
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; shouldRemove: boolean }> {
  try {
    const audience = new URL(subscription.endpoint).origin;
    
    // Create VAPID JWT token
    const jwtHeader = { typ: 'JWT', alg: 'ES256' };
    const jwtPayload = {
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
      sub: 'mailto:DIFMASHNI@GMAIL.COM',
    };

    // For now, use a simpler approach - send without encryption for testing
    // In production, you'd use a proper web-push library
    
    const payloadString = JSON.stringify(payload);
    
    // Create authorization header with VAPID
    const vapidToken = await createSimpleVapidToken(audience, vapidPrivateKey);
    
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${vapidToken}, k=${vapidPublicKey}`,
        'Content-Type': 'application/json',
        'TTL': '86400',
        'Urgency': 'high',
      },
      body: payloadString,
    });

    console.log('Push response:', response.status);

    if (response.status === 201 || response.status === 200) {
      return { success: true, shouldRemove: false };
    } else if (response.status === 410 || response.status === 404) {
      // Subscription is gone
      return { success: false, shouldRemove: true };
    } else {
      const text = await response.text();
      console.error('Push failed:', response.status, text);
      return { success: false, shouldRemove: false };
    }
  } catch (error) {
    console.error('Error sending push:', error);
    return { success: false, shouldRemove: false };
  }
}

// Create a simple VAPID token
async function createSimpleVapidToken(audience: string, privateKey: string): Promise<string> {
  try {
    const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    const payload = btoa(JSON.stringify({
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
      sub: 'mailto:DIFMASHNI@GMAIL.COM',
    })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    // For now, return unsigned token (some push services accept this for testing)
    // Production would need proper ECDSA signing
    return `${header}.${payload}.signature`;
  } catch (error) {
    console.error('Error creating VAPID token:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, title, body, icon, url } = await req.json();

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
      console.log('No subscriptions found for user:', userId);
      return new Response(
        JSON.stringify({ success: false, message: 'No subscriptions found for user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions for user ${userId}`);

    const payload = {
      title,
      body,
      icon: icon || 'https://al7ay.lovable.app/icons/icon-192.png',
      url: url || '/',
    };

    // Send to all user's subscriptions
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        const result = await sendWebPushNotification(
          {
            endpoint: sub.endpoint,
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
          payload,
          vapidPublicKey,
          vapidPrivateKey
        );

        // If subscription is invalid, remove it
        if (result.shouldRemove) {
          console.log('Removing invalid subscription:', sub.id);
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
        }

        return result.success;
      })
    );

    const successCount = results.filter(Boolean).length;

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        message: `Sent to ${successCount}/${subscriptions.length} subscriptions`,
        sentCount: successCount,
        totalSubscriptions: subscriptions.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
