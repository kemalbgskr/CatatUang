"use client";
import { useEffect, useState, useCallback } from "react";
import { formatRupiah } from "@/lib/utils";
import { Plus, Trash2, Save, Edit2, X, Check, Sparkles, Loader2 } from "lucide-react";

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
  const [aiBudgetLoading, setAiBudgetLoading] = useState(false);
  const [aiBudgetResult, setAiBudgetResult] = useState<{ theory: string; reason: string; savedCount: number } | null>(null);
  const [aiBudgetError, setAiBudgetError] = useState("");
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [autoFillMsg, setAutoFillMsg] = useState("");
  const [tab, setTab] = useState<"kategori" | "budget" | "profil" | "ai" | "webhook" | "bulk">("kategori");
  const [aiSettings, setAiSettings] = useState<AISettings>({
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiKey: "",
    systemPrompt: "Kamu adalah analis keuangan pribadi berbahasa Indonesia. Berikan rekomendasi praktis dan bertahap.",
  });
  
  const [bulkHistory, setBulkHistory] = useState<any[]>([]);
  const [bulkType, setBulkType] = useState<"incomes" | "expenses">("incomes");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");

  const load = useCallback(() => {
    fetch("/api/income-categories").then(r => r.json()).then(setIncomeCats);
    fetch("/api/expense-categories").then(r => r.json()).then(setExpenseCats);
    fetch("/api/budgets").then(r => r.json()).then(setBudgets);
    fetch("/api/profile").then(r => r.json()).then(setProfile);
    fetch("/api/ai-settings").then(r => r.json()).then(setAiSettings);
    fetch("/api/bulk/history").then(r => r.json()).then(setBulkHistory);
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

  const generateAIBudget = async () => {
    setAiBudgetLoading(true);
    setAiBudgetError("");
    setAiBudgetResult(null);
    try {
      const res = await fetch("/api/ai/budget", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setAiBudgetError(data.error || "Gagal membuat budget dengan AI.");
        return;
      }
      setAiBudgetResult(data);
      load(); // refresh budget list
    } catch {
      setAiBudgetError("Gagal terhubung ke layanan AI.");
    } finally {
      setAiBudgetLoading(false);
    }
  };

  const autoFillProfile = async () => {
    setAutoFillLoading(true);
    setAutoFillMsg("");
    try {
      const res = await fetch("/api/profile/auto-fill", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setAutoFillMsg(data.error || "Gagal menghitung."); return; }
      setProfile(prev => ({ ...prev, monthlyIncome: data.monthlyIncome, monthlyExpense: data.monthlyExpense }));
      setAutoFillMsg(`✓ Dihitung dari ${data.incomeMonthsCount} bulan pendapatan & ${data.expenseMonthsCount} bulan pengeluaran.`);
    } catch {
      setAutoFillMsg("Gagal terhubung ke server.");
    } finally {
      setAutoFillLoading(false);
    }
  };

  const tabs = [
    { key: "kategori" as const, label: "Kategori" },
    { key: "budget" as const, label: "Budget" },
    { key: "profil" as const, label: "Profil Keuangan" },
    { key: "ai" as const, label: "AI" },
    { key: "webhook" as const, label: "Webhook (Bot)" },
    { key: "bulk" as const, label: "Bulk Data" },
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Atur Budget Bulanan</h2>
            <button
              onClick={generateAIBudget}
              disabled={aiBudgetLoading}
              className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              {aiBudgetLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {aiBudgetLoading ? "Menganalisis..." : "Set Budget dengan AI"}
            </button>
          </div>

          {/* AI result banner */}
          {aiBudgetResult && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-700 mb-1">✨ Budget berhasil diset oleh AI ({aiBudgetResult.savedCount} kategori)</p>
              <p className="text-xs text-blue-600"><strong>Teori:</strong> {aiBudgetResult.theory}</p>
              <p className="text-xs text-blue-600 mt-0.5">{aiBudgetResult.reason}</p>
            </div>
          )}
          {aiBudgetError && (
            <div className="mb-4 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">{aiBudgetError}</div>
          )}
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Profil Keuangan</h2>
            <button
              onClick={autoFillProfile}
              disabled={autoFillLoading}
              className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              {autoFillLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {autoFillLoading ? "Menghitung..." : "Generate dari Laporan"}
            </button>
          </div>
          {autoFillMsg && (
            <div className={`mb-4 text-xs px-4 py-3 rounded-xl border ${
              autoFillMsg.startsWith("✓")
                ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
                : "bg-rose-950/50 border-rose-800 text-rose-300"
            }`}>{autoFillMsg}</div>
          )}
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

      {/* Webhook */}
      {tab === "webhook" && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Integrasi Webhook (Bot Telegram / OpenClaw)</h2>
            <p className="text-sm text-slate-500 mt-1">Gunakan API di bawah ini agar bot Telegram / OpenClaw bisa otomatis mencatat pengeluaran ke aplikasi ini.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Daftar Endpoint API</label>
              <div className="space-y-2">
                <div className="bg-slate-800 rounded-lg overflow-hidden flex flex-col md:flex-row shadow-sm">
                  <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 flex items-center justify-center w-full md:w-20">POST</div>
                  <code className="text-blue-300 text-sm px-3 py-2 flex-1 break-all">{"https://<domain-kamu>/api/webhook/expense"}</code>
                </div>
                <div className="bg-slate-800 rounded-lg overflow-hidden flex flex-col md:flex-row shadow-sm">
                  <div className="bg-blue-600 text-white text-xs font-bold px-3 py-2 flex items-center justify-center w-full md:w-20">GET</div>
                  <code className="text-blue-300 text-sm px-3 py-2 flex-1 break-all">{"https://<domain-kamu>/api/webhook/expense"}</code>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2"><b>POST</b> untuk kirim data pengeluaran. <b>GET</b> untuk mengambil opsi daftar nama kategori dalam bentuk array string (biar bot tau kategori terbaru).</p>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Secret Key (Headers)</label>
              <div className="bg-slate-800 p-3 rounded-lg text-sm overflow-x-auto">
                <pre className="text-blue-300">
                  {`{\n  "x-api-key": "sk_Y7Pq4lyrN8wX66X7Oqla137r8iMKAEkC"\n}`}
                </pre>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Kunci ini bisa diubah di file <code className="bg-slate-200 px-1 py-0.5 rounded">.env</code> pada variabel <code>WEBHOOK_API_KEY</code>.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Daftar Kategori yang Tersedia</label>
              <div className="flex flex-wrap gap-2">
                {expenseCats.length > 0 ? expenseCats.map(c => (
                  <span key={c.id} className="bg-white border rounded-full px-2.5 py-1 text-xs text-slate-600">{c.name}</span>
                )) : <span className="text-xs text-slate-400">Belum ada kategori pengeluaran</span>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contoh Body JSON</label>
              <p className="text-xs text-slate-500 mb-2">Kasih instruksi ini ke bot OpenClaw kamu supaya dia ngirim data dengan format berikut:</p>
              <div className="bg-slate-800 p-3 rounded-lg text-sm overflow-x-auto">
                <pre className="text-blue-300">
{`{
  "amount": 50000,
  "description": "Beli makan siang di warteg",
  "category": "Konsumsi",    // opsional, bot bisa cocokan dari daftar kategori di atas
  "date": "2026-03-15"       // opsional, default hari ini (YYYY-MM-DD)
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Data */}
      {tab === "bulk" && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Impor Excel (Bulk Update)</h2>
            <p className="text-sm text-slate-500 mt-1">Gunakan fitur ini untuk memasukkan data pendapatan/pengeluaran secara massal dari file Excel (.xlsx).</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">1. Download Template Excel</h3>
                <p className="text-xs text-slate-500 mb-4">Pilih dan download format Excel kosong sesuai kebutuhan.</p>
              </div>
              <div className="flex gap-2">
                <a href="/api/bulk/template?type=incomes" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-center py-2.5 rounded-lg text-sm font-medium">Template Pendapatan</a>
                <a href="/api/bulk/template?type=expenses" className="flex-1 bg-red-600 hover:bg-red-700 text-white text-center py-2.5 rounded-lg text-sm font-medium">Template Pengeluaran</a>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
              <h3 className="font-semibold text-slate-700 mb-2">2. Upload Data</h3>
              <div className="space-y-3">
                <select value={bulkType} onChange={e => setBulkType(e.target.value as any)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="incomes">Impor ke Pendapatan</option>
                  <option value="expenses">Impor ke Pengeluaran</option>
                </select>
                <input type="file" accept=".xlsx" onChange={e => setBulkFile(e.target.files?.[0] || null)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white" />
                <button 
                  onClick={async () => {
                    if (!bulkFile) return alert("Pilih file excel dulu");
                    setBulkLoading(true); setBulkMessage("");
                    const fd = new FormData();
                    fd.append("file", bulkFile);
                    fd.append("type", bulkType);
                    try {
                      const res = await fetch("/api/bulk/upload", { method: "POST", body: fd });
                      const data = await res.json();
                      if (data.ok) {
                        setBulkMessage(data.message);
                        setBulkFile(null);
                        load();
                      } else {
                        setBulkMessage("Error: " + data.error);
                        load();
                      }
                    } catch (e) {
                      setBulkMessage("Gagal upload file");
                    }
                    setBulkLoading(false);
                  }}
                  disabled={bulkLoading || !bulkFile}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium flex justify-center items-center gap-2"
                >
                  {bulkLoading && <Loader2 size={16} className="animate-spin" />}
                  Mulai Upload
                </button>
                {bulkMessage && <p className="text-xs font-semibold text-slate-700 mt-2">{bulkMessage}</p>}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold text-slate-700 mb-4">Riwayat Bulk Upload</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-2 rounded-l-lg">Tanggal Impor</th>
                    <th className="px-4 py-2">Tipe</th>
                    <th className="px-4 py-2">File</th>
                    <th className="px-4 py-2">Baris Sukses</th>
                    <th className="px-4 py-2 rounded-r-lg">Status & Pesan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bulkHistory.map(h => (
                    <tr key={h.id}>
                      <td className="px-4 py-3 text-slate-600">{new Date(h.createdAt).toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3 font-medium capitalize">{h.type.replace("incomes", "Pendapatan").replace("expenses", "Pengeluaran")}</td>
                      <td className="px-4 py-3 text-blue-600 truncate max-w-[150px]">{h.fileName}</td>
                      <td className="px-4 py-3 font-semibold">{h.rowsProcessed} Baris</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold w-fit px-2 py-0.5 rounded-full ${h.status === "success" ? "bg-emerald-100 text-emerald-700" : h.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                            {h.status.toUpperCase()}
                          </span>
                          {h.message && <span className="text-xs text-slate-500 mt-1">{h.message}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bulkHistory.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Belum ada histori upload</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
