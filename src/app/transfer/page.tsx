"use client";
import { useEffect, useState, useCallback } from "react";
import { formatRupiah, formatDate, getCurrentMonth } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

interface Account { id: number; name: string }
interface Transfer { id: number; date: string; fromAccount: Account; toAccount: Account; amount: number; adminFee: number }

export default function TransferPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], fromAccountId: "", toAccountId: "", amount: "", adminFee: "0" });

  const load = useCallback(() => {
    fetch("/api/transfers?month=" + month).then(r => r.json()).then(setTransfers);
  }, [month]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetch("/api/accounts").then(r => r.json()).then(setAccounts); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, fromAccountId: +form.fromAccountId, toAccountId: +form.toAccountId, amount: +form.amount, adminFee: +form.adminFee }),
    });
    setForm({ date: new Date().toISOString().split("T")[0], fromAccountId: "", toAccountId: "", amount: "", adminFee: "0" });
    setShowForm(false);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("Hapus transfer ini?")) return;
    await fetch("/api/transfers/" + id, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transfer / Pindah Kas / Nabung</h1>
          <p className="text-slate-500 text-sm">Pindah uang antar rekening</p>
        </div>
        <div className="flex gap-3">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white" />
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700">
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tanggal</label>
            <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Dari Rekening</label>
            <select required value={form.fromAccountId} onChange={e => setForm({...form, fromAccountId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Pilih...</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Ke Rekening</label>
            <select required value={form.toAccountId} onChange={e => setForm({...form, toAccountId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Pilih...</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nominal (Rp)</label>
            <input type="number" required min={0} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Biaya Admin (Rp)</label>
            <input type="number" min={0} value={form.adminFee} onChange={e => setForm({...form, adminFee: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 w-full">Simpan</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Tanggal</th>
                <th className="text-left px-4 py-3">Dari</th>
                <th className="text-left px-4 py-3">Ke</th>
                <th className="text-right px-4 py-3">Nominal</th>
                <th className="text-right px-4 py-3">Admin</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transfers.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{formatDate(t.date)}</td>
                  <td className="px-4 py-3 text-slate-600">{t.fromAccount.name}</td>
                  <td className="px-4 py-3 text-slate-600">{t.toAccount.name}</td>
                  <td className="px-4 py-3 text-right font-medium text-blue-600">{formatRupiah(t.amount)}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{formatRupiah(t.adminFee)}</td>
                  <td className="px-4 py-3"><button onClick={() => remove(t.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button></td>
                </tr>
              ))}
              {transfers.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Belum ada transfer bulan ini</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
