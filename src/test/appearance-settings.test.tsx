import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { APPEARANCE_STORAGE_KEY, AppearanceProvider, parseMenuLayout, useAppearanceSettings } from "@/lib/appearance-settings";

describe("Appearance settings", () => {
  beforeEach(() => localStorage.clear());
  it("defaults to sidebar for missing or invalid values", () => {
    expect(parseMenuLayout(null)).toBe("sidebar");
    expect(parseMenuLayout("unknown")).toBe("sidebar");
  });
  it("shares changes immediately and restores the saved layout", async () => {
    const first = renderHook(() => ({ shell: useAppearanceSettings(), form: useAppearanceSettings() }), { wrapper: AppearanceProvider });
    await waitFor(() => expect(first.result.current.form.ready).toBe(true));
    act(() => first.result.current.form.setLayout("bottom"));
    expect(first.result.current.shell.layout).toBe("bottom");
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("bottom");
    first.unmount();
    const restored = renderHook(() => useAppearanceSettings(), { wrapper: AppearanceProvider });
    await waitFor(() => expect(restored.result.current.layout).toBe("bottom"));
    act(() => restored.result.current.setLayout("sidebar"));
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("sidebar");
  });
});