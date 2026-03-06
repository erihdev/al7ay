import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.erihdev.al7ay',
  appName: 'al7ay',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'al7ay'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
