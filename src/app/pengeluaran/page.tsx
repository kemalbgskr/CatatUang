"use client";
import { useEffect, useState, useCallback } from "react";
import { useRef } from "react";
import { formatRupiah, formatDate, getCurrentMonth } from "@/lib/utils";
import { Plus, Trash2, Upload, Loader2, Edit2, Check, X, AlertTriangle, Info } from "lucide-react";
import MonthYearPicker from "@/components/MonthYearPicker";
import { CurrencyInput } from "@/components/CurrencyInput";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";

interface Category { id: number; name: string }
interface Expense { id: number; date: string; description: string; amount: number; category: Category; debtPayment?: any }
interface Budget { id: number; categoryId: number; monthlyAmount: number; category: Category }
interface DebtSource { id: number; name: string; initialAmount: number; loans: { amount: number }[]; payments: { amount: number }[] }

export default function PengeluaranPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debtSources, setDebtSources] = useState<DebtSource[]>([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [viewAll, setViewAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], categoryId: "", description: "", amount: "", debtSourceId: "" });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [ocrPreview, setOcrPreview] = useState("");
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ date: "", categoryId: "", description: "", amount: "", debtSourceId: "" });

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number; bulk?: boolean }>({ open: false });

  const load = useCallback(() => {
    const queryMonth = viewAll ? "all" : month;
    fetch("/api/expenses?month=" + queryMonth).then(r => r.json()).then(setExpenses);
  }, [month, viewAll]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/expense-categories").then(r => r.json()).then(setCategories);
    fetch("/api/budgets").then(r => r.json()).then(setBudgets);
    fetch("/api/debts").then(r => r.json()).then(setDebtSources);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, categoryId: +form.categoryId, amount: +form.amount, debtSourceId: form.debtSourceId ? +form.debtSourceId : undefined }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSubmitError(data.error || "Gagal menyimpan pengeluaran.");
      return;
    }
    setForm({ date: new Date().toISOString().split("T")[0], categoryId: "", description: "", amount: "", debtSourceId: "" });
    setShowForm(false);
    load();
    fetch("/api/debts").then(r => r.json()).then(setDebtSources);
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
    setConfirmDelete({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete.bulk) {
      if (selectedIds.length === 0) return;
      for (const id of selectedIds) {
        await fetch("/api/expenses/" + id, { method: "DELETE" });
      }
      setSelectedIds([]);
    } else if (confirmDelete.id) {
      await fetch("/api/expenses/" + confirmDelete.id, { method: "DELETE" });
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
    setSelectedIds(selectedIds.length === expenses.length ? [] : expenses.map(e => e.id));
  };

  const startEdit = (e: Expense) => {
    setEditId(e.id);
    setEditForm({
      date: e.date.split("T")[0],
      categoryId: e.category.id.toString(),
      description: e.description,
      amount: e.amount.toString(),
      debtSourceId: e.debtPayment?.debtSourceId?.toString() || ""
    });
  };

  const saveEdit = async () => {
    if (!editId) return;
    const res = await fetch("/api/expenses/" + editId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, categoryId: +editForm.categoryId, amount: +editForm.amount, debtSourceId: editForm.debtSourceId ? +editForm.debtSourceId : undefined }),
    });
    if (!res.ok) {
      alert("Gagal menyimpan perubahan.");
      return;
    }
    setEditId(null);
    load();
    fetch("/api/debts").then(r => r.json()).then(setDebtSources);
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
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-slate-500 text-sm">Total: <span className="font-bold text-red-600">{formatRupiah(total)}</span></p>
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
          <button onClick={triggerUpload} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700">
            <Upload size={16} /> Upload Nota
          </button>
          <button onClick={() => setShowForm(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-red-700">
            <Plus size={16} /> Tambah
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

      {!viewAll && Object.keys(byCategory).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
            const budget = budgets.find(b => b.category.name === cat);
            const isOver = budget ? amt > budget.monthlyAmount : false;
            const pct = budget ? Math.min((amt / budget.monthlyAmount) * 100, 100) : null;
            return (
              <div
                key={cat}
                className="rounded-xl p-3 relative overflow-hidden"
                style={{
                  background: isOver ? "#2d0808" : "#0f172a",
                  border: isOver ? "1.5px solid #7f1d1d" : "1.5px solid #1e293b",
                }}
              >
                <p className="text-xs text-white/60 mb-1">{cat}</p>
                <p className={`text-sm font-bold ${isOver ? "text-red-400" : "text-white"}`}>
                  {formatRupiah(amt)}
                </p>
                {budget && (
                  <>
                    <div className="mt-2 h-1 rounded-full bg-white/10">
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: isOver ? "#ef4444" : "#3b82f6" }}
                      />
                    </div>
                    <p className={`text-[10px] mt-1 ${isOver ? "text-red-400" : "text-white/40"}`}>
                      {isOver
                        ? `⚠ Melebihi ${formatRupiah(amt - budget.monthlyAmount)}`
                        : `Sisa ${formatRupiah(budget.monthlyAmount - amt)}`}
                    </p>
                  </>
                )}
                {!budget && <p className="text-[10px] text-white/30 mt-1">Tanpa budget</p>}
              </div>
            );
          })}
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
            <select required value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value, debtSourceId: ""})} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Pilih...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {(() => {
            const cat = categories.find(c => c.id === +form.categoryId);
            const isDebt = cat?.name.toLowerCase().includes("utang") || cat?.name.toLowerCase().includes("hutang");
            if (!isDebt) return null;
            
            const selectedDebt = debtSources.find(d => d.id === +form.debtSourceId);
            const balance = selectedDebt ? (selectedDebt.initialAmount + selectedDebt.loans.reduce((s, l) => s + l.amount, 0) - selectedDebt.payments.reduce((s, p) => s + p.amount, 0)) : 0;

            return (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3 animate-in fade-in zoom-in-95">
                <div>
                  <label className="block text-xs font-semibold text-orange-700 mb-1">Bayar Ke Utang Mana?</label>
                  <select required value={form.debtSourceId} onChange={e => setForm({...form, debtSourceId: e.target.value})} className="w-full border-orange-200 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">Pilih Sumber Utang...</option>
                    {debtSources.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                {selectedDebt && (
                  <div className="flex items-center gap-2 text-orange-600 bg-white/50 rounded-lg p-2 border border-orange-100">
                    <Info size={14} />
                    <p className="text-xs">Sisa Hutang: <span className="font-bold">{formatRupiah(balance)}</span></p>
                  </div>
                )}
              </div>
            );
          })()}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Rincian</label>
            <input type="text" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Deskripsi" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nominal (Rp)</label>
            <CurrencyInput required min={0} value={form.amount} onChangeValue={(val: string) => setForm({...form, amount: val})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" />
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
                <th className="px-4 py-3 w-10">
                   <input type="checkbox" checked={expenses.length > 0 && selectedIds.length === expenses.length} onChange={toggleSelectAll} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                </th>
                <th className="text-left px-4 py-3">Tanggal</th>
                <th className="text-left px-4 py-3">Kategori</th>
                <th className="text-left px-4 py-3">Rincian</th>
                <th className="text-right px-4 py-3">Nominal</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {expenses.map(e => (
                <tr key={e.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(e.id) ? "bg-red-50/50" : ""}`}>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={selectedIds.includes(e.id)} onChange={() => toggleSelect(e.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                  </td>
                  {editId === e.id ? (
                    <>
                      <td className="px-4 py-2"><input type="date" value={editForm.date} onChange={ev => setEditForm(f => ({ ...f, date: ev.target.value }))} className="w-full border rounded px-2 py-1 text-sm bg-white" /></td>
                      <td className="px-4 py-2">
                        <select value={editForm.categoryId} onChange={ev => setEditForm(f => ({ ...f, categoryId: ev.target.value }))} className="w-full border rounded px-2 py-1 text-sm bg-white">
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={editForm.description} onChange={ev => setEditForm(f => ({ ...f, description: ev.target.value }))} className="w-full border rounded px-2 py-1 text-sm bg-white mb-1" placeholder="Deskripsi" />
                        {(() => {
                          const cat = categories.find(c => c.id === +editForm.categoryId);
                          if (cat?.name.toLowerCase().includes("utang") || cat?.name.toLowerCase().includes("hutang")) {
                            return (
                              <select value={editForm.debtSourceId} onChange={ev => setEditForm(f => ({ ...f, debtSourceId: ev.target.value }))} className="w-full border border-orange-200 rounded px-2 py-1 text-[10px] bg-orange-50 appearance-none">
                                <option value="">Pilih Utang...</option>
                                {debtSources.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                            );
                          }
                          return null;
                        })()}
                      </td>
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
                      <td className="px-4 py-3 text-slate-700 font-medium">{formatDate(e.date)}</td>
                      <td className="px-4 py-3"><span className="bg-blue-900/50 text-blue-200 border border-blue-800/40 px-2 py-0.5 rounded-full text-xs">{e.category.name}</span></td>
                      <td className="px-4 py-3 text-slate-700">{e.description}</td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">{formatRupiah(e.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(e)} className="text-blue-400 hover:text-blue-600" title="Edit"><Edit2 size={16} /></button>
                          <button onClick={() => remove(e.id)} className="text-red-400 hover:text-red-600" title="Hapus"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Belum ada pengeluaran {viewAll ? "sama sekali" : "bulan ini"}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus"
        message={confirmDelete.bulk ? `Apakah Anda yakin ingin menghapus ${selectedIds.length} data pengeluaran yang dipilih? Tindakan ini tidak dapat dibatalkan.` : "Apakah Anda yakin ingin menghapus data pengeluaran ini?"}
        confirmLabel="Hapus Sekarang"
      />
    </div>
  );
}
