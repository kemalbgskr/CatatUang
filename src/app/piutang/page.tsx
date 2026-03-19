"use client";
import { useEffect, useState } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { CurrencyInput } from "@/components/CurrencyInput";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";

interface Receivable { id: number; date: string; amount: number; type: string }
interface Person { id: number; name: string; receivables: Receivable[] }

export default function PiutangPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [showGive, setShowGive] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], personId: "", amount: "" });
  const [newPerson, setNewPerson] = useState("");
  const [editTx, setEditTx] = useState<{id: number, type: "given" | "received"} | null>(null);
  const [editForm, setEditForm] = useState({ date: "", amount: "" });

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number; type?: "person" | "receivable"; bulk?: boolean; name?: string }>({ open: false });

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
    setConfirmDelete({ open: true, id, type: "receivable" });
  };

  const removePerson = async (id: number, name: string) => {
    setConfirmDelete({ open: true, id, type: "person", name });
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete.bulk) {
      if (selectedIds.length === 0) return;
      for (const id of selectedIds) {
        await fetch("/api/receivables/" + id, { method: "DELETE" });
      }
      setSelectedIds([]);
    } else if (confirmDelete.type === "person" && confirmDelete.id) {
      await fetch("/api/receivables/persons/" + confirmDelete.id, { method: "DELETE" });
    } else if (confirmDelete.type === "receivable" && confirmDelete.id) {
      await fetch("/api/receivables/" + confirmDelete.id, { method: "DELETE" });
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
    setSelectedIds(selectedIds.length === allTransactions.length ? [] : allTransactions.map(t => t.id));
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

  const allTransactions = persons.flatMap(p => 
    p.receivables.map(r => ({ ...r, personName: p.name }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const renderPersonCard = (p: Person) => {
    const given = p.receivables.filter(r => r.type === "given").reduce((s, r) => s + r.amount, 0);
    const received = p.receivables.filter(r => r.type === "received").reduce((s, r) => s + r.amount, 0);
    const rem = given - received;
    
    return (
      <div key={p.id} className="bg-white rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 p-6 flex flex-col justify-between group">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg tracking-tight mb-1">{p.name}</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Peminjam</p>
            </div>
            <div className="flex items-center gap-2">
               <button type="button" onClick={() => removePerson(p.id, p.name)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100" title="Hapus Orang"><Trash2 size={16} /></button>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
             <p className="text-[11px] font-bold text-slate-500 mb-1">Total Sisa Piutang</p>
             <p className={`text-xl font-black tracking-tight ${rem > 0 ? "text-indigo-600" : "text-emerald-600"}`}>
               {rem <= 0 ? "LUNAS" : formatRupiah(rem)}
             </p>
          </div>

          {p.receivables.length > 0 && (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {p.receivables.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  {editTx?.id === r.id ? (
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
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${r.type === "received" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"}`}>
                            {r.type === "received" ? "TERIMA" : "BERI"}
                          </span>
                          <span className="text-[11px] font-bold text-slate-800">{formatRupiah(r.amount)}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold">{formatDate(r.date)}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => startEdit(r)} className="p-1.5 text-slate-300 hover:text-indigo-400 transition-colors"><Edit2 size={13}/></button>
                        <button type="button" onClick={() => removeReceivable(r.id)} className="p-1.5 text-slate-300 hover:text-rose-400 transition-colors"><Trash2 size={13}/></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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
          {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
    <div className="space-y-8 pt-12 md:pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Catat Piutang</h1>
          <p className="text-slate-500 font-medium text-[15px] mt-1">Pantau uang yang dipinjam orang lain kepadamu.</p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <button 
            onClick={() => setViewMode(viewMode === "grouped" ? "flat" : "grouped")} 
            className="bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-2xl text-[13px] font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
          >
            {viewMode === "grouped" ? "Lihat Semua Rincian" : "Lihat Grup Kartu"}
          </button>
          
          <button onClick={() => setShowNew(true)} className="bg-slate-800 text-white px-4 py-2.5 rounded-2xl text-[13px] font-bold flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-slate-200">
            <Plus size={16} /> Peminjam
          </button>
          
          <button onClick={() => { setShowGive(true); setShowReceive(false); }} className="bg-indigo-100 text-indigo-900 px-4 py-2.5 rounded-2xl text-[13px] font-bold flex items-center gap-2 hover:bg-indigo-200 transition-all shadow-sm">
            <Plus size={16} /> Beri Piutang
          </button>
          
          <button onClick={() => { setShowReceive(true); setShowGive(false); }} className="bg-emerald-100 text-emerald-900 px-4 py-2.5 rounded-2xl text-[13px] font-bold flex items-center gap-2 hover:bg-emerald-200 transition-all shadow-sm">
            <Plus size={16} /> Terima Piutang
          </button>
        </div>
      </div>

      {/* Summary Hero Card */}
      <div className="relative overflow-hidden bg-indigo-900 rounded-[32px] p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <p className="text-indigo-300 text-[13px] font-bold uppercase tracking-wider mb-2">Total Sisa Piutang</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">{formatRupiah(totalPiutang)}</h2>
          <div className="mt-6 flex items-center gap-4 text-sm font-medium">
             <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                {activePersons.length} Peminjam Aktif
             </div>
             <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {historyPersons.length} Lunas
             </div>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-[20px] p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <p className="text-[13px] font-bold text-indigo-800">{selectedIds.length} data dipilih</p>
          <div className="flex gap-2">
            <button onClick={bulkDelete} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
              <Trash2 size={14} /> Hapus Terpilih
            </button>
            <button onClick={() => setSelectedIds([])} className="bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-50 transition">
              Batal
            </button>
          </div>
        </div>
      )}

      {viewMode === "grouped" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activePersons.map(renderPersonCard)}
          {activePersons.length === 0 && <div className="md:col-span-2 bg-white rounded-[24px] border-2 border-dashed border-slate-100 p-12 text-center text-slate-400 font-bold">Belum ada piutang aktif</div>}
          
          {historyPersons.length > 0 && (
            <div className="md:col-span-2 mt-8">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-extrabold text-slate-800">Riwayat (Lunas)</h2>
                <span className="bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2 py-0.5 rounded-lg">{historyPersons.length} Orang</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80 filter grayscale-[0.2]">
                {historyPersons.map(renderPersonCard)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h2 className="text-[17px] font-bold text-slate-800">Semua Transaksi Piutang</h2>
              <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-1 rounded-md">{allTransactions.length} data</span>
            </div>
            <label className="text-[13px] font-bold text-slate-500 cursor-pointer flex items-center gap-2 select-none hover:text-slate-800 transition">
              <input type="checkbox" checked={allTransactions.length > 0 && selectedIds.length === allTransactions.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-200 text-indigo-500 focus:ring-indigo-500" />
              Pilih Semua
            </label>
          </div>

          <div className="space-y-1">
            {allTransactions.map(t => (
              <div key={t.id} className={`group flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-all rounded-2xl ${selectedIds.includes(t.id) ? "bg-indigo-50/30" : ""}`}>
                <div className="flex items-center gap-4 flex-1">
                  <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} className="w-4 h-4 rounded border-slate-200 text-indigo-500 focus:ring-indigo-500" />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[14px] font-bold text-slate-800">{t.personName}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${t.type === "received" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"}`}>
                         {t.type === "received" ? "TERIMA" : "BERI"}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 font-semibold">{formatDate(t.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-3 md:mt-0 justify-between md:justify-end">
                  <p className={`text-16 font-black tracking-tight ${t.type === "received" ? "text-emerald-500" : "text-indigo-500"}`}>
                    {t.type === "received" ? "+" : "-"}{formatRupiah(t.amount)}
                  </p>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => startEdit(t)} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"><Edit2 size={16} /></button>
                    <button type="button" onClick={() => removeReceivable(t.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
            {allTransactions.length === 0 && <div className="py-12 text-center text-slate-400 font-bold">Belum ada transaksi</div>}
          </div>
        </div>
      )}

      {/* Modals with Budggt-style enhancements */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Tambah Nama Peminjam">
        <form onSubmit={addPerson} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Nama Peminjam</label>
            <input type="text" required value={newPerson} onChange={e => setNewPerson(e.target.value)} className="w-full border-slate-200 rounded-xl px-4 py-3 text-[14px] font-semibold bg-slate-50 focus:border-indigo-300 focus:bg-white outline-none transition-all" placeholder="Nama orang atau instansi" />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[14px] font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">SIMPAN NAMA PEMINJAM</button>
        </form>
      </Modal>

      <Modal open={showGive} onClose={() => setShowGive(false)} title="Beri Pinjaman / Piutang">
        <FormPiutang type="given" />
      </Modal>

      <Modal open={showReceive} onClose={() => setShowReceive(false)} title="Terima Cicilan / Pembayaran">
        <FormPiutang type="received" />
      </Modal>

      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus"
        message={
          confirmDelete.bulk 
            ? `Hapus ${selectedIds.length} transaksi piutang terpilih?`
            : confirmDelete.type === "person"
              ? `Hapus peminjam "${confirmDelete.name}" beserta semua histori piutang?`
              : "Hapus transaksi piutang ini?"
        }
        confirmLabel="Hapus Sekarang"
      />
    </div>
  );
}
