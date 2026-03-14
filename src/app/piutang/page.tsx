"use client";
import { useEffect, useState } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Receivable { id: number; date: string; amount: number; type: string }
interface Person { id: number; name: string; receivables: Receivable[] }

export default function PiutangPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [showGive, setShowGive] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], personId: "", amount: "" });
  const [newPerson, setNewPerson] = useState("");

  const load = () => { fetch("/api/receivables").then(r => r.json()).then(setPersons); };
  useEffect(() => { load(); }, []);

  const submit = async (type: string) => {
    await fetch("/api/receivables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, personId: +form.personId, amount: +form.amount, type }) });
    setForm({ date: new Date().toISOString().split("T")[0], personId: "", amount: "" });
    setShowGive(false); setShowReceive(false);
    load();
  };

  const addPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/receivables/persons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newPerson }) });
    setNewPerson(""); setShowNew(false); load();
  };

  const totalPiutang = persons.reduce((s, p) => {
    const given = p.receivables.filter(r => r.type === "given").reduce((s2, r) => s2 + r.amount, 0);
    const received = p.receivables.filter(r => r.type === "received").reduce((s2, r) => s2 + r.amount, 0);
    return s + given - received;
  }, 0);

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catat Piutang</h1>
          <p className="text-slate-500 text-sm">Total Sisa Piutang: {formatRupiah(totalPiutang)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowNew(!showNew)} className="bg-slate-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Peminjam</button>
          <button onClick={() => setShowGive(!showGive)} className="bg-orange-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Beri Piutang</button>
          <button onClick={() => setShowReceive(!showReceive)} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Terima Piutang</button>
        </div>
      </div>

      {showNew && (
        <form onSubmit={addPerson} className="bg-white rounded-xl shadow-sm border p-6 flex gap-4 items-end">
          <div><label className="block text-xs text-slate-500 mb-1">Nama Peminjam</label><input type="text" required value={newPerson} onChange={e => setNewPerson(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" /></div>
          <button type="submit" className="bg-slate-700 text-white px-6 py-2 rounded-lg text-sm">Simpan</button>
        </form>
      )}

      {(showGive || showReceive) && (
        <div className="bg-white rounded-xl shadow-sm border p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><label className="block text-xs text-slate-500 mb-1">Tanggal</label><input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Peminjam</label><select required value={form.personId} onChange={e => setForm({...form, personId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="">Pilih...</option>{persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="block text-xs text-slate-500 mb-1">Nominal (Rp)</label><input type="number" required min={0} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div className="flex items-end"><button onClick={() => submit(showGive ? "given" : "received")} className={(showGive ? "bg-orange-600 hover:bg-orange-700" : "bg-emerald-600 hover:bg-emerald-700") + " text-white px-6 py-2 rounded-lg text-sm w-full"}>{showGive ? "Beri Piutang" : "Terima Piutang"}</button></div>
        </div>
      )}

      <div className="space-y-4">
        {persons.map(p => {
          const given = p.receivables.filter(r => r.type === "given").reduce((s, r) => s + r.amount, 0);
          const received = p.receivables.filter(r => r.type === "received").reduce((s, r) => s + r.amount, 0);
          const rem = given - received;
          return (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-slate-800">{p.name}</h3>
                <span className={"font-bold " + (rem > 0 ? "text-amber-600" : "text-emerald-600")}>{formatRupiah(rem)}</span>
              </div>
              {p.receivables.length > 0 && (
                <table className="w-full text-sm"><tbody className="divide-y">
                  {p.receivables.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(r => (
                    <tr key={r.id}><td className="py-2 text-slate-500">{formatDate(r.date)}</td><td className="py-2"><span className={r.type === "given" ? "text-orange-600" : "text-emerald-600"}>{r.type === "given" ? "Beri" : "Terima"}</span></td><td className="py-2 text-right font-medium">{formatRupiah(r.amount)}</td></tr>
                  ))}
                </tbody></table>
              )}
            </div>
          );
        })}
        {persons.length === 0 && <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-slate-400">Belum ada data piutang</div>}
      </div>
    </div>
  );
}
