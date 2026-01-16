import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Dynamic import web-push
    const webpush = await import("https://esm.sh/web-push@3.6.7?target=deno");
    
    webpush.setVapidDetails(
      'mailto:admin@al7ay.lovable.app',
      vapidPublicKey,
      vapidPrivateKey
    );

    // Send to all user's subscriptions
    const results = await Promise.all(
      subscriptions.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          console.log('📤 Sending to:', sub.endpoint.substring(0, 60) + '...');
          await webpush.sendNotification(pushSubscription, payload);
          console.log('✅ Push sent successfully');
          return { success: true, subscriptionId: sub.id };
        } catch (err: unknown) {
          const error = err as { statusCode?: number; body?: string; message?: string };
          console.error('❌ Push failed:', error.statusCode, error.body || error.message);
          
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log('🗑️ Removing expired subscription:', sub.id);
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
            return { success: false, subscriptionId: sub.id, removed: true };
          }
          
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
