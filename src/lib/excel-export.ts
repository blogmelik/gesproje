import { ITEMS, STATIONS, ZONES, ROWS, TABLES, TABLE_TOTAL, pct, sumRange, type Data } from "@/lib/field-data";

export function buildExportRows(data: Data) {
  const tableCount = STATIONS * ZONES.length * ROWS * TABLES;
  const overall = sumRange(data, () => true);
  const summary: (string | number)[][] = [
    ["Kalem", "Yapılan", "Toplam Hedef", "Tamamlanma (%)"],
    ...ITEMS.map((item, index) => {
      const done = overall.per[index] ?? 0;
      const total = item.target * tableCount;
      return [item.name, done, total, pct(done, total)];
    }),
    ["Saha Geneli", overall.done, overall.total, pct(overall.done, overall.total)],
  ];
  const detail: (string | number)[][] = [];
  for (let s = 0; s < STATIONS; s++)
    for (let z = 0; z < ZONES.length; z++)
      for (let r = 0; r < ROWS; r++)
        for (let t = 0; t < TABLES; t++) {
          const values = data[`${s}-${z}-${r}-${t}`] ?? [];
          if (!values.some(v => v > 0)) continue;
          const done = values.reduce((a, b) => a + b, 0);
          detail.push([s + 1, ZONES[z] ?? "", r + 1, t + 1, ...ITEMS.map((_, i) => values[i] ?? 0), pct(done, TABLE_TOTAL)]);
        }
  return { summary, detail };
}

export async function saveOrShareExcel(wb: any, filename: string): Promise<boolean> {
  const XLSX = await import("xlsx");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const file = new File([blob], filename, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

  if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
        text: `${filename} raporu ektedir.`,
      });
      return true;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return false;
      console.warn("navigator.share failed, fallback to download", err);
    }
  }

  if (typeof window !== "undefined") {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
    return true;
  }

  XLSX.writeFile(wb, filename);
  return true;
}

export async function exportProgressExcel(data: Data) {
  const XLSX = await import("xlsx");
  const { summary, detail } = buildExportRows(data);
  const wb = XLSX.utils.book_new();
  const s1 = XLSX.utils.aoa_to_sheet(summary);
  s1["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, s1, "Özet");
  const headers = ["İstasyon", "Bölge", "Sıra", "Masa", ...ITEMS.map(i => `${i.name} (Yapılan / ${i.target})`), "Masa Tamamlanma Yüzdesi (%)"];
  const s2 = XLSX.utils.aoa_to_sheet([headers, ...detail]);
  s2["!cols"] = headers.map(h => ({ wch: Math.max(9, h.length + 2) }));
  s2["!autofilter"] = { ref: `A1:J${detail.length + 1}` };
  XLSX.utils.book_append_sheet(wb, s2, "Detaylı Liste");
  await saveOrShareExcel(wb, "saha_genel_ilerleme.xlsx");
  return detail.length;
}
