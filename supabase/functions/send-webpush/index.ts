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

// Concatenate Uint8Arrays
function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// HKDF implementation using Web Crypto
async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    ikm.buffer as ArrayBuffer,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt.buffer as ArrayBuffer,
      info: info.buffer as ArrayBuffer,
    },
    key,
    length * 8
  );

  return new Uint8Array(bits);
}

// Create info for HKDF
function createInfo(type: string, clientPublicKey: Uint8Array, serverPublicKey: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const typeBytes = encoder.encode(type);
  const nul = new Uint8Array([0]);
  
  const header = encoder.encode('Content-Encoding: ');
  const p256 = encoder.encode('P-256');
  
  const clientLen = new Uint8Array([0, clientPublicKey.length]);
  const serverLen = new Uint8Array([0, serverPublicKey.length]);
  
  return concatUint8Arrays(
    header, typeBytes, nul, p256, nul,
    clientLen, clientPublicKey,
    serverLen, serverPublicKey
  );
}

// Encrypt payload using aes128gcm
async function encryptPayload(
  payload: string,
  clientPublicKeyBase64: string,
  authSecretBase64: string
): Promise<{ encrypted: Uint8Array; serverPublicKey: Uint8Array }> {
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payload);
  
  const clientPublicKey = base64UrlToUint8Array(clientPublicKeyBase64);
  const authSecret = base64UrlToUint8Array(authSecretBase64);
  
  // Generate server's ECDH key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  
  const serverPublicKeyRaw = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey);
  const serverPublicKey = new Uint8Array(serverPublicKeyRaw);
  
  // Import client's public key
  const clientKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKey.buffer as ArrayBuffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  
  // Derive shared secret using ECDH
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientKey },
    serverKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);
  
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derive PRK using HKDF with auth secret
  const authInfo = encoder.encode('Content-Encoding: auth\0');
  const prk = await hkdf(authSecret, sharedSecret, authInfo, 32);
  
  // Derive content encryption key
  const cekInfo = createInfo('aes128gcm', clientPublicKey, serverPublicKey);
  const contentEncryptionKey = await hkdf(salt, prk, cekInfo, 16);
  
  // Derive nonce
  const nonceInfo = createInfo('nonce', clientPublicKey, serverPublicKey);
  const nonce = await hkdf(salt, prk, nonceInfo, 12);
  
  // Add padding delimiter (0x02) to payload
  const paddedPayload = concatUint8Arrays(payloadBytes, new Uint8Array([2]));
  
  // Encrypt using AES-GCM
  const key = await crypto.subtle.importKey(
    'raw',
    contentEncryptionKey.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce.buffer as ArrayBuffer },
    key,
    paddedPayload.buffer as ArrayBuffer
  );
  
  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65)
  const rs = new Uint8Array([0, 0, 16, 0]); // record size = 4096
  const idlen = new Uint8Array([serverPublicKey.length]);
  
  const encrypted = concatUint8Arrays(
    salt,
    rs,
    idlen,
    serverPublicKey,
    new Uint8Array(ciphertext)
  );
  
  return { encrypted, serverPublicKey };
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
      const publicKeyBytes = base64UrlToUint8Array(vapidPublicKey);
      const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);

      const x = uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33));
      const y = uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65));
      const d = uint8ArrayToBase64Url(privateKeyBytes);

      const jwk = { kty: 'EC', crv: 'P-256', x, y, d };
      const privateKey = await importJWK(jwk, 'ES256');

      return await new SignJWT({})
        .setProtectedHeader({ alg: 'ES256', typ: 'JWT' })
        .setAudience(audience)
        .setSubject('mailto:admin@al7ay.lovable.app')
        .setExpirationTime('12h')
        .sign(privateKey);
    };

    // Send to all user's subscriptions
    const results = await Promise.all(
      subscriptions.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
        try {
          console.log('📤 Sending to:', sub.endpoint.substring(0, 60) + '...');
          
          const endpointUrl = new URL(sub.endpoint);
          const audience = endpointUrl.origin;
          
          // Create VAPID JWT
          const jwt = await createVapidJwt(audience);
          const authHeader = `vapid t=${jwt}, k=${vapidPublicKey}`;
          
          // Encrypt the payload
          console.log('🔐 Encrypting payload...');
          const { encrypted } = await encryptPayload(payload, sub.p256dh, sub.auth);
          console.log('✅ Payload encrypted, size:', encrypted.length);

          // Send push notification
          const response = await fetch(sub.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Encoding': 'aes128gcm',
              'Content-Length': encrypted.length.toString(),
              'TTL': '86400',
              'Authorization': authHeader,
            },
            body: encrypted.buffer as ArrayBuffer,
          });

          if (response.ok || response.status === 201) {
            console.log('✅ Push sent successfully');
            return { success: true, subscriptionId: sub.id };
          } else {
            const errorText = await response.text();
            console.error('❌ Push failed:', response.status, errorText);
            
            // Remove subscription for expired, not found, or VAPID mismatch errors
            if (response.status === 410 || response.status === 404) {
              console.log('🗑️ Removing expired subscription:', sub.id);
              await supabase.from('push_subscriptions').delete().eq('id', sub.id);
              return { success: false, subscriptionId: sub.id, removed: true, reason: 'expired' };
            }
            
            // Handle VapidPkHashMismatch - delete the invalid subscription
            if (response.status === 400 && errorText.includes('VapidPkHashMismatch')) {
              console.log('🗑️ Removing subscription with VAPID mismatch:', sub.id);
              await supabase.from('push_subscriptions').delete().eq('id', sub.id);
              return { success: false, subscriptionId: sub.id, removed: true, reason: 'vapid_mismatch' };
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
