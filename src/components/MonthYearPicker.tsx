"use client";

type Props = {
  value: string;
  onChange: (next: string) => void;
  className?: string;
};

const MONTHS = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

function getYearOptions() {
  const now = new Date().getFullYear();
  const years: number[] = [];
  for (let y = now + 2; y >= now - 20; y--) {
    years.push(y);
  }
  return years;
}

export default function MonthYearPicker({ value, onChange, className = "" }: Props) {
  const [yearPart, monthPart] = value.split("-");
  const year = yearPart || String(new Date().getFullYear());
  const month = monthPart || String(new Date().getMonth() + 1).padStart(2, "0");
  const years = getYearOptions();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select
        value={month}
        onChange={(e) => onChange(`${year}-${e.target.value}`)}
        className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm"
        aria-label="Pilih bulan"
      >
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => onChange(`${e.target.value}-${month}`)}
        className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm"
        aria-label="Pilih tahun"
      >
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
