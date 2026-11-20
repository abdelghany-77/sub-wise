import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Use relative base so assets load seamlessly in Capacitor (https://localhost/) and web subpaths
const base = "./";

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
        scope: "./",
        start_url: "./",
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
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallback: "index.html",
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "zustand"],
          "charts-vendor": ["recharts"],
          "icons-vendor": ["lucide-react"],
        },
      },
    },
  },
});
