import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
const isCapacitor = process.env.CAPACITOR === "true" || process.env.npm_lifecycle_event?.includes("cap");
const base = isCapacitor ? "./" : (process.env.VITE_BASE || "/sub-wise/");

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png", "icon-192x192.png", "icon-512x512.png"],
      manifest: {
        name: "Walleteer — Wealth & Expense Tracker",
        short_name: "Walleteer",
        description: "Track your expenses, manage budgets, and grow your wealth with Walleteer.",
        theme_color: "#0B0F17",
        background_color: "#0B0F17",
        display: "standalone",
        orientation: "portrait",
        scope: "/sub-wise/",
        start_url: "/sub-wise/",
        icons: [
          {
            src: "icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallback: "index.html",
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
