"use client";
import { useEffect, useState } from "react";
import { formatRupiah, getCurrentMonth, getMonthLabel } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import MonthYearPicker from "@/components/MonthYearPicker";

interface DashboardData {
  accountBalances: Record<string, number>;
  totalKas: number; totalUtang: number; totalPiutang: number;
  totalAsetInvestasi: number; totalBarang: number; totalAset: number; kekayaanBersih: number;
  currentMonth: string; totalPendapatan: number; totalKebutuhanPokok: number;
  totalBeliAset: number; totalBeliBarang: number; sisaPendapatan: number;
  labaRugiBulanan: { month: string; pendapatan: number; kebutuhanPokok: number; beliAset: number; beliBarang: number; sisa: number }[];
  expenseByCategory: Record<string, number>;
  budgetComparison: { category: string; rencana: number; aktual: number }[];
  level: number; levelLabel: string;
  debtSummary: { name: string; remaining: number }[];
}

export default function AnalisaPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [month, setMonth] = useState(getCurrentMonth());

  useEffect(() => {
    fetch("/api/dashboard?month=" + month).then(r => r.json()).then(setData);
  }, [month]);

  if (!data) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  const kekayaanData = [
    { name: "Kas & Tabungan", value: data.totalKas },
    { name: "Aset Investasi", value: data.totalAsetInvestasi },
    { name: "Piutang", value: data.totalPiutang },
    { name: "Barang", value: data.totalBarang },
    { name: "Utang", value: -data.totalUtang },
  ];

  const trendData = data.labaRugiBulanan.map(l => ({
    ...l,
    tabungan: l.sisa,
    monthLabel: getMonthLabel(l.month).slice(0, 3) + " " + l.month.slice(0, 4),
  }));

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analisa Keuangan</h1>
          <p className="text-slate-500 text-sm">Analisis mendalam kesehatan keuanganmu</p>
        </div>
        <MonthYearPicker value={month} onChange={setMonth} />
      </div>

      {/* Kekayaan Bersih */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Kekayaan Bersih</h2>
        <p className="text-sm text-slate-500 mb-4">Seluruh aset yang dimiliki dikurangi utang</p>
        <div className="text-3xl font-bold mb-6" style={{ color: data.kekayaanBersih >= 0 ? "#10b981" : "#ef4444" }}>
          {formatRupiah(data.kekayaanBersih)}
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={kekayaanData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => (v / 1e6).toFixed(0) + "jt"} />
            <Tooltip formatter={(v) => formatRupiah(Number(v))} />
            <Bar dataKey="value" fill="#3b82f6" name="Nilai" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Laba Rugi Detail */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Laba Rugi Bulanan</h2>
        <p className="text-sm text-slate-500 mb-4">Periksa pendapatanmu apakah bisa menutupi kebutuhan bulanan</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-2">Kategori</th>
                {data.labaRugiBulanan.slice(-6).map(l => (
                  <th key={l.month} className="text-right px-3 py-2">{getMonthLabel(l.month)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-3 py-2 font-medium text-emerald-700">Pendapatan</td>
                {data.labaRugiBulanan.slice(-6).map(l => (
                  <td key={l.month} className="px-3 py-2 text-right text-emerald-600">{formatRupiah(l.pendapatan)}</td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-red-700">Kebutuhan Pokok</td>
                {data.labaRugiBulanan.slice(-6).map(l => (
                  <td key={l.month} className="px-3 py-2 text-right text-red-600">{formatRupiah(-l.kebutuhanPokok)}</td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-orange-700">Beli Aset</td>
                {data.labaRugiBulanan.slice(-6).map(l => (
                  <td key={l.month} className="px-3 py-2 text-right text-orange-600">{formatRupiah(-l.beliAset)}</td>
                ))}
              </tr>
              <tr className="bg-slate-50">
                <td className="px-3 py-2 font-bold">Sisa Pendapatan</td>
                {data.labaRugiBulanan.slice(-6).map(l => (
                  <td key={l.month} className={"px-3 py-2 text-right font-bold " + (l.sisa >= 0 ? "text-emerald-600" : "text-red-600")}>{formatRupiah(l.sisa)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend Tabungan */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Tren Kemampuan Menabung</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={v => (v / 1e6).toFixed(0) + "jt"} />
            <Tooltip formatter={(v) => formatRupiah(Number(v))} />
            <Legend />
            <Line type="monotone" dataKey="pendapatan" stroke="#10b981" name="Pendapatan" strokeWidth={2} />
            <Line type="monotone" dataKey="kebutuhanPokok" stroke="#ef4444" name="Pengeluaran" strokeWidth={2} />
            <Line type="monotone" dataKey="tabungan" stroke="#3b82f6" name="Tabungan" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Budgeting */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Budgeting</h2>
        <p className="text-sm text-slate-500 mb-4">Periksa apakah aktual budgeting sesuai dengan rencana</p>
        {data.budgetComparison.length > 0 ? (
          <div className="space-y-3">
            {data.budgetComparison.map(b => {
              const pct = b.rencana > 0 ? (b.aktual / b.rencana * 100) : 0;
              const over = pct > 100;
              return (
                <div key={b.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{b.category}</span>
                    <span className={over ? "text-red-600 font-medium" : "text-slate-600"}>
                      {formatRupiah(b.aktual)} / {formatRupiah(b.rencana)} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className={"h-2.5 rounded-full " + (over ? "bg-red-500" : "bg-blue-500")} style={{ width: Math.min(pct, 100) + "%" }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-slate-400 text-center py-8">Belum ada budget. Atur di halaman Pengaturan.</p>}
      </div>

      {/* Pengeluaran per Kategori detail */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Detail Pengeluaran - {getMonthLabel(data.currentMonth)}</h2>
        {Object.keys(data.expenseByCategory).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(data.expenseByCategory).sort((a/*, b*/) => a[1]).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between items-center bg-slate-50 rounded-lg p-3">
                <span className="text-sm text-slate-700">{cat}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-red-600">{formatRupiah(amt)}</span>
                  <span className="text-xs text-slate-400 ml-2">({(amt / data.totalKebutuhanPokok * 100).toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-slate-400 text-center py-8">Belum ada data</p>}
      </div>
    </div>
  );
}
