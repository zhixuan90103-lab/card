/**
 * Capacitor Haptics wrapper — no-op on web / if plugin missing.
 * Use light / medium / heavy impact for game feedback.
 */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

async function safeImpact(style: ImpactStyle): Promise<void> {
  if (!isNativeApp()) return;
  try {
    await Haptics.impact({ style });
  } catch {
    /* web preview or denied */
  }
}

/** Soft tick — select / invalid snap */
export function hapticLight(): void {
  void safeImpact(ImpactStyle.Light);
}

/** Confirm — draw / flip */
export function hapticMedium(): void {
  void safeImpact(ImpactStyle.Medium);
}

/** Strong — match clear */
export function hapticHeavy(): void {
  void safeImpact(ImpactStyle.Heavy);
}

/** Success pattern — win (optional) */
export function hapticSuccess(): void {
  if (!isNativeApp()) return;
  void Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}
