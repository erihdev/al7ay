// Native-aware OAuth (Google / Apple) sign-in for Capacitor + Supabase.
//
// On the web (PWA / browser) we keep using the existing Lovable cloud-auth flow,
// because window.location.origin is a real https URL that the provider can redirect to.
//
// Inside the native app (Capacitor iOS / Android) window.location.origin is something
// like capacitor://localhost which OAuth providers reject -> the user sees a 404.
// So on native we:
//   1. Ask Supabase for the provider URL with redirectTo = a deep link (al7ay://auth-callback)
//      and skipBrowserRedirect so WE control the navigation.
//   2. Open that URL in the system browser (@capacitor/browser).
//   3. Listen for the app being re-opened via the deep link (@capacitor/app appUrlOpen).
//   4. Exchange the returned code (or tokens) for a Supabase session, then close the browser.
//
// BACKEND CONFIG REQUIRED for native to work end-to-end (must be done once in dashboards):
//   - Supabase -> Authentication -> URL Configuration -> Redirect URLs: add  al7ay://auth-callback
//   - Supabase -> Authentication -> Providers: enable Google and Apple with valid credentials
//   - Apple: a "Sign in with Apple" Services ID configured for the Supabase callback

import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

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

    // Listen for the deep-link redirect back into the app.
    const handle = await App.addListener('appUrlOpen', async ({ url }) => {
      if (!url || !url.startsWith('al7ay://auth-callback')) return;
      try {
        await completeSessionFromUrl(url);
      } catch (e) {
        console.error('OAuth callback error:', e);
      } finally {
        try { await Browser.close(); } catch { /* browser may already be closed */ }
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
  // Web / PWA: keep the existing Lovable hosted flow (works with https origin).
  const result = await lovable.auth.signInWithOAuth(provider, {
    redirect_uri: window.location.origin,
  });
  return { error: result.error ?? null };
}
