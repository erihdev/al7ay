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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending scheduled notifications that are due
    const now = new Date().toISOString();
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now);

    if (fetchError) {
      console.error('Error fetching scheduled notifications:', fetchError);
      throw fetchError;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log('No pending scheduled notifications');
      return new Response(
        JSON.stringify({ message: 'No pending notifications', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${pendingNotifications.length} scheduled notifications`);

    let processedCount = 0;
    let errorCount = 0;

    for (const notification of pendingNotifications) {
      try {
        // Call the send-notification function with bulk_notification type
        const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'bulk_notification',
            title: notification.title,
            message: notification.body,
            tier: notification.tier_filter || undefined,
            neighborhoodId: notification.neighborhood_filter || undefined
          }),
        });

        if (response.ok) {
          const result = await response.json();
          
          // Update the notification status to sent
          await supabase
            .from('scheduled_notifications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              recipients_count: result.sentCount || 0
            })
            .eq('id', notification.id);

          // If using a template, increment usage count
          if (notification.template_id) {
            await supabase.rpc('increment_template_usage', { template_id: notification.template_id });
          }

          processedCount++;
          console.log(`Notification ${notification.id} sent successfully`);
        } else {
          const errorText = await response.text();
          throw new Error(errorText);
        }
      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        
        // Update the notification status to failed
        await supabase
          .from('scheduled_notifications')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', notification.id);

        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Scheduled notifications processed',
        processed: processedCount,
        errors: errorCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
