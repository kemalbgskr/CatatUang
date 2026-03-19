"use client";
import { useEffect, useState, useCallback } from "react";
import { formatRupiah } from "@/lib/utils";
import { Plus, Trash2, Save, X, Edit2, Loader2, Sparkles, LogOut, Code, User, CreditCard, Shield, Database, LayoutTemplate } from "lucide-react";
import { CurrencyInput } from "@/components/CurrencyInput";
import ConfirmModal from "@/components/ConfirmModal";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Interfaces from original file
interface IncomeCategory { id: number; name: string; }
interface ExpenseCategory { id: number; name: string; }
interface Profile { id: number; monthlyIncome: number; monthlyExpense: number; birthDate: string | null; retirementAge: number; inheritanceAge: number; }
interface AISettings { baseUrl: string; model: string; apiKey: string; systemPrompt: string; }
interface UserData { id: number; username: string; role: string; createdAt: string; }
interface Session { authenticated: boolean; userId: number; username: string; role: string; }

export default function PengaturanPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  
  const [incomeCats, setIncomeCats] = useState<IncomeCategory[]>([]);
  const [expenseCats, setExpenseCats] = useState<ExpenseCategory[]>([]);
  const [profile, setProfile] = useState<Profile>({ id: 0, monthlyIncome: 0, monthlyExpense: 0, birthDate: null, retirementAge: 60, inheritanceAge: 80 });
  const [aiSettings, setAiSettings] = useState<AISettings>({ baseUrl: "", model: "", apiKey: "", systemPrompt: "" });
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [userForm, setUserForm] = useState({ username: "", password: "", role: "USER" });
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  
  const [newIncomeCat, setNewIncomeCat] = useState("");
  const [newExpenseCat, setNewExpenseCat] = useState("");
  
  const [bulkHistory, setBulkHistory] = useState<any[]>([]);
  const [bulkType, setBulkType] = useState<"incomes" | "expenses">("incomes");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, type: "incomeCat" | "expenseCat" | "user" | null, id: number | null, name?: string }>({ open: false, type: null, id: null });
  const [activeSection, setActiveSection] = useState("preferensi");

  const load = useCallback(() => {
    fetch("/api/income-categories").then(r => r.json()).then(setIncomeCats);
    fetch("/api/expense-categories").then(r => r.json()).then(setExpenseCats);
    fetch("/api/profile").then(r => r.json()).then(setProfile);
    fetch("/api/ai-settings").then(r => r.json()).then(setAiSettings);
    fetch("/api/bulk/history").then(r => r.json()).then(setBulkHistory);
    fetch("/api/auth/me").then(r => r.json()).then(data => {
      setSession(data);
      if (data.role === "ADMIN") fetch("/api/users").then(r => r.json()).then(setUsers);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const addIncomeCat = async () => { if (!newIncomeCat.trim()) return; await fetch("/api/income-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newIncomeCat.trim() }) }); setNewIncomeCat(""); load(); };
  const addExpenseCat = async () => { if (!newExpenseCat.trim()) return; await fetch("/api/expense-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newExpenseCat.trim() }) }); setNewExpenseCat(""); load(); };
  const deleteIncomeCat = async (id: number) => setConfirmDelete({ open: true, type: "incomeCat", id });
  const deleteExpenseCat = async (id: number) => setConfirmDelete({ open: true, type: "expenseCat", id });
  
  const handleConfirmDelete = async () => {
    if (!confirmDelete.id || !confirmDelete.type) return;
    const { id, type } = confirmDelete;
    let url = "";
    if (type === "incomeCat") url = "/api/income-categories/" + id;
    else if (type === "expenseCat") url = "/api/expense-categories/" + id;
    else if (type === "user") url = "/api/users/" + id;
    await fetch(url, { method: "DELETE" });
    setConfirmDelete({ open: false, type: null, id: null });
    load();
  };

  const saveProfile = async () => { await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) }); alert("Profil tersimpan!"); };
  const saveAISettings = async () => { await fetch("/api/ai-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(aiSettings) }); alert("Konfigurasi AI tersimpan!"); };
  
  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault(); setUserLoading(true);
    const url = editingUserId ? `/api/users/${editingUserId}` : "/api/users";
    const res = await fetch(url, { method: editingUserId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userForm) });
    if (!res.ok) alert((await res.json()).error || "Gagal menyimpan user");
    else { setUserForm({ username: "", password: "", role: "USER" }); setEditingUserId(null); load(); }
    setUserLoading(false);
  };
  const deleteUser = async (id: number) => { if (id === session?.userId) return alert("Hapus diri sendiri tidak diizinkan."); const user = users.find(u => u.id === id); setConfirmDelete({ open: true, type: "user", id, name: user?.username }); };

  const autoFillProfile = async () => { setAutoFillLoading(true); try { const res = await fetch("/api/profile/auto-fill", { method: "POST" }); const data = await res.json(); if (!res.ok) return; setProfile(prev => ({ ...prev, monthlyIncome: data.monthlyIncome, monthlyExpense: data.monthlyExpense })); } finally { setAutoFillLoading(false); } };

  const SectionPill = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button 
      onClick={() => setActiveSection(id)}
      className={`flex flex-col items-center justify-center p-4 rounded-[20px] transition-all border-2 ${activeSection === id ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'}`}
    >
      <Icon size={24} className={`mb-2 ${activeSection === id ? 'text-rose-500' : 'text-slate-400'}`} />
      <span className="text-[13px] font-bold text-center leading-tight">{label}</span>
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-12 md:pt-4 pb-12">
      {/* Header Profile Info */}
      <div className="bg-white rounded-[32px] border border-slate-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-rose-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden shrink-0">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${session?.username || 'user'}`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{session?.username || "Pengguna"}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-indigo-100 text-indigo-700 text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">{session?.role || "USER"}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto">
          <button className="bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-xl text-[14px] transition-all flex-1 md:flex-none">Ganti Avatar</button>
          <button onClick={() => { fetch("/api/auth/logout", { method: "POST" }).then(() => { router.push("/login"); router.refresh(); }) }} className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-3 px-6 rounded-xl text-[14px] transition-all flex items-center justify-center gap-2 flex-1 md:flex-none"><LogOut size={16} /> Logout</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SectionPill id="preferensi" label="Preferensi" icon={User} />
        <SectionPill id="kategori" label="Kategori Data" icon={LayoutTemplate} />
        <SectionPill id="ai" label="AI Advisor" icon={Sparkles} />
        <SectionPill id="data" label="Data & Bot" icon={Database} />
        {session?.role === "ADMIN" && <SectionPill id="admin" label="User Admin" icon={Shield} />}
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
        
        {/* PREFERENSI */}
        {activeSection === "preferensi" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Preferensi & Finansial</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Data ini digunakan AI untuk memberikan saran akurat.</p>
              </div>
              <button onClick={autoFillProfile} disabled={autoFillLoading} className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl" title="Hitung Otomatis dari Data">
                {autoFillLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="text-blue-500" />}
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-[13px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Pendapatan Rata-rata / Bulan</label>
                <CurrencyInput value={profile.monthlyIncome} onChangeValue={(val: string) => setProfile({ ...profile, monthlyIncome: parseFloat(val) || 0 })} className="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white rounded-xl px-4 py-3 text-[15px] font-bold text-slate-800 outline-none transition-all" />
              </div>
              <div>
                <label className="text-[13px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Pengeluaran Rata-rata / Bulan</label>
                <CurrencyInput value={profile.monthlyExpense} onChangeValue={(val: string) => setProfile({ ...profile, monthlyExpense: parseFloat(val) || 0 })} className="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white rounded-xl px-4 py-3 text-[15px] font-bold text-slate-800 outline-none transition-all" />
              </div>
              <div>
                <label className="text-[13px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Usia Target Pensiun</label>
                <input type="number" value={profile.retirementAge} onChange={e => setProfile({ ...profile, retirementAge: parseInt(e.target.value) || 60 })} className="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white rounded-xl px-4 py-3 text-[15px] font-bold text-slate-800 outline-none transition-all" />
              </div>
              <div>
                <label className="text-[13px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Ekspektasi Usia Harapan Hidup</label>
                <input type="number" value={profile.inheritanceAge} onChange={e => setProfile({ ...profile, inheritanceAge: parseInt(e.target.value) || 80 })} className="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white rounded-xl px-4 py-3 text-[15px] font-bold text-slate-800 outline-none transition-all" />
              </div>
            </div>
            <button onClick={saveProfile} className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-slate-900/20">Simpan Perubahan</button>
          </div>
        )}

        {/* KATEGORI */}
        {activeSection === "kategori" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 mb-6">Kelola Kategori</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Pemasukan */}
                <div className="bg-slate-50 border border-slate-100 rounded-[20px] p-5">
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Kategori Pemasukan</h3>
                  <div className="flex gap-2 mb-4">
                    <input value={newIncomeCat} onChange={e => setNewIncomeCat(e.target.value)} placeholder="Nama Kategori..." className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-300" onKeyDown={e => e.key === "Enter" && addIncomeCat()} />
                    <button onClick={addIncomeCat} className="bg-emerald-500 text-white w-10 h-10 rounded-xl hover:bg-emerald-600 flex items-center justify-center"><Plus size={18} /></button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {incomeCats.map(c => (
                      <div key={c.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-4 py-3">
                        <span className="text-sm font-bold text-slate-700">{c.name}</span>
                        <button onClick={() => deleteIncomeCat(c.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pengeluaran */}
                <div className="bg-slate-50 border border-slate-100 rounded-[20px] p-5">
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /> Kategori Pengeluaran</h3>
                  <div className="flex gap-2 mb-4">
                    <input value={newExpenseCat} onChange={e => setNewExpenseCat(e.target.value)} placeholder="Nama Kategori..." className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-rose-300" onKeyDown={e => e.key === "Enter" && addExpenseCat()} />
                    <button onClick={addExpenseCat} className="bg-rose-500 text-white w-10 h-10 rounded-xl hover:bg-rose-600 flex items-center justify-center"><Plus size={18} /></button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {expenseCats.map(c => (
                      <div key={c.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-4 py-3">
                        <span className="text-sm font-bold text-slate-700">{c.name}</span>
                        <button onClick={() => deleteExpenseCat(c.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI ADVISOR */}
        {activeSection === "ai" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-xl font-extrabold text-slate-800">API Key & AI Setting <span className="text-[11px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full uppercase tracking-widest ml-2 align-middle">PRO</span></h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Gunakan API OpenAI/OpenRouter untuk fitur chat & scanner.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-[13px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Base URL API</label>
                <input type="text" value={aiSettings.baseUrl} onChange={e => setAiSettings({ ...aiSettings, baseUrl: e.target.value })} className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl px-4 py-3 text-[15px] font-bold text-slate-800 outline-none transition-all" placeholder="https://api.openai.com/v1" />
              </div>
              <div>
                <label className="text-[13px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Model Endpoint</label>
                <input type="text" value={aiSettings.model} onChange={e => setAiSettings({ ...aiSettings, model: e.target.value })} className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl px-4 py-3 text-[15px] font-bold text-slate-800 outline-none transition-all" placeholder="gpt-4o-mini" />
              </div>
            </div>
            
            <div>
              <label className="text-[13px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">API Key Rahasia</label>
              <input type="password" value={aiSettings.apiKey} onChange={e => setAiSettings({ ...aiSettings, apiKey: e.target.value })} className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl px-4 py-3 text-[15px] font-bold text-slate-800 outline-none transition-all" placeholder="sk-..." />
            </div>

            <div>
              <label className="text-[13px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">Persona & System Prompt</label>
              <textarea rows={4} value={aiSettings.systemPrompt} onChange={e => setAiSettings({ ...aiSettings, systemPrompt: e.target.value })} className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl px-4 py-3 text-[15px] font-medium text-slate-800 outline-none transition-all leading-relaxed" placeholder="Instruksi sistem ke AI" />
            </div>

            <button onClick={saveAISettings} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-indigo-600/20 align-center gap-2 flex justify-center items-center">Simpan Konfigurasi</button>
          </div>
        )}

        {/* DATA & BOT */}
        {activeSection === "data" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
            {/* Telegram / OpenClaw Bot */}
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 mb-2">Integrasi Bot (Telegram / WhatsApp)</h2>
              <p className="text-sm font-medium text-slate-500 mb-6">Sambungkan bot kamu ke CatatUang lewat Webhook berikut ini.</p>
              <div className="bg-slate-900 rounded-[24px] p-6 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <span className="bg-emerald-500 text-white text-xs font-black px-3 py-1.5 rounded-lg shrink-0">POST</span>
                  <code className="text-emerald-300 text-[13px] break-all md:w-auto w-full text-center md:text-left bg-slate-800 py-2 px-3 rounded-xl border border-slate-700 font-mono">https://{"<domain-kamu>"}/api/webhook/expense</code>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 max-h-48 overflow-auto CustomScrollbar">
                  <pre className="text-[12px] text-blue-300 font-mono">
{`// Body Format
{
  "amount": 50000,
  "description": "Beli kopi",
  "category": "Konsumsi"
}
// Header (Sesuaikan di .env)
{ "x-api-key": "sk_Y7P..." }`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Impor Massal Excel */}
            <div className="pt-8 border-t border-slate-100">
              <h2 className="text-xl font-extrabold text-slate-800 mb-2">Impor Data Massal</h2>
              <p className="text-sm font-medium text-slate-500 mb-6">Punya ribuan data? Download template excel dan impor langsung ke sini.</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-blue-900 mb-2">1. Download Template Asli</h3>
                    <p className="text-xs text-blue-700/80 mb-6">Unduh format Excel yang kami sediakan.</p>
                  </div>
                  <div className="grid gap-2">
                    <a href="/api/bulk/template?type=incomes" className="bg-white border border-blue-200 text-blue-700 font-bold py-2.5 rounded-xl text-xs text-center hover:bg-blue-100 transition">Template Pemasukan</a>
                    <a href="/api/bulk/template?type=expenses" className="bg-white border border-blue-200 text-blue-700 font-bold py-2.5 rounded-xl text-xs text-center hover:bg-blue-100 transition">Template Pengeluaran</a>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-800 mb-2">2. Upload Excel</h3>
                  <div className="space-y-3">
                    <select value={bulkType} onChange={e => setBulkType(e.target.value as any)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none">
                      <option value="incomes">Impor ke Pemasukan</option>
                      <option value="expenses">Impor ke Pengeluaran</option>
                    </select>
                    <input type="file" accept=".xlsx" onChange={e => setBulkFile(e.target.files?.[0] || null)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700" />
                    <button 
                      onClick={async () => {
                        if (!bulkFile) return alert("Pilih file excel dulu");
                        setBulkLoading(true); setBulkMessage("");
                        const fd = new FormData(); fd.append("file", bulkFile); fd.append("type", bulkType);
                        try {
                          const res = await fetch("/api/bulk/upload", { method: "POST", body: fd });
                          const data = await res.json();
                          setBulkMessage((data.ok ? "Berhasil: " : "Error: ") + (data.message || data.error));
                          if (data.ok) { setBulkFile(null); load(); }
                        } catch (e) { setBulkMessage("Gagal upload file"); }
                        setBulkLoading(false);
                      }}
                      disabled={bulkLoading || !bulkFile}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition"
                    >
                      {bulkLoading && <Loader2 size={16} className="animate-spin" />} Mulai Impor Massal
                    </button>
                    {bulkMessage && <p className="text-[12px] font-bold text-center mt-2 text-slate-600 bg-white p-2 border border-slate-200 rounded-lg">{bulkMessage}</p>}
                  </div>
                </div>
              </div>

              {bulkHistory.length > 0 && (
                <div className="mt-8 border border-slate-100 rounded-2xl p-2 shrink bg-slate-50 overflow-auto max-h-60 no-scrollbar">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-white text-slate-500 font-bold border-b border-slate-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-xl">Waktu</th>
                        <th className="px-4 py-3">Tipe</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                      {bulkHistory.map(h => (
                        <tr key={h.id} className="hover:bg-white transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">{new Date(h.createdAt).toLocaleDateString("id-ID")} {new Date(h.createdAt).getHours()}:{new Date(h.createdAt).getMinutes()}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800 capitalize">{h.type.replace("incomes", "Pemasukan").replace("expenses", "Pengeluaran")} <br/><span className="text-[10px] text-slate-400 font-normal">{h.rowsProcessed} Baris</span></td>
                          <td className="px-4 py-3">
                            <span className={`font-black px-2 py-1 rounded-md text-[10px] uppercase ${h.status === "success" ? "bg-emerald-100 text-emerald-700" : h.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{h.status}</span>
                            {h.message && <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight" title={h.message}>{h.message}</p>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* USER ADMIN */}
        {activeSection === "admin" && session?.role === "ADMIN" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">Manajemen Pengguna Aplikasi</h2>
            
            <form onSubmit={saveUser} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 grid md:grid-cols-12 gap-4 items-end">
              <div className="col-span-12 md:col-span-4">
                <label className="text-[12px] font-extrabold text-slate-500 mb-1 block">Username</label>
                <input required value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} className="w-full bg-white border border-slate-200 focus:border-indigo-400 rounded-xl px-4 py-3 text-[14px] font-bold text-slate-800 outline-none" placeholder="Masukkan username" />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="text-[12px] font-extrabold text-slate-500 mb-1 block">Password {editingUserId && "(Kosongi Jika Tidak Diganti)"}</label>
                <input type="password" required={!editingUserId} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full bg-white border border-slate-200 focus:border-indigo-400 rounded-xl px-4 py-3 text-[14px] font-bold text-slate-800 outline-none" placeholder="Masukkan password" />
              </div>
              <div className="col-span-12 md:col-span-2">
                <label className="text-[12px] font-extrabold text-slate-500 mb-1 block">Role</label>
                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-[14px] font-bold text-slate-800 outline-none">
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="col-span-12 md:col-span-2 flex gap-2 w-full h-[46px]">
                <button type="submit" disabled={userLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-[14px] font-bold h-full transition shadow-md">{editingUserId ? "Update" : "Buat"}</button>
                {editingUserId && (
                  <button type="button" onClick={() => { setEditingUserId(null); setUserForm({ username: "", password: "", role: "USER" }); }} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[14px] font-bold h-full transition">Batal</button>
                )}
              </div>
            </form>

            <div className="border border-slate-100 rounded-[20px] overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Pengguna</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-right">Opsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${u.username}`} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 text-[14px]">{u.username}</p>
                            <p className="font-medium text-[11px] text-slate-400">Join: {new Date(u.createdAt).toLocaleDateString("id-ID")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md ${u.role === "ADMIN" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"}`}>{u.role}</span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <button onClick={() => { setEditingUserId(u.id); setUserForm({ username: u.username, password: "", role: u.role }); }} className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition"><Edit2 size={16} /></button>
                        <button onClick={() => deleteUser(u.id)} disabled={u.id === session?.userId} className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-2 rounded-lg transition disabled:opacity-50"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, type: null, id: null })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus"
        message={confirmDelete.type === "user" ? "Anda yakin hapus user ini? Data historynya tertinggal dan rawan konflik DB manual." : "Apakah kamu yakin ingin menghapus kategori ini?"}
        confirmLabel="Hapus Permanen"
      />
    </div>
  );
}
