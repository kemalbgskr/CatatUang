"use client";
import { useEffect, useState, useCallback } from "react";
import { formatRupiah, formatDate, getCurrentMonth } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

interface Category { id: number; name: string }
interface Account { id: number; name: string }
interface Expense { id: number; date: string; description: string; amount: number; category: Category; account: Account }

export default function PengeluaranPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], categoryId: "", description: "", accountId: "", amount: "" });

  const load = useCallback(() => {
    fetch("/api/expenses?month=" + month).then(r => r.json()).then(setExpenses);
  }, [month]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/expense-categories").then(r => r.json()).then(setCategories);
    fetch("/api/accounts").then(r => r.json()).then(setAccounts);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, categoryId: +form.categoryId, accountId: +form.accountId, amount: +form.amount }),
    });
    setForm({ date: new Date().toISOString().split("T")[0], categoryId: "", description: "", accountId: "", amount: "" });
    setShowForm(false);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("Hapus pengeluaran ini?")) return;
    await fetch("/api/expenses/" + id, { method: "DELETE" });
    load();
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  // Group by category
  const byCategory: Record<string, number> = {};
  expenses.forEach(e => { byCategory[e.category.name] = (byCategory[e.category.name] || 0) + e.amount; });

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catat Pengeluaran</h1>
          <p className="text-slate-500 text-sm">Total: {formatRupiah(total)}</p>
        </div>
        <div className="flex gap-3">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white" />
          <button onClick={() => setShowForm(!showForm)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-red-700">
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      {/* Category summary */}
      {Object.keys(byCategory).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(byCategory).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
            <div key={cat} className="bg-white rounded-lg shadow-sm border p-3">
              <p className="text-xs text-slate-500">{cat}</p>
              <p className="text-sm font-semibold text-red-600">{formatRupiah(amt)}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tanggal</label>
            <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Kategori</label>
            <select required value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Pilih...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Rincian</label>
            <input type="text" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Deskripsi" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Rekening</label>
            <select required value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Pilih...</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nominal (Rp)</label>
            <input type="number" required min={0} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-red-700 w-full">Simpan</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Tanggal</th>
                <th className="text-left px-4 py-3">Kategori</th>
                <th className="text-left px-4 py-3">Rincian</th>
                <th className="text-left px-4 py-3">Rekening</th>
                <th className="text-right px-4 py-3">Nominal</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{formatDate(e.date)}</td>
                  <td className="px-4 py-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">{e.category.name}</span></td>
                  <td className="px-4 py-3 text-slate-600">{e.description}</td>
                  <td className="px-4 py-3 text-slate-600">{e.account.name}</td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">{formatRupiah(e.amount)}</td>
                  <td className="px-4 py-3"><button onClick={() => remove(e.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button></td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Belum ada pengeluaran bulan ini</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
