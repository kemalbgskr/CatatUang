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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1">Catat Pendapatan</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-slate-500 text-base">Total: <span className="font-bold text-emerald-600">{formatRupiah(total)}</span></p>
            {!viewAll && diff !== null && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{
                  background: diff > 0 ? "#022c22" : diff < 0 ? "#2d0808" : "#1e293b",
                  color: diff > 0 ? "#34d399" : diff < 0 ? "#f87171" : "#94a3b8",
                  border: diff > 0 ? "1px solid #065f46" : diff < 0 ? "1px solid #7f1d1d" : "1px solid #334155",
                }}
              >
                {diff > 0 ? <TrendingUp size={12} /> : diff < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                {diff > 0 ? "+" : ""}{formatRupiah(diff)}
                {diffPct && <span className="opacity-70">({diff > 0 ? "+" : ""}{diffPct}%)</span>}
                <span className="opacity-50 ml-0.5">vs bln lalu</span>
              </span>
            )}
            {viewAll && <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">Mode: Semua Data</span>}
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button 
            onClick={() => setViewAll(!viewAll)} 
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${viewAll ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"}`}
          >
            {viewAll ? "Tutup Semua" : "Lihat Semua"}
          </button>
          {!viewAll && <MonthYearPicker value={month} onChange={setMonth} />}
          <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-base font-semibold flex items-center gap-2 shadow transition">
            <Plus size={18} /> Tambah
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <p className="text-sm font-medium text-indigo-700">{selectedIds.length} data dipilih</p>
          <div className="flex gap-2">
            <button onClick={bulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition">
              <Trash2 size={14} /> Hapus Terpilih
            </button>
            <button onClick={() => setSelectedIds([])} className="bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 px-4 py-1.5 rounded-lg text-xs font-bold transition">
              Batal
            </button>
          </div>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Tambah Pendapatan">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tanggal</label>
            <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Kategori</label>
            <select required value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm">
              <option value="">Pilih Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Deskripsi</label>
            <input type="text" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm" placeholder="Contoh: Gaji, Bonus, dll" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Jumlah (Rp)</label>
            <CurrencyInput required min={1} value={form.amount} onChangeValue={(val: string) => setForm(f => ({ ...f, amount: val }))} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm" placeholder="0" />
          </div>
          {submitError && <p className="text-sm text-rose-600">{submitError}</p>}
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl text-sm font-semibold w-full">Simpan</button>
        </form>
      </Modal>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 w-10">
                   <input type="checkbox" checked={incomes.length > 0 && selectedIds.length === incomes.length} onChange={toggleSelectAll} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                </th>
                <th className="text-left px-4 py-3">Tanggal</th>
                <th className="text-left px-4 py-3">Kategori</th>
                <th className="text-left px-4 py-3">Rincian</th>
                <th className="text-right px-4 py-3">Nominal</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {incomes.map(i => (
                <tr key={i.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(i.id) ? "bg-blue-50/50" : ""}`}>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={selectedIds.includes(i.id)} onChange={() => toggleSelect(i.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                  </td>
                  {editId === i.id ? (
                    <>
                      <td className="px-4 py-2"><input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm bg-white" /></td>
                      <td className="px-4 py-2">
                        <select value={editForm.categoryId} onChange={e => setEditForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm bg-white">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2"><input type="text" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm bg-white" /></td>
                      <td className="px-4 py-2"><CurrencyInput min={0} value={editForm.amount} onChangeValue={(val: string) => setEditForm(f => ({ ...f, amount: val }))} className="w-full border rounded px-2 py-1 text-sm bg-white text-right" /></td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <button onClick={saveEdit} className="text-emerald-600 hover:text-emerald-800" title="Simpan"><Check size={16} /></button>
                          <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600" title="Batal"><X size={16} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-slate-700 font-medium">{formatDate(i.date)}</td>
                      <td className="px-4 py-3"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">{i.category.name}</span></td>
                      <td className="px-4 py-3 text-slate-700">{i.description}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatRupiah(i.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(i)} className="text-blue-400 hover:text-blue-600" title="Edit"><Edit2 size={16} /></button>
                          <button onClick={() => remove(i.id)} className="text-red-400 hover:text-red-600" title="Hapus"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {incomes.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Belum ada pendapatan {viewAll ? "sama sekali" : "bulan ini"}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus"
        message={confirmDelete.bulk ? `Apakah Anda yakin ingin menghapus ${selectedIds.length} data pendapatan yang dipilih? Tindakan ini tidak dapat dibatalkan.` : "Apakah Anda yakin ingin menghapus data pendapatan ini?"}
        confirmLabel="Hapus Sekarang"
      />
    </div>
  );
}
