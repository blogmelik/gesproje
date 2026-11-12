import CryptoJS from "crypto-js";
import { getFirebaseInstance } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import type { Data } from "./field-data";
import type { FieldSubmission } from "./submissions";

const SYNC_TOPIC = "ozgun_ges_saha_takip_sync_2026";
const NTFY_URL = `https://ntfy.sh/${SYNC_TOPIC}`;
const SECRET_KEY = "OzgunInsaat2026SahaTakip$!";

/** Publishes a field submission to the instant cloud relay and Firebase */
export async function publishSubmissionToCloud(submission: FieldSubmission): Promise<{ success: boolean; message: string }> {
  let cloudSent = false;

  // 1. Send via fast HTTP Pub/Sub (ntfy.sh) - Works instantly on 4G/LTE mobile networks with zero config
  try {
    const jsonStr = JSON.stringify(submission);
    const encrypted = CryptoJS.AES.encrypt(jsonStr, SECRET_KEY).toString();

    const response = await fetch(NTFY_URL, {
      method: "POST",
      headers: {
        "Title": `GES Rapor: İstasyon ${submission.station + 1} - Bölge ${submission.zone}`,
        "Priority": "default",
        "Tags": "package,white_check_mark"
      },
      body: encrypted
    });

    if (response.ok) {
      cloudSent = true;
    }
  } catch (err) {
    console.warn("Cloud relay post warning:", err);
  }

  // 2. Also send to Firebase Firestore if an instance is configured
  const fb = getFirebaseInstance();
  if (fb) {
    try {
      const colRef = collection(fb.db, "ges_submissions");
      await addDoc(colRef, {
        ...submission,
        createdAt: submission.timestamp
      });
      cloudSent = true;
    } catch (fbErr) {
      console.warn("Firebase firestore post warning:", fbErr);
    }
  }

  if (cloudSent) {
    return { success: true, message: "Rapor bulut üzerinden merkeze iletildi." };
  } else {
    return { success: true, message: "Rapor yerel olarak kaydedildi (çevrimdışı)." };
  }
}

/** Pulls incoming submissions from the cloud relay and merges with Firebase */
export async function pullSubmissionsFromCloud(): Promise<FieldSubmission[]> {
  const result: FieldSubmission[] = [];
  const seenIds = new Set<string>();

  // 1. Pull from cloud pub/sub (messages from last 24 hours)
  try {
    const response = await fetch(`${NTFY_URL}/json?poll=1&since=24h`, {
      method: "GET"
    });

    if (response.ok) {
      const text = await response.text();
      const lines = text.trim().split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const evt = JSON.parse(line);
          if (evt.event === "message" && evt.message) {
            // Decrypt message
            let rawJson = "";
            try {
              const bytes = CryptoJS.AES.decrypt(evt.message, SECRET_KEY);
              rawJson = bytes.toString(CryptoJS.enc.Utf8);
            } catch {
              rawJson = evt.message;
            }

            if (rawJson) {
              const subObj = JSON.parse(rawJson) as FieldSubmission;
              if (subObj && subObj.id && !seenIds.has(subObj.id)) {
                seenIds.add(subObj.id);
                result.push(subObj);
              }
            }
          }
        } catch {
          /* ignore malformed lines */
        }
      }
    }
  } catch (err) {
    console.warn("Cloud relay pull error:", err);
  }

  // 2. Pull from Firebase if configured
  const fb = getFirebaseInstance();
  if (fb) {
    try {
      const colRef = collection(fb.db, "ges_submissions");
      const q = query(colRef, orderBy("createdAt", "desc"), limit(50));
      const snap = await getDocs(q);
      snap.forEach(docSnap => {
        const item = docSnap.data() as FieldSubmission;
        const subId = docSnap.id;
        if (!seenIds.has(subId)) {
          seenIds.add(subId);
          result.push({
            ...item,
            id: subId
          });
        }
      });
    } catch (fbErr) {
      console.warn("Firebase pull error:", fbErr);
    }
  }

  // Sort newest first
  return result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
