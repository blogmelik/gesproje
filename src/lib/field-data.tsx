import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface Item {
  name: string;
  target: number;
}

export interface SiteConfig {
  stations: number;     // İstasyon Sayısı (default 36)
  rows: number;         // Sıra Sayısı (default 18)
  tables: number;       // Masa Sayısı (default 4)
  kolonTarget: number;  // Kolon Sayısı (default 24)
  asikTarget: number;   // Aşık Sayısı (default 40)
  kirisTarget: number;  // Kiriş Sayısı (default 12)
  payandaTarget: number;// Payanda Sayısı (default 12)
  panelTarget: number;  // Panel Sayısı (default 56)
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  stations: 36,
  rows: 18,
  tables: 4,
  kolonTarget: 24,
  asikTarget: 40,
  kirisTarget: 12,
  payandaTarget: 12,
  panelTarget: 56,
};

export const SITE_CONFIG_STORAGE_KEY = "ges-site-config-v2";

export function loadSiteConfig(): SiteConfig {
  try {
    const raw = localStorage.getItem(SITE_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_CONFIG;
    const p = JSON.parse(raw);
    return {
      stations: Math.max(1, Math.min(200, Number(p.stations) || DEFAULT_SITE_CONFIG.stations)),
      rows: Math.max(1, Math.min(100, Number(p.rows) || DEFAULT_SITE_CONFIG.rows)),
      tables: Math.max(1, Math.min(50, Number(p.tables) || DEFAULT_SITE_CONFIG.tables)),
      kolonTarget: Math.max(1, Math.min(500, Number(p.kolonTarget) || DEFAULT_SITE_CONFIG.kolonTarget)),
      asikTarget: Math.max(1, Math.min(500, Number(p.asikTarget) || DEFAULT_SITE_CONFIG.asikTarget)),
      kirisTarget: Math.max(1, Math.min(500, Number(p.kirisTarget) || DEFAULT_SITE_CONFIG.kirisTarget)),
      payandaTarget: Math.max(1, Math.min(500, Number(p.payandaTarget) || DEFAULT_SITE_CONFIG.payandaTarget)),
      panelTarget: Math.max(1, Math.min(1000, Number(p.panelTarget) || DEFAULT_SITE_CONFIG.panelTarget)),
    };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

export function saveSiteConfig(config: SiteConfig) {
  try {
    localStorage.setItem(SITE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save site config:", e);
  }
}

export function buildItems(cfg: SiteConfig): Item[] {
  return [
    { name: "Kolon", target: cfg.kolonTarget },
    { name: "Kiriş", target: cfg.kirisTarget },
    { name: "Payanda", target: cfg.payandaTarget },
    { name: "Aşık", target: cfg.asikTarget },
    { name: "Panel", target: cfg.panelTarget },
  ];
}

export function calcTableTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.target, 0);
}

// Initial default constants for backward-compatibility
export const STATIONS = DEFAULT_SITE_CONFIG.stations;
export const ZONES = ["A", "B", "C", "D"];
export const ROWS = DEFAULT_SITE_CONFIG.rows;
export const TABLES = DEFAULT_SITE_CONFIG.tables;
export const ITEMS = buildItems(DEFAULT_SITE_CONFIG);
export const TABLE_TOTAL = calcTableTotal(ITEMS);

export type Data = Record<string, number[]>;
export const tableKey = (station: number, zone: number, row: number, table: number) => `${station}-${zone}-${row}-${table}`;
export const pct = (done: number, total: number) => total ? Math.round(done / total * 100) : 0;
export const tone = (value: number) => value >= 100 ? "bg-success" : value > 0 ? "bg-progress" : "bg-empty";
export const textTone = (value: number) => value >= 100 ? "text-success" : value > 0 ? "text-progress" : "text-muted-foreground";

export function seedData(cfg: SiteConfig = loadSiteConfig()): Data {
  const currentItems = buildItems(cfg);
  const data: Data = {};
  for (let station = 0; station < cfg.stations; station++) {
    for (let zone = 0; zone < ZONES.length; zone++) {
      for (let row = 0; row < cfg.rows; row++) {
        for (let table = 0; table < cfg.tables; table++) {
          data[tableKey(station, zone, row, table)] = currentItems.map(() => 0);
        }
      }
    }
  }
  return data;
}

export function sumRange(data: Data, filter: (key: string) => boolean, currentItems = ITEMS, totalPerTable = TABLE_TOTAL) {
  let done = 0, total = 0;
  const per = currentItems.map(() => 0);
  for (const [key, values] of Object.entries(data)) {
    if (!filter(key)) continue;
    values.forEach((value, index) => {
      done += value;
      per[index] = (per[index] ?? 0) + value;
    });
    total += totalPerTable;
  }
  return { done, total, per };
}

type FieldContextValue = {
  siteConfig: SiteConfig;
  updateSiteConfig: (newConfig: Partial<SiteConfig>) => void;
  stations: number;
  rows: number;
  tables: number;
  items: Item[];
  tableTotal: number;
  data: Data;
  draftData: Data;
  pendingCount: number;
  stageItem: (key: string, index: number, value: number) => void;
  saveChanges: () => void;
  locks: Record<string, boolean>;
  toggleLock: (key: string) => void;
  overall: ReturnType<typeof sumRange>;
  stationPct: number[];
  completeTables: number;
  setItem: (key: string, index: number, value: number) => void;
  importData: (updates: Data) => void;
};

const FieldContext = createContext<FieldContextValue | null>(null);

export const PROGRESS_STORAGE_KEY = "ges-progress-v1";

/** Parses stored sparse progress and keeps only valid table keys and clamped values. */
export function parseStoredProgress(raw: string | null, cfg: SiteConfig = loadSiteConfig()): { committed: Data; pending: Data } {
  const currentItems = buildItems(cfg);
  const clean = (value: unknown): Data => {
    const out: Data = {};
    if (typeof value !== "object" || value === null) return out;
    const valid = /^(\d+)-(\d+)-(\d+)-(\d+)$/;
    for (const [key, list] of Object.entries(value as Record<string, unknown>)) {
      const m = valid.exec(key);
      if (!m || !Array.isArray(list)) continue;
      const [s, z, r, t] = m.slice(1).map(Number) as [number, number, number, number];
      if (s >= cfg.stations || z >= ZONES.length || r >= cfg.rows || t >= cfg.tables) continue;
      out[key] = currentItems.map((item, i) => {
        const n = Number(list[i]);
        return Number.isFinite(n) ? Math.max(0, Math.min(item.target, Math.trunc(n))) : 0;
      });
    }
    return out;
  };
  try {
    const parsed: unknown = JSON.parse(raw ?? "null");
    const record = (typeof parsed === "object" && parsed !== null ? parsed : {}) as Record<string, unknown>;
    return { committed: clean(record["committed"]), pending: clean(record["pending"]) };
  } catch {
    return { committed: {}, pending: {} };
  }
}

function sparse(data: Data) {
  const out: Data = {};
  for (const [key, values] of Object.entries(data)) {
    if (values.some(v => v > 0)) out[key] = values;
  }
  return out;
}

export function FieldDataProvider({ children }: { children: ReactNode }) {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => loadSiteConfig());
  const [data, setData] = useState<Data>(() => seedData(siteConfig));
  const [pending, setPending] = useState<Data>({});
  const [locks, setLocks] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  const items = useMemo(() => buildItems(siteConfig), [siteConfig]);
  const tableTotal = useMemo(() => calcTableTotal(items), [items]);
  const stations = siteConfig.stations;
  const rows = siteConfig.rows;
  const tables = siteConfig.tables;

  const updateSiteConfig = (newConfig: Partial<SiteConfig>) => {
    setSiteConfig(prev => {
      const merged: SiteConfig = {
        stations: Math.max(1, Math.min(200, Number(newConfig.stations) || prev.stations)),
        rows: Math.max(1, Math.min(100, Number(newConfig.rows) || prev.rows)),
        tables: Math.max(1, Math.min(50, Number(newConfig.tables) || prev.tables)),
        kolonTarget: Math.max(1, Math.min(500, Number(newConfig.kolonTarget) || prev.kolonTarget)),
        asikTarget: Math.max(1, Math.min(500, Number(newConfig.asikTarget) || prev.asikTarget)),
        kirisTarget: Math.max(1, Math.min(500, Number(newConfig.kirisTarget) || prev.kirisTarget)),
        payandaTarget: Math.max(1, Math.min(500, Number(newConfig.payandaTarget) || prev.payandaTarget)),
        panelTarget: Math.max(1, Math.min(1000, Number(newConfig.panelTarget) || prev.panelTarget)),
      };
      saveSiteConfig(merged);
      return merged;
    });
  };

  useEffect(() => {
    try {
      const stored = parseStoredProgress(localStorage.getItem(PROGRESS_STORAGE_KEY), siteConfig);
      try {
        const storedLocks = JSON.parse(localStorage.getItem("ges-locked-v1") || "{}");
        setLocks(storedLocks);
      } catch { /* ignore */ }
      setData(previous => ({ ...previous, ...stored.committed }));
      setPending(stored.pending);
    } catch { /* storage unavailable */ }
    setLoaded(true);
  }, [siteConfig]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ committed: sparse(data), pending }));
    } catch { /* storage full or unavailable */ }
  }, [data, pending, loaded]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("ges-locked-v1", JSON.stringify(locks));
    } catch { /* storage full */ }
  }, [locks, loaded]);

  const toggleLock = (key: string) => {
    setLocks(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  };

  const draftData = useMemo(() => ({ ...data, ...pending }), [data, pending]);
  const pendingCount = Object.keys(pending).length;

  function stageItem(key: string, index: number, value: number) {
    const item = items[index];
    if (!item) return;
    const clamped = Math.max(0, Math.min(item.target, Number.isFinite(value) ? Math.trunc(value) : 0));
    setPending(previous => {
      const next = { ...previous };
      const values = items.map((_, i) => i === index ? clamped : (previous[key]?.[i] ?? data[key]?.[i] ?? 0));
      if (values.every((quantity, i) => quantity === (data[key]?.[i] ?? 0))) delete next[key];
      else next[key] = values;
      return next;
    });
  }

  function saveChanges() {
    setData(previous => ({ ...previous, ...pending }));
    setPending({});
  }

  const overall = useMemo(() => sumRange(data, () => true, items, tableTotal), [data, items, tableTotal]);

  const completeTables = useMemo(
    () => Object.values(data).filter(values => items.every((item, index) => (values[index] ?? 0) >= item.target)).length,
    [data, items]
  );

  const stationPct = useMemo(() => {
    const sums = Array.from({ length: stations }, () => 0);
    for (const [key, values] of Object.entries(data)) {
      const s = Number(key.split("-")[0]);
      if (s < stations) {
        sums[s] = (sums[s] ?? 0) + values.reduce((sum, value) => sum + value, 0);
      }
    }
    const maxPerStation = ZONES.length * rows * tables * tableTotal;
    return sums.map(value => pct(value, maxPerStation));
  }, [data, stations, rows, tables, tableTotal]);

  function setItem(key: string, index: number, value: number) {
    const item = items[index];
    if (!item) return;
    const clamped = Math.max(0, Math.min(item.target, Number.isFinite(value) ? Math.trunc(value) : 0));
    setData(previous => ({
      ...previous,
      [key]: items.map((_, i) => i === index ? clamped : (previous[key]?.[i] ?? 0))
    }));
  }

  function importData(updates: Data) {
    setData(previous => ({ ...previous, ...updates }));
  }

  return (
    <FieldContext.Provider
      value={{
        siteConfig,
        updateSiteConfig,
        stations,
        rows,
        tables,
        items,
        tableTotal,
        data,
        draftData,
        pendingCount,
        stageItem,
        saveChanges,
        overall,
        stationPct,
        completeTables,
        setItem,
        importData,
        locks: locks || {},
        toggleLock
      }}
    >
      {children}
    </FieldContext.Provider>
  );
}

export function useFieldData() {
  const context = useContext(FieldContext);
  if (!context) throw new Error("FieldDataProvider is required");
  return context;
}
