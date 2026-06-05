// Native-aware OAuth (Google / Apple) sign-in for Capacitor + Supabase.
//
// Web (PWA / browser): use Supabase's standard OAuth redirect with window.location.origin.
// Native app (Capacitor iOS / Android): window.location.origin is capacitor://localhost which
// OAuth providers reject (404). So we ask Supabase for the provider URL with a deep-link
// redirect (al7ay://auth-callback), open it in the system browser, catch the deep link, and
// exchange the returned code/tokens for a Supabase session.
//
// BACKEND CONFIG (once, in the Supabase dashboard you now own):
//   - Authentication -> URL Configuration -> Redirect URLs: add  al7ay://auth-callback
//   - Authentication -> Providers: Google and Apple are already enabled.

import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export const OAUTH_DEEP_LINK = 'al7ay://auth-callback';

type Provider = 'google' | 'apple';

export interface OAuthResult {
  error: Error | null;
}

/** Complete a Supabase session from the deep-link callback URL. */
async function completeSessionFromUrl(url: string): Promise<void> {
  // Authorization-code (PKCE) flow: ?code=...
  const query = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const code = new URLSearchParams(query).get('code');
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    return;
  }

  // Implicit flow: #access_token=...&refresh_token=...
  const hash = url.includes('#') ? url.split('#')[1] : '';
  if (hash) {
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  }
}

async function nativeOAuth(provider: Provider): Promise<OAuthResult> {
  try {
    const { Browser } = await import('@capacitor/browser');
    const { App } = await import('@capacitor/app');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: OAUTH_DEEP_LINK,
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error };
    if (!data?.url) return { error: new Error('تعذّر بدء تسجيل الدخول') };

    const handle = await App.addListener('appUrlOpen', async ({ url }) => {
      if (!url || !url.startsWith('al7ay://auth-callback')) return;
      try {
        await completeSessionFromUrl(url);
      } catch (e) {
        console.error('OAuth callback error:', e);
      } finally {
        try { await Browser.close(); } catch { /* already closed */ }
        await handle.remove();
      }
    });

    await Browser.open({ url: data.url, presentationStyle: 'popover' });
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}

/** Sign in with an OAuth provider, choosing the correct flow for the platform. */
export async function signInWithProvider(provider: Provider): Promise<OAuthResult> {
  if (Capacitor.isNativePlatform()) {
    return nativeOAuth(provider);
  }
  // Web / PWA: standard Supabase OAuth redirect.
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
  return { error: error ?? null };
}
