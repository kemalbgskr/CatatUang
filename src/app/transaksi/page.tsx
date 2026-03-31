"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { formatRupiah, formatDate, getCurrentMonth } from "@/lib/utils";
import { Plus, Trash2, Upload, Edit2, Check, X, AlertTriangle, ArrowUpRight, ArrowDownRight, UploadCloud } from "lucide-react";
import MonthYearPicker from "@/components/MonthYearPicker";
import { CurrencyInput } from "@/components/CurrencyInput";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";

interface Category { id: number; name: string }
interface Transaction {
  id: number;
  type: "income" | "expense";
  date: string;
  description: string;
  amount: number;
  category: Category;
  debtPayment?: any;
}
interface Budget { id: number; categoryId: number; monthlyAmount: number; category: Category }
interface DebtSource { id: number; name: string; initialAmount: number; loans: { amount: number }[]; payments: { amount: number }[] }

export default function TransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debtSources, setDebtSources] = useState<DebtSource[]>([]);
  
  const [month, setMonth] = useState(getCurrentMonth());
  const [viewAll, setViewAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<{id: number, type: "income" | "expense"}[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"Pengeluaran" | "Pemasukan">("Pengeluaran");
  
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], categoryId: "", description: "", amount: "", debtSourceId: "" });
  
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [ocrPreview, setOcrPreview] = useState("");
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [editTx, setEditTx] = useState<{id: number, type: "income" | "expense"} | null>(null);
  const [editForm, setEditForm] = useState({ date: "", categoryId: "", description: "", amount: "", debtSourceId: "" });

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number; type?: "income" | "expense"; bulk?: boolean }>({ open: false });

  const load = useCallback(async () => {
    const queryMonth = viewAll ? "all" : month;
    const [incRes, expRes] = await Promise.all([
      fetch("/api/incomes?month=" + queryMonth),
      fetch("/api/expenses?month=" + queryMonth)
    ]);
    
    const incs = await incRes.json().catch(() => []);
    const exps = await expRes.json().catch(() => []);
    
    const combined: Transaction[] = [
      ...incs.map((i: any) => ({ ...i, type: "income" })),
      ...exps.map((e: any) => ({ ...e, type: "expense" }))
    ];
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(combined);
  }, [month, viewAll]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/income-categories").then(r => r.json()).then(setIncomeCategories);
    fetch("/api/expense-categories").then(r => r.json()).then(setExpenseCategories);
    fetch("/api/budgets").then(r => r.json()).then(setBudgets);
    fetch("/api/debts").then(r => r.json()).then(setDebtSources);
  }, []);

  const resetForm = () => {
     setForm({ date: new Date().toISOString().split("T")[0], categoryId: "", description: "", amount: "", debtSourceId: "" });
     setSubmitError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const endpoint = activeTab === "Pengeluaran" ? "/api/expenses" : "/api/incomes";
    const body = activeTab === "Pengeluaran" 
        ? { ...form, categoryId: +form.categoryId, amount: +form.amount, debtSourceId: form.debtSourceId ? +form.debtSourceId : undefined }
        : { ...form, categoryId: +form.categoryId, amount: +form.amount };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSubmitError(data.error || `Gagal menyimpan ${activeTab.toLowerCase()}.`);
      return;
    }
    resetForm();
    setShowForm(false);
    load();
    if (activeTab === "Pengeluaran") fetch("/api/debts").then(r => r.json()).then(setDebtSources);
  };

  const triggerUpload = () => {
    setActiveTab("Pengeluaran");
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
        body: JSON.stringify({ ocrText: text, categories: expenseCategories.map(c => ({ id: c.id, name: c.name })) }),
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

  const startEdit = (e: Transaction) => {
    setEditTx({ id: e.id, type: e.type });
    setEditForm({
      date: e.date.split("T")[0],
      categoryId: e.category.id.toString(),
      description: e.description,
      amount: e.amount.toString(),
      debtSourceId: e.debtPayment?.debtSourceId?.toString() || ""
    });
  };

  const saveEdit = async () => {
    if (!editTx) return;
    const endpoint = editTx.type === "expense" ? "/api/expenses/" + editTx.id : "/api/incomes/" + editTx.id;
    const body = editTx.type === "expense" 
        ? { ...editForm, categoryId: +editForm.categoryId, amount: +editForm.amount, debtSourceId: editForm.debtSourceId ? +editForm.debtSourceId : undefined }
        : { ...editForm, categoryId: +editForm.categoryId, amount: +editForm.amount };

    const res = await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      alert("Gagal menyimpan perubahan.");
      return;
    }
    setEditTx(null);
    load();
    if (editTx.type === "expense") fetch("/api/debts").then(r => r.json()).then(setDebtSources);
  };

  const remove = async (id: number, type: "income" | "expense") => {
    setConfirmDelete({ open: true, id, type });
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete.bulk) {
      if (selectedIds.length === 0) return;
      for (const item of selectedIds) {
        const url = item.type === "expense" ? "/api/expenses/" : "/api/incomes/";
        await fetch(url + item.id, { method: "DELETE" });
      }
      setSelectedIds([]);
    } else if (confirmDelete.id && confirmDelete.type) {
      const url = confirmDelete.type === "expense" ? "/api/expenses/" : "/api/incomes/";
      await fetch(url + confirmDelete.id, { method: "DELETE" });
    }
    setConfirmDelete({ open: false });
    load();
  };

  const bulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmDelete({ open: true, bulk: true });
  };

  const toggleSelect = (id: number, type: "income" | "expense") => {
    setSelectedIds(prev => prev.some(x => x.id === id && x.type === type) 
       ? prev.filter(x => !(x.id === id && x.type === type)) 
       : [...prev, {id, type}]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map(t => ({ id: t.id, type: t.type })));
    }
  };

  const totalExpenseAmount = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalIncomeAmount = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);

  const categoriesToUse = activeTab === "Pengeluaran" ? expenseCategories : incomeCategories;

  return (
    <div className="space-y-6 pt-12 md:pt-0 max-w-6xl mx-auto pb-20 fade-in duration-300">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} disabled={ocrLoading} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2C2C2C] tracking-tight">Semua Transaksi</h1>
          <p className="text-[#848484] font-medium text-[15px] mt-1">Rekap seluruh pemasukan dan pengeluaran bulan ini.</p>
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
          
          <button onClick={() => { setActiveTab("Pemasukan"); setShowForm(true); }} className="bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-[14px] text-[13px] font-extrabold flex items-center gap-2 hover:bg-emerald-100 transition-all border border-emerald-100">
            <Plus size={16} /> Pemasukan
          </button>

          <button onClick={() => { setActiveTab("Pengeluaran"); setShowForm(true); }} className="bg-rose-50 text-rose-600 px-5 py-2.5 rounded-[14px] text-[13px] font-extrabold flex items-center gap-2 hover:bg-rose-100 transition-all border border-rose-100">
            <Plus size={16} /> Pengeluaran
          </button>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="px-4 md:px-0 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50/50 rounded-[24px] p-6 border border-emerald-100 flex justify-between items-center shadow-sm">
             <div>
                <p className="text-[11px] font-black text-emerald-800 uppercase tracking-widest mb-1 flex items-center gap-2"><ArrowUpRight size={14}/> Pemasukan</p>
                <h2 className="text-3xl font-black text-emerald-600 tracking-tight">{formatRupiah(totalIncomeAmount)}</h2>
             </div>
             <div className="w-12 h-12 bg-emerald-100 rounded-full flex justify-center items-center text-emerald-600"><ArrowUpRight size={24}/></div>
          </div>
          <div className="bg-rose-50/50 rounded-[24px] p-6 border border-rose-100 flex justify-between items-center shadow-sm">
             <div>
                <p className="text-[11px] font-black text-rose-800 uppercase tracking-widest mb-1 flex items-center gap-2"><ArrowDownRight size={14}/> Pengeluaran</p>
                <h2 className="text-3xl font-black text-rose-600 tracking-tight">{formatRupiah(totalExpenseAmount)}</h2>
             </div>
             <div className="w-12 h-12 bg-rose-100 rounded-full flex justify-center items-center text-rose-600"><ArrowDownRight size={24}/></div>
          </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-slate-900 mx-4 md:mx-0 rounded-[20px] p-4 px-6 flex items-center justify-between text-white shadow-xl">
          <p className="text-[13px] font-bold">{selectedIds.length} data dipilih</p>
          <div className="flex gap-2">
            <button onClick={bulkDelete} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
              <Trash2 size={14} /> Hapus Terpilih
            </button>
            <button onClick={() => setSelectedIds([])} className="bg-slate-800 text-slate-300 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition">
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Main List */}
      <div className="bg-white rounded-[32px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden p-6 md:p-8 mx-4 md:mx-0">
        <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[17px] font-bold text-slate-800">Riwayat Transaksi</h2>
            <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-1 rounded-md">{transactions.length} item</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[13px] font-bold text-slate-500 cursor-pointer flex items-center gap-2 select-none hover:text-slate-800 transition">
              <input type="checkbox" checked={transactions.length > 0 && selectedIds.length === transactions.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-200 text-rose-500 focus:ring-rose-500" />
              Pilih Semua
            </label>
          </div>
        </div>

        <div className="space-y-0 relative min-h-[200px]">
          {transactions.map(t => {
            const isEditing = editTx?.id === t.id && editTx?.type === t.type;
            const isSelected = selectedIds.some(x => x.id === t.id && x.type === t.type);
            const isInc = t.type === "income";

            return (
            <div key={`${t.type}-${t.id}`} className={`group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-all rounded-2xl ${isSelected ? "bg-slate-50" : ""}`}>
              {isEditing ? (
                <div className="w-full flex flex-col md:flex-row gap-4 items-start md:items-center">
                   <input type="date" value={editForm.date} onChange={ev => setEditForm(f => ({ ...f, date: ev.target.value }))} className="w-full md:w-32 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-rose-300" />
                   <select value={editForm.categoryId} onChange={ev => setEditForm(f => ({ ...f, categoryId: ev.target.value }))} className="w-full md:w-40 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-rose-300">
                     {(isInc ? incomeCategories : expenseCategories).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                   <div className="w-full flex-1">
                     <input type="text" value={editForm.description} onChange={ev => setEditForm(f => ({ ...f, description: ev.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white mb-1.5 focus:border-rose-300" placeholder="Deskripsi" />
                      {!isInc && (() => {
                        const cat = expenseCategories.find(c => c.id === +editForm.categoryId);
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
                   <CurrencyInput min={0} value={editForm.amount} onChangeValue={(val: string) => setEditForm(f => ({ ...f, amount: val }))} className="w-full md:w-36 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-rose-300" />
                   <div className="flex items-center gap-2 w-full md:w-auto mt-3 md:mt-0 justify-end">
                      <button onClick={saveEdit} className="bg-slate-900 text-white p-2 rounded-xl hover:bg-slate-800 transition shadow-sm border border-slate-900" title="Simpan"><Check size={16} /></button>
                      <button onClick={() => setEditTx(null)} className="bg-white border border-slate-200 text-slate-500 p-2 rounded-xl hover:bg-slate-50 transition shadow-sm" title="Batal"><X size={16} /></button>
                   </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 flex-1">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(t.id, t.type)} className={`w-4 h-4 rounded border-slate-200 ${isInc ? "text-emerald-500 focus:ring-emerald-500" : "text-rose-500 focus:ring-rose-500"} shrink-0`} />
                    <div className={`w-12 h-12 shrink-0 rounded-[14px] flex items-center justify-center text-xl shadow-sm border ${isInc ? "bg-emerald-50 border-emerald-100 text-emerald-500" : "bg-rose-50 border-rose-100 text-rose-500"}`}>
                      {isInc ? <ArrowUpRight size={20} className="text-emerald-500" strokeWidth={3}/> : <ArrowDownRight size={20} className="text-rose-500" strokeWidth={3}/>}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-slate-800 tracking-tight leading-tight">{t.description}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                         <p className="text-[11px] font-bold text-slate-400">{formatDate(t.date)}</p>
                         <span className="w-1 h-1 rounded-full bg-slate-200" />
                         <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold tracking-wide uppercase ${isInc ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{t.category.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end mt-4 md:mt-0 pl-16 md:pl-0">
                    <p className={`text-[15px] font-black tracking-tight mb-2 md:mb-1 ${isInc ? "text-emerald-600" : "text-slate-800"}`}>
                      {isInc ? "+" : "-"} {formatRupiah(t.amount)}
                    </p>
                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(t)} className="bg-white border border-slate-200 text-slate-500 p-1.5 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition shadow-sm" title="Edit"><Edit2 size={14} strokeWidth={2.5}/></button>
                      <button onClick={() => remove(t.id, t.type)} className="bg-white border border-slate-200 text-slate-500 p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition hover:border-rose-200 shadow-sm" title="Hapus"><Trash2 size={14} strokeWidth={2.5}/></button>
                    </div>
                  </div>
                </>
              )}
            </div>
            );
          })}

          {transactions.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 absolute inset-0">
               <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4 text-2xl">⚡</div>
               <p className="text-[15px] font-bold text-slate-600 mb-1">Daftar Transaksi Kosong</p>
               <p className="text-[13px] font-medium text-center max-w-xs">{viewAll ? "Belum ada satupun transaksi. Mulai catat dari sekarang!" : "Bulan ini kamu belum mencatat pengeluaran maupun pemasukan."}</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); resetForm(); }} title="Transaksi Baru">
        <div className="flex flex-col gap-6">
          {/* Enhanced Tabs for Form */}
          <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full">
            {(["Pemasukan", "Pengeluaran"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); resetForm(); }}
                className={`flex-1 py-3 text-[12px] font-black uppercase tracking-tight rounded-xl transition-all
                  ${activeTab === tab && tab === 'Pengeluaran' ? 'bg-white shadow-md text-rose-600 ring-1 ring-black/5' : 
                    activeTab === tab && tab === 'Pemasukan' ? 'bg-white shadow-md text-emerald-600 ring-1 ring-black/5' : 
                    'text-slate-400 hover:text-slate-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-5">
            {activeTab === "Pengeluaran" && (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex justify-center items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 py-3 rounded-2xl text-[12px] font-bold transition-all w-full">
                {ocrLoading ? <span className="animate-spin">⏳</span> : <UploadCloud size={16}/>}
                {ocrLoading ? "Memproses AI OCR..." : "Scan Nota (Otomatis)"}
              </button>
            )}
            
            {(ocrPreview || ocrError) && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] font-medium text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
                {ocrError ? <span className="text-rose-500 font-bold">{ocrError}</span> : `Nota: ${receiptName}`}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black tracking-widest text-[#A19FA6] mb-2 uppercase">KATEGORI</label>
              <select required value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value, debtSourceId: ""})} className="w-full border-slate-100 bg-slate-50 rounded-2xl px-4 py-4 text-[14px] font-bold text-slate-900 focus:bg-white focus:border-rose-200 focus:ring-4 focus:ring-rose-50 transition-all outline-none appearance-none">
                <option value="">Pilih...</option>
                {categoriesToUse.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black tracking-widest text-[#A19FA6] mb-2 uppercase">RINCIAN {activeTab.toUpperCase()}</label>
              <input type="text" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border-slate-100 bg-slate-50 rounded-2xl px-4 py-4 text-[14px] font-bold text-slate-900 focus:bg-white focus:border-rose-200 focus:ring-4 focus:ring-rose-50 transition-all outline-none placeholder:text-slate-400" placeholder={`Contoh: ${activeTab === "Pemasukan" ? "Gaji/Bonus" : "Kopi Kenangan"}`} />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-[10px] font-black tracking-widest text-[#A19FA6] mb-2 uppercase">TANGGAL</label>
                 <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border-slate-100 bg-slate-50 rounded-2xl px-4 py-4 text-[13px] font-bold text-slate-900 focus:bg-white focus:border-rose-200 focus:ring-4 focus:ring-rose-50 transition-all outline-none" />
               </div>
               <div className="relative">
                 <label className="block text-[10px] font-black tracking-widest text-[#A19FA6] mb-2 uppercase">NOMINAL</label>
                 <CurrencyInput required min={0} value={form.amount} onChangeValue={(val: string) => setForm({...form, amount: val})} className="w-full border-slate-100 bg-slate-50 rounded-2xl px-4 py-4 text-[14px] font-extrabold text-[#2C2C2C] focus:bg-white focus:border-rose-200 focus:ring-4 focus:ring-rose-50 transition-all outline-none placeholder:text-slate-400" placeholder="Rp 0" />
               </div>
            </div>

            {submitError && <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-[13px] font-bold flex items-center gap-2"><AlertTriangle size={16}/> {submitError}</div>}
            
            <button type="submit" className={`${activeTab === "Pemasukan" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30" : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/30"} text-white px-6 py-4 rounded-[20px] text-[15px] shadow-lg font-black w-full transition-all mt-2`}>
              Simpan Transaksi
            </button>
          </form>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus"
        message={confirmDelete.bulk ? `Yakin mau menghapus ${selectedIds.length} transaksi sekaligus? Aksi ini permanen.` : "Yakin mau menghapus riwayat transaksi ini?"}
        confirmLabel="Hapus Permanen"
      />
    </div>
  );
}
