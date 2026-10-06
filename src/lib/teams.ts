import { useEffect, useState } from "react";
import { FAULT_STORAGE_KEY } from "@/lib/fault-reports";

export const TEAM_STORAGE_KEY = "ges-teams-v1";
export const DEFAULT_TEAMS = ["Mehti'nin Ekibi", "Yezid'in Ekibi", "Mekanik Taşeron"];
const EVENT = "ges-teams-change";

export function parseTeams(raw: string | null): string[] {
  if (raw === null) return DEFAULT_TEAMS;
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Invalid teams");
  return parsed.filter((t): t is string => typeof t === "string" && t.trim() !== "");
}

const clean = (name: string) => name.trim().replace(/\s+/g, " ").slice(0, 60);
const exists = (list: string[], name: string, except?: string) => list.some(t => t !== except && t.toLocaleLowerCase("tr") === name.toLocaleLowerCase("tr"));

export function useTeams() {
  const [teams, setTeams] = useState<string[]>(DEFAULT_TEAMS);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const load = () => { try { setTeams(parseTeams(localStorage.getItem(TEAM_STORAGE_KEY))); } catch { setTeams(DEFAULT_TEAMS); } };
    load(); setReady(true);
    window.addEventListener(EVENT, load);
    window.addEventListener("storage", load);
    return () => { window.removeEventListener(EVENT, load); window.removeEventListener("storage", load); };
  }, []);

  function commit(next: string[]): string {
    try {
      localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(next));
      setTeams(next);
      window.dispatchEvent(new Event(EVENT));
      return "";
    } catch { return "Ekip listesi cihazda saklanamadı."; }
  }
  function add(raw: string) {
    const name = clean(raw);
    if (!name) return "Ekip adı boş olamaz.";
    if (exists(teams, name)) return "Bu isimde bir ekip zaten var.";
    return commit([...teams, name]);
  }
  function rename(oldName: string, raw: string) {
    const name = clean(raw);
    if (!name) return "Ekip adı boş olamaz.";
    if (exists(teams, name, oldName)) return "Bu isimde bir ekip zaten var.";
    const error = commit(teams.map(t => t === oldName ? name : t));
    if (!error) {
      try {
        const stored = JSON.parse(localStorage.getItem(FAULT_STORAGE_KEY) ?? "{}") as Record<string, { team?: string }>;
        let changed = false;
        for (const r of Object.values(stored)) if (r && r.team === oldName) { r.team = name; changed = true; }
        if (changed) localStorage.setItem(FAULT_STORAGE_KEY, JSON.stringify(stored));
      } catch { /* hata kayıtları eski adla kalır */ }
    }
    return error;
  }
  function remove(name: string) { return commit(teams.filter(t => t !== name)); }
  return { teams, ready, add, rename, remove };
}
