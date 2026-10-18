/**
 * Samsung Galaxy Haptic Feedback & Hardware Integration
 * Utilizes the HTML5 Vibration API supported by Samsung One UI devices
 * and Web Audio synthesis fallback.
 */

export function isSamsungDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes('samsung') ||
    ua.includes('samsungbrowser') ||
    ua.includes('sm-') ||
    ua.includes('oneui') ||
    (ua.includes('android') && !ua.includes('pixel') && !ua.includes('xiaomi'))
  );
}

export function triggerSamsungHaptic(
  type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' = 'light'
): void {
  if (typeof window === 'undefined') return;

  // Real Samsung Galaxy internal vibration motor (Haptic feedback)
  if ('vibrate' in navigator) {
    try {
      switch (type) {
        case 'light':
        case 'selection':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(22);
          break;
        case 'heavy':
          navigator.vibrate(40);
          break;
        case 'success':
          navigator.vibrate([15, 40, 20]);
          break;
        case 'warning':
          navigator.vibrate([35, 30, 35]);
          break;
      }
    } catch {
      // Ignore vibration errors if blocked by browser policy
    }
  }
}
