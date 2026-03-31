"use client";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/utils";
import { Calculator, Users, Receipt, Plus, Trash2, ArrowRightLeft, HandCoins, CreditCard, ChevronDown, Check, X } from "lucide-react";
import Modal from "@/components/Modal";
import { CurrencyInput } from "@/components/CurrencyInput";

type SplitType = "even" | "itemized";

interface PersonObj {
  id: string;
  name: string;
}

interface ItemObj {
  id: string;
  name: string;
  price: number;
  assignees: string[]; // array of person ids
}

export default function SplitBillPage() {
  const [splitType, setSplitType] = useState<SplitType>("even");
  
  // Even Split State
  const [evenTotal, setEvenTotal] = useState<string>("");
  const [evenPersons, setEvenPersons] = useState<PersonObj[]>([
    { id: "1", name: "Saya" },
    { id: "2", name: "Teman 1" }
  ]);

  // Itemized Split State
  const [items, setItems] = useState<ItemObj[]>([
    { id: "i1", name: "", price: 0, assignees: [] }
  ]);
  const [taxAmount, setTaxAmount] = useState<string>("");
  const [serviceAmount, setServiceAmount] = useState<string>("");

  // Common State
  const [persons, setPersons] = useState<PersonObj[]>([
    { id: "p1", name: "Saya" },
    { id: "p2", name: "Teman 1" }
  ]);

  // Modals for Saving
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveType, setSaveType] = useState<"piutang" | "utang" | "pengeluaran">("piutang");
  const [saveTarget, setSaveTarget] = useState<{ name: string; amount: number } | null>(null);

  // External API Data
  const [receivablePersons, setReceivablePersons] = useState<any[]>([]);
  const [debtSources, setDebtSources] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);

  // Form states for Modal
  const [selectedExistingId, setSelectedExistingId] = useState("");
  const [newEntityName, setNewEntityName] = useState("");

  useEffect(() => {
    fetch("/api/receivables").then(r => r.json()).then(setReceivablePersons);
    fetch("/api/debts").then(r => r.json()).then(setDebtSources);
    fetch("/api/expense-categories").then(r => r.json()).then(setExpenseCategories);
  }, []);

  // --- Handlers for Even ---
  const addEvenPerson = () => {
    setEvenPersons([...evenPersons, { id: Date.now().toString(), name: `Teman ${evenPersons.length + 1}` }]);
  };
  const removeEvenPerson = (id: string) => {
    if (evenPersons.length <= 2) return;
    setEvenPersons(evenPersons.filter(p => p.id !== id));
  };
  const updateEvenPerson = (id: string, name: string) => {
    setEvenPersons(evenPersons.map(p => p.id === id ? { ...p, name } : p));
  };

  // --- Handlers for Itemized ---
  const addPerson = () => setPersons([...persons, { id: Date.now().toString(), name: `Teman ${persons.length + 1}` }]);
  const updatePerson = (id: string, name: string) => setPersons(persons.map(p => p.id === id ? { ...p, name } : p));
  const removePerson = (id: string) => {
    if (persons.length <= 2) return;
    setPersons(persons.filter(p => p.id !== id));
    setItems(items.map(it => ({ ...it, assignees: it.assignees.filter(a => a !== id) })));
  };

  const addItem = () => setItems([...items, { id: Date.now().toString(), name: "", price: 0, assignees: [] }]);
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const updateItem = (id: string, field: keyof ItemObj, val: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  };
  const toggleAssignee = (itemId: string, personId: string) => {
    setItems(items.map(i => {
      if (i.id !== itemId) return i;
      const has = i.assignees.includes(personId);
      return { ...i, assignees: has ? i.assignees.filter(a => a !== personId) : [...i.assignees, personId] };
    }));
  };

  // --- Calculation Logic ---
  const calculateResult = () => {
    if (splitType === "even") {
      const total = Number(evenTotal) || 0;
      const perPerson = total / evenPersons.length;
      return evenPersons.map(p => ({ name: p.name, amount: perPerson }));
    } else {
      let results: Record<string, number> = {};
      persons.forEach(p => results[p.id] = 0);
      let itemsTotal = 0;

      items.forEach(it => {
        itemsTotal += it.price;
        if (it.assignees.length > 0) {
          const splitPrice = it.price / it.assignees.length;
          it.assignees.forEach(a => { if (results[a] !== undefined) results[a] += splitPrice; });
        }
      });

      const tax = Number(taxAmount) || 0;
      const svc = Number(serviceAmount) || 0;
      const totalExtras = tax + svc;

      if (itemsTotal > 0 && totalExtras > 0) {
        persons.forEach(p => {
          const ratio = results[p.id] / itemsTotal;
          results[p.id] += ratio * totalExtras;
        });
      }

      return persons.map(p => ({
        name: p.name,
        amount: results[p.id]
      })).filter(r => r.amount > 0);
    }
  };

  const results = calculateResult();
  const sumResult = results.reduce((s, r) => s + r.amount, 0);

  // --- Save Integration ---
  const openSaveModal = (type: "piutang" | "utang" | "pengeluaran", res: { name: string, amount: number }) => {
    setSaveType(type);
    setSaveTarget(res);
    setNewEntityName(type === "pengeluaran" ? "Split Bill - " + res.name : (res.name !== "Saya" ? res.name : ""));
    setSelectedExistingId("");
    setShowSaveModal(true);
  };

  const confirmSave = async () => {
    if (!saveTarget) return;

    if (saveType === "piutang") {
      // Create Piutang: I gave money, so someone owes me
      let pId = selectedExistingId;
      if (!pId) {
        const createPerson = await fetch("/api/receivables/persons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newEntityName || saveTarget.name }) });
        const pd = await createPerson.json();
        pId = pd.id;
      }
      await fetch("/api/receivables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personId: pId, amount: saveTarget.amount, date: new Date().toISOString().split("T")[0], type: "given", description: "Split Bill" }) });
      alert("Piutang berhasil dicatat!");

    } else if (saveType === "utang") {
      // Create Utang: Someone gave me money, I owe them
      let dId = selectedExistingId;
      if (!dId) {
        const createDebt = await fetch("/api/debts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newEntityName || saveTarget.name, initialAmount: 0 }) });
        const dd = await createDebt.json();
        dId = dd.id;
      }
      await fetch("/api/debts/loans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ debtSourceId: dId, amount: saveTarget.amount, date: new Date().toISOString().split("T")[0], description: "Split Bill" }) });
      alert("Utang berhasil dicatat!");
    } else if (saveType === "pengeluaran") {
      if (!selectedExistingId) {
        alert("Pilih Kategori Pengeluaran!"); return;
      }
      await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId: +selectedExistingId, amount: saveTarget.amount, date: new Date().toISOString().split("T")[0], description: newEntityName }) });
      alert("Pengeluaran berhasil dicatat!");
    }

    setShowSaveModal(false);
    // refresh data
    fetch("/api/receivables").then(r => r.json()).then(setReceivablePersons);
    fetch("/api/debts").then(r => r.json()).then(setDebtSources);
  };

  return (
    <div className="space-y-8 pt-12 md:pt-0 max-w-6xl mx-auto pb-20 fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2C2C2C] tracking-tight flex items-center gap-3">
             <Calculator strokeWidth={2.5}/> Split Bill & Patungan
          </h1>
          <p className="text-[#848484] font-medium text-[15px] mt-1.5">Hitung pembagian nota bareng teman secara adil dan catat ke hutang/piutang.</p>
        </div>
      </div>

      <div className="px-4 md:px-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Input */}
        <div className="lg:col-span-7 bg-white rounded-[32px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
           
           <div className="p-6 border-b border-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
             <button onClick={() => setSplitType("even")} className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all min-w-[140px]
               ${splitType === "even" ? "bg-slate-900 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
               <Users size={18}/> Sama Rata
             </button>
             <button onClick={() => setSplitType("itemized")} className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all min-w-[150px]
               ${splitType === "itemized" ? "bg-indigo-600 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
               <Receipt size={18}/> Per Item (Detail)
             </button>
           </div>

           <div className="p-6 md:p-8">
             {splitType === "even" ? (
                <div className="space-y-6">
                   <div>
                     <label className="block text-[11px] font-black tracking-widest text-[#A19FA6] mb-2 uppercase">TOTAL NOTA KESELURUHAN</label>
                     <CurrencyInput min={0} value={evenTotal} onChangeValue={v => setEvenTotal(v)} className="w-full text-3xl font-black text-slate-900 border-none bg-slate-50 px-6 py-5 rounded-[20px] focus:ring-4 focus:ring-slate-100 outline-none transition-all placeholder:text-slate-300" placeholder="Rp 0" />
                   </div>

                   <div>
                     <label className="block text-[11px] font-black tracking-widest text-[#A19FA6] mb-3 uppercase">SIAPA SAJA YANG IKUT?</label>
                     <div className="space-y-3">
                       {evenPersons.map((p, i) => (
                         <div key={p.id} className="flex gap-3">
                           <div className="w-12 h-12 rounded-[16px] bg-slate-100 flex items-center justify-center font-black text-slate-500 shrink-0">{i+1}</div>
                           <input type="text" value={p.name} onChange={e => updateEvenPerson(p.id, e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-[16px] px-4 font-bold text-slate-800 outline-none focus:border-slate-400" placeholder="Nama..." />
                           {evenPersons.length > 2 && (
                             <button onClick={() => removeEvenPerson(p.id)} className="w-12 h-12 rounded-[16px] bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 shrink-0"><Trash2 size={16}/></button>
                           )}
                         </div>
                       ))}
                       <button onClick={addEvenPerson} className="flex w-full items-center justify-center gap-2 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-[16px] border border-dashed border-slate-200 transition-all text-[13px]">
                         <Plus size={16}/> Tambah Orang
                       </button>
                     </div>
                   </div>
                </div>
             ) : (
                <div className="space-y-8">
                   {/* Itemized Input */}
                   <div>
                     <label className="block text-[11px] font-black tracking-widest text-indigo-400 mb-3 uppercase flex items-center justify-between">
                       <span>DAFTAR ORANG & PESERTA</span>
                     </label>
                     <div className="flex flex-wrap gap-2">
                       {persons.map((p, i) => (
                         <div key={p.id} className="flex items-center bg-indigo-50 border border-indigo-100 rounded-xl pr-1 overflow-hidden group">
                           <input type="text" value={p.name} onChange={e => updatePerson(p.id, e.target.value)} className="bg-transparent border-none w-24 px-3 py-2 text-[13px] font-bold text-indigo-900 outline-none focus:w-32 transition-all" />
                           {persons.length > 2 && (
                             <button onClick={() => removePerson(p.id)} className="p-1.5 text-indigo-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><X size={14}/></button>
                           )}
                         </div>
                       ))}
                       <button onClick={addPerson} className="bg-white border text-indigo-600 border-indigo-100 border-dashed hover:bg-indigo-50 py-2 px-3 rounded-xl text-[13px] font-bold flex items-center gap-1"><Plus size={14}/> Tambah</button>
                     </div>
                   </div>

                   <hr className="border-slate-100" />

                   <div>
                     <label className="block text-[11px] font-black tracking-widest text-[#A19FA6] mb-3 uppercase">RINCIAN ITEM PESANAN</label>
                     <div className="space-y-4">
                       {items.map((it, i) => (
                         <div key={it.id} className="bg-slate-50 border border-slate-100 rounded-[20px] p-4 relative">
                           <button onClick={() => removeItem(it.id)} className="absolute -top-2 -right-2 bg-white text-rose-500 shadow-sm border border-rose-100 p-1 rounded-full hover:bg-rose-50"><X size={14}/></button>
                           
                           <div className="flex flex-col md:flex-row gap-3 mb-4">
                              <input type="text" value={it.name} onChange={e => updateItem(it.id, "name", e.target.value)} placeholder="Nama Item (MIE GAC...)" className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-indigo-400 text-[14px]" />
                              <CurrencyInput value={String(it.price || "")} onChangeValue={v => updateItem(it.id, "price", Number(v))} placeholder="Harga (Rp)" className="w-full md:w-1/3 bg-white border border-slate-200 rounded-xl px-4 py-3 font-extrabold text-slate-800 outline-none focus:border-indigo-400 text-[14px]" />
                           </div>

                           <div>
                             <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">Milik Siapa? (Pilih satu atau lebih untuk berbagi adil)</p>
                             <div className="flex flex-wrap gap-2">
                               {persons.map(p => {
                                 const isAssigned = it.assignees.includes(p.id);
                                 return (
                                   <button key={p.id} onClick={() => toggleAssignee(it.id, p.id)} className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all border ${isAssigned ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"}`}>
                                      {p.name}
                                   </button>
                                 )
                               })}
                             </div>
                           </div>
                         </div>
                       ))}
                       <button onClick={addItem} className="flex w-full items-center justify-center gap-2 py-4 bg-white hover:bg-slate-50 text-indigo-600 font-bold rounded-[20px] border border-dashed border-indigo-200 transition-all text-[13px] shadow-sm">
                         <Plus size={16}/> Tambah Item Pesanan
                       </button>
                     </div>
                   </div>

                   <hr className="border-slate-100" />

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[11px] font-black tracking-widest text-[#A19FA6] mb-2 uppercase">PAJAK (TAX) JIKA ADA</label>
                       <CurrencyInput min={0} value={taxAmount} onChangeValue={v => setTaxAmount(v)} className="w-full text-[14px] font-bold text-slate-900 bg-white border border-slate-200 px-4 py-3 rounded-xl focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300" placeholder="Rp 0" />
                     </div>
                     <div>
                       <label className="block text-[11px] font-black tracking-widest text-[#A19FA6] mb-2 uppercase">Layanan (SERVICE)</label>
                       <CurrencyInput min={0} value={serviceAmount} onChangeValue={v => setServiceAmount(v)} className="w-full text-[14px] font-bold text-slate-900 bg-white border border-slate-200 px-4 py-3 rounded-xl focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300" placeholder="Rp 0" />
                     </div>
                   </div>
                </div>
             )}
           </div>
        </div>

        {/* RIGHT COLUMN: Result */}
        <div className="lg:col-span-5 space-y-4">
           
           <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
             
             <div className="absolute top-0 right-0 p-8 opacity-10">
               <Receipt size={120} />
             </div>

             <div className="relative z-10">
               <p className="text-[11px] font-black text-slate-400 tracking-widest uppercase mb-1">TOTAL TAGIHAN KALKULASI</p>
               <h2 className="text-4xl font-black tracking-tight mb-8 text-white">{formatRupiah(sumResult)}</h2>
               
               <p className="text-[11px] font-black tracking-widest text-slate-400 mb-4 uppercase">HASIL BAGIAN MASING-MASING:</p>

               <div className="space-y-3">
                 {results.length === 0 && (
                   <p className="text-slate-500 font-medium text-sm italic">Belum ada perhitungan...</p>
                 )}
                 {results.map((res, i) => (
                   <div key={i} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-4">
                     <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-[15px]">{res.name}</span>
                        <span className="font-black text-emerald-400 tracking-tight">{formatRupiah(Math.round(res.amount))}</span>
                     </div>
                     
                     <div className="flex gap-2 flex-wrap mt-2">
                        <button 
                          onClick={() => openSaveModal("piutang", res)}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-emerald-500/20"
                          title="Tandai bahwa dia berhutang kepada Anda karena Anda yang menalangi."
                        >
                          <ArrowRightLeft size={12}/> Jadikan Piutang
                        </button>
                        <button 
                          onClick={() => openSaveModal("utang", res)}
                          className="flex-1 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-rose-500/20"
                          title="Tandai bahwa Anda berhutang kepadanya karena dia yang menalangi."
                        >
                          <CreditCard size={12}/> Jadikan Utang
                        </button>
                        <button 
                          onClick={() => openSaveModal("pengeluaran", res)}
                          className="flex-1 min-w-[120px] py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-indigo-500/20"
                          title="Catat bagian ini sebagai pengeluaran Anda sendiri."
                        >
                          <Receipt size={12}/> Jadikan Pengeluaran
                        </button>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>

           <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 text-indigo-800 text-[13px] font-medium">
             <strong className="font-black text-indigo-900 block mb-1">💡 Tips Utang / Piutang:</strong>
             Jika Anda yang membayar seluruh bill ke kasir, maka bagian teman Anda adalah <b>Piutang</b> (mereka hutang ke Anda). Namun jika teman Anda yang membayar, maka bagian Anda adalah <b>Utang</b> (Anda hutang ke mereka).
           </div>

        </div>
      </div>

      <Modal open={showSaveModal} onClose={() => setShowSaveModal(false)} title={`Simpan sebagai ${saveType === 'piutang' ? 'Piutang' : saveType === 'utang' ? 'Utang' : 'Pengeluaran'} `}>
        <div className="space-y-5">
           <div className={`p-4 rounded-2xl border ${saveType === "piutang" ? "bg-emerald-50 border-emerald-100" : saveType === "utang" ? "bg-rose-50 border-rose-100" : "bg-indigo-50 border-indigo-100"}`}>
             <p className="text-[12px] font-black uppercase tracking-wider text-slate-500 opacity-80 mb-1">
               {saveType === "piutang" ? "Mereka Harus Bayar:" : saveType === "utang" ? "Anda Harus Bayar:" : "Total Pengeluaran Anda:"}
             </p>
             <p className={`text-3xl font-black tracking-tight ${saveType === "piutang" ? "text-emerald-600" : saveType === "utang" ? "text-rose-600" : "text-indigo-600"}`}>
               {formatRupiah(Math.round(saveTarget?.amount || 0))}
             </p>
           </div>

           <div>
              <label className="block text-[10px] font-black tracking-widest text-[#A19FA6] mb-2 uppercase">
                {saveType === "piutang" ? "PILIH/BUAT NAMA PEMINJAM (TEMAN)" : saveType === "utang" ? "PILIH/BUAT NAMA PEMBERI UTANG" : "PILIH KATEGORI PENGELUARAN"}
              </label>
              
              <div className="space-y-3">
                <select 
                  value={selectedExistingId} 
                  onChange={e => { setSelectedExistingId(e.target.value); if(e.target.value && saveType !== "pengeluaran") setNewEntityName(""); }}
                  className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 text-[14px] font-bold text-slate-900 focus:border-indigo-400 outline-none"
                >
                  <option value="">{saveType === "pengeluaran" ? "Pilih Kategori..." : "+ Buat Nama Baru..."}</option>
                  {(saveType === "piutang" ? receivablePersons : saveType === "utang" ? debtSources : expenseCategories).map(entity => (
                    <option key={entity.id} value={entity.id}>{entity.name}</option>
                  ))}
                </select>

                {(!selectedExistingId && saveType !== "pengeluaran") && (
                  <input 
                    type="text" 
                    value={newEntityName} 
                    onChange={e => setNewEntityName(e.target.value)} 
                    placeholder="Contoh: Budi, Andi..."
                    className="w-full border border-indigo-200 bg-indigo-50 rounded-xl px-4 py-3 text-[14px] font-bold text-indigo-900 focus:border-indigo-400 outline-none placeholder:text-indigo-300"
                  />
                )}

                {saveType === "pengeluaran" && (
                   <input 
                   type="text" 
                   value={newEntityName} 
                   onChange={e => setNewEntityName(e.target.value)} 
                   placeholder="Rincian Pengeluaran..."
                   className="w-full border border-indigo-200 bg-indigo-50 rounded-xl px-4 py-3 text-[14px] font-bold text-indigo-900 focus:border-indigo-400 outline-none placeholder:text-indigo-300"
                 />
                )}
              </div>
           </div>

           <button 
             onClick={confirmSave}
             disabled={(saveType !== "pengeluaran" && !selectedExistingId && !newEntityName.trim()) || (saveType === "pengeluaran" && !selectedExistingId)}
             className={`w-full py-4 text-white text-[15px] font-black rounded-2xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
               ${saveType === "piutang" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : saveType === "utang" ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" : "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20"}`}
           >
             Simpan ke {saveType === "piutang" ? "Daftar Piutang" : saveType === "utang" ? "Sumber Utang" : "Riwayat Pengeluaran"}
           </button>
        </div>
      </Modal>

    </div>
  );
}
