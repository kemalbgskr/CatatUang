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

export default function AnalisaPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [month, setMonth] = useState(getCurrentMonth());

  useEffect(() => {
    fetch("/api/dashboard?month=" + month).then(r => r.json()).then(setData);
  }, [month]);

  if (!data) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  const trendData = data.labaRugiBulanan.map(l => ({
    ...l,
    tabungan: l.sisa,
    monthLabel: l.month,
  }));

  const totalExpense = data.totalPengeluaran || 1; // avoid division by zero

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analisa Keuangan</h1>
          <p className="text-slate-500 text-sm">Analisis mendalam kesehatan keuanganmu</p>
        </div>
        <MonthYearPicker value={month} onChange={setMonth} />
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
