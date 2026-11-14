import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.abdelghany.subwise",
  appName: "SubWise",
  webDir: "dist",
  android: {
    backgroundColor: "#0B0F17",
  },
  server: {
    androidScheme: "https",
    hostname: "localhost",
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#0ea5e9",
    },
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: "#0B0F17",
    },
  },
};

export default config;
