"use client";
import { useEffect, useState, useCallback } from "react";
import { formatRupiah, formatDate, getCurrentMonth } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import MonthYearPicker from "@/components/MonthYearPicker";
import { CurrencyInput } from "@/components/CurrencyInput";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";

interface Category { id: number; name: string }
interface Income { id: number; date: string; description: string; amount: number; category: Category }

export default function PendapatanPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [viewAll, setViewAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], categoryId: "", description: "", amount: "" });
  
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number; bulk?: boolean }>({ open: false });

  const load = useCallback(() => {
    const queryMonth = viewAll ? "all" : month;
    fetch("/api/incomes?month=" + queryMonth).then(r => r.json()).then(setIncomes);
  }, [month, viewAll]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/income-categories").then(r => r.json()).then(setCategories);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const res = await fetch("/api/incomes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, categoryId: +form.categoryId, amount: +form.amount }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setSubmitError(payload.error || "Gagal menambah pendapatan.");
      return;
    }
    setForm({ date: new Date().toISOString().split("T")[0], categoryId: "", description: "", amount: "" });
    setShowForm(false);
    load();
  };

  const remove = async (id: number) => {
    setConfirmDelete({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete.bulk) {
      for (const id of selectedIds) { await fetch("/api/incomes/" + id, { method: "DELETE" }); }
      setSelectedIds([]);
    } else if (confirmDelete.id) {
      await fetch("/api/incomes/" + confirmDelete.id, { method: "DELETE" });
    }
    setConfirmDelete({ open: false });
    load();
  };

  const total = incomes.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6 pt-12 md:pt-0 pb-20 max-w-5xl mx-auto">
      {/* Header aligned to Budggt style */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2C2C2C] tracking-tight">Pemasukan</h1>
          <p className="text-[#848484] font-medium text-[15px] mt-1">Duit datang dari mana aja?</p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <button 
            onClick={() => setViewAll(!viewAll)} 
            className={`px-4 py-2.5 rounded-2xl text-[13px] font-extrabold transition flex items-center gap-2 border shadow-sm
              ${viewAll ? "bg-[#2C2C2C] text-white border-[#2C2C2C]" : "bg-white text-[#2C2C2C] border-[#EAEAEA] hover:bg-[#F8F8F8]"}`}
          >
            {viewAll ? "Lihat Per Bulan" : "Lihat Semua"}
          </button>
          <div className="bg-white border border-[#EAEAEA] rounded-2xl p-0.5 flex items-center shadow-sm">
            <MonthYearPicker value={month} onChange={setMonth} className="text-[13px] font-extrabold border-none shadow-none bg-transparent" />
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-[#FFEFEF] hover:bg-[#FFDFDF] text-[#E06363] px-5 py-2.5 rounded-2xl text-[13px] font-extrabold transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} strokeWidth={3} /> Tambah Baru
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="px-4 md:px-0">
        <div className="bg-[#2C2C2C] rounded-[32px] p-8 text-white relative overflow-hidden shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-[#A19FA6] text-[10px] font-black tracking-widest mb-3 flex items-center gap-2 uppercase">
                <span className="text-emerald-400">⚡</span> PEMASUKAN {viewAll ? "TOTAL" : getMonthLabel(month)}
              </p>
              <h2 className="text-4xl md:text-5xl font-black mb-1 ml-1 tracking-tighter">{formatRupiah(total)}</h2>
              <p className="text-[#A19FA6] text-[12px] font-bold mt-2 ml-1">total pemasukan kamu</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm self-start md:self-auto min-w-[140px] text-center">
                 <p className="text-[10px] font-black text-[#A19FA6] mb-1 uppercase tracking-widest">TRANSAKSI</p>
                 <p className="text-lg font-black">{incomes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main List Table */}
      <div className="px-4 md:px-0">
        <div className="bg-white border border-[#EAEAEA] rounded-[32px] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-6 py-5 text-[10px] font-black text-[#848484] uppercase tracking-widest">Waktu</th>
                <th className="px-6 py-5 text-[10px] font-black text-[#848484] uppercase tracking-widest">Kategori</th>
                <th className="px-6 py-5 text-[10px] font-black text-[#848484] uppercase tracking-widest">Rincian</th>
                <th className="px-6 py-5 text-[10px] font-black text-[#848484] uppercase tracking-widest text-right">Jumlah</th>
                <th className="px-6 py-5 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {incomes.map(i => (
                <tr key={i.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5 text-[13px] font-bold text-[#64748b]">
                    {formatDate(i.date)}
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-black uppercase tracking-tight">
                      {i.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-[14px] font-extrabold text-[#2C2C2C]">
                    {i.description}
                  </td>
                  <td className="px-6 py-5 text-[15px] font-black text-emerald-500 text-right tracking-tight">
                    +{formatRupiah(i.amount)}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button onClick={() => remove(i.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {incomes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center">
                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-2xl">📥</div>
                       <p className="text-[15px] font-bold text-slate-600 mb-1">Belum Ada Pemasukan</p>
                       <p className="text-[13px] font-medium text-[#848484]">Pemasukan kamu masih kosong {viewAll ? "sama sekali" : "bulan ini"}.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={handleConfirmDelete}
        title="Hapus Pendapatan"
        message="Yakin mau hapus data pendapatan ini?"
      />

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-[32px] overflow-hidden shadow-2xl">
             <div className="p-8 relative">
               <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-slate-400 hover:text-black focus:outline-none focus:ring-2 focus:ring-slate-100 rounded-lg transition-all"><X size={20} /></button>
               <h2 className="text-[20px] font-black text-[#2C2C2C] mb-8">Tambah Pemasukan</h2>
               <form onSubmit={submit} className="space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-[11px] font-extrabold tracking-wide text-[#B0B0B0] mb-1.5 uppercase">TANGGAL</label>
                     <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border-[#EAEAEA] rounded-xl px-4 py-3 text-[13px] font-semibold outline-none focus:border-rose-300 transition-all bg-[#F8F8F8]" />
                   </div>
                   <div>
                     <label className="block text-[11px] font-extrabold tracking-wide text-[#B0B0B0] mb-1.5 uppercase">KATEGORI</label>
                     <select value={form.categoryId} required onChange={e => setForm({...form, categoryId: e.target.value})} className="w-full border-[#EAEAEA] rounded-xl px-4 py-3 text-[13px] font-semibold outline-none focus:border-rose-300 transition-all bg-[#F8F8F8]">
                       <option value="">Pilih</option>
                       {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                   </div>
                 </div>
                 <div>
                   <label className="block text-[11px] font-extrabold tracking-wide text-[#B0B0B0] mb-1.5 uppercase">RINCIAN</label>
                   <input type="text" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border-[#EAEAEA] rounded-xl px-4 py-3 text-[13px] font-semibold outline-none focus:border-rose-300 transition-all bg-[#F8F8F8]" placeholder="Contoh: Gaji, Jual Barang..." />
                 </div>
                 <div>
                   <label className="block text-[11px] font-extrabold tracking-wide text-[#B0B0B0] mb-1.5 uppercase">JUMLAH (RP)</label>
                   <CurrencyInput value={form.amount} onChangeValue={v => setForm({...form, amount: v})} className="w-full border-[#EAEAEA] rounded-xl px-4 py-3 text-[13px] font-semibold outline-none focus:border-rose-300 transition-all bg-[#F8F8F8]" />
                 </div>
                 <button type="submit" className="w-full bg-[#FFEFEF] hover:bg-[#FFDFDF] text-[#E06363] py-4 rounded-[20px] text-[14px] font-black transition-all shadow-sm">SIMPAN</button>
               </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getMonthLabel(monthStr: string) {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-");
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}
