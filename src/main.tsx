// App entry point
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// Detect Capacitor (native app) environment
const isCapacitor = typeof (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor !== 'undefined';

Sentry.init({
    dsn: "https://139bc0d0ec25af6e6b1fe61262a918db@o4510939233976320.ingest.us.sentry.io/4510939838349312",
    integrations: isCapacitor
        // Disable replay in Capacitor — can cause WebView issues
        ? [Sentry.browserTracingIntegration()]
        : [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 1.0,
    tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
    replaysSessionSampleRate: isCapacitor ? 0 : 0.1,
    replaysOnErrorSampleRate: isCapacitor ? 0 : 1.0,
});

/** Remove the HTML splash screen with a fade after React mounts */
function removeHtmlSplash() {
  const s = document.getElementById("html-splash");
  if (!s) return;
  s.style.opacity = "0";
  setTimeout(() => { const el = document.getElementById("html-splash"); if (el) el.remove(); }, 400);
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Remove splash after React's first paint (double rAF = after layout + paint)
requestAnimationFrame(() => requestAnimationFrame(removeHtmlSplash));
