import { Capacitor } from '@capacitor/core';

/**
 * Thin wrapper around @aparajita/capacitor-biometric-auth + capacitor-secure-storage-plugin.
 *
 * IMPORTANT: this is a LOCAL UNLOCK, not a second auth method the backend knows
 * about. The flow is:
 *   1. User logs in normally (email + password) — this is unchanged.
 *   2. If they opt in, we save their current Sanctum token in the device's
 *      secure storage (Android Keystore / iOS Keychain, not localStorage).
 *   3. Next app open, a successful fingerprint/face match unlocks that stored
 *      token and we hydrate the session from it — no camera, no location,
 *      no biometric data ever leaves the device or reaches Skulag's servers.
 *
 * Every function here is a no-op-safe on web (returns false/null) so the rest
 * of the app can call these without checking platform first.
 */

const TOKEN_KEY = 'skulag_biometric_token';
const ENABLED_KEY = 'skulag_biometric_enabled';

let biometricAuthModule = null;
let secureStorageModule = null;

// Native plugins are dynamically imported so a web build never pulls in
// Android/iOS-only code and never throws just from importing this file.
async function loadPlugins() {
  if (!Capacitor.isNativePlatform()) return null;
  if (!biometricAuthModule) {
    biometricAuthModule = await import('@aparajita/capacitor-biometric-auth');
  }
  if (!secureStorageModule) {
    secureStorageModule = await import('capacitor-secure-storage-plugin');
  }
  return { ...biometricAuthModule, ...secureStorageModule };
}

export function isNative() {
  return Capacitor.isNativePlatform();
}

/**
 * Checks whether this device has usable biometric hardware right now.
 * Returns { isAvailable, biometryType, reason } — never throws.
 */
export async function checkBiometricAvailability() {
  if (!isNative()) return { isAvailable: false, biometryType: 'none', reason: 'web' };
  try {
    const { BiometricAuth } = await loadPlugins();
    const result = await BiometricAuth.checkBiometry();
    return result;
  } catch (error) {
    return { isAvailable: false, biometryType: 'none', reason: error?.message ?? 'unknown' };
  }
}

/**
 * Whether the CURRENT user has previously opted in to biometric unlock on
 * THIS device. This is device-local — logging in on a new phone always
 * starts with it off.
 */
export async function isBiometricLoginEnabled() {
  if (!isNative()) return false;
  try {
    const { SecureStoragePlugin } = await loadPlugins();
    const { value } = await SecureStoragePlugin.get({ key: ENABLED_KEY });
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Opt in: store the current session token behind the device's secure
 * storage. Call this right after a normal, successful password login.
 */
export async function enableBiometricLogin(token) {
  if (!isNative() || !token) return false;
  const { SecureStoragePlugin } = await loadPlugins();
  await SecureStoragePlugin.set({ key: TOKEN_KEY, value: token });
  await SecureStoragePlugin.set({ key: ENABLED_KEY, value: 'true' });
  return true;
}

/**
 * Opt out: wipe the stored token and the enabled flag from this device.
 * Safe to call even if nothing was ever stored.
 */
export async function disableBiometricLogin() {
  if (!isNative()) return;
  try {
    const { SecureStoragePlugin } = await loadPlugins();
    await SecureStoragePlugin.remove({ key: TOKEN_KEY });
    await SecureStoragePlugin.remove({ key: ENABLED_KEY });
  } catch {
    // Nothing was stored — fine.
  }
}

/**
 * Prompts the OS fingerprint/face dialog. On success, returns the stored
 * token so the caller can hydrate a session with it. On failure or
 * cancellation, throws — callers should fall back to the password form,
 * never treat a throw here as "no internet" or anything alarming.
 */
export async function authenticateAndGetToken() {
  if (!isNative()) throw new Error('Biometric login is only available in the Skulag app.');

  const { BiometricAuth, SecureStoragePlugin } = await loadPlugins();

  await BiometricAuth.authenticate({
    reason: 'Unlock Skulag',
    cancelTitle: 'Use password instead',
    allowDeviceCredential: true,
    androidTitle: 'Skulag biometric login',
    androidSubtitle: 'Confirm it\u2019s you to continue',
    androidConfirmationRequired: false,
  });

  const { value } = await SecureStoragePlugin.get({ key: TOKEN_KEY });
  if (!value) throw new Error('No saved session found. Please log in with your password.');
  return value;
}
