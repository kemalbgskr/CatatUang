"use client";
import { useEffect, useState } from "react";
import { formatRupiah, getCurrentMonth, getMonthLabel } from "@/lib/utils";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import MonthYearPicker from "@/components/MonthYearPicker";

interface DashboardData {
  currentMonth: string;
  totalPendapatan: number;
  totalPengeluaran: number;
  sisaPendapatan: number;
  totalPendapatanAll: number;
  totalPengeluaranAll: number;
  saldoBersih: number;
  totalUtang: number;
  totalPiutang: number;
  kekayaanBersih: number;
  labaRugiBulanan: { month: string; pendapatan: number; pengeluaran: number; sisa: number }[];
  expenseByCategory: Record<string, number>;
  budgetComparison: { category: string; rencana: number; aktual: number }[];
  level: number;
  levelLabel: string;
  debtSummary: { name: string; remaining: number }[];
}

interface SavedAIAnalysis {
  month: string;
  generatedAt: string;
  level: number;
  levelLabel: string;
  analysis: string;
}

export default function AnalisaPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [month, setMonth] = useState(getCurrentMonth());
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [savedAnalysis, setSavedAnalysis] = useState<SavedAIAnalysis | null>(null);

  useEffect(() => {
    fetch("/api/dashboard?month=" + month).then(r => r.json()).then(setData);
  }, [month]);

  useEffect(() => {
    fetch("/api/ai-analysis")
      .then((r) => r.json())
      .then(setSavedAnalysis)
      .catch(() => setSavedAnalysis(null));
  }, []);

  const triggerAIAnalysis = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch(`/api/ai/analyze?month=${month}`, { method: "POST" });
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

  const levelDescriptions: Record<number, string> = {
    0: "Aset belum mampu menutup utang. Fokus utama: hentikan kebocoran dan stabilkan arus kas.",
    1: "Utang masih mendominasi. Prioritas: bayar utang berbunga tinggi dan hindari utang baru.",
    2: "Sudah ada aset, tapi fondasi belum aman. Bangun cashflow positif secara konsisten.",
    3: "Keuangan cukup stabil bulanan. Selanjutnya: siapkan dana darurat minimal 6 bulan.",
    4: "Dana darurat sudah terbentuk. Naik level dengan investasi terukur dan disiplin.",
    5: "Arah pensiun sudah aman. Optimalkan alokasi aset, lindungi dari inflasi dan risiko.",
    6: "Kondisi sangat kuat. Fokus pada keberlanjutan, proteksi aset, dan perencanaan warisan.",
  };

  if (!data) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  const trendData = data.labaRugiBulanan.map(l => ({
    ...l,
    tabungan: l.sisa,
    monthLabel: l.month,
  }));

  const totalExpense = data.totalPengeluaran || 1; 

  const aiLevelForMonth = savedAnalysis?.month === month ? savedAnalysis : null;
  const displayLevel = aiLevelForMonth?.level ?? data.level;
  const displayLevelLabel = aiLevelForMonth?.levelLabel ?? data.levelLabel;

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

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analisa Keuangan</h1>
          <p className="text-slate-500 text-sm">Analisis mendalam kesehatan keuanganmu</p>
        </div>
        <MonthYearPicker value={month} onChange={setMonth} />
      </div>

      {/* AI Analysis Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6" style={{ boxShadow: "0 2px 20px 0 rgba(30,58,138,0.07)" }}>
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

      {/* Ringkasan Kekayaan */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Saldo Bersih", value: data.saldoBersih, color: data.saldoBersih >= 0 ? "#60a5fa" : "#f87171" },
          { label: "Total Utang", value: -data.totalUtang, color: "#fb923c" },
          { label: "Total Piutang", value: data.totalPiutang, color: "#facc15" },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-2xl border border-slate-100 p-4" style={{ boxShadow: "0 2px 20px rgba(30,58,138,0.08)" }}>
            <p className="text-xs text-white/60 uppercase tracking-wider mb-2">{item.label}</p>
            <p className="text-lg font-black" style={{ color: item.color }}>{formatRupiah(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Laba Rugi Tabel */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6" style={{ boxShadow: "0 2px 20px rgba(30,58,138,0.08)" }}>
        <h2 className="text-base font-bold text-slate-800 mb-1">Laba Rugi Bulanan</h2>
        <p className="text-sm text-slate-500 mb-4">Periksa pendapatanmu apakah bisa menutupi kebutuhan bulanan</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 text-white/60 font-semibold">Kategori</th>
                {data.labaRugiBulanan.slice(-6).map(l => (
                  <th key={l.month} className="text-right px-3 py-2 text-white/60 font-semibold">{getMonthLabel(l.month)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="px-3 py-2 font-medium text-emerald-400">Pendapatan</td>
                {data.labaRugiBulanan.slice(-6).map(l => (
                  <td key={l.month} className="px-3 py-2 text-right text-emerald-400">{formatRupiah(l.pendapatan)}</td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-red-400">Pengeluaran</td>
                {data.labaRugiBulanan.slice(-6).map(l => (
                  <td key={l.month} className="px-3 py-2 text-right text-red-400">{formatRupiah(l.pengeluaran)}</td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 font-bold text-white">Sisa Pendapatan</td>
                {data.labaRugiBulanan.slice(-6).map(l => (
                  <td key={l.month} className={"px-3 py-2 text-right font-bold " + (l.sisa >= 0 ? "text-emerald-400" : "text-red-400")}>{formatRupiah(l.sisa)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6" style={{ boxShadow: "0 2px 20px rgba(30,58,138,0.08)" }}>
        <h2 className="text-base font-bold text-slate-800 mb-4">Tren Kemampuan Menabung</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => (v / 1e6).toFixed(0) + "jt"} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => formatRupiah(Number(v))} contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, color: "#e2e8f0" }} />
            <Legend />
            <Line type="monotone" dataKey="pendapatan" stroke="#10b981" name="Pendapatan" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="pengeluaran" stroke="#ef4444" name="Pengeluaran" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="tabungan" stroke="#3b82f6" name="Tabungan" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Budgeting */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6" style={{ boxShadow: "0 2px 20px rgba(30,58,138,0.08)" }}>
        <h2 className="text-base font-bold text-slate-800 mb-1">Budgeting</h2>
        <p className="text-sm text-slate-500 mb-4">Periksa apakah aktual budgeting sesuai dengan rencana</p>
        {data.budgetComparison.length > 0 ? (
          <div className="space-y-3">
            {data.budgetComparison.map(b => {
              const pct = b.rencana > 0 ? (b.aktual / b.rencana * 100) : 0;
              const over = pct > 100;
              return (
                <div key={b.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/80">{b.category}</span>
                    <span className={over ? "text-red-400 font-medium" : "text-white/60"}>
                      {formatRupiah(b.aktual)} / {formatRupiah(b.rencana)} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className={"h-2 rounded-full " + (over ? "bg-red-500" : "bg-blue-500")} style={{ width: Math.min(pct, 100) + "%" }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-white/40 text-center py-8">Belum ada budget. Atur di halaman Pengaturan.</p>}
      </div>

      {/* Pengeluaran per Kategori */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6" style={{ boxShadow: "0 2px 20px rgba(30,58,138,0.08)" }}>
        <h2 className="text-base font-bold text-slate-800 mb-4">Detail Pengeluaran - {getMonthLabel(data.currentMonth)}</h2>
        {Object.keys(data.expenseByCategory).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(data.expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between items-center rounded-xl p-3" style={{ background: "#111827" }}>
                <span className="text-sm text-white/80">{cat}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-red-400">{formatRupiah(amt)}</span>
                  <span className="text-xs text-white/40 ml-2">({(amt / totalExpense * 100).toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-white/40 text-center py-8">Belum ada data</p>}
      </div>
    </div>
  );
}
