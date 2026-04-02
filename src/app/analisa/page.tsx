"use client";
import { useEffect, useState } from "react";
import { formatRupiah, getCurrentMonth, getMonthLabel } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import MonthYearPicker from "@/components/MonthYearPicker";
import { Sparkles, Loader2, ArrowLeft, TrendingUp, TrendingDown, Wallet, BookOpen } from "lucide-react";
import Link from "next/link";

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

const SimpleMarkdown = ({ text }: { text: string }) => {
  return (
    <div className="text-[13px] text-slate-300 font-medium leading-[1.6] flex flex-col gap-[6px]">
      {text.split('\n').filter(p => p.trim() !== '').map((part, i) => {
        let content = part;
        let isHeader = false;
        let isList = false;

        if (content.startsWith('### ')) {
          content = content.replace('### ', '');
          isHeader = true;
        } else if (content.startsWith('- ')) {
          content = content.replace('- ', '');
          isList = true;
        }

        const boldParts = content.split(/(\*\*.*?\*\*)/g);
        const rendered = boldParts.map((bp, j) => {
          if (bp.startsWith('**') && bp.endsWith('**')) {
            return <strong key={j} className="text-white font-black">{bp.slice(2, -2)}</strong>;
          }
          return bp;
        });

        if (isHeader) return <h3 key={i} className="text-[14px] font-extrabold text-white mt-4 first:mt-0 mb-1">{rendered}</h3>;
        if (isList) return <div key={i} className="ml-3 pl-3 border-l-2 border-slate-600/50 mb-1">{rendered}</div>;
        
        return <p key={i} className="mb-0.5">{rendered}</p>;
      })}
    </div>
  );
};

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

  if (!data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner mb-4">
        <Loader2 size={24} className="animate-spin" />
      </div>
      <p className="text-slate-500 font-bold animate-pulse">Memuat Analisa...</p>
    </div>
  );

  const trendData = data.labaRugiBulanan.map(l => ({
    ...l,
    tabungan: l.sisa,
    monthLabel: getMonthLabel(l.month),
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
    <div className="max-w-5xl mx-auto space-y-6 pt-12 md:pt-4 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Laporan & Analisa</h1>
            <p className="text-slate-500 text-[15px] font-medium mt-0.5">Lihat duit kamu dari berbagai sudut pandang.</p>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-1 shadow-sm shrink-0 w-fit inline-flex">
          <MonthYearPicker value={month} onChange={setMonth} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - AI Score & Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Wealth Score */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden flex flex-col max-h-[580px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col h-full overflow-hidden">
               {/* Header Teks */}
               <div className="shrink-0 mb-5">
                  <p className="text-slate-400 font-extrabold text-[12px] uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Sparkles size={14} className="text-rose-400" />
                    Financial Health Score
                  </p>
                  <h2 className="text-2xl font-black mb-3">{displayLevelLabel}</h2>
                  <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-400 to-indigo-400 h-full rounded-full" style={{ width: `${(displayLevel / 6) * 100}%` }}></div>
                  </div>
               </div>

               {/* Scrollable Content Teks */}
               <div className="flex-1 overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent mb-4">
                  {aiRingkasan ? (
                    <SimpleMarkdown text={aiRingkasan} />
                  ) : (
                    <p className="text-[13px] text-slate-300 font-medium leading-relaxed">
                      {levelDescriptions[displayLevel] || levelDescriptions[0]}
                    </p>
                  )}
               </div>

               {/* Tombol Bawah */}
               <div className="shrink-0 pt-5 mt-auto border-t border-slate-700/50">
                  <button
                    onClick={triggerAIAnalysis}
                    disabled={aiLoading}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[14px] font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                  >
                    {aiLoading ? <Loader2 size={16} className="animate-spin" /> : "Analisis Bulan Ini"}
                  </button>
               </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-6">
            <h3 className="text-[15px] font-extrabold text-slate-800 border-b border-slate-100 pb-4">Ringkasan Posisi</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><Wallet size={18} /></div>
                  <span className="font-bold text-slate-600 text-[14px]">Saldo Bersih</span>
                </div>
                <span className={`font-black text-[15px] ${data.saldoBersih >= 0 ? "text-slate-800" : "text-rose-600"}`}>{formatRupiah(data.saldoBersih)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center"><TrendingDown size={18} /></div>
                  <span className="font-bold text-slate-600 text-[14px]">Total Utang</span>
                </div>
                <span className="font-black text-[15px] text-slate-800">{formatRupiah(data.totalUtang)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><TrendingUp size={18} /></div>
                  <span className="font-bold text-slate-600 text-[14px]">Total Piutang</span>
                </div>
                <span className="font-black text-[15px] text-slate-800">{formatRupiah(data.totalPiutang)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Charts and Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Trend Chart */}
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800">Tren Pemasukan vs Pengeluaran</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Berdasarkan bulan ke bulan</p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B", fontWeight: 600 }} dy={10} />
                  <YAxis tickFormatter={v => `${(v / 1e6).toFixed(0)}Jt`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B", fontWeight: 600 }} dx={-10} />
                  <Tooltip 
                    cursor={{ fill: "#F1F5F9" }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    formatter={(v: any) => [formatRupiah(v), ""]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600 }} />
                  <Bar dataKey="pendapatan" name="Pemasukan" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Laba Rugi Table */}
            <div className="bg-slate-50 rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-inner overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-700 shadow-sm"><BookOpen size={18} /></div>
                <h2 className="text-[16px] font-bold text-slate-800">Laba / Rugi</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="font-bold text-slate-500 text-[14px]">Total Pemasukan</span>
                  <span className="font-black text-emerald-600 text-[15px]">{formatRupiah(data.totalPendapatan)}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="font-bold text-slate-500 text-[14px]">Total Pengeluaran</span>
                  <span className="font-black text-rose-500 text-[15px]">{formatRupiah(data.totalPengeluaran)}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="font-bold text-slate-500 text-[14px]">Sisa (Tabungan)</span>
                  <span className={`font-black text-[15px] ${data.sisaPendapatan >= 0 ? "text-indigo-600" : "text-rose-600"}`}>{formatRupiah(data.sisaPendapatan)}</span>
                </div>
              </div>
            </div>

            {/* Breakdown Kategori */}
            <div className="bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              <h2 className="text-[16px] font-bold text-slate-800 mb-6 flex items-center gap-2">Breakdown Kategori</h2>
              {Object.keys(data.expenseByCategory).length > 0 ? (
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 no-scrollbar">
                  {Object.entries(data.expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
                    const pct = (amt / totalExpense) * 100;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between items-center text-[13px] mb-1.5">
                          <span className="font-bold text-slate-700">{cat}</span>
                          <span className="font-bold text-slate-900">{formatRupiah(amt)} <span className="text-slate-400 ml-1">({pct.toFixed(0)}%)</span></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-rose-400" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm font-bold">Belum ada pengeluaran</p>
                </div>
              )}
            </div>
          </div>

          {/* Budgeting Insights */}
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Status Budgeting</h2>
            {data.budgetComparison.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.budgetComparison.map(b => {
                  const pct = b.rencana > 0 ? (b.aktual / b.rencana * 100) : 0;
                  const over = pct > 100;
                  return (
                    <div key={b.category} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-500 text-sm">{b.category.charAt(0)}</div>
                        <span className="font-extrabold text-[14px] text-slate-700">{b.category}</span>
                      </div>
                      <div className="mb-2">
                        <span className={`font-black text-[15px] ${over ? 'text-rose-500' : 'text-slate-800'}`}>{formatRupiah(b.aktual)}</span>
                        <span className="text-slate-400 font-semibold text-[12px] ml-1">/ {formatRupiah(b.rencana)}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full ${over ? "bg-rose-500" : "bg-indigo-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <p className={`text-[11px] font-bold mt-2 text-right ${over ? 'text-rose-500' : 'text-slate-500'}`}>{pct.toFixed(0)}% terpakai</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 px-4 border-2 border-dashed border-slate-100 rounded-3xl">
                <h3 className="text-slate-500 font-bold text-[15px]">Belum Ada Budget</h3>
                <p className="text-slate-400 text-sm mt-1 mb-4">Atur budget pengeluaranmu terlebih dahulu.</p>
                <Link href="/budget" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-[14px]">Atur Budget Sekarang</Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
