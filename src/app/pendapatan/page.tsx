"use client";
import { useEffect, useState, useCallback } from "react";
import { formatRupiah, formatDate, getCurrentMonth } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import MonthYearPicker from "@/components/MonthYearPicker";
import Modal from "@/components/Modal";

interface Category { id: number; name: string }
interface Income { id: number; date: string; description: string; amount: number; category: Category }

export default function PendapatanPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], categoryId: "", description: "", amount: "" });

  const load = useCallback(() => {
    fetch("/api/incomes?month=" + month).then(r => r.json()).then(setIncomes);
  }, [month]);

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
    if (!confirm("Hapus pendapatan ini?")) return;
    await fetch("/api/incomes/" + id, { method: "DELETE" });
    load();
  };

  const total = incomes.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1">Catat Pendapatan</h1>
          <p className="text-slate-500 text-base">Total: <span className="font-bold text-emerald-600">{formatRupiah(total)}</span></p>
        </div>
        <div className="flex gap-3">
          <MonthYearPicker value={month} onChange={setMonth} />
          <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-base font-semibold flex items-center gap-2 shadow transition">
            <Plus size={18} /> Tambah
          </button>
        </div>
      </div>

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
            <input type="number" required min={1} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm" placeholder="0" />
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
                <th className="text-left px-4 py-3">Tanggal</th>
                <th className="text-left px-4 py-3">Kategori</th>
                <th className="text-left px-4 py-3">Rincian</th>
                <th className="text-right px-4 py-3">Nominal</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {incomes.map(i => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700 font-medium">{formatDate(i.date)}</td>
                  <td className="px-4 py-3"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">{i.category.name}</span></td>
                  <td className="px-4 py-3 text-slate-700">{i.description}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatRupiah(i.amount)}</td>
                  <td className="px-4 py-3"><button onClick={() => remove(i.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button></td>
                </tr>
              ))}
              {incomes.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Belum ada pendapatan bulan ini</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
