"use client";
import { useEffect, useState, useCallback } from "react";
import { formatRupiah } from "@/lib/utils";
import { Plus, Trash2, Edit2, X, Check, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { CurrencyInput } from "@/components/CurrencyInput";
import ConfirmModal from "@/components/ConfirmModal";
import Link from "next/link";

interface ExpenseCategory { id: number; name: string; }
interface Budget { id: number; categoryId: number; monthlyAmount: number; category: ExpenseCategory; }

export default function BudgetPage() {
  const [expenseCats, setExpenseCats] = useState<ExpenseCategory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [newBudgetCatId, setNewBudgetCatId] = useState("");
  const [newBudgetAmt, setNewBudgetAmt] = useState("");
  const [editBudgetId, setEditBudgetId] = useState<number | null>(null);
  const [editBudgetAmt, setEditBudgetAmt] = useState("");
  
  const [aiBudgetLoading, setAiBudgetLoading] = useState(false);
  const [aiBudgetResult, setAiBudgetResult] = useState<{ theory: string; reason: string; savedCount: number } | null>(null);
  const [aiBudgetError, setAiBudgetError] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: number | null }>({ open: false, id: null });

  const load = useCallback(() => {
    fetch("/api/expense-categories").then(r => r.json()).then(setExpenseCats);
    fetch("/api/budgets").then(r => r.json()).then(setBudgets);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addBudget = async () => {
    if (!newBudgetCatId || !newBudgetAmt) return;
    await fetch("/api/budgets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId: parseInt(newBudgetCatId), monthlyAmount: parseFloat(newBudgetAmt) }) });
    setNewBudgetCatId(""); setNewBudgetAmt(""); load();
  };

  const updateBudget = async (b: Budget) => {
    await fetch("/api/budgets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId: b.categoryId, monthlyAmount: parseFloat(editBudgetAmt) }) });
    setEditBudgetId(null); load();
  };

  const deleteBudget = async (id: number) => {
    setConfirmDelete({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.id) return;
    const res = await fetch("/api/budgets/" + confirmDelete.id, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Gagal menghapus budget.");
    }
    setConfirmDelete({ open: false, id: null });
    load();
  };

  const generateAIBudget = async () => {
    setAiBudgetLoading(true);
    setAiBudgetError("");
    setAiBudgetResult(null);
    try {
      const res = await fetch("/api/ai/budget", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setAiBudgetError(data.error || "Gagal membuat budget dengan AI.");
        return;
      }
      setAiBudgetResult(data);
      load();
    } catch {
      setAiBudgetError("Gagal terhubung ke layanan AI.");
    } finally {
      setAiBudgetLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-12 md:pt-0">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Atur Budget</h1>
          <p className="text-slate-500 text-[15px] font-medium mt-0.5">Budget yang bikin disiplin pakai Percentage Budgeting.</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Alokasi Bulanan</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Total: <span className="text-rose-600 font-extrabold">{formatRupiah(budgets.reduce((s, b) => s + b.monthlyAmount, 0))}</span></p>
          </div>
          <button
            onClick={generateAIBudget}
            disabled={aiBudgetLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-60 text-white px-5 py-3 rounded-xl text-[14px] font-bold transition shadow-lg shadow-indigo-200"
          >
            {aiBudgetLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {aiBudgetLoading ? "Menganalisis Pola..." : "Auto-Budget via AI"}
          </button>
        </div>

        {aiBudgetResult && (
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 px-5 py-4 rounded-2xl text-[14px]">
            <p className="font-bold flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-indigo-600" /> AI Berhasil Setting {aiBudgetResult.savedCount} Kategori
            </p>
            <p className="font-medium text-indigo-700"><strong>Teori:</strong> {aiBudgetResult.theory}</p>
            <p className="font-medium text-indigo-600 mt-1">{aiBudgetResult.reason}</p>
          </div>
        )}
        
        {aiBudgetError && (
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-4 font-bold">{aiBudgetError}</div>
        )}

        {/* Add Budget Form */}
        <div className="flex flex-col md:flex-row gap-3">
          <select value={newBudgetCatId} onChange={e => setNewBudgetCatId(e.target.value)} className="flex-1 border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-rose-200 rounded-xl px-4 py-3.5 text-[15px] font-semibold text-slate-700 outline-none transition-all appearance-none">
            <option value="">Pilih Kategori...</option>
            {expenseCats.filter(c => !budgets.some(b => b.categoryId === c.id)).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <CurrencyInput value={newBudgetAmt} onChangeValue={(val: string) => setNewBudgetAmt(val)} placeholder="Jumlah Budget" className="flex-1 border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-rose-200 rounded-xl px-4 py-3.5 text-[15px] font-semibold text-slate-700 outline-none transition-all" />
          <button onClick={addBudget} className="bg-slate-900 text-white px-6 py-3.5 rounded-xl text-[15px] font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
            <Plus size={18} /> Tambah
          </button>
        </div>

        {/* List Budget */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          {budgets.map(b => (
            <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-100 hover:border-rose-100 rounded-2xl p-4 transition-all shadow-sm hover:shadow-md group">
              <div className="flex items-center gap-3 mb-3 sm:mb-0">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center font-bold text-lg">
                  {b.category.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800">{b.category.name}</h3>
                  <p className="text-[13px] font-semibold text-slate-400">Target Bulanan</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                {editBudgetId === b.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <CurrencyInput value={editBudgetAmt} onChangeValue={(val: string) => setEditBudgetAmt(val)} className="flex-1 w-32 border-2 border-rose-200 rounded-xl px-3 py-2 text-[15px] font-bold text-rose-600 outline-none" />
                    <button onClick={() => updateBudget(b)} className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100"><Check size={18} /></button>
                    <button onClick={() => setEditBudgetId(null)} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"><X size={18} /></button>
                  </div>
                ) : (
                  <>
                    <span className="text-[16px] font-extrabold text-slate-700">{formatRupiah(b.monthlyAmount)}</span>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditBudgetId(b.id); setEditBudgetAmt(String(b.monthlyAmount)); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => deleteBudget(b.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          {budgets.length === 0 && (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-3xl">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="text-slate-300" size={24} />
              </div>
              <h3 className="text-slate-500 font-bold text-[15px]">Belum Ada Budget</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">Tambahkan budget bulananmu di atas atau gunakan AI Advisor untuk mengatur otomatis.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={handleConfirmDelete}
        title="Hapus Budget?"
        message="Apakah kamu yakin ingin menghapus alokasi budget ini?"
        confirmLabel="Ya, Hapus"
      />
    </div>
  );
}
