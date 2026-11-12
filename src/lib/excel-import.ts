import { ZONES, tableKey, loadSiteConfig, buildItems } from "@/lib/field-data";
import { saveOrShareExcel } from "@/lib/excel-export";

export const IMPORT_HEADERS = ["İstasyon", "Bölge", "Sıra", "Masa", ...buildItems(loadSiteConfig()).map(i => i.name)];

export type ImportResult = { updates: Record<string, number[]>; errors: string[]; rows: number };

export function parseImportRows(rows: unknown[][]): ImportResult {
  const cfg = loadSiteConfig();
  const currentItems = buildItems(cfg);
  const updates: Record<string, number[]> = {};
  const errors: string[] = [];
  let count = 0;

  rows.slice(1).forEach((row, i) => {
    const line = i + 2;
    if (!row || row.every(c => c === undefined || c === null || String(c).trim() === "")) return;
    count++;
    const station = Number(row[0]);
    const zone = ZONES.indexOf(String(row[1] ?? "").trim().toUpperCase());
    const r = Number(row[2]);
    const table = Number(row[3]);
    if (!Number.isInteger(station) || station < 1 || station > cfg.stations) return errors.push(`Satır ${line}: İstasyon 1-${cfg.stations} olmalı`);
    if (zone < 0) return errors.push(`Satır ${line}: Bölge A-D olmalı`);
    if (!Number.isInteger(r) || r < 1 || r > cfg.rows) return errors.push(`Satır ${line}: Sıra 1-${cfg.rows} olmalı`);
    if (!Number.isInteger(table) || table < 1 || table > cfg.tables) return errors.push(`Satır ${line}: Masa 1-${cfg.tables} olmalı`);
    const values: number[] = [];
    for (let k = 0; k < currentItems.length; k++) {
      const raw = row[4 + k];
      const v = raw === undefined || raw === null || raw === "" ? 0 : Number(raw);
      const item = currentItems[k]!;
      if (!Number.isInteger(v) || v < 0 || v > item.target) { errors.push(`Satır ${line}: ${item.name} 0-${item.target} arası tam sayı olmalı`); return; }
      values.push(v);
    }
    updates[tableKey(station - 1, zone, r - 1, table - 1)] = values;
    return undefined;
  });
  return { updates, errors, rows: count };
}

export async function readImportFile(file: File): Promise<ImportResult> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]!];
  if (!sheet) return { updates: {}, errors: ["Dosyada sayfa bulunamadı"], rows: 0 };
  return parseImportRows(XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false }));
}

export async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const cfg = loadSiteConfig();
  const currentItems = buildItems(cfg);
  const headers = ["İstasyon", "Bölge", "Sıra", "Masa", ...currentItems.map(i => i.name)];
  const sampleRow = [1, "A", 1, 1, ...currentItems.map(i => i.target)];
  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Veri");
  await saveOrShareExcel(wb, "saha_veri_sablonu.xlsx");
}
