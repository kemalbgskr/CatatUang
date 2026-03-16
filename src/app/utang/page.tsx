"use client";
import { useEffect, useState } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { CurrencyInput } from "@/components/CurrencyInput";
import Modal from "@/components/Modal";

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
    if (!confirm(`Hapus pemberi utang ${name} beserta seluruh histori utangnya?`)) return;
    await fetch("/api/debts/" + id, { method: "DELETE" });
    load();
  };

  const deleteTransaction = async (type: "Pinjaman" | "Bayar", id: number) => {
    if (!confirm("Hapus transaksi utang ini?")) return;
    const endpoint = type === "Pinjaman" ? "/api/debts/loans/" : "/api/debts/payments/";
    await fetch(endpoint + id, { method: "DELETE" });
    load();
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Hapus ${selectedIds.length} transaksi terpilih?`)) return;
    for (const item of selectedIds) {
      const endpoint = item.type === "Pinjaman" ? "/api/debts/loans/" : "/api/debts/payments/";
      await fetch(endpoint + item.id, { method: "DELETE" });
    }
    setSelectedIds([]);
    load();
  };

  const toggleSelect = (id: number, type: "Pinjaman" | "Bayar") => {
    setSelectedIds(prev => {
      const exists = prev.find(x => x.id === id && x.type === type);
      if (exists) return prev.filter(x => !(x.id === id && x.type === type));
      return [...prev, { id, type }];
    });
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
      <div key={d.id} className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800">{d.name}</h3>
          <div className="flex items-center gap-3">
            <span className={"font-bold " + (remaining > 0 ? "text-red-600" : "text-emerald-600")}>{remaining <= 0 ? "Lunas" : formatRupiah(remaining)}</span>
            <button type="button" onClick={() => deleteDebtSource(d.id, d.name)} className="text-red-400 hover:text-red-600" title="Hapus pemberi utang" aria-label="Hapus pemberi utang"><Trash2 size={16} /></button>
          </div>
        </div>
        {d.initialAmount > 0 && <p className="text-xs text-slate-600 mb-2">Utang awal: {formatRupiah(d.initialAmount)}</p>}
        {allTx.length > 0 && (
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {allTx.map((t) => (
                <tr key={`${t.type}-${t.id}`} className="hover:bg-slate-50">
                  {editTx?.id === t.id && editTx?.type === t.type ? (
                    <>
                      <td className="py-2"><input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm bg-white" /></td>
                      <td className="py-2"><span className={t.type === "Bayar" ? "text-emerald-600" : "text-orange-600"}>{t.type}</span></td>
                      <td className="py-2"><input type="text" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm bg-white" /></td>
                      <td className="py-2"><CurrencyInput min={0} value={editForm.amount} onChangeValue={(val: string) => setEditForm(f => ({ ...f, amount: val }))} className="w-full border rounded px-2 py-1 text-sm bg-white text-right" /></td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={saveEdit} className="text-emerald-600 hover:text-emerald-800" title="Simpan"><Check size={15} /></button>
                          <button onClick={() => setEditTx(null)} className="text-slate-400 hover:text-slate-600" title="Batal"><X size={15} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 text-slate-700">{formatDate(t.date)}</td>
                      <td className="py-2"><span className={t.type === "Bayar" ? "text-emerald-600" : "text-orange-600"}>{t.type}</span></td>
                      <td className="py-2 text-slate-700">{t.description}</td>
                      <td className="py-2 text-right font-semibold text-slate-800">{formatRupiah(t.amount)}</td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" onClick={() => startEdit(t)} className="text-blue-400 hover:text-blue-600" title="Edit"><Edit2 size={15} /></button>
                          <button type="button" onClick={() => deleteTransaction(t.type, t.id)} className="text-red-400 hover:text-red-600" title="Hapus transaksi" aria-label="Hapus transaksi"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catat Utang</h1>
          <p className="text-slate-500 text-sm">Total Sisa Utang: {formatRupiah(totalUtang)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setViewMode(viewMode === "grouped" ? "flat" : "grouped")} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition">
            {viewMode === "grouped" ? "Lihat Semua Transaksi" : "Lihat Grup Kartu"}
          </button>
          <button onClick={() => setShowNewDebt(true)} className="bg-slate-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-slate-700 transition"><Plus size={14} /> Pemberi Utang</button>
          <button onClick={() => setShowLoanForm(true)} className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-orange-700 transition"><Plus size={14} /> Ambil Pinjaman</button>
          <button onClick={() => setShowPayForm(true)} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-emerald-700 transition"><Plus size={14} /> Bayar Utang</button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between">
          <p className="text-sm font-medium text-indigo-700">{selectedIds.length} transaksi dipilih</p>
          <div className="flex gap-2">
            <button onClick={bulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"><Trash2 size={14} /> Hapus Terpilih</button>
            <button onClick={() => setSelectedIds([])} className="bg-white text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition">Batal</button>
          </div>
        </div>
      )}

      {viewMode === "grouped" ? (
        <div className="space-y-4">
          {activeDebts.map(renderDebtCard)}
          {activeDebts.length === 0 && <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-slate-400">Belum ada utang aktif</div>}
          
          {historyDebts.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Riwayat (Lunas)</h2>
              <div className="space-y-4 opacity-75">
                {historyDebts.map(renderDebtCard)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="text-left px-4 py-3">Tanggal</th>
                <th className="text-left px-4 py-3">Pemberi</th>
                <th className="text-left px-4 py-3">Tipe</th>
                <th className="text-left px-4 py-3">Rincian</th>
                <th className="text-right px-4 py-3">Nominal</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allTransactions.map(t => {
                const isSelected = selectedIds.some(x => x.id === t.id && x.type === t.type);
                return (
                  <tr key={`${t.type}-${t.id}`} className={`hover:bg-slate-50 ${isSelected ? "bg-blue-50/50" : ""}`}>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(t.id, t.type)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{t.sourceName}</td>
                    <td className="px-4 py-3"><span className={t.type === "Bayar" ? "text-emerald-600" : "text-orange-600"}>{t.type}</span></td>
                    <td className="px-4 py-3 text-slate-600">{t.description}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{formatRupiah(t.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                         <button type="button" onClick={() => startEdit({...t, type: t.type})} className="text-blue-400 hover:text-blue-600"><Edit2 size={16} /></button>
                         <button type="button" onClick={() => deleteTransaction(t.type, t.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {allTransactions.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Belum ada transaksi</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals remain same */}
      <Modal open={showNewDebt} onClose={() => setShowNewDebt(false)} title="Tambah Pemberi Utang">
        <form onSubmit={addDebt} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nama Pemberi Utang</label>
            <input type="text" required value={newDebt.name} onChange={e => setNewDebt({...newDebt, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Utang Awal (Rp)</label>
            <CurrencyInput min={0} value={newDebt.initialAmount} onChangeValue={(val: string) => setNewDebt({...newDebt, initialAmount: val})} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          {submitError && <p className="text-sm text-rose-600">{submitError}</p>}
          <button type="submit" className="bg-slate-700 text-white px-6 py-2 rounded-lg text-sm font-semibold w-full">Simpan</button>
        </form>
      </Modal>

      <Modal open={showLoanForm} onClose={() => setShowLoanForm(false)} title="Ambil Pinjaman">
        <form onSubmit={submitLoan} className="flex flex-col gap-4">
          <DebtFormFields form={loanForm} setForm={setLoanForm} />
          {submitError && <p className="text-sm text-rose-600">{submitError}</p>}
          <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-semibold w-full hover:bg-orange-700">Simpan Pinjaman</button>
        </form>
      </Modal>

      <Modal open={showPayForm} onClose={() => setShowPayForm(false)} title="Bayar Utang">
        <form onSubmit={submitPay} className="flex flex-col gap-4">
          <DebtFormFields form={payForm} setForm={setPayForm} />
          {submitError && <p className="text-sm text-rose-600">{submitError}</p>}
          <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-semibold w-full hover:bg-emerald-700">Bayar</button>
        </form>
      </Modal>
    </div>
  );
}
