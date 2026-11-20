import { StatusBar, Style } from "@capacitor/status-bar";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { handleHardwareBack } from "./backButtonManager";

let capacitorInitialized = false;

/**
 * Initializes Capacitor Native mobile hardening:
 * - Dark-mode status bar styling matching #0B0F17 theme
 * - Global Android hardware back-button listener (registered once)
 */
export async function initCapacitorApp(): Promise<void> {
  if (!Capacitor.isNativePlatform() || capacitorInitialized) return;
  capacitorInitialized = true;

  try {
    // Match the dark theme background and light icons
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0B0F17" });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.warn("[CapacitorInit] StatusBar setup warning:", err);
  }

  // Global Android Hardware Back Button listener
  App.addListener("backButton", ({ canGoBack }) => {
    // 1. Check if any modal, drawer, or sheet is open and handle it
    const wasHandled = handleHardwareBack();
    if (wasHandled) {
      return;
    }

    // 2. If on a sub-route or hash page other than root/dashboard, go back
    const currentHash = window.location.hash.slice(1);
    if (currentHash && currentHash !== "dashboard") {
      window.location.hash = "dashboard";
      return;
    }

    // 3. Fallback to WebView history if available
    if (canGoBack) {
      window.history.back();
      return;
    }

    // 4. On root dashboard with no open modals: minimize the app
    App.minimizeApp();
  });
}
