import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "es.urbanenglish.touchbase",
  appName: "TouchBase",
  webDir: "www",

  server: {
    url: "https://app.urbanenglish.es",
    cleartext: false,
  },
};

export default config;