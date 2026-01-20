import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c5160f700391456ca56d5779caf9872d',
  appName: 'al7ay',
  webDir: 'dist',
  server: {
    url: 'https://c5160f70-0391-456c-a56d-5779caf9872d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
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
