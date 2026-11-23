import { describe, it, expect } from "vitest";

import { toAbsoluteAyah, fromAbsoluteAyah, countUniqueAyahs } from "@/lib/memorization";
import { surahs } from "@/data/surahs";

describe("surahs", () => {
  it("contains 114 surahs", () => {
    expect(surahs.length).toBe(114);
  });

  it("total ayahs is 6236", () => {
    expect(surahs.reduce((s, x) => s + x.ayahCount, 0)).toBe(6236);
  });

  it("toAbsoluteAyah maps surah 1 ayah 1 to 1", () => {
    expect(toAbsoluteAyah(1, 1)).toBe(1);
  });

  it("toAbsoluteAyah maps surah 2 ayah 1 to 8", () => {
    expect(toAbsoluteAyah(2, 1)).toBe(8);
  });

  it("fromAbsoluteAyah round-trips", () => {
    const { surahNumber, ayah } = fromAbsoluteAyah(toAbsoluteAyah(18, 10));
    expect(surahNumber).toBe(18);
    expect(ayah).toBe(10);
  });
});

describe("countUniqueAyahs", () => {
  it("merges overlapping ranges", () => {
    const ranges = [
      { start: 1, end: 5 },
      { start: 3, end: 7 },
    ];
    expect(countUniqueAyahs(ranges)).toBe(7);
  });

  it("counts disjoint ranges", () => {
    const ranges = [
      { start: 1, end: 3 },
      { start: 10, end: 12 },
    ];
    expect(countUniqueAyahs(ranges)).toBe(6);
  });

  it("returns 0 for empty", () => {
    expect(countUniqueAyahs([])).toBe(0);
  });
});

describe("attendance percentage", () => {
  it("computes percentage", () => {
    const present = 8;
    const late = 2;
    const total = 12;
    const attended = present + late;
    const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
    expect(pct).toBe(83);
  });
});

describe("fees remaining", () => {
  it("computes remaining", () => {
    const amount = 200;
    const paid = 120;
    const remaining = Math.max(amount - paid, 0);
    expect(remaining).toBe(80);
  });

  it("clamps at 0", () => {
    const amount = 200;
    const paid = 250;
    const remaining = Math.max(amount - paid, 0);
    expect(remaining).toBe(0);
  });
});
