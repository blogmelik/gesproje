import { ITEMS, ROWS, STATIONS, TABLES, ZONES, tableKey } from "@/lib/field-data";

export const IMPORT_HEADERS = ["İstasyon", "Bölge", "Sıra", "Masa", ...ITEMS.map(i => i.name)];

export type ImportResult = { updates: Record<string, number[]>; errors: string[]; rows: number };

export function parseImportRows(rows: unknown[][]): ImportResult {
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
    if (!Number.isInteger(station) || station < 1 || station > STATIONS) return errors.push(`Satır ${line}: İstasyon 1-${STATIONS} olmalı`);
    if (zone < 0) return errors.push(`Satır ${line}: Bölge A-D olmalı`);
    if (!Number.isInteger(r) || r < 1 || r > ROWS) return errors.push(`Satır ${line}: Sıra 1-${ROWS} olmalı`);
    if (!Number.isInteger(table) || table < 1 || table > TABLES) return errors.push(`Satır ${line}: Masa 1-${TABLES} olmalı`);
    const values: number[] = [];
    for (let k = 0; k < ITEMS.length; k++) {
      const raw = row[4 + k];
      const v = raw === undefined || raw === null || raw === "" ? 0 : Number(raw);
      const item = ITEMS[k]!;
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
  const ws = XLSX.utils.aoa_to_sheet([IMPORT_HEADERS, [1, "A", 1, 1, 24, 12, 12, 40, 56], [1, "A", 1, 2, 10, 0, 0, 0, 0]]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Veri");
  XLSX.writeFile(wb, "saha_veri_sablonu.xlsx");
}
