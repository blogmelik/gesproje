import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyFault, FAULT_STORAGE_KEY, parseFaultReports, useFaultReports } from "@/lib/fault-reports";

describe("Fault report storage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());
  it("keeps photo and precise survey coordinates across remounts, isolated per item", async () => {
    const report = { ...emptyFault(), detail: "Kolon bağlantısı gevşek", photo: "data:image/jpeg;base64,YQ==", latitude: 38.123456, longitude: 32.123456, x: "123456.123456789", y: "456789.001", z: "-12.05", team: "Ekip B", resolved: true };
    const first = renderHook(() => useFaultReports());
    await waitFor(() => expect(first.result.current.ready).toBe(true));
    act(() => { expect(first.result.current.save("20-1-11-0-0", report)).toBe(true); });
    first.unmount();
    const second = renderHook(() => useFaultReports());
    await waitFor(() => expect(second.result.current.reports['20-1-11-0-0']).toEqual(report));
    expect(second.result.current.reports['20-1-11-0-1']).toBeUndefined();
  });
  it("surfaces quota errors without pretending to save", async () => {
    const hook = renderHook(() => useFaultReports());
    await waitFor(() => expect(hook.result.current.ready).toBe(true));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError"); });
    act(() => { expect(hook.result.current.save("item", emptyFault())).toBe(false); });
    expect(hook.result.current.error).toContain("saklanamadı");
    expect(hook.result.current.reports).toEqual({});
  });
  it("handles corrupt storage without overwriting it", async () => {
    localStorage.setItem(FAULT_STORAGE_KEY, "broken-json");
    const hook = renderHook(() => useFaultReports());
    await waitFor(() => expect(hook.result.current.error).toContain("okunamadı"));
    act(() => { expect(hook.result.current.save("item", emptyFault())).toBe(false); });
    expect(localStorage.getItem(FAULT_STORAGE_KEY)).toBe("broken-json");
    expect(parseFaultReports(null)).toEqual({});
  });
});