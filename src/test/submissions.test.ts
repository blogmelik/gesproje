import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  getLocalSubmissions,
  saveLocalSubmissions,
  getPendingSubmissionCount,
  approveSubmission,
  rejectSubmission,
  exportSubmissionFile,
  type FieldSubmission,
} from "@/lib/submissions";

describe("Submissions Inbox & Review Logic", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("handles empty or corrupted local storage gracefully", () => {
    expect(getLocalSubmissions()).toEqual([]);
    expect(getPendingSubmissionCount()).toBe(0);

    localStorage.setItem("ges-submissions-inbox-v1", "{ invalid json corrupt content");
    expect(getLocalSubmissions()).toEqual([]);
    expect(getPendingSubmissionCount()).toBe(0);
  });

  it("saves and retrieves submissions correctly", () => {
    const sub1: FieldSubmission = {
      id: "sub_1",
      senderName: "Ahmet Usta",
      station: 0,
      zone: "A",
      row: 0,
      summaryText: "İstasyon 1 › Bölge A › Sıra 1",
      changes: { "0-0-0-0": [24, 12, 12, 40, 56] },
      timestamp: "2026-11-12T10:00:00Z",
      status: "pending",
    };

    saveLocalSubmissions([sub1]);
    expect(getLocalSubmissions()).toHaveLength(1);
    expect(getPendingSubmissionCount()).toBe(1);
    expect(getLocalSubmissions()[0]?.senderName).toBe("Ahmet Usta");
  });

  it("approves a submission and applies changes via callback", async () => {
    const sub1: FieldSubmission = {
      id: "sub_1",
      senderName: "Mehmet Çavuş",
      station: 1,
      zone: "B",
      row: 2,
      summaryText: "İstasyon 2 › Bölge B › Sıra 3",
      changes: { "1-1-2-0": [24, 0, 0, 0, 0] },
      timestamp: "2026-11-12T11:00:00Z",
      status: "pending",
    };

    saveLocalSubmissions([sub1]);

    let appliedChanges = {};
    const res = await approveSubmission(sub1, (changes) => {
      appliedChanges = changes;
    });

    expect(res.success).toBe(true);
    expect(appliedChanges).toEqual({ "1-1-2-0": [24, 0, 0, 0, 0] });

    const stored = getLocalSubmissions();
    expect(stored[0]?.status).toBe("approved");
    expect(stored[0]?.reviewedBy).toBe("Merkez Yetkilisi");
    expect(getPendingSubmissionCount()).toBe(0);
  });

  it("rejects a submission without applying data changes", async () => {
    const sub1: FieldSubmission = {
      id: "sub_2",
      senderName: "Hatalı Giriş Ekibi",
      station: 0,
      zone: "A",
      summaryText: "Hatalı test verisi",
      changes: { "0-0-0-0": [99, 99, 99, 99, 99] },
      timestamp: "2026-11-12T12:00:00Z",
      status: "pending",
    };

    saveLocalSubmissions([sub1]);
    const res = await rejectSubmission(sub1);
    expect(res.success).toBe(true);

    const stored = getLocalSubmissions();
    expect(stored[0]?.status).toBe("rejected");
    expect(getPendingSubmissionCount()).toBe(0);
  });

  it("exports encrypted submission file correctly", async () => {
    const sub1: FieldSubmission = {
      id: "sub_export",
      senderName: "Export Test",
      station: 0,
      zone: "A",
      summaryText: "Export deneme",
      changes: { "0-0-0-0": [10, 10, 10, 10, 10] },
      timestamp: new Date().toISOString(),
      status: "pending",
    };

    // Mock HTMLAnchorElement click to prevent jsdom navigation error
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const res = await exportSubmissionFile(sub1);
    expect(res).toBe(true);

    clickSpy.mockRestore();
  });
});
