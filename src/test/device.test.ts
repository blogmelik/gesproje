import { describe, expect, it, beforeEach } from "vitest";
import { isMobileDevice, isDesktopApp } from "@/lib/device";

describe("Device & Platform Detection", () => {
  const originalUserAgent = window.navigator.userAgent;

  beforeEach(() => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: originalUserAgent,
      writable: true,
      configurable: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).Capacitor;
  });

  it("identifies Android user agent as mobile", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36",
      writable: true,
      configurable: true,
    });

    expect(isMobileDevice()).toBe(true);
    expect(isDesktopApp()).toBe(false);
  });

  it("identifies iPhone user agent as mobile", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      writable: true,
      configurable: true,
    });

    expect(isMobileDevice()).toBe(true);
    expect(isDesktopApp()).toBe(false);
  });

  it("identifies Capacitor native app as mobile", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Capacitor = {
      isNativePlatform: () => true,
    };

    expect(isMobileDevice()).toBe(true);
    expect(isDesktopApp()).toBe(false);
  });

  it("identifies Windows Electron app as desktop", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Electron/44.6.0 Chrome/120.0.0.0",
      writable: true,
      configurable: true,
    });

    expect(isMobileDevice()).toBe(false);
    expect(isDesktopApp()).toBe(true);
  });

  it("identifies standard PC desktop browser as desktop", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      writable: true,
      configurable: true,
    });

    expect(isMobileDevice()).toBe(false);
    expect(isDesktopApp()).toBe(true);
  });
});
