import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ddalkkak.sourcing',
  appName: '딸깍소싱',
  webDir: 'out',
  server: {
    // TODO: Vercel 프로덕션 URL로 교체하세요
    url: process.env.CAPACITOR_SERVER_URL || 'https://dgs-five.vercel.app',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    preferredContentMode: 'mobile',
  },
};

export default config;
