"use client";
import { useEffect, useState, useCallback } from "react";
import { useRef } from "react";
import { formatRupiah, formatDate, getCurrentMonth } from "@/lib/utils";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import MonthYearPicker from "@/components/MonthYearPicker";
import Modal from "@/components/Modal";

interface Category { id: number; name: string }
interface Expense { id: number; date: string; description: string; amount: number; category: Category }

export default function PengeluaranPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], categoryId: "", description: "", amount: "" });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [ocrPreview, setOcrPreview] = useState("");
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(() => {
    fetch("/api/expenses?month=" + month).then(r => r.json()).then(setExpenses);
  }, [month]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/expense-categories").then(r => r.json()).then(setCategories);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, categoryId: +form.categoryId, amount: +form.amount }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSubmitError(data.error || "Gagal menyimpan pengeluaran.");
      return;
    }
    setForm({ date: new Date().toISOString().split("T")[0], categoryId: "", description: "", amount: "" });
    setShowForm(false);
    load();
  };

  const triggerUpload = () => {
    setShowForm(true);
    setTimeout(() => fileInputRef.current?.click(), 150);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setOcrError("");
    setReceiptName(file.name);
    try {
      const { recognize } = await import("tesseract.js");
      const ocrResult = await recognize(file, "ind+eng");
      const text = (ocrResult?.data?.text || "").trim();
      setOcrPreview(text.slice(0, 600));
      if (!text) { setOcrError("Teks dari nota tidak terbaca. Coba foto lebih terang dan fokus."); return; }
      const aiRes = await fetch("/api/ai/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText: text, categories: categories.map(c => ({ id: c.id, name: c.name })) }),
      });
      const suggestion = await aiRes.json();
      const nextCategoryId = suggestion.suggestedCategoryId || "";
      const nextAmount = suggestion.suggestedAmount ? String(Math.round(Number(suggestion.suggestedAmount))) : "";
      const note = suggestion.noteText ? ` | Catatan OCR: ${suggestion.noteText}` : "";
      const nextDescription = `${suggestion.suggestedDescription || "Pengeluaran dari nota"} | Bukti: ${file.name}${note}`;
      setForm(prev => ({ ...prev, categoryId: nextCategoryId || prev.categoryId, amount: nextAmount || prev.amount, description: nextDescription }));
    } catch {
      setOcrError("Gagal memproses OCR/AI. Coba ulangi upload.");
    } finally {
      setOcrLoading(false);
      e.target.value = "";
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Hapus pengeluaran ini?")) return;
    await fetch("/api/expenses/" + id, { method: "DELETE" });
    load();
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory: Record<string, number> = {};
  expenses.forEach(e => { byCategory[e.category.name] = (byCategory[e.category.name] || 0) + e.amount; });

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} disabled={ocrLoading} />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catat Pengeluaran</h1>
          <p className="text-slate-500 text-sm">Total: {formatRupiah(total)}</p>
        </div>
        <div className="flex gap-3">
          <MonthYearPicker value={month} onChange={setMonth} />
          <button onClick={triggerUpload} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700">
            <Upload size={16} /> Upload Nota
          </button>
          <button onClick={() => setShowForm(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-red-700">
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      {Object.keys(byCategory).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} className="bg-white rounded-lg shadow-sm border p-3">
              <p className="text-xs text-slate-500">{cat}</p>
              <p className="text-sm font-semibold text-red-600">{formatRupiah(amt)}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Tambah Pengeluaran">
        <form onSubmit={submit} className="flex flex-col gap-4">
          {/* OCR Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={triggerUpload} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                {ocrLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {ocrLoading ? "Menganalisis nota..." : "Upload Nota / Resi"}
              </button>
              {receiptName && <span className="text-xs text-slate-600">File: {receiptName}</span>}
            </div>
            <p className="text-xs text-slate-500 mt-2">Upload nota untuk mengisi form otomatis via OCR + AI.</p>
            {ocrError && <p className="text-xs text-rose-600 mt-2">{ocrError}</p>}
            {ocrPreview && (
              <div className="mt-3 bg-white border border-slate-200 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-600 mb-1">Preview OCR:</p>
                <p className="text-xs text-slate-500 whitespace-pre-wrap">{ocrPreview}</p>
              </div>
            )}
          </div>
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
            <label className="block text-xs text-slate-500 mb-1">Nominal (Rp)</label>
            <input type="number" required min={0} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" />
          </div>
          {submitError && <p className="text-sm text-rose-600">{submitError}</p>}
          <button type="submit" className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-red-700 w-full font-semibold">Simpan</button>
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
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700 font-medium">{formatDate(e.date)}</td>
                  <td className="px-4 py-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">{e.category.name}</span></td>
                  <td className="px-4 py-3 text-slate-700">{e.description}</td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">{formatRupiah(e.amount)}</td>
                  <td className="px-4 py-3"><button onClick={() => remove(e.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button></td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Belum ada pengeluaran bulan ini</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
