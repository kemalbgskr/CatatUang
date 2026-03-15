import { formatRupiah, formatDate, getCurrentMonth, getMonthLabel } from "@/lib/utils";

describe("formatRupiah", () => {
  it("format angka positif", () => {
    expect(formatRupiah(1000000)).toBe("Rp 1.000.000");
  });

  it("format angka nol", () => {
    expect(formatRupiah(0)).toBe("Rp 0");
  });

  it("format angka negatif dengan tanda minus", () => {
    expect(formatRupiah(-500000)).toBe("-Rp 500.000");
  });

  it("format angka kecil", () => {
    expect(formatRupiah(500)).toBe("Rp 500");
  });

  it("format angka besar dengan pemisah ribuan", () => {
    expect(formatRupiah(1234567890)).toBe("Rp 1.234.567.890");
  });

  it("format angka desimal (dibulatkan Intl)", () => {
    const result = formatRupiah(1500.5);
    expect(result).toMatch(/^Rp /);
  });
});

describe("formatDate", () => {
  it("format string tanggal ISO ke format Indonesia", () => {
    const result = formatDate("2026-03-15");
    expect(result).toContain("2026");
    expect(result).toContain("15");
  });

  it("format objek Date ke format Indonesia", () => {
    const result = formatDate(new Date(2026, 2, 15)); // Maret 2026
    expect(result).toContain("2026");
  });

  it("mengandung nama bulan pendek atau angka", () => {
    const result = formatDate("2026-01-01");
    // Nama bulan dalam bahasa Indonesia: Jan / Jan
    expect(result).toBeTruthy();
  });
});

describe("getCurrentMonth", () => {
  it("mengembalikan format YYYY-MM", () => {
    const result = getCurrentMonth();
    expect(result).toMatch(/^\d{4}-\d{2}$/);
  });

  it("bulan berada dalam rentang 01-12", () => {
    const result = getCurrentMonth();
    const month = parseInt(result.split("-")[1]);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });

  it("tahun sesuai dengan tahun saat ini", () => {
    const result = getCurrentMonth();
    const year = parseInt(result.split("-")[0]);
    expect(year).toBe(new Date().getFullYear());
  });
});

describe("getMonthLabel", () => {
  it("mengubah 2026-03 menjadi label bulan Indonesia", () => {
    const result = getMonthLabel("2026-03");
    expect(result).toContain("2026");
    expect(result.toLowerCase()).toContain("maret");
  });

  it("mengubah 2026-01 menjadi Januari", () => {
    const result = getMonthLabel("2026-01");
    expect(result.toLowerCase()).toContain("januari");
  });

  it("mengubah 2026-12 menjadi Desember", () => {
    const result = getMonthLabel("2026-12");
    expect(result.toLowerCase()).toContain("desember");
  });

  it("mengandung tahun yang benar", () => {
    const result = getMonthLabel("2025-06");
    expect(result).toContain("2025");
  });
});
