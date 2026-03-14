"use client";
import { useEffect, useState } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

interface DebtSource { id: number; name: string; initialAmount: number; loans: { id: number; date: string; amount: number; description: string }[]; payments: { id: number; date: string; amount: number; description: string }[] }

export default function UtangPage() {
  const [debts, setDebts] = useState<DebtSource[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [showPayForm, setShowPayForm] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showNewDebt, setShowNewDebt] = useState(false);
  const [payForm, setPayForm] = useState({ date: new Date().toISOString().split("T")[0], debtSourceId: "", amount: "", description: "" });
  const [loanForm, setLoanForm] = useState({ date: new Date().toISOString().split("T")[0], debtSourceId: "", amount: "", description: "" });
  const [newDebt, setNewDebt] = useState({ name: "", initialAmount: "0" });

  const load = () => { fetch("/api/debts").then(r => r.json()).then(setDebts); };
  useEffect(() => { load(); }, []);

  const submitPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const res = await fetch("/api/debts/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payForm, debtSourceId: +payForm.debtSourceId, amount: +payForm.amount }) });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setSubmitError(payload.error || "Gagal menambah pembayaran utang.");
      return;
    }
    setPayForm({ date: new Date().toISOString().split("T")[0], debtSourceId: "", amount: "", description: "" });
    setShowPayForm(false);
    load();
  };

  const submitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const res = await fetch("/api/debts/loans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...loanForm, debtSourceId: +loanForm.debtSourceId, amount: +loanForm.amount }) });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setSubmitError(payload.error || "Gagal menambah pinjaman.");
      return;
    }
    setLoanForm({ date: new Date().toISOString().split("T")[0], debtSourceId: "", amount: "", description: "" });
    setShowLoanForm(false);
    load();
  };

  const addDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const res = await fetch("/api/debts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newDebt.name, initialAmount: +newDebt.initialAmount }) });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setSubmitError(payload.error || "Gagal menambah pemberi utang.");
      return;
    }
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

  const totalUtang = debts.reduce((s, d) => {
    const loans = d.loans.reduce((s2, l) => s2 + l.amount, 0);
    const payments = d.payments.reduce((s2, p) => s2 + p.amount, 0);
    return s + d.initialAmount + loans - payments;
  }, 0);

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catat Utang</h1>
          <p className="text-slate-500 text-sm">Total Sisa Utang: {formatRupiah(totalUtang)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowNewDebt(!showNewDebt)} className="bg-slate-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-slate-700"><Plus size={14} /> Pemberi Utang</button>
          <button onClick={() => setShowLoanForm(!showLoanForm)} className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-orange-700"><Plus size={14} /> Ambil Pinjaman</button>
          <button onClick={() => setShowPayForm(!showPayForm)} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-emerald-700"><Plus size={14} /> Bayar Utang</button>
        </div>
      </div>

      {showNewDebt && (
        <form onSubmit={addDebt} className="bg-white rounded-xl shadow-sm border p-6 flex flex-wrap gap-4 items-end">
          <div><label className="block text-xs text-slate-500 mb-1">Nama Pemberi Utang</label><input type="text" required value={newDebt.name} onChange={e => setNewDebt({...newDebt, name: e.target.value})} className="border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Utang Awal (Rp)</label><input type="number" min={0} value={newDebt.initialAmount} onChange={e => setNewDebt({...newDebt, initialAmount: e.target.value})} className="border rounded-lg px-3 py-2 text-sm" /></div>
          <button type="submit" className="bg-slate-700 text-white px-6 py-2 rounded-lg text-sm">Simpan</button>
        </form>
      )}

      {showPayForm && (
        <form onSubmit={submitPay} className="bg-white rounded-xl shadow-sm border p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-xs text-slate-500 mb-1">Tanggal</label><input type="date" required value={payForm.date} onChange={e => setPayForm({...payForm, date: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Pemberi Utang</label><select required value={payForm.debtSourceId} onChange={e => setPayForm({...payForm, debtSourceId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="">Pilih...</option>{debts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div><label className="block text-xs text-slate-500 mb-1">Rincian</label><input type="text" value={payForm.description} onChange={e => setPayForm({...payForm, description: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Nominal (Rp)</label><input type="number" required min={0} value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div className="flex items-end"><button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm w-full">Bayar</button></div>
        </form>
      )}

      {showLoanForm && (
        <form onSubmit={submitLoan} className="bg-white rounded-xl shadow-sm border p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-xs text-slate-500 mb-1">Tanggal</label><input type="date" required value={loanForm.date} onChange={e => setLoanForm({...loanForm, date: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Pemberi Utang</label><select required value={loanForm.debtSourceId} onChange={e => setLoanForm({...loanForm, debtSourceId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="">Pilih...</option>{debts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div><label className="block text-xs text-slate-500 mb-1">Rincian</label><input type="text" value={loanForm.description} onChange={e => setLoanForm({...loanForm, description: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Nominal (Rp)</label><input type="number" required min={0} value={loanForm.amount} onChange={e => setLoanForm({...loanForm, amount: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div className="flex items-end"><button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-lg text-sm w-full">Simpan Pinjaman</button></div>
        </form>
      )}

      {submitError && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          {submitError}
        </div>
      )}

      <div className="space-y-4">
        {debts.map(d => {
          const loans = d.loans.reduce((s, l) => s + l.amount, 0);
          const payments = d.payments.reduce((s, p) => s + p.amount, 0);
          const remaining = d.initialAmount + loans - payments;
          const allTx = [...d.loans.map(l => ({...l, type: "Pinjaman" as const})), ...d.payments.map(p => ({...p, type: "Bayar" as const}))].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return (
            <div key={d.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800">{d.name}</h3>
                <div className="flex items-center gap-3">
                  <span className={"font-bold " + (remaining > 0 ? "text-red-600" : "text-emerald-600")}>{formatRupiah(remaining)}</span>
                  <button
                    type="button"
                    onClick={() => deleteDebtSource(d.id, d.name)}
                    className="text-red-400 hover:text-red-600"
                    title="Hapus pemberi utang"
                    aria-label="Hapus pemberi utang"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {d.initialAmount > 0 && <p className="text-xs text-slate-400 mb-2">Utang awal: {formatRupiah(d.initialAmount)}</p>}
              {allTx.length > 0 && (
                <table className="w-full text-sm">
                  <tbody className="divide-y">
                    {allTx.map((t) => (
                      <tr key={`${t.type}-${t.id}`} className="hover:bg-slate-50">
                        <td className="py-2 text-slate-500">{formatDate(t.date)}</td>
                        <td className="py-2"><span className={t.type === "Bayar" ? "text-emerald-600" : "text-orange-600"}>{t.type}</span></td>
                        <td className="py-2 text-slate-500">{t.description}</td>
                        <td className="py-2 text-right font-medium">{formatRupiah(t.amount)}</td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() => deleteTransaction(t.type, t.id)}
                            className="text-red-400 hover:text-red-600"
                            title="Hapus transaksi"
                            aria-label="Hapus transaksi"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
        {debts.length === 0 && <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-slate-400">Belum ada data utang</div>}
      </div>
    </div>
  );
}
