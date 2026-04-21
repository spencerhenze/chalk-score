import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chalkscore.app',
  appName: 'ChalkScore',
  webDir: 'www',
  plugins: {
    Browser: {
      presentationStyle: 'popover',
    },
  },
};

export default config;
