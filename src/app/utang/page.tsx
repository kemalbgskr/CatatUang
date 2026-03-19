"use client";
import { useEffect, useState } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { CurrencyInput } from "@/components/CurrencyInput";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";

interface DebtSource { id: number; name: string; initialAmount: number; loans: { id: number; date: string; amount: number; description: string }[]; payments: { id: number; date: string; amount: number; description: string }[] }

export default function UtangPage() {
  const [debts, setDebts] = useState<DebtSource[]>([]);
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");
  const [selectedIds, setSelectedIds] = useState<{ id: number, type: "Pinjaman" | "Bayar" }[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [showPayForm, setShowPayForm] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showNewDebt, setShowNewDebt] = useState(false);
  const [payForm, setPayForm] = useState({ date: new Date().toISOString().split("T")[0], debtSourceId: "", amount: "", description: "" });
  const [loanForm, setLoanForm] = useState({ date: new Date().toISOString().split("T")[0], debtSourceId: "", amount: "", description: "" });
  const [newDebt, setNewDebt] = useState({ name: "", initialAmount: "0" });
  const [editTx, setEditTx] = useState<{id: number, type: "Pinjaman" | "Bayar"} | null>(null);
  const [editForm, setEditForm] = useState({ date: "", amount: "", description: "" });

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number; type?: "Pinjaman" | "Bayar" | "source"; bulk?: boolean; name?: string }>({ open: false });

  const load = () => { fetch("/api/debts").then(r => r.json()).then(setDebts); };
  useEffect(() => { load(); }, []);

  const submitPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const res = await fetch("/api/debts/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payForm, debtSourceId: +payForm.debtSourceId, amount: +payForm.amount }) });
    if (!res.ok) { const payload = await res.json().catch(() => ({})); setSubmitError(payload.error || "Gagal menambah pembayaran utang."); return; }
    setPayForm({ date: new Date().toISOString().split("T")[0], debtSourceId: "", amount: "", description: "" });
    setShowPayForm(false);
    load();
  };

  const submitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const res = await fetch("/api/debts/loans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...loanForm, debtSourceId: +loanForm.debtSourceId, amount: +loanForm.amount }) });
    if (!res.ok) { const payload = await res.json().catch(() => ({})); setSubmitError(payload.error || "Gagal menambah pinjaman."); return; }
    setLoanForm({ date: new Date().toISOString().split("T")[0], debtSourceId: "", amount: "", description: "" });
    setShowLoanForm(false);
    load();
  };

  const addDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const res = await fetch("/api/debts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newDebt.name, initialAmount: +newDebt.initialAmount }) });
    if (!res.ok) { const payload = await res.json().catch(() => ({})); setSubmitError(payload.error || "Gagal menambah pemberi utang."); return; }
    setNewDebt({ name: "", initialAmount: "0" });
    setShowNewDebt(false);
    load();
  };

  const deleteDebtSource = async (id: number, name: string) => {
    setConfirmDelete({ open: true, id, type: "source", name });
  };

  const deleteTransaction = async (type: "Pinjaman" | "Bayar", id: number) => {
    setConfirmDelete({ open: true, id, type });
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete.bulk) {
      if (selectedIds.length === 0) return;
      for (const item of selectedIds) {
        const endpoint = item.type === "Pinjaman" ? "/api/debts/loans/" : "/api/debts/payments/";
        await fetch(endpoint + item.id, { method: "DELETE" });
      }
      setSelectedIds([]);
    } else if (confirmDelete.type === "source" && confirmDelete.id) {
      await fetch("/api/debts/" + confirmDelete.id, { method: "DELETE" });
    } else if (confirmDelete.id && confirmDelete.type) {
      const endpoint = confirmDelete.type === "Pinjaman" ? "/api/debts/loans/" : "/api/debts/payments/";
      await fetch(endpoint + confirmDelete.id, { method: "DELETE" });
    }
    setConfirmDelete({ open: false });
    load();
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setConfirmDelete({ open: true, bulk: true });
  };

  const toggleSelect = (id: number, type: "Pinjaman" | "Bayar") => {
    setSelectedIds(prev => {
      const exists = prev.find(x => x.id === id && x.type === type);
      if (exists) return prev.filter(x => !(x.id === id && x.type === type));
      return [...prev, { id, type }];
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === allTransactions.length ? [] : allTransactions.map(t => ({ id: t.id, type: t.type })));
  };

  const startEdit = (t: { id: number; date: string; amount: number; description: string; type: "Pinjaman" | "Bayar" }) => {
    setEditTx({ id: t.id, type: t.type });
    setEditForm({
      date: t.date.split("T")[0],
      description: t.description,
      amount: t.amount.toString(),
    });
  };

  const saveEdit = async () => {
    if (!editTx) return;
    const endpoint = editTx.type === "Pinjaman" ? "/api/debts/loans/" : "/api/debts/payments/";
    const res = await fetch(endpoint + editTx.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, amount: +editForm.amount }),
    });
    if (!res.ok) {
      alert("Gagal menyimpan perubahan.");
      return;
    }
    setEditTx(null);
    load();
  };

  const totalUtang = debts.reduce((s, d) => {
    const loans = d.loans.reduce((s2, l) => s2 + l.amount, 0);
    const payments = d.payments.reduce((s2, p) => s2 + p.amount, 0);
    return s + d.initialAmount + loans - payments;
  }, 0);

  const activeDebts = debts.filter(d => {
    const loans = d.loans.reduce((s, l) => s + l.amount, 0);
    const payments = d.payments.reduce((s, p) => s + p.amount, 0);
    return (d.initialAmount + loans - payments) > 0;
  });

  const historyDebts = debts.filter(d => {
    const loans = d.loans.reduce((s, l) => s + l.amount, 0);
    const payments = d.payments.reduce((s, p) => s + p.amount, 0);
    return (d.initialAmount + loans - payments) <= 0;
  });

  const allTransactions = debts.flatMap(d => [
    ...d.loans.map(l => ({ ...l, type: "Pinjaman" as const, sourceName: d.name })),
    ...d.payments.map(p => ({ ...p, type: "Bayar" as const, sourceName: d.name }))
  ]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const renderDebtCard = (d: DebtSource) => {
    const loans = d.loans.reduce((s, l) => s + l.amount, 0);
    const payments = d.payments.reduce((s, p) => s + p.amount, 0);
    const remaining = d.initialAmount + loans - payments;
    const allTx = [...d.loans.map(l => ({...l, type: "Pinjaman" as const})), ...d.payments.map(p => ({...p, type: "Bayar" as const}))].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return (
      <div key={d.id} className="bg-white rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 p-6 flex flex-col justify-between group">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg tracking-tight mb-1">{d.name}</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Akun Utang</p>
            </div>
            <div className="flex items-center gap-2">
               <button type="button" onClick={() => deleteDebtSource(d.id, d.name)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100" title="Hapus Akun"><Trash2 size={16} /></button>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
             <p className="text-[11px] font-bold text-slate-500 mb-1">Total Sisa Tagihan</p>
             <p className={`text-xl font-black tracking-tight ${remaining > 0 ? "text-rose-600" : "text-emerald-600"}`}>
               {remaining <= 0 ? "LUNAS" : formatRupiah(remaining)}
             </p>
          </div>

          {allTx.length > 0 && (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {allTx.map((t) => (
                <div key={`${t.type}-${t.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  {editTx?.id === t.id && editTx?.type === t.type ? (
                    <div className="w-full flex gap-2 items-center">
                      <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="flex-1 border-slate-200 rounded-lg px-2 py-1 text-[11px] bg-white" />
                      <CurrencyInput min={0} value={editForm.amount} onChangeValue={(val: string) => setEditForm(f => ({ ...f, amount: val }))} className="w-20 border-slate-200 rounded-lg px-2 py-1 text-[11px] bg-white text-right font-bold" />
                      <button onClick={saveEdit} className="text-emerald-600 p-1"><Check size={14}/></button>
                      <button onClick={() => setEditTx(null)} className="text-slate-400 p-1"><X size={14}/></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${t.type === "Bayar" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                            {t.type === "Bayar" ? "BAYAR" : "PINJAM"}
                          </span>
                          <span className="text-[11px] font-bold text-slate-800">{formatRupiah(t.amount)}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold">{formatDate(t.date)} {t.description && `• ${t.description}`}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => startEdit(t)} className="p-1.5 text-slate-300 hover:text-indigo-400 transition-colors"><Edit2 size={13}/></button>
                        <button type="button" onClick={() => deleteTransaction(t.type, t.id)} className="p-1.5 text-slate-300 hover:text-rose-400 transition-colors"><Trash2 size={13}/></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          {allTx.length === 0 && d.initialAmount > 0 && (
            <div className="p-4 text-center text-slate-400 text-[11px] font-bold border-2 border-dashed border-slate-50 rounded-xl">
              Tarik transaksi dari bank atau tambah manual
            </div>
          )}
        </div>
      </div>
    );
  };

  const DebtFormFields = ({ form, setForm }: { form: typeof payForm, setForm: React.Dispatch<React.SetStateAction<typeof payForm>> }) => (
    <>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Tanggal</label>
        <input type="date" required value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Pemberi Utang</label>
        <select required value={form.debtSourceId} onChange={e => setForm(f => ({...f, debtSourceId: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm">
          <option value="">Pilih...</option>
          {debts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Rincian</label>
        <input type="text" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Nominal (Rp)</label>
        <CurrencyInput required min={0} value={form.amount} onChangeValue={(val: string) => setForm(f => ({...f, amount: val}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
    </>
  );

  return (
    <div className="space-y-8 pt-12 md:pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Catat Utang</h1>
          <p className="text-slate-500 font-medium text-[15px] mt-1">Atur pinjaman dan pembayaranmu secara teratur.</p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <button 
            onClick={() => setViewMode(viewMode === "grouped" ? "flat" : "grouped")} 
            className="bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-2xl text-[13px] font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
          >
            {viewMode === "grouped" ? "Lihat Semua Rincian" : "Lihat Grup Kartu"}
          </button>
          
          <button onClick={() => setShowNewDebt(true)} className="bg-slate-800 text-white px-4 py-2.5 rounded-2xl text-[13px] font-bold flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-slate-200">
            <Plus size={16} /> Pemberi Utang
          </button>
          
          <button onClick={() => setShowLoanForm(true)} className="bg-orange-100 text-orange-900 px-4 py-2.5 rounded-2xl text-[13px] font-bold flex items-center gap-2 hover:bg-orange-200 transition-all shadow-sm">
            <Plus size={16} /> Pinjaman
          </button>
          
          <button onClick={() => setShowPayForm(true)} className="bg-emerald-100 text-emerald-900 px-4 py-2.5 rounded-2xl text-[13px] font-bold flex items-center gap-2 hover:bg-emerald-200 transition-all shadow-sm">
            <Plus size={16} /> Bayar Utang
          </button>
        </div>
      </div>

      {/* Summary Hero Card */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[32px] p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <p className="text-slate-400 text-[13px] font-bold uppercase tracking-wider mb-2">Total Sisa Utang</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">{formatRupiah(totalUtang)}</h2>
          <div className="mt-6 flex items-center gap-4 text-sm font-medium">
             <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                {activeDebts.length} Akun Aktif
             </div>
             <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {historyDebts.length} Lunas
             </div>
          </div>
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

      {viewMode === "grouped" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeDebts.map(renderDebtCard)}
          {activeDebts.length === 0 && <div className="md:col-span-2 bg-white rounded-[24px] border-2 border-dashed border-slate-100 p-12 text-center text-slate-400 font-bold">Belum ada utang aktif</div>}
          
          {historyDebts.length > 0 && (
            <div className="md:col-span-2 mt-8">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-extrabold text-slate-800">Riwayat (Lunas)</h2>
                <span className="bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2 py-0.5 rounded-lg">{historyDebts.length} Akun</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80 filter grayscale-[0.3]">
                {historyDebts.map(renderDebtCard)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h2 className="text-[17px] font-bold text-slate-800">Semua Transaksi Utang</h2>
              <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-1 rounded-md">{allTransactions.length} data</span>
            </div>
            <label className="text-[13px] font-bold text-slate-500 cursor-pointer flex items-center gap-2 select-none hover:text-slate-800 transition">
              <input type="checkbox" checked={allTransactions.length > 0 && selectedIds.length === allTransactions.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-200 text-rose-500 focus:ring-rose-500" />
              Pilih Semua
            </label>
          </div>

          <div className="space-y-1">
            {allTransactions.map(t => {
              const isSelected = selectedIds.some(x => x.id === t.id && x.type === t.type);
              return (
                <div key={`${t.type}-${t.id}`} className={`group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-all rounded-2xl ${isSelected ? "bg-rose-50/30" : ""}`}>
                  <div className="flex items-center gap-4 flex-1">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(t.id, t.type)} className="w-4 h-4 rounded border-slate-200 text-rose-500 focus:ring-rose-500" />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[14px] font-bold text-slate-800">{t.sourceName}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${t.type === "Bayar" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                           {t.type}
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-500 font-semibold">{formatDate(t.date)} {t.description && " • " + t.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-3 md:mt-0 justify-between md:justify-end">
                    <p className={`text-16 font-black tracking-tight ${t.type === "Bayar" ? "text-emerald-500" : "text-rose-500"}`}>
                      {t.type === "Bayar" ? "+" : "-"}{formatRupiah(t.amount)}
                    </p>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => startEdit({...t, type: t.type})} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"><Edit2 size={16} /></button>
                      <button type="button" onClick={() => deleteTransaction(t.type, t.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
            {allTransactions.length === 0 && <div className="py-12 text-center text-slate-400 font-bold">Belum ada transaksi</div>}
          </div>
        </div>
      )}

      {/* Modals with Budggt-style enhancements */}
      <Modal open={showNewDebt} onClose={() => setShowNewDebt(false)} title="Pemberi Utang Baru">
        <form onSubmit={addDebt} className="space-y-5">
           <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Nama Instansi / Orang</label>
            <input type="text" required value={newDebt.name} onChange={e => setNewDebt({...newDebt, name: e.target.value})} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold bg-slate-50 focus:border-rose-300 focus:bg-white outline-none transition-all" placeholder="Contoh: BCA, Pinjol A, Teman B" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Saldo Utang Saat Ini (Jika ada)</label>
            <CurrencyInput min={0} value={newDebt.initialAmount} onChangeValue={(val: string) => setNewDebt({...newDebt, initialAmount: val})} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold bg-slate-50 focus:border-rose-300 focus:bg-white outline-none transition-all" />
          </div>
          {submitError && <p className="text-sm text-rose-500 font-bold bg-rose-50 p-3 rounded-lg">{submitError}</p>}
          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[14px] font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">SIMPAN PEMBERI UTANG</button>
        </form>
      </Modal>

      <Modal open={showLoanForm} onClose={() => setShowLoanForm(false)} title="Ambil Pinjaman Baru">
        <form onSubmit={submitLoan} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Tanggal</label>
              <input type="date" required value={loanForm.date} onChange={e => setLoanForm(f => ({...f, date: e.target.value}))} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold bg-slate-50 focus:border-rose-300 focus:bg-white outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Pilih Akun</label>
              <select required value={loanForm.debtSourceId} onChange={e => setLoanForm(f => ({...f, debtSourceId: e.target.value}))} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold bg-slate-50 focus:border-rose-300 focus:bg-white outline-none transition-all">
                <option value="">Pilih...</option>
                {debts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Jumlah Pinjaman</label>
            <CurrencyInput required min={0} value={loanForm.amount} onChangeValue={(val: string) => setLoanForm(f => ({...f, amount: val}))} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold bg-slate-50 focus:border-rose-300 focus:bg-white outline-none transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Keterangan</label>
            <input type="text" value={loanForm.description} onChange={e => setLoanForm(f => ({...f, description: e.target.value}))} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold bg-slate-50 focus:border-rose-300 focus:bg-white outline-none transition-all" placeholder="Contoh: Utang modal usaha" />
          </div>
          {submitError && <p className="text-sm text-rose-500 font-bold bg-rose-50 p-3 rounded-lg">{submitError}</p>}
          <button type="submit" className="w-full bg-orange-200 text-orange-900 py-4 rounded-2xl text-[14px] font-black hover:bg-orange-300 transition-all shadow-sm">TAMBAH PINJAMAN</button>
        </form>
      </Modal>

      <Modal open={showPayForm} onClose={() => setShowPayForm(false)} title="Bayar Ke Cicilan / Utang">
        <form onSubmit={submitPay} className="space-y-5">
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Tanggal</label>
              <input type="date" required value={payForm.date} onChange={e => setPayForm(f => ({...f, date: e.target.value}))} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold bg-slate-50 focus:border-rose-300 focus:bg-white outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Pilih Akun</label>
              <select required value={payForm.debtSourceId} onChange={e => setPayForm(f => ({...f, debtSourceId: e.target.value}))} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold bg-slate-50 focus:border-rose-300 focus:bg-white outline-none transition-all">
                <option value="">Pilih...</option>
                {debts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Jumlah Pembayaran</label>
            <CurrencyInput required min={0} value={payForm.amount} onChangeValue={(val: string) => setPayForm(f => ({...f, amount: val}))} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold bg-slate-50 focus:border-rose-300 focus:bg-white outline-none transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Keterangan</label>
            <input type="text" value={payForm.description} onChange={e => setPayForm(f => ({...f, description: e.target.value}))} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold bg-slate-50 focus:border-rose-300 focus:bg-white outline-none transition-all" placeholder="Contoh: Bayar cicilan Bulan Maret" />
          </div>
          {submitError && <p className="text-sm text-rose-500 font-bold bg-rose-50 p-3 rounded-lg">{submitError}</p>}
          <button type="submit" className="w-full bg-emerald-200 text-emerald-900 py-4 rounded-2xl text-[14px] font-black hover:bg-emerald-300 transition-all shadow-sm">BAYAR UTANG</button>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus"
        message={
          confirmDelete.bulk 
            ? `Hapus ${selectedIds.length} transaksi utang terpilih?` 
            : confirmDelete.type === "source" 
              ? `Apakah Anda yakin ingin menghapus pemberi utang "${confirmDelete.name}" beserta seluruh histori transaksi utangnya?`
              : "Apakah Anda yakin ingin menghapus transaksi utang ini?"
        }
        confirmLabel="Hapus Sekarang"
      />
    </div>
  );
}
