import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor · Web → iOS/Android shell
 * webDir must match Vite `build.outDir` (dist).
 */
const config: CapacitorConfig = {
  appId: 'com.cardpair.mvp',
  appName: '配对牌',
  webDir: 'dist',
  server: {
    // Load from bundled assets (not a remote URL)
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
  plugins: {
    // Haptics needs no extra config; impact styles in code
  },
};

export default config;
