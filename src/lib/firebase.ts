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

export function getSavedFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.apiKey && parsed.projectId) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveFirebaseConfig(config: FirebaseConfig | string): boolean {
  try {
    let confObj: FirebaseConfig;
    if (typeof config === "string") {
      // Support pasting the entire firebaseConfig = { ... } snippet directly
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

export function getFirebaseInstance(): { app: FirebaseApp; db: Firestore } | null {
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
    console.error("Firebase init error:", err);
    return null;
  }
}

export async function uploadBackupToFirebase(payload: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
  const instance = getFirebaseInstance();
  if (!instance) {
    return {
      success: false,
      message: "Firebase henüz ayarlanmamış. Lütfen Ayarlar sayfasından Firebase bilgilerinizi kaydedin."
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
      message: "Firebase henüz ayarlanmamış. Lütfen Ayarlar sayfasından Firebase bilgilerinizi kaydedin."
    };
  }

  try {
    const backupRef = doc(instance.db, "ges_backups", BACKUP_DOC_ID);
    const snap = await getDoc(backupRef);
    if (!snap.exists()) {
      return { success: false, message: "Firebase üzerinde henüz kayıtlı bir yedek bulunamadı." };
    }

    return {
      success: true,
      data: snap.data(),
      message: "En güncel yedek buluttan başarıyla çekildi!"
    };
  } catch (err: unknown) {
    console.error("Firebase download error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Buluttan geri yükleme başarısız oldu: ${msg}` };
  }
}
