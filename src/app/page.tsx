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
  saldoBersih: number;
  kekayaanBersih: number;
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
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );

  const saldoBersih = data.totalPendapatanAll - data.totalPengeluaranAll;
  const pieData = Object.entries(data.expenseByCategory).map(
    ([name, value]) => ({ name, value }),
  );
  const chartData = data.labaRugiBulanan.map((item) => ({
    ...item,
    pengeluaran: item.pengeluaran ?? 0,
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
      valueColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
      icon: <TrendingUp size={20} className="text-emerald-600" />,
    },
    {
      label: "Pengeluaran",
      value: formatRupiah(data.totalPengeluaran),
      sub: getMonthLabel(data.currentMonth),
      valueColor: "text-rose-600",
      iconBg: "bg-rose-100",
      icon: <TrendingDown size={20} className="text-rose-600" />,
    },
    {
      label: "Sisa Bulan Ini",
      value: formatRupiah(data.sisaPendapatan),
      sub: getMonthLabel(data.currentMonth),
      valueColor: data.sisaPendapatan >= 0 ? "text-blue-700" : "text-rose-600",
      iconBg: data.sisaPendapatan >= 0 ? "bg-blue-100" : "bg-rose-100",
      icon: <Wallet size={20} className={data.sisaPendapatan >= 0 ? "text-blue-600" : "text-rose-600"} />,
    },
    {
      label: "Saldo Bersih",
      value: formatRupiah(saldoBersih),
      sub: "Semua waktu",
      valueColor: saldoBersih >= 0 ? "text-indigo-700" : "text-rose-600",
      iconBg: saldoBersih >= 0 ? "bg-indigo-100" : "bg-rose-100",
      icon: <Star size={20} className={saldoBersih >= 0 ? "text-indigo-600" : "text-rose-600"} />,
    },
    {
      label: "Total Utang",
      value: formatRupiah(data.totalUtang),
      sub: "Aktif",
      valueColor: "text-orange-600",
      iconBg: "bg-orange-100",
      icon: <AlertCircle size={20} className="text-orange-600" />,
    },
    {
      label: "Total Piutang",
      value: formatRupiah(data.totalPiutang),
      sub: "Aktif",
      valueColor: "text-amber-600",
      iconBg: "bg-amber-100",
      icon: <HandCoins size={20} className="text-amber-600" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header Card */}
      <div
        className="rounded-3xl p-6 md:p-8 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #3b82f6 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -right-4 w-32 h-32 rounded-full bg-white/8" />
        <div className="absolute top-4 right-20 w-16 h-16 rounded-full bg-white/5" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Selamat datang</p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">Dashboard Keuangan</h1>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Star size={12} />
              {displayLevelLabel}
              {aiLevelForMonth && <span className="opacity-70">(AI)</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MonthYearPicker value={month} onChange={setMonth} />
          </div>
        </div>

        {/* Mini stats row 1 */}
        <div className="mt-6 grid grid-cols-3 gap-4 relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-blue-200 text-xs font-medium">Pendapatan</p>
            <p className="text-white font-black text-base mt-0.5">{formatRupiah(data.totalPendapatan)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-blue-200 text-xs font-medium">Pengeluaran</p>
            <p className="text-white font-black text-base mt-0.5">{formatRupiah(data.totalPengeluaran)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-blue-200 text-xs font-medium">Sisa</p>
            <p className="text-white font-black text-base mt-0.5">{formatRupiah(data.sisaPendapatan)}</p>
          </div>
        </div>
        {/* Mini stats row 2 */}
        <div className="mt-3 grid grid-cols-3 gap-4 relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-blue-200 text-xs font-medium">Saldo Bersih</p>
            <p className="text-white font-black text-base mt-0.5">{formatRupiah(data.saldoBersih)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-blue-200 text-xs font-medium">Total Utang</p>
            <p className={`font-black text-base mt-0.5 ${data.totalUtang > 0 ? "text-red-300" : "text-white"}`}>{formatRupiah(data.totalUtang)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-blue-200 text-xs font-medium">Total Piutang</p>
            <p className={`font-black text-base mt-0.5 ${data.totalPiutang > 0 ? "text-yellow-200" : "text-white"}`}>{formatRupiah(data.totalPiutang)}</p>
          </div>
        </div>
      </div>

      {/* Laba Rugi Chart */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6" style={{ boxShadow: "0 2px 20px 0 rgba(30,58,138,0.07)" }}>
        <h2 className="text-base font-bold text-slate-800">Laba Rugi Bulanan</h2>
        <p className="text-sm text-slate-400 mt-0.5 mb-5">Pendapatan vs pengeluaran 12 bulan terakhir</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => (v / 1_000_000).toFixed(0) + "jt"} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
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
            <Bar dataKey="pendapatan" fill="#3b82f6" name="Pendapatan" radius={[6, 6, 0, 0]} />
            <Bar dataKey="pengeluaran" fill="#f43f5e" name="Pengeluaran" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Level Kekayaan + AI Analysis — merged card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6" style={{ boxShadow: "0 2px 20px 0 rgba(30,58,138,0.07)" }}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Level Kekayaan &amp; Rekomendasi AI</h2>
            <p className="text-sm text-slate-500 mt-1">
              {displayLevelLabel}
              {aiLevelForMonth && (
                <span className="ml-2 text-xs text-blue-500 font-medium">(dari analisis AI)</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={triggerAIAnalysis}
            disabled={aiLoading}
            className="bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl shrink-0 transition"
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
        <div className="bg-white rounded-3xl border border-slate-100 p-6" style={{ boxShadow: "0 2px 20px 0 rgba(30,58,138,0.07)" }}>
          <h2 className="text-base font-bold text-slate-800">Pengeluaran per Kategori</h2>
          <p className="text-sm text-slate-400 mt-0.5 mb-4">{getMonthLabel(data.currentMonth)}</p>
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
        <div className="bg-white rounded-3xl border border-slate-100 p-6" style={{ boxShadow: "0 2px 20px 0 rgba(30,58,138,0.07)" }}>
          <h2 className="text-base font-bold text-slate-800">Budget vs Aktual</h2>
          <p className="text-sm text-slate-400 mt-0.5 mb-5">{getMonthLabel(data.currentMonth)}</p>
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
        <div className="bg-white rounded-3xl border border-slate-100 p-6" style={{ boxShadow: "0 2px 20px 0 rgba(30,58,138,0.07)" }}>
          <h2 className="text-base font-bold text-slate-800 mb-4">Ringkasan Utang</h2>
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
        <div className="bg-white rounded-3xl border border-slate-100 p-6" style={{ boxShadow: "0 2px 20px 0 rgba(30,58,138,0.07)" }}>
          <h2 className="text-base font-bold text-slate-800 mb-4">Ringkasan Piutang</h2>
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
