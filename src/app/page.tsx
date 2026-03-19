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
  Eye,
  Clock,
  Calendar,
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

  useEffect(() => {
    fetch("/api/dashboard?month=" + month)
      .then((r) => r.json())
      .then(setData);
  }, [month]);


  if (!data)
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );

  if (!data || !data.expenseByCategory)
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );

  const saldoBersih = data.totalPendapatanAll - data.totalPengeluaranAll;
  const pieData = Object.entries(data.expenseByCategory || {}).map(
    ([name, value]) => ({ name, value }),
  );
  const chartData = data.labaRugiBulanan.map((item) => ({
    ...item,
    pengeluaran: item.pengeluaran ?? 0,
  }));

  // Kalkulasi display level dari data dashboard.
  const displayLevel = data.level;
  const displayLevelLabel = data.levelLabel;


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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
            <button className="text-slate-400 hover:text-slate-600 mt-1"><Eye size={18} /></button>
          </div>
          <p className="text-slate-500 font-medium text-[15px]">Halo, Pengguna <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-md text-xs ml-1 font-bold">{displayLevelLabel}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-xs font-bold text-slate-400 bg-white shadow-sm">
            <Clock size={14} className="text-rose-400" />
            <div className="text-left leading-tight">
              <div>ACTIVE PERIOD</div>
              <span className="text-slate-800">{getMonthLabel(data.currentMonth)}</span>
            </div>
          </div>
          <div className="bg-white rounded-full px-2 py-1 border border-slate-200 shadow-sm flex items-center">
             <Calendar size={16} className="text-rose-400 ml-2 mr-1" />
             <MonthYearPicker value={month} onChange={setMonth} className="text-sm font-bold border-none shadow-none bg-transparent" />
          </div>
        </div>
      </div>

      {/* Main Hero Card (Dark) */}
      <div className="bg-[#302C34] rounded-[24px] p-6 md:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between mb-8 relative z-10">
          <div>
            <p className="text-[#A19FA6] text-[10px] font-extrabold tracking-widest mb-3 flex items-center gap-2">
              <span className="text-rose-400">⚡</span> SEKILAS BULAN INI
            </p>
            <h2 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">{formatRupiah(data.sisaPendapatan)}</h2>
            <p className="text-[#A19FA6] text-xs font-semibold flex items-center gap-1.5 mt-2">👇🏻 sisa pendapatan bulan ini</p>
          </div>
          <div className="flex gap-8 mt-6 md:mt-0 md:text-right">
            <div>
              <p className="text-[#A19FA6] text-[10px] font-extrabold tracking-widest mb-2">PEMASUKAN</p>
              <p className="text-white font-bold text-lg">{formatRupiah(data.totalPendapatan)}</p>
            </div>
            <div>
              <p className="text-[#A19FA6] text-[10px] font-extrabold tracking-widest mb-2">PENGELUARAN</p>
              <p className="text-white font-bold text-lg">{formatRupiah(data.totalPengeluaran)}</p>
            </div>
          </div>
        </div>
        
        {/* Decorative footer text */}
        <div className="pt-5 border-t border-white/10 relative z-10">
          <p className="text-[#A19FA6] text-[13px] font-medium tracking-wide">Tetap semangat atur keuanganmu! 🚀</p>
        </div>
      </div>

      {/* Budggt Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100/50 flex flex-col justify-between">
          <p className="text-slate-400 font-extrabold text-[10px] tracking-widest mb-2">TOTAL SALDO BERSIH</p>
          <h3 className="text-[22px] font-black text-slate-800 tracking-tight">{formatRupiah(data.saldoBersih)}</h3>
          <p className="text-emerald-600 font-bold text-[10px] mt-4 bg-emerald-50 content-fit self-start px-2.5 py-1 rounded-md">+ {displayLevelLabel}</p>
        </div>
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100/50 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-slate-400 font-extrabold text-[10px] tracking-widest mb-2">TOTAL UTANG</p>
            <h3 className="text-[22px] font-black text-slate-800 tracking-tight">{formatRupiah(data.totalUtang)}</h3>
            <p className={`font-bold text-[10px] mt-4 self-start px-2.5 py-1 rounded-md inline-block
                ${data.totalUtang > 0 ? "text-rose-600 bg-rose-50" : "text-slate-400 bg-slate-50"}`}>
              {data.totalUtang > 0 ? "Harus Dibayar!" : "Aman 👍"}
            </p>
          </div>
          {data.totalUtang > 0 && <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-50 rounded-full opacity-50 z-0"></div>}
        </div>
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100/50 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-slate-400 font-extrabold text-[10px] tracking-widest mb-2 flex items-center gap-1.5"><AlertCircle size={12} className="text-amber-500" /> TOTAL PIUTANG</p>
            <h3 className="text-[22px] font-black text-slate-800 tracking-tight">{formatRupiah(data.totalPiutang)}</h3>
            <p className={`font-bold text-[10px] mt-4 self-start px-2.5 py-1 rounded-md inline-block
               ${data.totalPiutang > 0 ? "text-amber-600 bg-amber-50" : "text-slate-400 bg-slate-50"}`}>
              {data.totalPiutang > 0 ? "Belum Dibayar" : "Aman 👍"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#3A3335] rounded-[24px] p-6 md:px-8 flex flex-col md:flex-row md:items-center justify-between mt-2">
        <div className="flex items-center gap-3 mb-2 md:mb-0">
          <Calendar size={18} className="text-rose-300" />
          <p className="text-white font-bold text-[15px] tracking-tight">Tagihan Mendatang</p>
        </div>
        <p className="text-[#A19FA6] text-[13px] font-medium">Tidak ada tagihan mendatang.</p>
      </div>

      {/* Laba Rugi / Aktivitas Bulan Ini */}
      <div className="grid md:grid-cols-2 gap-6 mt-2">
        <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h2 className="text-[17px] font-bold text-slate-800 mb-1">Aktivitas Bulan Ini</h2>
          <p className="text-[10px] font-extrabold tracking-widest text-[#A19FA6] mb-8 uppercase">
            12 BULAN TERAKHIR
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={2} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => (v / 1_000_000).toFixed(0) + "jt"} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                formatter={(v) => formatRupiah(Number(v))}
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  borderRadius: 16,
                  border: "none",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "12px 16px"
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 16, color: '#64748b' }} iconType="circle" iconSize={8} />
              <Bar dataKey="pendapatan" fill="#93c5fd" name="Pendapatan" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pengeluaran" fill="#FFC1B6" name="Pengeluaran" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Realisasi */}
        <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h2 className="text-[17px] font-bold text-slate-800 mb-1">Realisasi Anggaran</h2>
          <p className="text-[10px] font-extrabold tracking-widest text-[#A19FA6] mb-8 uppercase">
            {getMonthLabel(data.currentMonth)}
          </p>
          
          {data.budgetComparison.length > 0 ? (
            <div className="space-y-6 max-h-[250px] overflow-y-auto pr-2">
              {data.budgetComparison.map((b) => {
                const pct = b.rencana > 0 ? Math.min((b.aktual / b.rencana) * 100, 100) : 0;
                const over = b.rencana > 0 && b.aktual > b.rencana;
                return (
                  <div key={b.category}>
                    <div className="flex justify-between items-center text-[13px] mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${over ? "bg-rose-400" : "bg-indigo-400"}`} />
                        <span className="font-bold text-slate-700">{b.category}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold tracking-wide ${over ? "text-rose-500" : "text-slate-400"}`}>
                        {over ? "MELEBIHI!" : `${pct.toFixed(0)}%`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${over ? "bg-rose-400" : "bg-indigo-400"}`}
                        style={{ width: pct + "%" }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1.5">
                      <span>{formatRupiah(b.aktual)}</span>
                      <span>/ {formatRupiah(b.rencana)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-slate-400 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <Wallet size={24} className="text-slate-300" />
              </div>
              <p className="text-[13px] font-bold text-slate-600 mb-1">Belum Ada Anggaran</p>
              <p className="text-[11px]">Atur budget di menu Pengaturan.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
