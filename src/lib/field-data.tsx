import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const STATIONS = 36;
export const ZONES = ["A", "B", "C", "D"];
export const ROWS = 18;
export const TABLES = 4;
export const ITEMS = [
  { name: "Kolon", target: 24 },
  { name: "Kiriş", target: 12 },
  { name: "Payanda", target: 12 },
  { name: "Aşık", target: 40 },
  { name: "Panel", target: 56 },
];
export const TABLE_TOTAL = ITEMS.reduce((sum, item) => sum + item.target, 0);
export type Data = Record<string, number[]>;
export const tableKey = (station: number, zone: number, row: number, table: number) => `${station}-${zone}-${row}-${table}`;
export const pct = (done: number, total: number) => total ? Math.round(done / total * 100) : 0;
export const tone = (value: number) => value >= 100 ? "bg-success" : value > 0 ? "bg-progress" : "bg-empty";
export const textTone = (value: number) => value >= 100 ? "text-success" : value > 0 ? "text-progress" : "text-muted-foreground";

export function seedData(): Data {
  let x = 12345;
  const random = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
  const data: Data = {};
  for (let station = 0; station < STATIONS; station++) {
    const level: number = 0; // Ön kayıtlı ilerleme yok; tüm masalar sıfırdan başlar.
    void station; void random;
    for (let zone = 0; zone < ZONES.length; zone++)
      for (let row = 0; row < ROWS; row++)
        for (let table = 0; table < TABLES; table++) {
          data[tableKey(station, zone, row, table)] = ITEMS.map((item, index) => {
            if (level === 0) return 0;
            if (level === 1) return item.target;
            const progress = Math.min(1, level * (1.3 - index * 0.15) * (0.5 + random()));
            return progress > 0.92 ? item.target : Math.floor(item.target * progress);
          });
        }
  }
  return data;
}

export function sumRange(data: Data, filter: (key: string) => boolean) {
  let done = 0, total = 0;
  const per = ITEMS.map(() => 0);
  for (const [key, values] of Object.entries(data)) {
    if (!filter(key)) continue;
    values.forEach((value, index) => { done += value; per[index] = (per[index] ?? 0) + value; });
    total += TABLE_TOTAL;
  }
  return { done, total, per };
}

type FieldContextValue = {
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

/** Parses stored sparse progress ({committed, pending}) and keeps only valid table keys and clamped values. */
export function parseStoredProgress(raw: string | null): { committed: Data; pending: Data } {
  const clean = (value: unknown): Data => {
    const out: Data = {};
    if (typeof value !== "object" || value === null) return out;
    const valid = /^(\d+)-(\d+)-(\d+)-(\d+)$/;
    for (const [key, list] of Object.entries(value as Record<string, unknown>)) {
      const m = valid.exec(key);
      if (!m || !Array.isArray(list)) continue;
      const [s, z, r, t] = m.slice(1).map(Number) as [number, number, number, number];
      if (s >= STATIONS || z >= ZONES.length || r >= ROWS || t >= TABLES) continue;
      out[key] = ITEMS.map((item, i) => {
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
  } catch { return { committed: {}, pending: {} }; }
}

function sparse(data: Data) {
  const out: Data = {};
  for (const [key, values] of Object.entries(data)) if (values.some(v => v > 0)) out[key] = values;
  return out;
}

export function FieldDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(seedData);
  const [pending, setPending] = useState<Data>({});
    const [locks, setLocks] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const stored = parseStoredProgress(localStorage.getItem(PROGRESS_STORAGE_KEY));
        try {
          const storedLocks = JSON.parse(localStorage.getItem("ges-locked-v1") || "{}");
          setLocks(storedLocks);
        } catch { /* ignore */ }
      setData(previous => ({ ...previous, ...stored.committed }));
      setPending(stored.pending);
    } catch { /* storage unavailable */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ committed: sparse(data), pending })); }
    catch { /* storage full or unavailable */ }
  }, [data, pending, loaded]);
  useEffect(() => {
      if (!loaded) return;
      try { localStorage.setItem("ges-locked-v1", JSON.stringify(locks)); }
      catch { /* storage full */ }
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
    const item = ITEMS[index];
    if (!item) return;
    const clamped = Math.max(0, Math.min(item.target, Number.isFinite(value) ? Math.trunc(value) : 0));
    setPending(previous => {
      const next = { ...previous };
      const values = ITEMS.map((_, i) => i === index ? clamped : (previous[key]?.[i] ?? data[key]?.[i] ?? 0));
      if (values.every((quantity, i) => quantity === (data[key]?.[i] ?? 0))) delete next[key];
      else next[key] = values;
      return next;
    });
  }
  function saveChanges() {
    setData(previous => ({ ...previous, ...pending }));
    setPending({});
  }
  const overall = useMemo(() => sumRange(data, () => true), [data]);
  const completeTables = useMemo(() => Object.values(data).filter(values => ITEMS.every((item, index) => (values[index] ?? 0) >= item.target)).length, [data]);
  const stationPct = useMemo(() => {
    const sums = Array.from({ length: STATIONS }, () => 0);
    for (const [key, values] of Object.entries(data)) {
      const station = Number(key.split("-")[0]);
      sums[station] = (sums[station] ?? 0) + values.reduce((sum, value) => sum + value, 0);
    }
    return sums.map(value => pct(value, ZONES.length * ROWS * TABLES * TABLE_TOTAL));
  }, [data]);
  function setItem(key: string, index: number, value: number) {
    const item = ITEMS[index];
    if (!item) return;
    const clamped = Math.max(0, Math.min(item.target, Number.isFinite(value) ? Math.trunc(value) : 0));
    setData(previous => ({ ...previous, [key]: ITEMS.map((_, i) => i === index ? clamped : (previous[key]?.[i] ?? 0)) }));
  }
  function importData(updates: Data) {
    setData(previous => ({ ...previous, ...updates }));
  }
  return <FieldContext.Provider value={{ data, draftData, pendingCount, stageItem, saveChanges, overall, stationPct, completeTables, setItem, importData, locks: locks || {}, toggleLock }}>{children}</FieldContext.Provider>;
}

export function useFieldData() {
  const context = useContext(FieldContext);
  if (!context) throw new Error("FieldDataProvider is required");
  return context;
}