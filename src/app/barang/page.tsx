"use client";
import { useEffect, useState } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Account { id: number; name: string }
interface Item { id: number; name: string; initialQty: number; initialValue: number; transactions: { id: number; date: string; type: string; price: number; quantity: number; account: Account }[] }

export default function BarangPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", initialQty: "0", initialValue: "0" });
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], itemId: "", price: "", quantity: "1", accountId: "" });

  const load = () => { fetch("/api/items").then(r => r.json()).then(setItems); };
  useEffect(() => { load(); fetch("/api/accounts").then(r => r.json()).then(setAccounts); }, []);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newItem.name, initialQty: +newItem.initialQty, initialValue: +newItem.initialValue }) });
    setNewItem({ name: "", initialQty: "0", initialValue: "0" }); setShowNew(false); load();
  };

  const submitTx = async (type: string) => {
    await fetch("/api/items/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, itemId: +form.itemId, price: +form.price, quantity: +form.quantity, accountId: +form.accountId, type }) });
    setForm({ date: new Date().toISOString().split("T")[0], itemId: "", price: "", quantity: "1", accountId: "" });
    setShowBuy(false); setShowSell(false); load();
  };

  const totalValue = items.reduce((s, i) => {
    const buys = i.transactions.filter(t => t.type === "buy").reduce((s2, t) => s2 + t.price * t.quantity, 0);
    const sells = i.transactions.filter(t => t.type === "sell").reduce((s2, t) => s2 + t.price * t.quantity, 0);
    return s + i.initialValue + buys - sells;
  }, 0);

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Beli / Jual Barang</h1>
          <p className="text-slate-500 text-sm">Total Nilai: {formatRupiah(totalValue)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowNew(!showNew)} className="bg-slate-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Barang Baru</button>
          <button onClick={() => {setShowBuy(!showBuy);setShowSell(false)}} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Beli</button>
          <button onClick={() => {setShowSell(!showSell);setShowBuy(false)}} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Jual</button>
        </div>
      </div>

      {showNew && (
        <form onSubmit={addItem} className="bg-white rounded-xl shadow-sm border p-6 flex flex-wrap gap-4 items-end">
          <div><label className="block text-xs text-slate-500 mb-1">Nama Barang</label><input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Jumlah Awal</label><input type="number" min={0} value={newItem.initialQty} onChange={e => setNewItem({...newItem, initialQty: e.target.value})} className="border rounded-lg px-3 py-2 text-sm w-24" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Nilai Awal (Rp)</label><input type="number" min={0} value={newItem.initialValue} onChange={e => setNewItem({...newItem, initialValue: e.target.value})} className="border rounded-lg px-3 py-2 text-sm" /></div>
          <button type="submit" className="bg-slate-700 text-white px-6 py-2 rounded-lg text-sm">Simpan</button>
        </form>
      )}

      {(showBuy || showSell) && (
        <div className="bg-white rounded-xl shadow-sm border p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-xs text-slate-500 mb-1">Tanggal</label><input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Barang</label><select required value={form.itemId} onChange={e => setForm({...form, itemId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="">Pilih...</option>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
          <div><label className="block text-xs text-slate-500 mb-1">Harga (Rp)</label><input type="number" required min={0} value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Jumlah</label><input type="number" required min={1} value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Rekening</label><select required value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="">Pilih...</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <div className="flex items-end"><button onClick={() => submitTx(showBuy ? "buy" : "sell")} className={(showBuy ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700") + " text-white px-6 py-2 rounded-lg text-sm w-full"}>{showBuy ? "Beli" : "Jual"}</button></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(i => {
          const buys = i.transactions.filter(t => t.type === "buy");
          const sells = i.transactions.filter(t => t.type === "sell");
          const qty = i.initialQty + buys.reduce((s, t) => s + t.quantity, 0) - sells.reduce((s, t) => s + t.quantity, 0);
          const val = i.initialValue + buys.reduce((s, t) => s + t.price * t.quantity, 0) - sells.reduce((s, t) => s + t.price * t.quantity, 0);
          return (
            <div key={i.id} className="bg-white rounded-xl shadow-sm border p-4">
              <h3 className="font-semibold text-slate-800">{i.name}</h3>
              <p className="text-xs text-slate-400">Qty: {qty}</p>
              <p className="text-lg font-bold text-amber-600 mt-1">{formatRupiah(val)}</p>
              {i.transactions.length > 0 && (
                <div className="mt-3 space-y-1">
                  {i.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(t => (
                    <div key={t.id} className="flex justify-between text-xs">
                      <span className="text-slate-400">{formatDate(t.date)} - <span className={t.type === "buy" ? "text-blue-500" : "text-emerald-500"}>{t.type === "buy" ? "Beli" : "Jual"}</span></span>
                      <span className="text-slate-600">{formatRupiah(t.price * t.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && <div className="col-span-full bg-white rounded-xl shadow-sm border p-8 text-center text-slate-400">Belum ada barang</div>}
      </div>
    </div>
  );
}
