import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { ITEMS, STATIONS, ROWS, TABLES, ZONES, seedData, sumRange, TABLE_TOTAL, tableKey, FieldDataProvider, useFieldData } from "@/lib/field-data";

describe("Field sample data", () => {
  it("contains the full station, zone, row and table hierarchy", () => {
    const data = seedData();
    expect(Object.keys(data)).toHaveLength(STATIONS * ZONES.length * ROWS * TABLES);
    expect(data[tableKey(35, 3, 17, 3)]).toEqual([0, 0, 0, 0, 0]);
    expect(data[tableKey(0, 0, 0, 0)]).toEqual(ITEMS.map(() => 0));
    expect(sumRange(data, () => true).total).toBe(STATIONS * ZONES.length * ROWS * TABLES * TABLE_TOTAL);
  });
  it("has deterministic sample quantities within their targets", () => {
    const data = seedData();
    expect(seedData()).toEqual(data);
    for (const values of Object.values(data)) {
      ITEMS.forEach((item, index) => {
        expect(values[index]).toBeGreaterThanOrEqual(0);
        expect(values[index]).toBeLessThanOrEqual(item.target);
      });
    }
  });
});

describe("Explicit progress save", () => {
  it("keeps edits pending until saved and commits all edited locations", () => {
    const { result } = renderHook(() => useFieldData(), { wrapper: FieldDataProvider });
    const first = tableKey(0, 0, 0, 0);
    const second = tableKey(2, 2, 0, 0);
    act(() => result.current.stageItem(first, 0, 8));
    act(() => result.current.stageItem(first, 1, 6));
    act(() => result.current.stageItem(second, 0, 24));
    expect(result.current.data[first]).toEqual([0, 0, 0, 0, 0]);
    expect(result.current.overall.done).toBe(0);
    expect(result.current.draftData[first]).toEqual([8, 6, 0, 0, 0]);
    expect(result.current.pendingCount).toBe(2);
    act(() => result.current.saveChanges());
    expect(result.current.data[first]).toEqual([8, 6, 0, 0, 0]);
    expect(result.current.data[second]?.[0]).toBe(24);
    expect(result.current.overall.done).toBe(38);
    expect(result.current.pendingCount).toBe(0);
  });
  it("removes reverted edits and clamps quantities", () => {
    const { result } = renderHook(() => useFieldData(), { wrapper: FieldDataProvider });
    const key = tableKey(0, 0, 0, 0);
    act(() => result.current.stageItem(key, 0, 99));
    expect(result.current.draftData[key]?.[0]).toBe(24);
    act(() => result.current.stageItem(key, 0, 0));
    expect(result.current.pendingCount).toBe(0);
  });
});