"use client";
import { useEffect, useState } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Account { id: number; name: string }
interface Asset { id: number; name: string; initialQty: number; initialValue: number; transactions: { id: number; date: string; type: string; price: number; quantity: number; account: Account }[] }

export default function InvestasiPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: "", initialQty: "0", initialValue: "0" });
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], assetId: "", price: "", quantity: "1", accountId: "" });

  const load = () => { fetch("/api/investments").then(r => r.json()).then(setAssets); };
  useEffect(() => { load(); fetch("/api/accounts").then(r => r.json()).then(setAccounts); }, []);

  const addAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/investments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newAsset.name, initialQty: +newAsset.initialQty, initialValue: +newAsset.initialValue }) });
    setNewAsset({ name: "", initialQty: "0", initialValue: "0" }); setShowNew(false); load();
  };

  const submitTx = async (type: string) => {
    await fetch("/api/investments/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, assetId: +form.assetId, price: +form.price, quantity: +form.quantity, accountId: +form.accountId, type }) });
    setForm({ date: new Date().toISOString().split("T")[0], assetId: "", price: "", quantity: "1", accountId: "" });
    setShowBuy(false); setShowSell(false); load();
  };

  const totalValue = assets.reduce((s, a) => {
    const buys = a.transactions.filter(t => t.type === "buy").reduce((s2, t) => s2 + t.price * t.quantity, 0);
    const sells = a.transactions.filter(t => t.type === "sell").reduce((s2, t) => s2 + t.price * t.quantity, 0);
    return s + a.initialValue + buys - sells;
  }, 0);

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catat Investasi</h1>
          <p className="text-slate-500 text-sm">Total Nilai: {formatRupiah(totalValue)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowNew(!showNew)} className="bg-slate-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Aset Baru</button>
          <button onClick={() => {setShowBuy(!showBuy);setShowSell(false)}} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Beli Aset</button>
          <button onClick={() => {setShowSell(!showSell);setShowBuy(false)}} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> Jual Aset</button>
        </div>
      </div>

      {showNew && (
        <form onSubmit={addAsset} className="bg-white rounded-xl shadow-sm border p-6 flex flex-wrap gap-4 items-end">
          <div><label className="block text-xs text-slate-500 mb-1">Nama Aset</label><input type="text" required value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Jumlah Awal</label><input type="number" min={0} value={newAsset.initialQty} onChange={e => setNewAsset({...newAsset, initialQty: e.target.value})} className="border rounded-lg px-3 py-2 text-sm w-24" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Nilai Awal (Rp)</label><input type="number" min={0} value={newAsset.initialValue} onChange={e => setNewAsset({...newAsset, initialValue: e.target.value})} className="border rounded-lg px-3 py-2 text-sm" /></div>
          <button type="submit" className="bg-slate-700 text-white px-6 py-2 rounded-lg text-sm">Simpan</button>
        </form>
      )}

      {(showBuy || showSell) && (
        <div className="bg-white rounded-xl shadow-sm border p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-xs text-slate-500 mb-1">Tanggal</label><input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Aset</label><select required value={form.assetId} onChange={e => setForm({...form, assetId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="">Pilih...</option>{assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <div><label className="block text-xs text-slate-500 mb-1">Harga Satuan (Rp)</label><input type="number" required min={0} value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Jumlah</label><input type="number" required min={1} value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-500 mb-1">Rekening</label><select required value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="">Pilih...</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <div className="flex items-end"><button onClick={() => submitTx(showBuy ? "buy" : "sell")} className={(showBuy ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700") + " text-white px-6 py-2 rounded-lg text-sm w-full"}>{showBuy ? "Beli" : "Jual"}</button></div>
        </div>
      )}

      <div className="space-y-4">
        {assets.map(a => {
          const buys = a.transactions.filter(t => t.type === "buy");
          const sells = a.transactions.filter(t => t.type === "sell");
          const qty = a.initialQty + buys.reduce((s, t) => s + t.quantity, 0) - sells.reduce((s, t) => s + t.quantity, 0);
          const val = a.initialValue + buys.reduce((s, t) => s + t.price * t.quantity, 0) - sells.reduce((s, t) => s + t.price * t.quantity, 0);
          return (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-3">
                <div><h3 className="font-semibold text-slate-800">{a.name}</h3><span className="text-xs text-slate-400">Qty: {qty}</span></div>
                <span className="font-bold text-purple-600">{formatRupiah(val)}</span>
              </div>
              {a.transactions.length > 0 && (
                <table className="w-full text-sm"><tbody className="divide-y">
                  {a.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(t => (
                    <tr key={t.id}><td className="py-2 text-slate-500">{formatDate(t.date)}</td><td className="py-2"><span className={t.type === "buy" ? "text-blue-600" : "text-emerald-600"}>{t.type === "buy" ? "Beli" : "Jual"}</span></td><td className="py-2 text-slate-500">{t.account.name}</td><td className="py-2 text-right">{formatRupiah(t.price)} x {t.quantity}</td><td className="py-2 text-right font-medium">{formatRupiah(t.price * t.quantity)}</td></tr>
                  ))}
                </tbody></table>
              )}
            </div>
          );
        })}
        {assets.length === 0 && <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-slate-400">Belum ada aset investasi</div>}
      </div>
    </div>
  );
}
