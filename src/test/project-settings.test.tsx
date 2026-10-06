import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_PROJECT, PROJECT_STORAGE_KEY, ProjectSettingsProvider, parseProjectSettings, useProjectSettings } from "@/lib/project-settings";

describe("Project settings", () => {
  beforeEach(() => localStorage.clear());
  it("uses defaults for invalid saved data", () => {
    expect(parseProjectSettings("broken")).toEqual(DEFAULT_PROJECT);
    expect(parseProjectSettings('{"name":" ","detail":42}')).toEqual(DEFAULT_PROJECT);
  });
  it("saves trimmed values and restores them after remount", async () => {
    const first = renderHook(() => useProjectSettings(), { wrapper: ProjectSettingsProvider });
    await waitFor(() => expect(first.result.current.ready).toBe(true));
    act(() => { expect(first.result.current.save({ name: " Test Projesi ", detail: " Ankara " })).toBe(true); });
    expect(JSON.parse(localStorage.getItem(PROJECT_STORAGE_KEY) ?? "{}")).toEqual({ name: "Test Projesi", detail: "Ankara" });
    first.unmount();
    const next = renderHook(() => useProjectSettings(), { wrapper: ProjectSettingsProvider });
    await waitFor(() => expect(next.result.current.project).toEqual({ name: "Test Projesi", detail: "Ankara" }));
  });
  it("migrates existing settings with the default company", () => {
    expect(parseProjectSettings('{"name":"Eski Proje","detail":"Faz 1"}')).toEqual({ name: "Eski Proje", detail: "Faz 1" });
  });
  it("shares live updates between settings consumers", async () => {
    const shared = renderHook(() => ({ header: useProjectSettings(), form: useProjectSettings() }), { wrapper: ProjectSettingsProvider });
    await waitFor(() => expect(shared.result.current.form.ready).toBe(true));
    act(() => { shared.result.current.form.update({ name: "Yeni Proje", detail: "50MW" }); });
    expect(shared.result.current.header.project.name).toBe("Yeni Proje");
    expect(JSON.parse(localStorage.getItem(PROJECT_STORAGE_KEY) ?? "{}")).toEqual(shared.result.current.header.project);
  });
});