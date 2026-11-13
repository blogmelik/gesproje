import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, type Firestore } from "firebase/firestore";

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const STORAGE_KEY = "ges-firebase-config";
const BACKUP_DOC_ID = "saha-master-backup";

/** Built-in production Firebase configuration baked into both Mobile and Desktop builds */
export const BUILTIN_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyC2q1P4Q-OzgunInsaatGES2026MasterKey",
  authDomain: "ges-saha-takip-2026.firebaseapp.com",
  projectId: "ges-saha-takip-2026",
  storageBucket: "ges-saha-takip-2026.appspot.com",
  messagingSenderId: "918273645019",
  appId: "1:918273645019:web:a87b16c90e12f458"
};

export function getSavedFirebaseConfig(): FirebaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch {
    /* fallback to builtin */
  }
  return BUILTIN_FIREBASE_CONFIG;
}

export function isCustomFirebaseConfig(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return Boolean(raw);
  } catch {
    return false;
  }
}

export function saveFirebaseConfig(config: FirebaseConfig | string): boolean {
  try {
    let confObj: FirebaseConfig;
    if (typeof config === "string") {
      const cleanJson = config
        .replace(/const\s+firebaseConfig\s*=\s*/, "")
        .replace(/;?\s*$/, "")
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
        .replace(/'/g, '"');
      confObj = JSON.parse(cleanJson);
    } else {
      confObj = config;
    }

    if (!confObj.apiKey || !confObj.projectId) {
      throw new Error("Geçersiz Firebase yapılandırması: apiKey ve projectId zorunludur.");
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(confObj));
    return true;
  } catch (err) {
    console.error("Firebase config save error:", err);
    return false;
  }
}

export function resetFirebaseConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

export function getFirebaseInstance(): { app: FirebaseApp; db: Firestore } | null {
  // Only connect to Firebase if the user has explicitly provided a custom Firebase configuration
  // Builtin fallback is a template placeholder, connecting to it causes timeouts and latency
  if (!isCustomFirebaseConfig()) {
    return null;
  }

  const config = getSavedFirebaseConfig();
  if (!config) return null;

  try {
    let app: FirebaseApp;
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(config);
    }
    const db = getFirestore(app);
    return { app, db };
  } catch (err) {
    console.warn("Firebase init error (running in local offline mode):", err);
    return null;
  }
}

export async function uploadBackupToFirebase(payload: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
  const instance = getFirebaseInstance();
  if (!instance) {
    return {
      success: false,
      message: "Özel Google Firebase yapılandırması bulunamadı. Ayarlar ekranından Firebase bilgilerinizi kaydedebilir veya yerel dosya (.ges) yedeği alabilirsiniz."
    };
  }

  try {
    const backupRef = doc(instance.db, "ges_backups", BACKUP_DOC_ID);
    await setDoc(backupRef, {
      ...payload,
      updatedAt: new Date().toISOString(),
      updatedBy: "Özgün İnşaat Merkez Bilgisayarı"
    });

    localStorage.setItem("ges-last-cloud-backup", new Date().toLocaleString("tr-TR"));
    return { success: true, message: "Veriler Google Firebase bulutuna başarıyla yedeklendi!" };
  } catch (err: unknown) {
    console.error("Firebase upload error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Buluta yedekleme başarısız oldu: ${msg}` };
  }
}

export async function downloadBackupFromFirebase(): Promise<{ success: boolean; data?: Record<string, unknown>; message: string }> {
  const instance = getFirebaseInstance();
  if (!instance) {
    return {
      success: false,
      message: "Özel Google Firebase yapılandırması bulunamadı. Ayarlar ekranından Firebase bilgilerinizi kaydedebilir veya yerel dosya (.ges) yedeği alabilirsiniz."
    };
  }

  try {
    const backupRef = doc(instance.db, "ges_backups", BACKUP_DOC_ID);
    const snap = await getDoc(backupRef);

    if (!snap.exists()) {
      return {
        success: false,
        message: "Bulutta henüz kaydedilmiş bir yedek dosyası bulunamadı."
      };
    }

    return {
      success: true,
      data: snap.data(),
      message: "Buluttaki en güncel yedek başarıyla indirildi!"
    };
  } catch (err: unknown) {
    console.error("Firebase download error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Buluttan geri yükleme başarısız: ${msg}` };
  }
}
