// App entry point
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/** Fade out and remove the HTML splash screen */
function removeHtmlSplash() {
  const s = document.getElementById("html-splash");
  if (!s) return;
  s.style.opacity = "0";
  setTimeout(() => { document.getElementById("html-splash")?.remove(); }, 400);
}

/** Show a visible error on screen — helps diagnose crashes on real devices */
function showFatalError(err: unknown) {
  removeHtmlSplash();
  const msg = err instanceof Error ? `${err.message}\n\n${err.stack ?? ""}` : String(err);
  const div = document.createElement("div");
  div.style.cssText =
    "position:fixed;inset:0;z-index:99999;background:#0d1f17;color:#f87171;" +
    "padding:24px;font-family:monospace;font-size:13px;overflow:auto;white-space:pre-wrap;direction:ltr";
  div.textContent = "🚨 App Error:\n\n" + msg;
  document.body.appendChild(div);
}

try {
  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);
  // Remove splash after React's first paint (double rAF = after layout + paint)
  requestAnimationFrame(() => requestAnimationFrame(removeHtmlSplash));
} catch (err) {
  showFatalError(err);
}
