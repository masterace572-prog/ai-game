import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

let lastLightTapTime = 0;

/**
 * Light tap haptic for high-frequency actions like tap-to-earn and boost.
 * Throttled to at most 10 per second (~100ms interval).
 */
export async function tapLight(enabled: boolean = true): Promise<void> {
  if (!enabled) return;
  const now = Date.now();
  if (now - lastLightTapTime < 95) return;
  lastLightTapTime = now;

  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Fail silently on web or unsupported platforms
  }
}

/**
 * Medium impact haptic for purchases (products, team, compute, upgrades, managers).
 */
export async function impactMedium(enabled: boolean = true): Promise<void> {
  if (!enabled) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // Fail silently on web or unsupported platforms
  }
}

/**
 * Success notification haptic for milestone thresholds and model launches.
 */
export async function success(enabled: boolean = true): Promise<void> {
  if (!enabled) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Fail silently on web or unsupported platforms
  }
}
