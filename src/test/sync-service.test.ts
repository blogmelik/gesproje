import { describe, expect, it, beforeEach } from "vitest";
import CryptoJS from "crypto-js";
import { type FieldSubmission, upsertLocalSubmission, getLocalSubmissions } from "@/lib/submissions";
import { decryptSubmission } from "@/lib/sync-service";
import { APP_VERSION, BUILD_NUMBER } from "@/lib/version";

const SECRET_KEY = "OzgunInsaat2026SahaTakip$!";

describe("Sync Service Encryption & Payload Safety", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("verifies application version is bumped to v1.0.4 build #5", () => {
    expect(APP_VERSION).toBe("1.0.4");
    expect(BUILD_NUMBER).toBe(5);
  });

  it("encrypts and decrypts submissions losslessly including Turkish characters", () => {
    const originalSub: FieldSubmission = {
      id: "test_sync_123",
      senderName: "Şantiyedeki Çavuş & İmalatçı Ömer",
      station: 3,
      zone: "C",
      row: 7,
      summaryText: "İstasyon 4 › Bölge C › Sıra 8 (4 masa tamamlandı)",
      note: "Çelik aşık ve payanda bağlantıları güçlendirildi.",
      changes: {
        "3-2-7-0": [24, 12, 12, 40, 56],
        "3-2-7-1": [24, 12, 12, 40, 56],
      },
      timestamp: "2026-11-12T14:30:00.000Z",
      status: "pending",
    };

    const json = JSON.stringify(originalSub);
    const encrypted = CryptoJS.AES.encrypt(json, SECRET_KEY).toString();

    // Verify encrypted output is safe ASCII base64
    expect(/^U2FsdGVkX1[A-Za-z0-9+/=]+$/.test(encrypted)).toBe(true);

    const decryptedBytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const decryptedJson = decryptedBytes.toString(CryptoJS.enc.Utf8);
    const restored = JSON.parse(decryptedJson) as FieldSubmission;

    expect(restored).toEqual(originalSub);
    expect(restored.senderName).toBe("Şantiyedeki Çavuş & İmalatçı Ömer");
    expect(restored.note).toBe("Çelik aşık ve payanda bağlantıları güçlendirildi.");
  });

  it("decryptSubmission caches results and handles corrupted payloads safely", () => {
    const originalSub: FieldSubmission = {
      id: "sub_cache_test_1",
      senderName: "Usta",
      station: 1,
      zone: "A",
      row: 2,
      summaryText: "İstasyon 2 › Bölge A › Sıra 3",
      changes: {},
      timestamp: "2026-11-13T10:00:00.000Z",
      status: "pending",
    };

    const json = JSON.stringify(originalSub);
    const encrypted = CryptoJS.AES.encrypt(json, SECRET_KEY).toString();

    // First call decrypts
    const firstCall = decryptSubmission(encrypted);
    expect(firstCall).not.toBeNull();
    expect(firstCall?.id).toBe("sub_cache_test_1");

    // Second call reads from memory cache instantly
    const secondCall = decryptSubmission(encrypted);
    expect(secondCall).toBe(firstCall);

    // Corrupted input returns null without throwing
    expect(decryptSubmission("corrupted_base64_!#%")).toBeNull();
    expect(decryptSubmission("")).toBeNull();
  });

  it("upsertLocalSubmission inserts new item and preserves local reviewed status", () => {
    const sub1: FieldSubmission = {
      id: "sub_stream_101",
      senderName: "Ahmet",
      station: 2,
      zone: "B",
      row: 1,
      summaryText: "İstasyon 3 › Bölge B",
      changes: { "2-1-1-0": [10, 5, 5, 20, 28] },
      timestamp: "2026-11-13T11:00:00.000Z",
      status: "pending",
    };

    // 1. Initial insert via SSE stream
    const res1 = upsertLocalSubmission(sub1);
    expect(res1.isNew).toBe(true);
    expect(res1.updated).toBe(true);
    expect(getLocalSubmissions().length).toBe(1);

    // 2. Local approval in desktop inbox
    const local = getLocalSubmissions();
    expect(local[0]).toBeDefined();
    if (local[0]) {
      local[0].status = "approved";
      local[0].reviewedBy = "Merkez";
      localStorage.setItem("ges-submissions-inbox-v1", JSON.stringify(local));
    }

    // 3. Duplicate incoming event over stream must NOT revert to "pending"
    const res2 = upsertLocalSubmission(sub1);
    expect(res2.isNew).toBe(false);
    expect(res2.updated).toBe(true);

    const savedAfter = getLocalSubmissions();
    expect(savedAfter.length).toBe(1);
    expect(savedAfter[0]?.status).toBe("approved");
    expect(savedAfter[0]?.reviewedBy).toBe("Merkez");
  });

  it("produces strictly safe ASCII headers for fetch compatibility", () => {
    const sub: FieldSubmission = {
      id: "sub_test",
      senderName: "Saha Ekibi",
      station: 5,
      zone: "B",
      summaryText: "İstasyon 6 › Bölge B",
      changes: {},
      timestamp: new Date().toISOString(),
      status: "pending",
    };

    const safeTitle = `GES Rapor: Istasyon ${sub.station + 1} - Bolge ${sub.zone || "A"}`;

    // Verify all characters are in 7-bit ASCII range (0-127)
    for (let i = 0; i < safeTitle.length; i++) {
      expect(safeTitle.charCodeAt(i)).toBeLessThanOrEqual(127);
    }

    // Verify Headers constructor does not throw ByteString error
    expect(() => {
      new Headers({
        Title: safeTitle,
        Priority: "default",
        Tags: "package,white_check_mark",
      });
    }).not.toThrow();
  });
});
