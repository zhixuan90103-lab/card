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
    /**
     * never = WKWebView full-bleed under status bar / home indicator.
     * automatic was double-insetting with CSS safe-area → black gap + wrong height.
     * Safe areas handled in JS shellLayout + CSS cream fill.
     */
    contentInset: 'never',
    preferredContentMode: 'mobile',
    backgroundColor: '#efe5d9',
    // Allows edge-to-edge; content avoids notch via shellLayout padding
    scrollEnabled: false,
  },
  plugins: {
    // Haptics needs no extra config; impact styles in code
  },
};

export default config;
