import CryptoJS from "crypto-js";
import { uploadBackupToFirebase, downloadBackupFromFirebase } from "./firebase";

const SECRET_KEY = "OzgunInsaat2026SahaTakip$!";

export interface BackupPayload {
  version: string;
  timestamp: string;
  progress: string | null;
  faults: string | null;
  settings: string | null;
  teams: string | null;
  locked: string | null;
  siteConfig?: string | null;
}

export function createBackupPayload(): BackupPayload {
  return {
    version: "2.0",
    timestamp: new Date().toISOString(),
    progress: localStorage.getItem("ges-progress-v1"),
    faults: localStorage.getItem("ges-faults"),
    settings: localStorage.getItem("ges-settings"),
    teams: localStorage.getItem("ges-teams"),
    locked: localStorage.getItem("ges-locked-v1"),
    siteConfig: localStorage.getItem("ges-site-config-v2")
  };
}

export function restoreBackupPayload(payload: Partial<BackupPayload>): boolean {
  try {
    if (payload.progress) localStorage.setItem("ges-progress-v1", payload.progress);
    if (payload.faults) localStorage.setItem("ges-faults", payload.faults);
    if (payload.settings) localStorage.setItem("ges-settings", payload.settings);
    if (payload.teams) localStorage.setItem("ges-teams", payload.teams);
    if (payload.locked) localStorage.setItem("ges-locked-v1", payload.locked);
    if (payload.siteConfig) localStorage.setItem("ges-site-config-v2", payload.siteConfig);
    return true;
  } catch (err) {
    console.error("Restore error:", err);
    return false;
  }
}

/** Exports current site progress to an encrypted .ges file (or shares on mobile) */
export async function exportBackupFile(): Promise<{ success: boolean; message: string }> {
  try {
    const payload = createBackupPayload();
    const rawJson = JSON.stringify(payload);
    const encrypted = CryptoJS.AES.encrypt(rawJson, SECRET_KEY).toString();
    
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `GES_Saha_Yedek_${dateStr}.ges`;
    const blob = new Blob([encrypted], { type: "application/octet-stream" });
    const file = new File([blob], filename, { type: "application/octet-stream" });

    // Web Share API for Mobile (WhatsApp / Drive / Files)
    if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "GES Saha Yedek Dosyası",
          text: `GES Saha Takip yedek dosyası (${dateStr}) ektedir.`
        });
        return { success: true, message: "Yedek dosyası paylaşıldı!" };
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return { success: false, message: "Paylaşım iptal edildi." };
        }
      }
    }

    // Direct Browser / Electron Download
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
      return { success: true, message: `Yedek dosyası indirildi: ${filename}` };
    }

    return { success: true, message: "Yedek oluşturuldu." };
  } catch (err) {
    console.error("Export file error:", err);
    return { success: false, message: "Dosya yedekleme oluşturulamadı." };
  }
}

/** Reads and restores a .ges backup file */
export async function importBackupFile(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text();
    let jsonStr: string;

    // Check if encrypted with AES
    if (text.startsWith("U2FsdGVk")) {
      const bytes = CryptoJS.AES.decrypt(text, SECRET_KEY);
      jsonStr = bytes.toString(CryptoJS.enc.Utf8);
    } else {
      jsonStr = text;
    }

    const payload = JSON.parse(jsonStr) as Partial<BackupPayload>;
    const success = restoreBackupPayload(payload);
    if (success) {
      return { success: true, message: "Yedek dosyası başarıyla yüklendi! Sayfa yenileniyor..." };
    }
    return { success: false, message: "Yedek dosyası uygulanamadı." };
  } catch (err) {
    console.error("Import file error:", err);
    return { success: false, message: "Geçersiz veya bozuk yedek dosyası." };
  }
}

/** Uploads master backup to Google Firebase manually */
export async function backupToFirebase(): Promise<{ success: boolean; message: string }> {
  const payload = createBackupPayload();
  return uploadBackupToFirebase(payload as unknown as Record<string, unknown>);
}

/** Downloads master backup from Google Firebase manually */
export async function restoreFromFirebase(): Promise<{ success: boolean; message: string }> {
  const result = await downloadBackupFromFirebase();
  if (!result.success || !result.data) {
    return { success: false, message: result.message };
  }

  const success = restoreBackupPayload(result.data as Partial<BackupPayload>);
  if (success) {
    return { success: true, message: "Buluttaki en güncel yedek başarıyla yüklendi! Sayfa yenileniyor..." };
  }
  return { success: false, message: "Buluttan indirilen veri yerel hafızaya yazılamadı." };
}
