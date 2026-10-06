import { useEffect, useState } from "react";

export interface FaultReport {
  detail: string;
  photo: string | null;
  latitude: number | null;
  longitude: number | null;
  x: string;
  y: string;
  z: string;
  resolved: boolean;
  critical: boolean;
  team: string;
  createdAt: string;
}

export const FAULT_STORAGE_KEY = "ges-fault-reports-v1";
export const emptyFault = (): FaultReport => ({ detail: "", photo: null, latitude: null, longitude: null, x: "", y: "", z: "", resolved: false, critical: false, team: "", createdAt: new Date().toISOString() });

export function parseFaultReports(raw: string | null): Record<string, FaultReport> {
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid records");
  const result: Record<string, FaultReport> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (!value || typeof value !== "object") continue;
    const record = value as Record<string, unknown>;
    if (typeof record['detail'] !== "string" || typeof record['resolved'] !== "boolean" || typeof record['team'] !== "string") continue;
    result[key] = {
      detail: record['detail'],
      photo: typeof record['photo'] === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(record['photo']) ? record['photo'] : null,
      latitude: typeof record['latitude'] === "number" && Number.isFinite(record['latitude']) ? record['latitude'] : null,
      longitude: typeof record['longitude'] === "number" && Number.isFinite(record['longitude']) ? record['longitude'] : null,
      x: typeof record['x'] === "string" ? record['x'] : "",
      y: typeof record['y'] === "string" ? record['y'] : "",
      z: typeof record['z'] === "string" ? record['z'] : "",
      resolved: record['resolved'],
      team: String(record['team']),
      critical: record['critical'] === true,
      createdAt: typeof record['createdAt'] === "string" ? record['createdAt'] : "",
    };
  }
  return result;
}

export function useFaultReports() {
  const [reports, setReports] = useState<Record<string, FaultReport>>({});
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setReports(parseFaultReports(localStorage.getItem(FAULT_STORAGE_KEY))); }
    catch { setError("Cihazdaki hata kayıtları okunamadı. Tarayıcı depolama izinlerini kontrol edin."); }
    setReady(true);
  }, []);

  function save(id: string, report: FaultReport) {
    try {
      const stored = parseFaultReports(localStorage.getItem(FAULT_STORAGE_KEY));
      const next = { ...stored, [id]: report };
      localStorage.setItem(FAULT_STORAGE_KEY, JSON.stringify(next));
      setReports(next);
      setError("");
      return true;
    } catch {
      setError("Kayıt cihazda saklanamadı. Depolama alanı dolu veya tarayıcı izni kapalı olabilir; fotoğrafı kaldırıp tekrar deneyin.");
      return false;
    }
  }
  function remove(id: string) {
    try {
      const stored = parseFaultReports(localStorage.getItem(FAULT_STORAGE_KEY));
      if (!(id in stored)) return true;
      const next = { ...stored };
      delete next[id];
      localStorage.setItem(FAULT_STORAGE_KEY, JSON.stringify(next));
      setReports(next);
      setError("");
      return true;
    } catch {
      setError("Hata kaydı cihazdan silinemedi. Depolama izinlerini kontrol edin.");
      return false;
    }
  }
  return { reports, save, remove, error, ready };
}

export async function prepareFaultPhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("JPG, PNG veya WebP formatında bir fotoğraf seçin.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Fotoğraf en fazla 20 MB olabilir.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const ratio = Math.min(1, 1280 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Fotoğraf işlenemedi.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.75);
  } finally { URL.revokeObjectURL(url); }
}
export type FaultStatus = "Açık" | "Kritik" | "Giderildi";
export const faultStatus = (r: FaultReport): FaultStatus => r.resolved ? "Giderildi" : r.critical ? "Kritik" : "Açık";
