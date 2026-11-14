import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";
import type { StateStorage } from "zustand/middleware";

/**
 * Hybrid Safe Storage engine for Zustand:
 * - On Native Mobile (Android/iOS): Reads and writes to native SharedPreferences / UserDefaults
 *   via @capacitor/preferences, protecting data from OS WebView cache-clearing, with localStorage fallback.
 * - On Web: Uses standard localStorage.
 */
export const safeStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // 1. Try native Preferences on mobile platforms
    if (Capacitor.isNativePlatform()) {
      try {
        const { value } = await Preferences.get({ key: name });
        if (value !== null && value !== undefined) {
          return value;
        }
      } catch (err) {
        console.warn("[SafeStorage] Preferences.get failed, trying localStorage:", err);
      }
    }

    // 2. Read from localStorage (works on web and as migration source on native)
    try {
      const local = localStorage.getItem(name);
      if (local && Capacitor.isNativePlatform()) {
        // Auto-migrate web data into native Preferences
        Preferences.set({ key: name, value: local }).catch(() => {});
      }
      return local;
    } catch (err) {
      console.warn("[SafeStorage] localStorage.getItem failed:", err);
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    // Write to localStorage
    try {
      localStorage.setItem(name, value);
    } catch (err) {
      console.warn("[SafeStorage] localStorage.setItem failed:", err);
    }

    // Also write to native Preferences on native platform
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.set({ key: name, value });
      } catch (err) {
        console.warn("[SafeStorage] Preferences.set failed:", err);
      }
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      localStorage.removeItem(name);
    } catch {}

    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.remove({ key: name });
      } catch {}
    }
  },
};
