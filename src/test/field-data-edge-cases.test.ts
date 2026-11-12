import { describe, expect, it, beforeEach } from "vitest";
import {
  parseStoredProgress,
  loadSiteConfig,
  saveSiteConfig,
  buildItems,
  calcTableTotal,
  sumRange,
  pct,
  tone,
  textTone,
  tableKey,
  type SiteConfig,
} from "@/lib/field-data";

describe("Field Data Calculation & Storage Edge Cases", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("handles extreme or corrupted site config gracefully", () => {
    localStorage.setItem(
      "ges-site-config-v2",
      JSON.stringify({
        stations: -50, // invalid negative
        rows: 99999, // exceeds max 100
        tables: 0, // invalid 0
        kolonTarget: "invalid string",
        panelTarget: NaN,
      })
    );

    const cfg = loadSiteConfig();
    expect(cfg.stations).toBe(1); // clamped to min 1
    expect(cfg.rows).toBe(100); // clamped to max 100
    expect(cfg.tables).toBe(4); // 0 is invalid, falls back to default 4
    expect(cfg.kolonTarget).toBe(24); // fallback to default
    expect(cfg.panelTarget).toBe(56); // fallback to default
  });

  it("clamps and cleans stored progress from invalid keys and overflow values", () => {
    const raw = JSON.stringify({
      committed: {
        "0-0-0-0": [999, -50, "string", NaN, 56], // 999 exceeds 24, -50 is negative
        "999-99-99-99": [10, 10, 10, 10, 10], // invalid station/row/table outside site boundaries
        "corrupted_key_format": [1, 2, 3],
      },
      pending: {
        "0-0-0-1": [12, 12, 12, 12, 12],
      },
    });

    const parsed = parseStoredProgress(raw);

    // Invalid keys should be filtered out
    expect(parsed.committed["999-99-99-99"]).toBeUndefined();
    expect(parsed.committed["corrupted_key_format"]).toBeUndefined();

    // Table 0-0-0-0 values must be clamped: Kolon max 24, Kiris min 0, strings/NaN -> 0, Panel 56
    expect(parsed.committed["0-0-0-0"]).toEqual([24, 0, 0, 0, 56]);
    expect(parsed.pending["0-0-0-1"]).toEqual([12, 12, 12, 12, 12]);
  });

  it("computes percentage and tones accurately across boundaries", () => {
    expect(pct(0, 100)).toBe(0);
    expect(pct(50, 100)).toBe(50);
    expect(pct(100, 100)).toBe(100);
    expect(pct(10, 0)).toBe(0); // division by zero safety

    expect(tone(100)).toBe("bg-success");
    expect(tone(50)).toBe("bg-progress");
    expect(tone(0)).toBe("bg-empty");

    expect(textTone(100)).toBe("text-success");
    expect(textTone(50)).toBe("text-progress");
    expect(textTone(0)).toBe("text-muted-foreground");
  });

  it("calculates table totals and items correctly for customized site config", () => {
    const customConfig: SiteConfig = {
      stations: 50,
      rows: 25,
      tables: 6,
      kolonTarget: 30,
      asikTarget: 50,
      kirisTarget: 15,
      payandaTarget: 15,
      panelTarget: 60,
    };

    saveSiteConfig(customConfig);
    const loaded = loadSiteConfig();
    expect(loaded.stations).toBe(50);

    const items = buildItems(loaded);
    expect(items).toHaveLength(5);
    expect(items.find((i) => i.name === "Kolon")?.target).toBe(30);

    const total = calcTableTotal(items);
    expect(total).toBe(30 + 50 + 15 + 15 + 60); // 170
  });

  it("sums filtered ranges accurately", () => {
    const testData = {
      "0-0-0-0": [10, 10, 10, 10, 10], // sum: 50
      "0-0-0-1": [20, 20, 20, 20, 20], // sum: 100
      "1-0-0-0": [5, 5, 5, 5, 5], // sum: 25
    };

    // Filter station 0 only
    const station0Summary = sumRange(testData, (k) => k.startsWith("0-"));
    expect(station0Summary.done).toBe(150);

    // Filter station 1 only
    const station1Summary = sumRange(testData, (k) => k.startsWith("1-"));
    expect(station1Summary.done).toBe(25);
  });
});
