"use client";
import { useEffect, useState, useCallback } from "react";
import { formatRupiah } from "@/lib/utils";
import { Plus, Trash2, Save, Edit2, X, Check } from "lucide-react";

interface IncomeCategory { id: number; name: string; }
interface ExpenseCategory { id: number; name: string; }
interface Budget { id: number; categoryId: number; monthlyAmount: number; category: ExpenseCategory; }
interface Profile { id: number; monthlyIncome: number; monthlyExpense: number; birthDate: string | null; retirementAge: number; inheritanceAge: number; }
interface AISettings { baseUrl: string; model: string; apiKey: string; systemPrompt: string; }

export default function PengaturanPage() {
  const [incomeCats, setIncomeCats] = useState<IncomeCategory[]>([]);
  const [expenseCats, setExpenseCats] = useState<ExpenseCategory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [profile, setProfile] = useState<Profile>({ id: 0, monthlyIncome: 0, monthlyExpense: 0, birthDate: null, retirementAge: 60, inheritanceAge: 80 });

  const [newIncomeCat, setNewIncomeCat] = useState("");
  const [newExpenseCat, setNewExpenseCat] = useState("");
  const [newBudgetCatId, setNewBudgetCatId] = useState("");
  const [newBudgetAmt, setNewBudgetAmt] = useState("");
  const [editBudgetId, setEditBudgetId] = useState<number | null>(null);
  const [editBudgetAmt, setEditBudgetAmt] = useState("");
  const [tab, setTab] = useState<"kategori" | "budget" | "profil" | "ai">("kategori");
  const [aiSettings, setAiSettings] = useState<AISettings>({
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiKey: "",
    systemPrompt: "Kamu adalah analis keuangan pribadi berbahasa Indonesia. Berikan rekomendasi praktis dan bertahap.",
  });

  const load = useCallback(() => {
    fetch("/api/income-categories").then(r => r.json()).then(setIncomeCats);
    fetch("/api/expense-categories").then(r => r.json()).then(setExpenseCats);
    fetch("/api/budgets").then(r => r.json()).then(setBudgets);
    fetch("/api/profile").then(r => r.json()).then(setProfile);
    fetch("/api/ai-settings").then(r => r.json()).then(setAiSettings);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addIncomeCat = async () => {
    if (!newIncomeCat.trim()) return;
    await fetch("/api/income-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newIncomeCat.trim() }) });
    setNewIncomeCat(""); load();
  };
  const addExpenseCat = async () => {
    if (!newExpenseCat.trim()) return;
    await fetch("/api/expense-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newExpenseCat.trim() }) });
    setNewExpenseCat(""); load();
  };
  const deleteIncomeCat = async (id: number) => {
    if (!confirm("Hapus kategori pendapatan ini?")) return;
    const res = await fetch("/api/income-categories/" + id, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Gagal menghapus kategori pendapatan.");
      return;
    }
    load();
  };
  const deleteExpenseCat = async (id: number) => {
    if (!confirm("Hapus kategori pengeluaran ini?")) return;
    const res = await fetch("/api/expense-categories/" + id, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Gagal menghapus kategori pengeluaran.");
      return;
    }
    load();
  };
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
    await fetch("/api/budgets/" + id, { method: "DELETE" });
    load();
  };
  const saveProfile = async () => {
    await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
    alert("Profil tersimpan!");
  };

  const saveAISettings = async () => {
    await fetch("/api/ai-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aiSettings),
    });
    alert("Konfigurasi AI tersimpan!");
  };

  const tabs = [
    { key: "kategori" as const, label: "Kategori" },
    { key: "budget" as const, label: "Budget" },
    { key: "profil" as const, label: "Profil Keuangan" },
    { key: "ai" as const, label: "AI" },
  ];

  return (
    <div className="space-y-6 pt-12 md:pt-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pengaturan</h1>
        <p className="text-slate-500 text-sm">Kelola kategori, budget, dan profil keuanganmu</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={"flex-1 py-2 text-sm font-medium rounded-md transition-colors " + (tab === t.key ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Kategori */}
      {tab === "kategori" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Kategori Pendapatan</h2>
            <div className="flex gap-2 mb-4">
              <input value={newIncomeCat} onChange={e => setNewIncomeCat(e.target.value)} placeholder="Nama kategori..." className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={e => e.key === "Enter" && addIncomeCat()} />
              <button onClick={addIncomeCat} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700"><Plus size={16} /></button>
            </div>
            <div className="space-y-2">
              {incomeCats.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2">
                  <span className="text-sm text-slate-700">{c.name}</span>
                  <button onClick={() => deleteIncomeCat(c.id)} className="text-slate-400 hover:text-red-600" title="Hapus kategori">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {incomeCats.length === 0 && <p className="text-center text-slate-400 py-4">Belum ada</p>}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Kategori Pengeluaran</h2>
            <div className="flex gap-2 mb-4">
              <input value={newExpenseCat} onChange={e => setNewExpenseCat(e.target.value)} placeholder="Nama kategori..." className="flex-1 border rounded-lg px-3 py-2 text-sm" onKeyDown={e => e.key === "Enter" && addExpenseCat()} />
              <button onClick={addExpenseCat} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700"><Plus size={16} /></button>
            </div>
            <div className="space-y-2">
              {expenseCats.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2">
                  <span className="text-sm text-slate-700">{c.name}</span>
                  <button onClick={() => deleteExpenseCat(c.id)} className="text-slate-400 hover:text-red-600" title="Hapus kategori">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {expenseCats.length === 0 && <p className="text-center text-slate-400 py-4">Belum ada</p>}
            </div>
          </div>
        </div>
      )}

      {/* Budget */}
      {tab === "budget" && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Atur Budget Bulanan</h2>
          <div className="flex gap-2 mb-4">
            <select value={newBudgetCatId} onChange={e => setNewBudgetCatId(e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm">
              <option value="">Pilih kategori...</option>
              {expenseCats.filter(c => !budgets.some(b => b.categoryId === c.id)).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input type="number" value={newBudgetAmt} onChange={e => setNewBudgetAmt(e.target.value)} placeholder="Jumlah..." className="w-40 border rounded-lg px-3 py-2 text-sm" />
            <button onClick={addBudget} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"><Plus size={16} />Tambah</button>
          </div>
          <div className="space-y-2">
            {budgets.map(b => (
              <div key={b.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-slate-700">{b.category.name}</span>
                <div className="flex items-center gap-2">
                  {editBudgetId === b.id ? (
                    <>
                      <input type="number" value={editBudgetAmt} onChange={e => setEditBudgetAmt(e.target.value)} className="w-32 border rounded px-2 py-1 text-sm" />
                      <button onClick={() => updateBudget(b)} className="text-emerald-600 hover:text-emerald-800"><Check size={16} /></button>
                      <button onClick={() => setEditBudgetId(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-blue-600 font-semibold">{formatRupiah(b.monthlyAmount)}</span>
                      <button onClick={() => { setEditBudgetId(b.id); setEditBudgetAmt(String(b.monthlyAmount)); }} className="text-slate-400 hover:text-blue-600"><Edit2 size={14} /></button>
                      <button onClick={() => deleteBudget(b.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {budgets.length === 0 && <p className="text-center text-slate-400 py-4">Belum ada budget</p>}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between">
            <span className="text-sm font-medium text-slate-600">Total Budget</span>
            <span className="text-sm font-bold text-blue-600">{formatRupiah(budgets.reduce((s, b) => s + b.monthlyAmount, 0))}</span>
          </div>
        </div>
      )}

      {/* Profil */}
      {tab === "profil" && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Profil Keuangan</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pendapatan Bulanan</label>
              <input type="number" value={profile.monthlyIncome} onChange={e => setProfile({ ...profile, monthlyIncome: parseFloat(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pengeluaran Bulanan</label>
              <input type="number" value={profile.monthlyExpense} onChange={e => setProfile({ ...profile, monthlyExpense: parseFloat(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Lahir</label>
              <input type="date" value={profile.birthDate || ""} onChange={e => setProfile({ ...profile, birthDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usia Pensiun</label>
              <input type="number" value={profile.retirementAge} onChange={e => setProfile({ ...profile, retirementAge: parseInt(e.target.value) || 60 })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usia Warisan</label>
              <input type="number" value={profile.inheritanceAge} onChange={e => setProfile({ ...profile, inheritanceAge: parseInt(e.target.value) || 80 })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={saveProfile} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"><Save size={16} />Simpan</button>
          </div>
        </div>
      )}

      {/* AI */}
      {tab === "ai" && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Pengaturan AI Analisis</h2>
          <p className="text-sm text-slate-500">Masukkan API AI yang ingin dipakai untuk analisis level kekayaan dan rekomendasi otomatis.</p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Base URL API</label>
              <input
                type="text"
                value={aiSettings.baseUrl}
                onChange={e => setAiSettings({ ...aiSettings, baseUrl: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
              <input
                type="text"
                value={aiSettings.model}
                onChange={e => setAiSettings({ ...aiSettings, model: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="gpt-4o-mini"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
            <input
              type="password"
              value={aiSettings.apiKey}
              onChange={e => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="sk-..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">System Prompt</label>
            <textarea
              rows={5}
              value={aiSettings.systemPrompt}
              onChange={e => setAiSettings({ ...aiSettings, systemPrompt: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Instruksi ke AI"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={saveAISettings} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"><Save size={16} />Simpan Konfigurasi AI</button>
          </div>
        </div>
      )}
    </div>
  );
}
