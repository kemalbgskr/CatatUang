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
import Link from "next/link";

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
  recentTransactions: any[];
  dailyExpenses: Record<string, { expense: number, income: number }>;
  catProgress: {
    kebutuhan: { rencana: number; aktual: number };
    keinginan: { rencana: number; aktual: number };
    tabungan: { rencana: number; aktual: number };
  };
  topPemasukan: number;
  topPengeluaran: number;
  dailyBudget: number;
  netWealthGrowth: number;
  incomeGrowth: number;
  expenseGrowth: number;
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [month, setMonth] = useState(getCurrentMonth());

  useEffect(() => {
    fetch("/api/dashboard?month=" + month)
      .then((r) => r.json())
      .then(setData);
  }, [month]);

  if (!data || !data.expenseByCategory)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-10 w-10 border-4 border-rose-500 border-t-transparent rounded-full" />
      </div>
    );

  const chartData = data.labaRugiBulanan.map((item) => ({
    ...item,
    pengeluaran: item.pengeluaran ?? 0,
  }));

  // Helper for Calendar
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const yearNum = parseInt(data.currentMonth.split("-")[0]);
  const monthNum = parseInt(data.currentMonth.split("-")[1]) - 1;
  const daysInMonth = getDaysInMonth(yearNum, monthNum);
  const firstDayOfMonth = new Date(yearNum, monthNum, 1).getDay(); // 0 is Sunday, 1 is Monday...
  
  // Adjusted for SN, SL, RB... (Monday start)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const getWeekDays = ["SN", "SL", "RB", "KM", "JM", "SB", "MG"];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 font-medium text-[15px]">Halo, Pengguna! Kondisi Anda: <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-md text-xs ml-1 font-bold">{data.levelLabel}</span></p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
           <Calendar size={16} className="text-rose-400 ml-2 mr-1" />
           <MonthYearPicker value={month} onChange={setMonth} className="text-sm font-bold border-none shadow-none bg-transparent" />
        </div>
      </div>
      {/* Premium Hero Card - Sekilas Bulan Ini */}
      <div className="bg-[#2C2C2C] rounded-[32px] p-8 text-white relative overflow-hidden shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between relative z-10">
          <div>
            <p className="text-[#A19FA6] text-[10px] font-extrabold tracking-widest mb-3 flex items-center gap-2 uppercase">
              <span className="text-rose-400">⚡</span> Sekilas Bulan Ini
            </p>
            <h2 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">{formatRupiah(data.dailyBudget)}</h2>
            <p className="text-[#A19FA6] text-xs font-semibold flex items-center gap-1.5 mt-2">
              <span className="text-amber-400">👇</span> budget harian yang tersisa
            </p>
          </div>
          <div className="flex gap-12 mt-6 md:mt-0 items-center">
            <Link href="/pendapatan" className="text-right group">
              <p className="text-[#A19FA6] text-[10px] font-extrabold tracking-widest mb-1 uppercase">PEMASUKAN</p>
              <p className="text-orange-300 font-bold text-lg group-hover:scale-105 transition-transform">{formatRupiah(data.topPemasukan)}</p>
              <p className={`text-[9px] font-bold uppercase mt-1 ${data.incomeGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.incomeGrowth >= 0 ? '+' : ''}{data.incomeGrowth.toFixed(1)}% vs bulan lalu
              </p>
            </Link>
            <Link href="/pengeluaran" className="text-right group">
              <p className="text-[#A19FA6] text-[10px] font-extrabold tracking-widest mb-1 uppercase">PENGELUARAN</p>
              <p className="text-rose-400 font-bold text-lg group-hover:scale-105 transition-transform">{formatRupiah(data.topPengeluaran)}</p>
              <p className={`text-[9px] font-bold uppercase mt-1 ${data.expenseGrowth <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.expenseGrowth >= 0 ? '+' : ''}{data.expenseGrowth.toFixed(1)}% vs bulan lalu
              </p>
            </Link>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-2">
           <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-white/20" style={{ width: `${Math.min((data.topPengeluaran / (data.topPemasukan || 1)) * 100, 100)}%` }} />
           </div>
           <p className="text-[10px] text-white/40 font-bold italic">
             {data.dailyBudget > 100000 ? 'Suppeerrrr! Budget harianmu masih sangat aman.' : 'Semangat! Jaga pengeluaranmu bulan ini.'}
           </p>
        </div>
      </div>

      {/* Runway & Upcoming Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.01)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black tracking-widest text-rose-400 uppercase flex items-center gap-1">
              <AlertCircle size={10} /> RUNWAY DANA DARURAT
            </p>
            <Eye size={14} className="text-slate-200" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-[#2C2C2C] tracking-tighter">
              {data.totalPengeluaran > 0 ? (data.saldoBersih / data.totalPengeluaran).toFixed(1) : '∞'} <span className="text-sm text-slate-400 font-bold">Bulan</span>
            </h3>
            <div className="w-full bg-slate-50 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-rose-200 h-full" style={{ width: '40%' }} />
            </div>
            <p className="text-[9px] font-bold text-slate-300 mt-2 uppercase tracking-tight">Termasuk {formatRupiah(data.saldoBersih)} dana likuid</p>
          </div>
        </div>
        <div className="bg-[#2C2C2C] rounded-[32px] p-6 text-white shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-rose-400" />
            </div>
            <p className="text-sm font-bold">Tagihan Mendatang</p>
          </div>
          <p className="text-white/40 text-[11px] font-medium italic">Tidak ada tagihan mendatang.</p>
        </div>
      </div>

      {/* Progres Pengeluaran Section */}
      <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Circle Progress Example */}
            <div className="flex items-center gap-4 shrink-0">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - Math.min(data.totalPengeluaran / (data.totalPendapatan || 1), 1))} className="text-[#2C2C2C]" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black text-[#A19FA6] leading-none uppercase tracking-tighter">HARI</span>
                        <span className="text-xl font-black text-[#2C2C2C]">{new Date().getDate()}</span>
                    </div>
                </div>
                <div>
                   <h3 className="text-lg font-bold text-[#2C2C2C]">Progres Pengeluaran</h3>
                   <p className="text-[12px] font-medium text-[#A19FA6]">Hari {new Date().getDate()} dari {daysInMonth}</p>
                </div>
            </div>

            {/* Linear Progress Bars */}
            <div className="flex-1 w-full space-y-5">
                {[
                    { label: 'KEBUTUHAN', key: 'kebutuhan', color: 'bg-indigo-300', status: 'Masih aman' },
                    { label: 'KEINGINAN', key: 'keinginan', color: 'bg-orange-300', status: 'Masih aman' },
                    { label: 'TABUNGAN', key: 'tabungan', color: 'bg-emerald-400', status: 'Cepat sekali' }
                ].map(item => {
                    const prog = data.catProgress[item.key as keyof typeof data.catProgress];
                    const pct = prog.rencana > 0 ? (prog.aktual / prog.rencana * 100) : 0;
                    return (
                        <div key={item.key}>
                            <div className="flex justify-between items-center mb-1.5 px-1">
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{item.label} <span className="text-[9px] font-bold normal-case text-slate-300 ml-1">{item.status}</span></p>
                                <span className="text-[10px] font-black text-slate-800 tracking-tighter">{pct.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-100">
                                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Aktivitas Bulan Ini (Calendar) */}
        <div className="lg:col-span-3 bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h2 className="text-lg font-bold text-[#2C2C2C] mb-1">Aktivitas Bulan Ini</h2>
          <p className="text-[10px] font-black tracking-widest text-[#A19FA6] mb-8 uppercase">{getMonthLabel(data.currentMonth)} {yearNum}</p>
          
          <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden mt-6">
            {getWeekDays.map(d => (
              <div key={d} className="bg-white py-3 text-center text-[10px] font-black text-[#A19FA6]">{d}</div>
            ))}
            
            {/* Empty days before 1st */}
            {Array.from({ length: adjustedFirstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white min-h-[80px]" />
            ))}
            
            {/* Calendar days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dateStr = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const dailyData = data.dailyExpenses[dateStr];
              const isToday = d === new Date().getDate() && monthNum === new Date().getMonth();
              
              return (
                <div key={d} className={`bg-white min-h-[80px] p-2 relative group hover:bg-slate-50 transition-colors ${isToday ? 'bg-rose-50/20' : ''}`}>
                  <span className={`text-[11px] font-bold ${isToday ? 'text-rose-500' : 'text-slate-400'}`}>{d}</span>
                  <div className="mt-1 flex flex-col gap-1">
                    {dailyData?.expense > 0 && (
                      <p className="text-[9px] font-black text-rose-400 leading-none">-{ (dailyData.expense / 1000).toFixed(0) }rb</p>
                    )}
                    {dailyData?.income > 0 && (
                      <p className="text-[9px] font-black text-emerald-400 leading-none">+{ (dailyData.income / 1000).toFixed(0) }rb</p>
                    )}
                  </div>
                  {isToday && <div className="absolute inset-x-2 bottom-2 h-1 bg-rose-200 rounded-full" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaksi Terbaru */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h2 className="text-lg font-bold text-[#2C2C2C] mb-1">Transaksi Terbaru</h2>
          <div className="mt-8 space-y-6">
            {data.recentTransactions.length > 0 ? data.recentTransactions.map((tx, idx) => (
              <div key={idx} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110
                    ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                    {tx.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-extrabold text-[#2C2C2C] text-[14px] truncate max-w-[140px]" title={tx.description}>{tx.description}</h4>
                    <p className="text-[11px] font-bold text-[#A19FA6] uppercase tracking-tight">{tx.category?.name || 'UMUM'} • {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-[15px] tracking-tight ${tx.type === 'income' ? 'text-[#6366f1]' : 'text-[#2C2C2C]'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-[#B0B0B0] font-semibold text-sm">Belum ada transaksi bulan ini.</div>
            )}
            
            <Link href="/pengeluaran" className="block text-center pt-4 text-[12px] font-black text-[#A19FA6] hover:text-[#2C2C2C] transition-colors uppercase tracking-widest">Lihat Semua Riwayat</Link>
          </div>
        </div>
      </div>
      {/* Unified Utang Piutang Section (Below Activities) */}
      <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] mt-6">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#2C2C2C]">Utang Piutang</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link href="/utang" className="group block">
            <p className="text-[10px] font-black tracking-widest text-[#A19FA6] uppercase mb-2 group-hover:text-rose-400 transition-colors">UTANG</p>
            <p className="text-xl font-black text-rose-500 tracking-tight group-hover:scale-105 transition-transform origin-left">{formatRupiah(data.totalUtang)}</p>
            <span className="text-[9px] font-bold text-slate-300 uppercase">+0% vs periode lalu</span>
          </Link>
          <Link href="/piutang" className="group block">
            <p className="text-[10px] font-black tracking-widest text-[#A19FA6] uppercase mb-2 group-hover:text-emerald-400 transition-colors">PIUTANG</p>
            <p className="text-xl font-black text-emerald-500 tracking-tight group-hover:scale-105 transition-transform origin-left">{formatRupiah(data.totalPiutang)}</p>
            <span className="text-[9px] font-bold text-slate-300 uppercase">+0% vs periode lalu</span>
          </Link>
          <div className="group block">
            <p className="text-[10px] font-black tracking-widest text-[#A19FA6] uppercase mb-2">POSISI BERSIH</p>
            <p className="text-xl font-black text-[#2C2C2C] tracking-tight">{formatRupiah(data.kekayaanBersih)}</p>
            <span className={`text-[9px] font-bold uppercase ${data.netWealthGrowth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {data.netWealthGrowth >= 0 ? '+' : ''}{data.netWealthGrowth.toFixed(1)}% vs periode lalu
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Pengeluaran Terbesar Section */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <h2 className="text-lg font-bold text-[#2C2C2C] mb-8">Pengeluaran Terbesar</h2>
          <div className="space-y-4">
            {data.recentTransactions.filter((tx: any) => tx.type === 'expense').slice(0, 5).map((tx: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                    <TrendingDown size={18} className="text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#2C2C2C]">{tx.description}</h4>
                    <span className="text-[10px] font-black tracking-widest text-[#A19FA6] uppercase">{tx.category?.name || 'UMUM'}</span>
                  </div>
                </div>
                <p className="text-sm font-black text-[#2C2C2C]">{formatRupiah(tx.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Realisasi Anggaran Section (Doughnut Style) */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col">
          <h2 className="text-lg font-bold text-[#2C2C2C] mb-4">Realisasi Anggaran</h2>
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px]">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Aktual', value: data.totalPengeluaran },
                    { name: 'Sisa', value: Math.max(data.sisaPendapatan, 0) }
                  ]}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#C7D2FE" />
                  <Cell fill="#FEF3C7" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black tracking-widest text-[#A19FA6] uppercase">SISA</span>
                <span className="text-xl font-black text-[#2C2C2C] tracking-tight">{formatRupiah(data.sisaPendapatan)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

