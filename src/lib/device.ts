/**
 * Device and Platform Detection Utility
 */

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Capacitor native app on Android / iOS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).Capacitor?.isNativePlatform?.()) {
    return true;
  }

  // 2. User agent checks
  const ua = window.navigator.userAgent.toLowerCase();
  if (
    ua.includes("android") ||
    ua.includes("iphone") ||
    ua.includes("ipad") ||
    ua.includes("ipod") ||
    ua.includes("mobile")
  ) {
    return true;
  }

  // 3. Android specific protocol
  if (window.location.protocol === "capacitor:") {
    return true;
  }

  return false;
}

export function isDesktopApp(): boolean {
  return !isMobileDevice();
}
