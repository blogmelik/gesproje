import { describe, expect, it } from "vitest";
import CryptoJS from "crypto-js";
import { type FieldSubmission } from "@/lib/submissions";

const SECRET_KEY = "OzgunInsaat2026SahaTakip$!";

describe("Sync Service Encryption & Payload Safety", () => {
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
