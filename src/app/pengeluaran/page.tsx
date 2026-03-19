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

      {/* Header aligned to Budggt Transaksi style */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pengeluaran</h1>
          <p className="text-slate-500 font-medium text-[15px] mt-1">Uangmu lari ke mana aja?</p>
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

          <button onClick={triggerUpload} className="bg-white border border-slate-200 shadow-sm text-slate-700 px-4 py-2.5 rounded-2xl text-[13px] font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Upload size={16} /> Upload Nota
          </button>
          
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

      {/* Categories Summary row, slightly lighter */}
      {!viewAll && Object.keys(byCategory).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
            const budget = budgets.find(b => b.category.name === cat);
            const isOver = budget ? amt > budget.monthlyAmount : false;
            const pct = budget ? Math.min((amt / budget.monthlyAmount) * 100, 100) : null;
            return (
              <div
                key={cat}
                className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between"
              >
                <div className="mb-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    {cat}
                  </p>
                  <p className={`text-lg font-black tracking-tight ${isOver ? "text-rose-500" : "text-slate-800"}`}>
                    {formatRupiah(amt)}
                  </p>
                </div>
                {budget && (
                  <div className="mt-auto">
                    <div className="h-[6px] rounded-full bg-slate-100 w-full mb-1.5">
                      <div
                        className={`h-[6px] rounded-full transition-all ${isOver ? "bg-rose-400" : "bg-indigo-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className={`text-[10px] font-bold ${isOver ? "text-rose-500" : "text-slate-400"}`}>
                      {isOver
                        ? `Melebihi ${formatRupiah(amt - budget.monthlyAmount)}`
                        : `Sisa ${formatRupiah(budget.monthlyAmount - amt)}`}
                    </p>
                  </div>
                )}
                {!budget && <p className="text-[10px] text-slate-400 font-bold mt-auto">Tanpa budget</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Main List */}
      <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100/50 overflow-hidden p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-[17px] font-bold text-slate-800">Semua Pengeluaran</h2>
            <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-1 rounded-md">{expenses.length} trans</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] font-bold text-slate-500 cursor-pointer flex items-center gap-2 select-none hover:text-slate-800 transition">
              <input type="checkbox" checked={expenses.length > 0 && selectedIds.length === expenses.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-200 text-rose-500 focus:ring-rose-500" />
              Pilih Semua
            </label>
          </div>
        </div>

        <div className="space-y-0">
          {expenses.map(e => (
            <div key={e.id} className={`group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-all rounded-2xl ${selectedIds.includes(e.id) ? "bg-rose-50/30" : ""}`}>
              {editId === e.id ? (
                <div className="w-full flex flex-col md:flex-row gap-4 items-start md:items-center">
                   <input type="date" value={editForm.date} onChange={ev => setEditForm(f => ({ ...f, date: ev.target.value }))} className="w-full md:w-32 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-rose-300 focus:ring focus:ring-rose-100" />
                   <select value={editForm.categoryId} onChange={ev => setEditForm(f => ({ ...f, categoryId: ev.target.value }))} className="w-full md:w-40 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-rose-300 focus:ring focus:ring-rose-100">
                     {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                   <div className="w-full flex-1">
                     <input type="text" value={editForm.description} onChange={ev => setEditForm(f => ({ ...f, description: ev.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white mb-1.5 focus:border-rose-300 focus:ring focus:ring-rose-100" placeholder="Deskripsi" />
                      {(() => {
                        const cat = categories.find(c => c.id === +editForm.categoryId);
                        if (cat?.name.toLowerCase().includes("utang") || cat?.name.toLowerCase().includes("hutang")) {
                          return (
                            <select value={editForm.debtSourceId} onChange={ev => setEditForm(f => ({ ...f, debtSourceId: ev.target.value }))} className="w-full border border-orange-200 rounded-lg px-2 py-1.5 text-xs bg-orange-50 appearance-none text-orange-900 font-medium">
                              <option value="">Pilih Utang...</option>
                              {debtSources.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                          );
                        }
                        return null;
                      })()}
                   </div>
                   <CurrencyInput min={0} value={editForm.amount} onChangeValue={(val: string) => setEditForm(f => ({ ...f, amount: val }))} className="w-full md:w-36 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-rose-300 focus:ring focus:ring-rose-100" />
                   <div className="flex items-center gap-2 w-full md:w-auto mt-3 md:mt-0 justify-end">
                      <button onClick={saveEdit} className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 transition shadow-sm" title="Simpan"><Check size={16} /></button>
                      <button onClick={() => setEditId(null)} className="bg-white border border-slate-200 text-slate-500 p-2 rounded-xl hover:bg-slate-50 transition shadow-sm" title="Batal"><X size={16} /></button>
                   </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 flex-1">
                    <input type="checkbox" checked={selectedIds.includes(e.id)} onChange={() => toggleSelect(e.id)} className="w-4 h-4 rounded border-slate-200 text-rose-500 focus:ring-rose-500 shrink-0" />
                    <div className="w-12 h-12 shrink-0 rounded-[14px] bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-sm">
                      💸
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-slate-800 tracking-tight leading-tight">{e.description}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                         <p className="text-[11px] font-bold text-slate-400">{formatDate(e.date)}</p>
                         <span className="w-1 h-1 rounded-full bg-slate-200" />
                         <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-[6px] text-[10px] font-bold tracking-wide uppercase">{e.category.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end mt-4 md:mt-0 pl-16 md:pl-0">
                    <p className="text-[15px] font-black text-slate-800 tracking-tight mb-2 md:mb-1">
                      - {formatRupiah(e.amount)}
                    </p>
                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(e)} className="bg-white border border-slate-200 text-slate-500 p-1.5 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition" title="Edit"><Edit2 size={14} strokeWidth={2.5}/></button>
                      <button onClick={() => remove(e.id)} className="bg-white border border-rose-200 text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition" title="Hapus"><Trash2 size={14} strokeWidth={2.5}/></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {expenses.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-2xl">
                 📭
               </div>
               <p className="text-[15px] font-bold text-slate-600 mb-1">Belum Ada Transaksi</p>
               <p className="text-[13px] font-medium">Pengeluaran kamu masih kosong {viewAll ? "sama sekali" : "bulan ini"}.</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Tambah Pengeluaran">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="bg-[#FAFAFA] border border-dashed border-slate-200 rounded-2xl p-6 text-center">
            <div className="flex justify-center mb-3 text-slate-300">
               <Upload size={32} />
            </div>
            <p className="text-[13px] font-bold text-slate-600 mb-4">Foto struk <span className="text-rose-400">untuk otomatis</span> buat transaksi.</p>
            <div className="flex flex-col md:flex-row justify-center gap-3">
              <button type="button" onClick={triggerUpload} disabled={ocrLoading} className="bg-rose-200 text-rose-900 font-bold px-6 py-2.5 rounded-xl text-[13px] flex items-center justify-center gap-2 hover:bg-rose-300 transition-all flex-1">
                {ocrLoading ? <Loader2 size={16} className="animate-spin" /> : "Ambil Foto"}
              </button>
              <button type="button" onClick={triggerUpload} disabled={ocrLoading} className="bg-white border border-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl text-[13px] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all flex-1">
                {ocrLoading ? <Loader2 size={16} className="animate-spin" /> : "Unggah Gambar"}
              </button>
            </div>
            {receiptName && <p className="text-[11px] font-bold text-emerald-600 mt-3 flex justify-center items-center gap-1"><Check size={12}/> {receiptName}</p>}
            {ocrError && <p className="text-[11px] font-bold text-rose-600 mt-3">{ocrError}</p>}
            {ocrPreview && (
              <div className="mt-4 bg-white border border-slate-100 rounded-xl p-3 text-left">
                <p className="text-[10px] font-bold tracking-widest text-[#A19FA6] mb-1.5 uppercase">Preview Teks:</p>
                <p className="text-[11px] font-medium text-slate-600 whitespace-pre-wrap">{ocrPreview}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-extrabold tracking-wide text-slate-400 mb-1.5 uppercase">Kategori</label>
            <select required value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value, debtSourceId: ""})} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[13px] font-semibold bg-white focus:border-rose-300 focus:ring focus:ring-rose-100 transition-all">
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
              <div className="bg-orange-50 border border-orange-100 rounded-[20px] p-5 space-y-3 animate-in fade-in zoom-in-95">
                <div>
                  <label className="block text-[11px] font-extrabold tracking-wide text-orange-600 mb-1.5 uppercase">Pilih Utang</label>
                  <select required value={form.debtSourceId} onChange={e => setForm({...form, debtSourceId: e.target.value})} className="w-full border-orange-200 rounded-xl px-4 py-3 text-[13px] font-bold bg-white focus:border-orange-300 focus:ring focus:ring-orange-100 transition-all text-orange-900">
                    <option value="">Sumber Utang...</option>
                    {debtSources.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                {selectedDebt && (
                  <div className="flex items-center gap-2 bg-orange-100/50 rounded-xl p-3 border border-orange-200/50">
                    <AlertTriangle size={16} className="text-orange-600" />
                    <p className="text-[13px] font-medium text-orange-800">Sisa Hutang: <span className="font-extrabold">{formatRupiah(balance)}</span></p>
                  </div>
                )}
              </div>
            );
          })()}

          <div>
            <label className="block text-[11px] font-extrabold tracking-wide text-slate-400 mb-1.5 uppercase">Rincian Transaksi</label>
            <input type="text" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[13px] font-semibold bg-white focus:border-rose-300 focus:ring focus:ring-rose-100 transition-all" placeholder="Contoh: Beli makan siang, Ongkos grab..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-[11px] font-extrabold tracking-wide text-slate-400 mb-1.5 uppercase">Tanggal</label>
               <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[13px] font-semibold bg-white focus:border-rose-300 focus:ring focus:ring-rose-100 transition-all" />
             </div>
             <div>
               <label className="block text-[11px] font-extrabold tracking-wide text-slate-400 mb-1.5 uppercase">Nominal</label>
               <CurrencyInput required min={0} value={form.amount} onChangeValue={(val: string) => setForm({...form, amount: val})} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[13px] font-extrabold bg-white focus:border-rose-300 focus:ring focus:ring-rose-100 transition-all text-slate-800" placeholder="0" />
             </div>
          </div>

          {submitError && <div className="bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100 text-[13px] font-bold flex items-center gap-2"><AlertTriangle size={16}/> {submitError}</div>}
          <div className="pt-2">
            <button type="submit" className="bg-rose-500 text-white px-6 py-3.5 rounded-xl text-[14px] font-black w-full hover:bg-rose-600 transition-all shadow-md shadow-rose-200">
              Simpan Pengeluaran
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus"
        message={confirmDelete.bulk ? `Yakin mau menghapus ${selectedIds.length} pengeluaran sekaligus? Aksi ini permanen.` : "Yakin mau menghapus riwayat pengeluaran ini?"}
        confirmLabel="Hapus Permanen"
      />
    </div>
  );
}
