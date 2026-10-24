/** Subtle tactile tick where supported (Android Chrome). Silently no-ops elsewhere, incl. iOS Safari. */
export function haptic(pattern: number | number[] = 8) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* never depend on haptics */
  }
}