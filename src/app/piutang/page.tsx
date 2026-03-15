"use client";
import { useEffect, useState } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { CurrencyInput } from "@/components/CurrencyInput";
import Modal from "@/components/Modal";

interface Receivable { id: number; date: string; amount: number; type: string }
interface Person { id: number; name: string; receivables: Receivable[] }

export default function PiutangPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [showGive, setShowGive] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], personId: "", amount: "" });
  const [newPerson, setNewPerson] = useState("");
  const [editTx, setEditTx] = useState<{id: number, type: "given" | "received"} | null>(null);
  const [editForm, setEditForm] = useState({ date: "", amount: "" });

  const load = () => { fetch("/api/receivables").then(r => r.json()).then(setPersons); };
  useEffect(() => { load(); }, []);

  const submit = async (type: string) => {
    setSubmitError("");
    const res = await fetch("/api/receivables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, personId: +form.personId, amount: +form.amount, type }) });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setSubmitError(payload.error || "Gagal menambah data piutang.");
      return;
    }
    setForm({ date: new Date().toISOString().split("T")[0], personId: "", amount: "" });
    setShowGive(false); setShowReceive(false);
    load();
  };

  const addPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const res = await fetch("/api/receivables/persons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newPerson }) });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setSubmitError(payload.error || "Gagal menambah peminjam.");
      return;
    }
    setNewPerson(""); setShowNew(false); load();
  };

  const removeReceivable = async (id: number) => {
    if (!confirm("Hapus transaksi piutang ini?")) return;
    await fetch("/api/receivables/" + id, { method: "DELETE" });
    load();
  };

  const removePerson = async (id: number, name: string) => {
    if (!confirm(`Hapus peminjam ${name} beserta semua histori piutang?`)) return;
    await fetch("/api/receivables/persons/" + id, { method: "DELETE" });
    load();
  };

  const startEdit = (r: Receivable) => {
    setEditTx({ id: r.id, type: r.type as "given" | "received" });
    setEditForm({
      date: r.date.split("T")[0],
      amount: r.amount.toString(),
    });
  };

  const saveEdit = async () => {
    if (!editTx) return;
    const res = await fetch("/api/receivables/" + editTx.id, {
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

  const totalPiutang = persons.reduce((s, p) => {
    const given = p.receivables.filter(r => r.type === "given").reduce((s2, r) => s2 + r.amount, 0);
    const received = p.receivables.filter(r => r.type === "received").reduce((s2, r) => s2 + r.amount, 0);
    return s + given - received;
  }, 0);

  const activePersons = persons.filter(p => {
    const given = p.receivables.filter(r => r.type === "given").reduce((s, r) => s + r.amount, 0);
    const received = p.receivables.filter(r => r.type === "received").reduce((s, r) => s + r.amount, 0);
    return (given - received) > 0;
  });

  const historyPersons = persons.filter(p => {
    const given = p.receivables.filter(r => r.type === "given").reduce((s, r) => s + r.amount, 0);
    const received = p.receivables.filter(r => r.type === "received").reduce((s, r) => s + r.amount, 0);
    return (given - received) <= 0;
  });

  const renderPersonCard = (p: typeof persons[0]) => {
    const given = p.receivables.filter(r => r.type === "given").reduce((s, r) => s + r.amount, 0);
    const received = p.receivables.filter(r => r.type === "received").reduce((s, r) => s + r.amount, 0);
    const rem = given - received;
    return (
      <div key={p.id} className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-slate-800">{p.name}</h3>
          <div className="flex items-center gap-3">
            <span className={"font-bold " + (rem > 0 ? "text-amber-600" : "text-emerald-600")}>{rem <= 0 ? "Lunas" : formatRupiah(rem)}</span>
            <button type="button" onClick={() => removePerson(p.id, p.name)} className="text-red-400 hover:text-red-600" title="Hapus peminjam" aria-label="Hapus peminjam">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {p.receivables.length > 0 && (
          <table className="w-full text-sm"><tbody className="divide-y">
            {p.receivables.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                {editTx?.id === r.id ? (
                  <>
                    <td className="py-2"><input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm bg-white" /></td>
                    <td className="py-2"><span className={r.type === "given" ? "text-orange-600" : "text-emerald-600"}>{r.type === "given" ? "Beri" : "Terima"}</span></td>
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
                    <td className="py-2 text-slate-700">{formatDate(r.date)}</td>
                    <td className="py-2"><span className={r.type === "given" ? "text-orange-600" : "text-emerald-600"}>{r.type === "given" ? "Beri" : "Terima"}</span></td>
                    <td className="py-2 text-right font-semibold text-slate-800">{formatRupiah(r.amount)}</td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => startEdit(r)} className="text-blue-400 hover:text-blue-600" title="Edit"><Edit2 size={15} /></button>
                        <button type="button" onClick={() => removeReceivable(r.id)} className="text-red-400 hover:text-red-600" title="Hapus transaksi" aria-label="Hapus transaksi">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody></table>
        )}
      </div>
    );
  };

  const FormPiutang = ({ type }: { type: "given" | "received" }) => (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-xs text-slate-500 mb-1">Tanggal</label>
        <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Peminjam</label>
        <select required value={form.personId} onChange={e => setForm({...form, personId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
          <option value="">Pilih...</option>
          {activePersons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Nominal (Rp)</label>
        <CurrencyInput required min={0} value={form.amount} onChangeValue={(val: string) => setForm({...form, amount: val})} className="w-full border rounded-lg px-3 py-2 text-sm" />
      </div>
      {submitError && <p className="text-sm text-rose-600">{submitError}</p>}
      <button onClick={() => submit(type)} className={(type === "given" ? "bg-orange-600 hover:bg-orange-700" : "bg-emerald-600 hover:bg-emerald-700") + " text-white px-6 py-2 rounded-lg text-sm w-full font-semibold"}>
        {type === "given" ? "Beri Piutang" : "Terima Piutang"}
      </button>
    </div>
  );

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catat Piutang</h1>
          <p className="text-slate-500 text-sm">Total Sisa Piutang: {formatRupiah(totalPiutang)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowNew(true)} className="bg-slate-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Peminjam</button>
          <button onClick={() => { setShowGive(true); setShowReceive(false); }} className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Beri Piutang</button>
          <button onClick={() => { setShowReceive(true); setShowGive(false); }} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Terima Piutang</button>
        </div>
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Tambah Peminjam">
        <form onSubmit={addPerson} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nama Peminjam</label>
            <input type="text" required value={newPerson} onChange={e => setNewPerson(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="bg-slate-700 text-white px-6 py-2 rounded-lg text-sm font-semibold w-full">Simpan</button>
        </form>
      </Modal>

      <Modal open={showGive} onClose={() => setShowGive(false)} title="Beri Piutang">
        <FormPiutang type="given" />
      </Modal>

      <Modal open={showReceive} onClose={() => setShowReceive(false)} title="Terima Piutang">
        <FormPiutang type="received" />
      </Modal>

      <div className="space-y-4">
        {activePersons.map(renderPersonCard)}
        {activePersons.length === 0 && <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-slate-400">Belum ada piutang aktif</div>}
      </div>

      {historyPersons.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Riwayat (Lunas)</h2>
          <div className="space-y-4 opacity-75">
            {historyPersons.map(renderPersonCard)}
          </div>
        </div>
      )}
    </div>
  );
}
