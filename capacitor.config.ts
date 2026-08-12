import type { CapacitorConfig } from '@capacitor/cli';

// appId and appName are placeholders — ng.komputech.schoolsaas /
// "School SaaS" — swap both for real once the product name is
// locked in. appId especially: it's the package ID (like a domain
// name) that identifies your app in the Play Store, and it CANNOT
// be changed after your first Play Store submission without
// publishing as a brand new app and losing all reviews/installs.
// Get the name decided before you submit, not after.
const config: CapacitorConfig = {
  appId: 'ng.komputech.schoolsaas',
  appName: 'School SaaS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#1F5C4A',
      showSpinner: false,
    },
  },
};

export default config;
