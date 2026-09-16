import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from './ui/Card';
import Button from './ui/Button';
import * as biometric from '../lib/biometric';

export default function BiometricLoginCard() {
  const { biometricEnabled, enableBiometricLogin, disableBiometricLogin } = useAuth();
  const [supported, setSupported] = useState(false);
  const [label, setLabel] = useState('biometric login');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    biometric.checkBiometricAvailability().then((result) => {
      if (cancelled) return;
      setSupported(result.isAvailable);
      if (result.biometryType === 'faceId' || result.biometryType === 'face') setLabel('Face unlock');
      else if (result.biometryType === 'touchId' || result.biometryType === 'fingerprint') setLabel('fingerprint unlock');
    });
    return () => { cancelled = true; };
  }, []);

  // Not on web, and not on a device with no usable fingerprint/face sensor
  // enrolled — nothing useful to offer here.
  if (!biometric.isNative() || !supported) return null;

  async function handleToggle() {
    setBusy(true);
    setMessage(null);
    try {
      if (biometricEnabled) {
        await disableBiometricLogin();
        setMessage({ type: 'success', text: 'Biometric login turned off on this device.' });
      } else {
        await enableBiometricLogin();
        setMessage({ type: 'success', text: 'Biometric login enabled. You can unlock Skulag with it next time you open the app.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err?.message ?? 'Could not update this setting.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Biometric login">
      {message && (
        <p className={`text-sm rounded-lg px-3 py-2 mb-4 ${message.type === 'success' ? 'text-success bg-success-soft' : 'text-danger bg-danger-soft'}`}>
          {message.text}
        </p>
      )}
      <p className="text-sm text-muted mb-4">
        Use {label} on this device to open Skulag instead of typing your password. Your face or
        fingerprint never leaves this device and is never sent to Skulag &mdash; it just unlocks a
        session already saved here. Turning this off (or logging out) removes it from this device.
      </p>
      <Button variant={biometricEnabled ? 'danger' : 'secondary'} onClick={handleToggle} disabled={busy} loading={busy}>
        {busy ? 'Please wait…' : biometricEnabled ? 'Turn off biometric login' : 'Enable biometric login'}
      </Button>
    </Card>
  );
}
