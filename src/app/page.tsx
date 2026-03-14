"use client";
import { useEffect, useState } from "react";
import { formatRupiah, getCurrentMonth, getMonthLabel } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  HandCoins,
  Star,
} from "lucide-react";
import MonthYearPicker from "@/components/MonthYearPicker";

interface DashboardData {
  totalUtang: number;
  totalPiutang: number;
  currentMonth: string;
  totalPendapatan: number;
  totalPengeluaran: number;
  sisaPendapatan: number;
  totalPendapatanAll: number;
  totalPengeluaranAll: number;
  labaRugiBulanan: {
    month: string;
    pendapatan: number;
    pengeluaran?: number;
    kebutuhanPokok?: number;
    sisa: number;
  }[];
  expenseByCategory: Record<string, number>;
  budgetComparison: { category: string; rencana: number; aktual: number }[];
  level: number;
  levelLabel: string;
  debtSummary: { name: string; remaining: number }[];
  receivableSummary: { name: string; remaining: number }[];
}

interface SavedAIAnalysis {
  month: string;
  generatedAt: string;
  level: number;
  levelLabel: string;
  analysis: string;
}

const COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [month, setMonth] = useState(getCurrentMonth());
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [savedAnalysis, setSavedAnalysis] = useState<SavedAIAnalysis | null>(
    null,
  );

  useEffect(() => {
    fetch("/api/dashboard?month=" + month)
      .then((r) => r.json())
      .then(setData);
  }, [month]);

  useEffect(() => {
    fetch("/api/ai-analysis")
      .then((r) => r.json())
      .then(setSavedAnalysis)
      .catch(() => setSavedAnalysis(null));
  }, []);

  if (!data)
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );

  const saldoBersih = data.totalPendapatanAll - data.totalPengeluaranAll;
  const pieData = Object.entries(data.expenseByCategory).map(
    ([name, value]) => ({ name, value }),
  );
  const chartData = data.labaRugiBulanan.map((item) => ({
    ...item,
    pengeluaran: item.pengeluaran ?? item.kebutuhanPokok ?? 0,
  }));

  const levelDescriptions: Record<number, string> = {
    0: "Aset belum mampu menutup utang. Fokus utama: hentikan kebocoran dan stabilkan arus kas.",
    1: "Utang masih mendominasi. Prioritas: bayar utang berbunga tinggi dan hindari utang baru.",
    2: "Sudah ada aset, tapi fondasi belum aman. Bangun cashflow positif secara konsisten.",
    3: "Keuangan cukup stabil bulanan. Selanjutnya: siapkan dana darurat minimal 6 bulan.",
    4: "Dana darurat sudah terbentuk. Naik level dengan investasi terukur dan disiplin.",
    5: "Arah pensiun sudah aman. Optimalkan alokasi aset, lindungi dari inflasi dan risiko.",
    6: "Kondisi sangat kuat. Fokus pada keberlanjutan, proteksi aset, dan perencanaan warisan.",
  };

  // Gunakan level dari AI analysis jika sudah dibuat untuk bulan yang dipilih,
  // fallback ke kalkulasi otomatis dari dashboard.
  const aiLevelForMonth = savedAnalysis?.month === month ? savedAnalysis : null;
  const displayLevel = aiLevelForMonth?.level ?? data.level;
  const displayLevelLabel = aiLevelForMonth?.levelLabel ?? data.levelLabel;

  // Ekstrak bagian Ringkasan dari teks analisis AI
  const aiRingkasan = aiLevelForMonth
    ? (() => {
        const text = aiLevelForMonth.analysis;
        const start = text.indexOf("# Ringkasan");
        if (start === -1) return null;
        const afterHeader = text.slice(start + "# Ringkasan".length).trimStart();
        const nextHeader = afterHeader.search(/^#\s/m);
        return nextHeader === -1 ? afterHeader.trim() : afterHeader.slice(0, nextHeader).trim();
      })()
    : null;

  const triggerAIAnalysis = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch(`/api/ai/analyze?month=${month}`, {
        method: "POST",
      });
      const payload = await res.json();
      if (!res.ok) {
        setAiError(payload.error || "Gagal menganalisis data dengan AI.");
      } else {
        fetch("/api/ai-analysis")
          .then((r) => r.json())
          .then(setSavedAnalysis)
          .catch(() => setSavedAnalysis(null));
      }
    } catch {
      setAiError("Gagal terhubung ke layanan AI.");
    } finally {
      setAiLoading(false);
    }
  };

  const summaryCards = [
    {
      label: "Pendapatan",
      value: formatRupiah(data.totalPendapatan),
      sub: getMonthLabel(data.currentMonth),
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: <TrendingUp size={22} className="text-emerald-500" />,
    },
    {
      label: "Pengeluaran",
      value: formatRupiah(data.totalPengeluaran),
      sub: getMonthLabel(data.currentMonth),
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
      icon: <TrendingDown size={22} className="text-rose-400" />,
    },
    {
      label: "Sisa Bulan Ini",
      value: formatRupiah(data.sisaPendapatan),
      sub: getMonthLabel(data.currentMonth),
      color: data.sisaPendapatan >= 0 ? "text-indigo-700" : "text-rose-600",
      bg: data.sisaPendapatan >= 0 ? "bg-indigo-50" : "bg-rose-50",
      border:
        data.sisaPendapatan >= 0 ? "border-indigo-200" : "border-rose-200",
      icon: (
        <Wallet
          size={22}
          className={
            data.sisaPendapatan >= 0 ? "text-indigo-400" : "text-rose-400"
          }
        />
      ),
    },
    {
      label: "Saldo Bersih",
      value: formatRupiah(saldoBersih),
      sub: "Semua waktu",
      color: saldoBersih >= 0 ? "text-blue-700" : "text-rose-600",
      bg: saldoBersih >= 0 ? "bg-blue-50" : "bg-rose-50",
      border: saldoBersih >= 0 ? "border-blue-200" : "border-rose-200",
      icon: (
        <Star
          size={22}
          className={saldoBersih >= 0 ? "text-blue-400" : "text-rose-400"}
        />
      ),
    },
    {
      label: "Total Utang",
      value: formatRupiah(data.totalUtang),
      sub: "Aktif",
      color: "text-orange-700",
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: <AlertCircle size={22} className="text-orange-400" />,
    },
    {
      label: "Total Piutang",
      value: formatRupiah(data.totalPiutang),
      sub: "Aktif",
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: <HandCoins size={22} className="text-amber-400" />,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Dashboard
          </h1>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 font-semibold text-sm px-3 py-1 rounded-full">
            <Star size={13} />
            {displayLevelLabel}
          </div>
        </div>
        <MonthYearPicker value={month} onChange={setMonth} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            className={`${c.bg} border ${c.border} rounded-2xl p-5 flex flex-col gap-3`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {c.label}
              </span>
              {c.icon}
            </div>
            <p className={`text-xl font-black leading-tight ${c.color}`}>
              {c.value}
            </p>
            <p className="text-xs font-medium text-slate-400">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Laba Rugi Chart */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-800">Laba Rugi Bulanan</h2>
        <p className="text-sm text-slate-400 mt-0.5 mb-5">
          Pendapatan vs pengeluaran 12 bulan terakhir
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
            />
            <YAxis
              tickFormatter={(v) => (v / 1_000_000).toFixed(0) + "jt"}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
            />
            <Tooltip
              formatter={(v) => formatRupiah(Number(v))}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 13,
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
            <Bar
              dataKey="pendapatan"
              fill="#10b981"
              name="Pendapatan"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="pengeluaran"
              fill="#f43f5e"
              name="Pengeluaran"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Level Kekayaan + AI Analysis — merged card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Level Kekayaan &amp; Rekomendasi AI</h2>
            <p className="text-sm text-slate-500 mt-1">
              {displayLevelLabel}
              {aiLevelForMonth && (
                <span className="ml-2 text-xs text-indigo-500 font-medium">(dari analisis AI)</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={triggerAIAnalysis}
            disabled={aiLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl shrink-0"
          >
            {aiLoading ? "Menganalisis..." : "Analisis"}
          </button>
        </div>

        {/* Level description / AI ringkasan */}
        {aiRingkasan ? (
          <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700 font-sans">{aiRingkasan}</pre>
        ) : (
          <>
            <p className="mt-4 text-sm leading-7 text-slate-700">
              {levelDescriptions[displayLevel] || levelDescriptions[0]}
            </p>
            <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600">
              Tips cepat: pastikan rasio tabungan bersih bulanan minimal 10-20% dari pendapatan agar level naik bertahap.
            </div>
          </>
        )}

        {aiError && (
          <div className="mt-4 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
            {aiError}
          </div>
        )}

        {/* Saved analysis */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-700">Analisis Terakhir Tersimpan</h3>
          {savedAnalysis ? (
            <div className="mt-2 bg-slate-50 border border-slate-100 rounded-xl p-4 max-h-72 overflow-y-auto">
              <p className="text-xs text-slate-500 mb-2">
                Bulan {getMonthLabel(savedAnalysis.month)} • {new Date(savedAnalysis.generatedAt).toLocaleString("id-ID")}
              </p>
              <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-700 font-sans">{savedAnalysis.analysis}</pre>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              Belum ada analisis tersimpan. Klik <strong>Analisis</strong> untuk membuat data pertama.
            </p>
          )}
        </div>
      </div>

      {/* Pie + Budget */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800">
            Pengeluaran per Kategori
          </h2>
          <p className="text-sm text-slate-400 mt-0.5 mb-4">
            {getMonthLabel(data.currentMonth)}
          </p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={42}
                    paddingAngle={3}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatRupiah(Number(v))}
                    contentStyle={{ borderRadius: 12, fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-3">
                {pieData.map((d, i) => (
                  <span
                    key={d.name}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 rounded-full px-2.5 py-1"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    {d.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <TrendingDown size={40} className="mb-2 opacity-30" />
              <p className="text-sm">Belum ada data pengeluaran</p>
            </div>
          )}
        </div>

        {/* Budget */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800">Budget vs Aktual</h2>
          <p className="text-sm text-slate-400 mt-0.5 mb-5">
            {getMonthLabel(data.currentMonth)}
          </p>
          {data.budgetComparison.length > 0 ? (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {data.budgetComparison.map((b) => {
                const pct =
                  b.rencana > 0
                    ? Math.min((b.aktual / b.rencana) * 100, 100)
                    : 0;
                const over = b.rencana > 0 && b.aktual > b.rencana;
                return (
                  <div key={b.category}>
                    <div className="flex justify-between items-center text-sm mb-1.5">
                      <span className="font-semibold text-slate-700">
                        {b.category}
                      </span>
                      <span
                        className={`text-xs font-bold ${over ? "text-rose-500" : "text-slate-400"}`}
                      >
                        {over ? "Melebihi!" : `${pct.toFixed(0)}%`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${over ? "bg-rose-400" : "bg-indigo-400"}`}
                        style={{ width: pct + "%" }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>{formatRupiah(b.aktual)}</span>
                      <span>/ {formatRupiah(b.rencana)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Wallet size={40} className="mb-2 opacity-30" />
              <p className="text-sm">
                Belum ada budget. Tambahkan di Pengaturan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Debt & Receivable */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Ringkasan Utang
          </h2>
          {data.debtSummary.filter((d) => d.remaining > 0).length > 0 ? (
            <div className="space-y-2">
              {data.debtSummary
                .filter((d) => d.remaining > 0)
                .map((d) => (
                  <div
                    key={d.name}
                    className="flex justify-between items-center bg-orange-50 border border-orange-100 rounded-xl px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-slate-700">
                      {d.name}
                    </span>
                    <span className="text-sm font-bold text-orange-600">
                      {formatRupiah(d.remaining)}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <span className="text-3xl mb-1">🎉</span>
              <p className="text-sm font-medium">Tidak ada utang aktif</p>
            </div>
          )}
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">
            Ringkasan Piutang
          </h2>
          {data.receivableSummary.filter((r) => r.remaining > 0).length > 0 ? (
            <div className="space-y-2">
              {data.receivableSummary
                .filter((r) => r.remaining > 0)
                .map((r) => (
                  <div
                    key={r.name}
                    className="flex justify-between items-center bg-amber-50 border border-amber-100 rounded-xl px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-slate-700">
                      {r.name}
                    </span>
                    <span className="text-sm font-bold text-amber-600">
                      {formatRupiah(r.remaining)}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <span className="text-3xl mb-1">🎉</span>
              <p className="text-sm font-medium">Tidak ada piutang aktif</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
