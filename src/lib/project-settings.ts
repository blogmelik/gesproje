import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";

export const PROJECT_STORAGE_KEY = "ges-project-settings-v1";
export const COMPANY_NAME = "ÖZGÜN İNŞAAT";
export interface ProjectSettings { name: string; detail: string }
export const DEFAULT_PROJECT: ProjectSettings = { name: "Cezayir Hassi Delaa GES Projesi", detail: "" };

export function parseProjectSettings(raw: string | null): ProjectSettings {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (typeof value !== "object" || value === null) return DEFAULT_PROJECT;
    const record = value as Record<string, unknown>;
    return {
      name: typeof record['name'] === "string" && record['name'].trim() ? record['name'].trim().slice(0, 120) : DEFAULT_PROJECT.name,
      detail: typeof record['detail'] === "string" ? record['detail'].trim().slice(0, 180) : "",
    };
  } catch { return DEFAULT_PROJECT; }
}

function useProjectSettingsState() {
  const [project, setProject] = useState(DEFAULT_PROJECT);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try { setProject(parseProjectSettings(localStorage.getItem(PROJECT_STORAGE_KEY))); }
    catch { setError("Bu cihazda proje ayarlarına erişilemiyor."); }
    setReady(true);
  }, []);
  function update(next: ProjectSettings) {
    setProject(next);
    try {
      localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(next));
      setError(""); return true;
    } catch { setError("Proje bilgileri bu cihazda saklanamadı. Cihaz depolamasını kontrol edin."); return false; }
  }
  function save(next: ProjectSettings) {
    const clean = parseProjectSettings(JSON.stringify(next));
    return update(clean);
  }
  return { project, ready, error, update, save };
}

const ProjectSettingsContext = createContext<ReturnType<typeof useProjectSettingsState> | null>(null);

export function ProjectSettingsProvider({ children }: { children: ReactNode }) {
  const settings = useProjectSettingsState();
  return createElement(ProjectSettingsContext.Provider, { value: settings }, children);
}

export function useProjectSettings() {
  const settings = useContext(ProjectSettingsContext);
  if (!settings) throw new Error("ProjectSettingsProvider is required.");
  return settings;
}