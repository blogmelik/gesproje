import CryptoJS from "crypto-js";
import type { Data } from "./field-data";
import { publishSubmissionToCloud, pullSubmissionsFromCloud } from "./sync-service";
import { getFirebaseInstance } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";

export interface FieldSubmission {
  id: string;
  senderName: string;
  senderPhone?: string | undefined;
  timestamp: string;
  station: number;
  zone: string;
  row?: number | undefined;
  summaryText: string;
  note?: string | undefined;
  changes: Data;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: string | undefined;
  reviewedBy?: string | undefined;
}

const LOCAL_STORAGE_KEY = "ges-submissions-inbox-v1";
const SECRET_KEY = "OzgunInsaat2026SahaTakip$!";

export function getLocalSubmissions(): FieldSubmission[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalSubmissions(list: FieldSubmission[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save local submissions:", e);
  }
}

export function getPendingSubmissionCount(): number {
  return getLocalSubmissions().filter(s => s.status === "pending").length;
}

/** Sends a field report submission to Cloud and saves locally */
export async function sendReportSubmission(
  submissionData: Omit<FieldSubmission, "id" | "timestamp" | "status">
): Promise<{ success: boolean; id: string; message: string; sharedOffline?: boolean }> {
  const timestamp = new Date().toISOString();
  const localId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const submission: FieldSubmission = {
    ...submissionData,
    id: localId,
    timestamp,
    status: "pending"
  };

  // 1. Always save in local history
  const list = getLocalSubmissions();
  list.unshift(submission);
  saveLocalSubmissions(list);

  // 2. Publish to cloud sync service
  const cloudRes = await publishSubmissionToCloud(submission);

  return {
    success: true,
    id: localId,
    message: cloudRes.message,
    sharedOffline: !cloudRes.success
  };
}

/** Fetches incoming submissions from Cloud and merges with local list */
export async function fetchSubmissionsFromCloud(): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const cloudList = await pullSubmissionsFromCloud();

    // Merge with local list (avoid duplicates by ID, keep local status if already reviewed)
    const local = getLocalSubmissions();
    const map = new Map<string, FieldSubmission>();
    
    // Put cloud items in map first
    for (const item of cloudList) {
      map.set(item.id, item);
    }
    // Overlay local items so local review status (approved/rejected) is preserved
    for (const item of local) {
      if (map.has(item.id)) {
        const cloudItem = map.get(item.id)!;
        map.set(item.id, {
          ...cloudItem,
          status: item.status, // preserve local review decision
          reviewedAt: item.reviewedAt || cloudItem.reviewedAt,
          reviewedBy: item.reviewedBy || cloudItem.reviewedBy
        });
      } else {
        map.set(item.id, item);
      }
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    saveLocalSubmissions(merged);

    const pendingCount = merged.filter(s => s.status === "pending").length;
    return {
      success: true,
      count: pendingCount,
      message: `${cloudList.length} rapor buluttan başarıyla çekildi.`
    };
  } catch (err) {
    console.error("fetchSubmissionsFromCloud error:", err);
    return {
      success: false,
      count: 0,
      message: "Buluttan veri çekilemedi. İnternet bağlantınızı kontrol edin."
    };
  }
}

/** Approves a submission, marks it approved in Firebase and local, and merges changes into project */
export async function approveSubmission(
  submission: FieldSubmission,
  onApplyChanges: (changes: Data) => void
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Apply data changes to the project
    onApplyChanges(submission.changes);

    // 2. Mark approved locally
    const list = getLocalSubmissions();
    const target = list.find(s => s.id === submission.id);
    if (target) {
      target.status = "approved";
      target.reviewedAt = new Date().toISOString();
      target.reviewedBy = "Merkez Yetkilisi";
      saveLocalSubmissions(list);
    }

    // 3. Update in Firebase if possible
    const fb = getFirebaseInstance();
    if (fb && !submission.id.startsWith("sub_")) {
      try {
        const docRef = doc(fb.db, "ges_submissions", submission.id);
        await updateDoc(docRef, {
          status: "approved",
          reviewedAt: new Date().toISOString(),
          reviewedBy: "Merkez Yetkilisi"
        });
      } catch (e) {
        console.warn("Failed to update status in Firebase:", e);
      }
    }

    return {
      success: true,
      message: `"${submission.senderName}" tarafından gönderilen rapor onaylandı ve ana projeye dahil edildi!`
    };
  } catch (err) {
    console.error("approveSubmission error:", err);
    return { success: false, message: "Rapor onaylanırken bir hata oluştu." };
  }
}

/** Rejects a submission */
export async function rejectSubmission(
  submission: FieldSubmission
): Promise<{ success: boolean; message: string }> {
  try {
    const list = getLocalSubmissions();
    const target = list.find(s => s.id === submission.id);
    if (target) {
      target.status = "rejected";
      target.reviewedAt = new Date().toISOString();
      target.reviewedBy = "Merkez Yetkilisi";
      saveLocalSubmissions(list);
    }

    const fb = getFirebaseInstance();
    if (fb && !submission.id.startsWith("sub_")) {
      try {
        const docRef = doc(fb.db, "ges_submissions", submission.id);
        await updateDoc(docRef, {
          status: "rejected",
          reviewedAt: new Date().toISOString(),
          reviewedBy: "Merkez Yetkilisi"
        });
      } catch (e) {
        console.warn("Failed to update status in Firebase:", e);
      }
    }

    return { success: true, message: "Rapor reddedildi." };
  } catch (err) {
    console.error("rejectSubmission error:", err);
    return { success: false, message: "Rapor reddedilirken bir hata oluştu." };
  }
}

/** Share or Export a single submission file (for WhatsApp/Bluetooth transfer) */
export async function exportSubmissionFile(submission: FieldSubmission): Promise<boolean> {
  try {
    const raw = JSON.stringify(submission);
    const encrypted = CryptoJS.AES.encrypt(raw, SECRET_KEY).toString();
    const filename = `Saha_Raporu_${submission.senderName.replace(/\s+/g, "_")}_${submission.timestamp.slice(0, 10)}.gessub`;
    const blob = new Blob([encrypted], { type: "application/octet-stream" });
    const file = new File([blob], filename, { type: "application/octet-stream" });

    if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Saha İmalat Raporu",
          text: `${submission.senderName} tarafından hazırlanan saha raporu ektedir.`
        });
        return true;
      } catch {
        return false;
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
    return false;
  } catch {
    return false;
  }
}

/** Import a .gessub file received via WhatsApp/Mail into Gelen Kutusu */
export async function importSubmissionFile(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text();
    let jsonStr: string;
    if (text.startsWith("U2FsdGVk")) {
      const bytes = CryptoJS.AES.decrypt(text, SECRET_KEY);
      jsonStr = bytes.toString(CryptoJS.enc.Utf8);
    } else {
      jsonStr = text;
    }

    const submission = JSON.parse(jsonStr) as FieldSubmission;
    if (!submission.senderName || !submission.changes) {
      return { success: false, message: "Geçersiz rapor dosyası." };
    }

    const list = getLocalSubmissions();
    // Check duplicate
    if (list.some(s => s.id === submission.id)) {
      return { success: false, message: "Bu rapor zaten Gelen Kutusu'nda mevcut." };
    }

    list.unshift(submission);
    saveLocalSubmissions(list);
    return { success: true, message: `"${submission.senderName}" tarafından iletilen rapor Gelen Kutusu'na eklendi!` };
  } catch (e) {
    console.error("importSubmissionFile error:", e);
    return { success: false, message: "Rapor dosyası okunamadı." };
  }
}
