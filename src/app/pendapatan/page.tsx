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
  const [prevTotal, setPrevTotal] = useState<number | null>(null);
  const [month, setMonth] = useState(getCurrentMonth());
  const [viewAll, setViewAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], categoryId: "", description: "", amount: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ date: "", categoryId: "", description: "", amount: "" });

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number; bulk?: boolean }>({ open: false });

  const load = useCallback(() => {
    const queryMonth = viewAll ? "all" : month;
    fetch("/api/incomes?month=" + queryMonth).then(r => r.json()).then(setIncomes);
    
    if (!viewAll) {
      // Hitung bulan sebelumnya
      const [y, m] = month.split("-").map(Number);
      const prevDate = new Date(y, m - 2, 1);
      const prevMonth = prevDate.getFullYear() + "-" + String(prevDate.getMonth() + 1).padStart(2, "0");
      fetch("/api/incomes?month=" + prevMonth)
        .then(r => r.json())
        .then((data: Income[]) => setPrevTotal(data.reduce((s, i) => s + i.amount, 0)));
    } else {
      setPrevTotal(null);
    }
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
      if (selectedIds.length === 0) return;
      for (const id of selectedIds) {
        await fetch("/api/incomes/" + id, { method: "DELETE" });
      }
      setSelectedIds([]);
    } else if (confirmDelete.id) {
      await fetch("/api/incomes/" + confirmDelete.id, { method: "DELETE" });
    }
    setConfirmDelete({ open: false });
    load();
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setConfirmDelete({ open: true, bulk: true });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === incomes.length ? [] : incomes.map(i => i.id));
  };

  const startEdit = (i: Income) => {
    setEditId(i.id);
    setEditForm({
      date: i.date.split("T")[0],
      categoryId: i.category.id.toString(),
      description: i.description,
      amount: i.amount.toString(),
    });
  };

  const saveEdit = async () => {
    if (!editId) return;
    const res = await fetch("/api/incomes/" + editId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, categoryId: +editForm.categoryId, amount: +editForm.amount }),
    });
    if (!res.ok) {
      alert("Gagal menyimpan perubahan.");
      return;
    }
    setEditId(null);
    load();
  };

  const total = incomes.reduce((s, i) => s + i.amount, 0);
  const diff = !viewAll && prevTotal !== null ? total - prevTotal : null;
  const diffPct = !viewAll && prevTotal && prevTotal > 0 ? ((diff! / prevTotal) * 100).toFixed(1) : null;

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pendapatan</h1>
          <p className="text-slate-500 font-medium text-[15px] mt-1">Total: <span className="font-bold text-emerald-600">{formatRupiah(total)}</span></p>
          {!viewAll && diff !== null && (
            <div className="mt-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold"
                style={{
                  background: diff > 0 ? "#10b98115" : diff < 0 ? "#f43f5e15" : "#f1f5f9",
                  color: diff > 0 ? "#10b981" : diff < 0 ? "#f43f5e" : "#64748b",
                }}
              >
                {diff > 0 ? <TrendingUp size={14} /> : diff < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                {diff > 0 ? "+" : ""}{formatRupiah(diff)}
                {diffPct && <span className="opacity-70">({diff > 0 ? "+" : ""}{diffPct}%)</span>}
                <span className="opacity-50 ml-0.5">vs bln lalu</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <button 
            onClick={() => setViewAll(!viewAll)} 
            className={`px-4 py-2.5 rounded-2xl text-[13px] font-bold transition flex items-center gap-2 border shadow-sm
              ${viewAll ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            {viewAll ? "Tutup Semua Waktu" : "Semua Waktu"}
          </button>
          {!viewAll && (
            <div className="bg-white rounded-2xl px-2 py-1.5 border border-slate-200 shadow-sm flex items-center">
              <MonthYearPicker value={month} onChange={setMonth} className="text-[13px] font-bold border-none shadow-none bg-transparent" />
            </div>
          )}
          <button onClick={() => setShowForm(true)} className="bg-rose-200 text-rose-900 px-4 py-2.5 rounded-2xl text-[13px] font-bold flex items-center gap-2 hover:bg-rose-300 transition-all">
            <Plus size={16} /> Tambah Baru
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-[20px] p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <p className="text-[13px] font-bold text-rose-800">{selectedIds.length} data dipilih</p>
          <div className="flex gap-2">
            <button onClick={bulkDelete} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
              <Trash2 size={14} /> Hapus Terpilih
            </button>
            <button onClick={() => setSelectedIds([])} className="bg-white border border-rose-200 text-rose-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-50 transition">
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Main List */}
      <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100/50 overflow-hidden p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-[17px] font-bold text-slate-800">Semua Pendapatan</h2>
            <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-1 rounded-md">{incomes.length} data</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] font-bold text-slate-500 cursor-pointer flex items-center gap-2 select-none hover:text-slate-800 transition">
              <input type="checkbox" checked={incomes.length > 0 && selectedIds.length === incomes.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-200 text-rose-500 focus:ring-rose-500" />
              Pilih Semua
            </label>
          </div>
        </div>

        <div className="space-y-0">
          {incomes.map(i => (
            <div key={i.id} className={`group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-all rounded-2xl ${selectedIds.includes(i.id) ? "bg-rose-50/30" : ""}`}>
              {editId === i.id ? (
                <div className="w-full flex flex-col md:flex-row gap-4 items-start md:items-center">
                   <input type="date" value={editForm.date} onChange={ev => setEditForm(f => ({ ...f, date: ev.target.value }))} className="w-full md:w-32 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-emerald-300 focus:ring focus:ring-emerald-100" />
                   <select value={editForm.categoryId} onChange={ev => setEditForm(f => ({ ...f, categoryId: ev.target.value }))} className="w-full md:w-40 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-emerald-300 focus:ring focus:ring-emerald-100">
                     {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                   <div className="w-full flex-1">
                     <input type="text" value={editForm.description} onChange={ev => setEditForm(f => ({ ...f, description: ev.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-emerald-300 focus:ring focus:ring-emerald-100" placeholder="Deskripsi" />
                   </div>
                   <CurrencyInput min={0} value={editForm.amount} onChangeValue={(val: string) => setEditForm(f => ({ ...f, amount: val }))} className="w-full md:w-36 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-emerald-300 focus:ring focus:ring-emerald-100" />
                   <div className="flex items-center gap-2 w-full md:w-auto mt-3 md:mt-0 justify-end">
                      <button onClick={saveEdit} className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 transition shadow-sm" title="Simpan"><Check size={16} /></button>
                      <button onClick={() => setEditId(null)} className="bg-white border border-slate-200 text-slate-500 p-2 rounded-xl hover:bg-slate-50 transition shadow-sm" title="Batal"><X size={16} /></button>
                   </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 flex-1">
                    <input type="checkbox" checked={selectedIds.includes(i.id)} onChange={() => toggleSelect(i.id)} className="w-4 h-4 rounded border-slate-200 text-rose-500 focus:ring-rose-500 shrink-0" />
                    <div className="w-12 h-12 shrink-0 rounded-[14px] bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-sm">
                      💰
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-slate-800 tracking-tight leading-tight">{i.description}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                         <p className="text-[11px] font-bold text-slate-400">{formatDate(i.date)}</p>
                         <span className="w-1 h-1 rounded-full bg-slate-200" />
                         <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-[6px] text-[10px] font-bold tracking-wide uppercase">{i.category.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end mt-4 md:mt-0 pl-16 md:pl-0">
                    <p className="text-[15px] font-black text-emerald-500 tracking-tight mb-2 md:mb-1">
                      + {formatRupiah(i.amount)}
                    </p>
                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(i)} className="bg-white border border-slate-200 text-slate-500 p-1.5 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition" title="Edit"><Edit2 size={14} strokeWidth={2.5}/></button>
                      <button onClick={() => remove(i.id)} className="bg-white border border-rose-200 text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition" title="Hapus"><Trash2 size={14} strokeWidth={2.5}/></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {incomes.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-2xl">
                 🌬️
               </div>
               <p className="text-[15px] font-bold text-slate-600 mb-1">Belum Ada Pendapatan</p>
               <p className="text-[13px] font-medium">Catatan pemasukanmu masih kosong {viewAll ? "sama sekali" : "bulan ini"}.</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Tambah Pendapatan">
        <form onSubmit={submit} className="flex flex-col gap-4 pt-2">
          <div>
            <label className="block text-[11px] font-extrabold tracking-wide text-slate-400 mb-1.5 uppercase">Kategori</label>
            <select required value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[13px] font-semibold bg-white focus:border-emerald-300 focus:ring focus:ring-emerald-100 transition-all">
              <option value="">Pilih...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold tracking-wide text-slate-400 mb-1.5 uppercase">Rincian / Sumber</label>
            <input type="text" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[13px] font-semibold bg-white focus:border-emerald-300 focus:ring focus:ring-emerald-100 transition-all" placeholder="Gaji Bulanan, Freelance..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-extrabold tracking-wide text-slate-400 mb-1.5 uppercase">Tanggal</label>
              <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[13px] font-semibold bg-white focus:border-emerald-300 focus:ring focus:ring-emerald-100 transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold tracking-wide text-slate-400 mb-1.5 uppercase">Nominal</label>
              <CurrencyInput required min={1} value={form.amount} onChangeValue={(val: string) => setForm(f => ({ ...f, amount: val }))} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[13px] font-extrabold bg-white focus:border-emerald-300 focus:ring focus:ring-emerald-100 transition-all text-emerald-700" placeholder="0" />
            </div>
          </div>

          {submitError && <div className="bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100 text-[13px] font-bold">{submitError}</div>}
          <div className="pt-2">
            <button type="submit" className="bg-emerald-500 text-white px-6 py-3.5 rounded-xl text-[14px] font-black w-full hover:bg-emerald-600 transition-all shadow-md shadow-emerald-200">
              Simpan Pendapatan
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus"
        message={confirmDelete.bulk ? `Yakin mau menghapus ${selectedIds.length} pendapatan sekaligus? Aksi ini permanen.` : "Yakin mau menghapus riwayat pendapatan ini?"}
        confirmLabel="Hapus Permanen"
      />
    </div>
  );
}
