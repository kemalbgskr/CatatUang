"use client";
import { useEffect, useState, useCallback } from "react";
import { formatRupiah } from "@/lib/utils";
import { Plus, Trash2, Edit2, X, CreditCard, Wallet, Building2, Coins, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { CurrencyInput } from "@/components/CurrencyInput";
import ConfirmModal from "@/components/ConfirmModal";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Dompet {
  id: number;
  type: string;
  name: string;
  accountNumber: string | null;
  balance: number;
  updatedAt: string;
}

export default function DompetPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Dompet[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id: 0, type: "Bank", name: "", accountNumber: "", balance: "" });
  const [isEditing, setIsEditing] = useState(false);

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: number | null }>({ open: false, id: null });

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/wallets");
    if (res.ok) {
      setWallets(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing && form.id ? `/api/wallets/${form.id}` : "/api/wallets";
    const method = isEditing && form.id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        name: form.name,
        accountNumber: form.accountNumber,
        balance: form.balance
      })
    });

    if (res.ok) {
      setModalOpen(false);
      resetForm();
      loadData();
    } else {
      alert("Gagal menyimpan dompet. Silakan coba lagi.");
    }
  };

  const resetForm = () => {
    setForm({ id: 0, type: "Bank", name: "", accountNumber: "", balance: "" });
    setIsEditing(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (w: Dompet) => {
    setIsEditing(true);
    setForm({
      id: w.id,
      type: w.type,
      name: w.name,
      accountNumber: w.accountNumber || "",
      balance: String(w.balance)
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete.id) return;
    await fetch(`/api/wallets/${confirmDelete.id}`, { method: "DELETE" });
    setConfirmDelete({ open: false, id: null });
    loadData();
  };

  const walletTypes = [
    { label: "Bank", value: "Bank" },
    { label: "E-Wallet", value: "E-Wallet" },
    { label: "Tunai", value: "Tunai" },
    { label: "Kartu Kredit", value: "Kartu Kredit" }
  ];

  const savingsCards = wallets.filter(w => w.type !== "Kartu Kredit");
  const creditCards = wallets.filter(w => w.type === "Kartu Kredit");

  const totalSavings = savingsCards.reduce((acc, curr) => acc + curr.balance, 0);
  const totalCredit = creditCards.reduce((acc, curr) => acc + curr.balance, 0);

  const getIcon = (type: string) => {
    if (type === "Bank") return <Building2 size={20} className="text-blue-500" />;
    if (type === "E-Wallet") return <Wallet size={20} className="text-emerald-500" />;
    if (type === "Tunai") return <Coins size={20} className="text-amber-500" />;
    return <CreditCard size={20} className="text-rose-500" />;
  };

  const getIconBg = (type: string, isDark: boolean = false) => {
    if (isDark) return "bg-white/10";
    if (type === "Bank") return "bg-blue-50";
    if (type === "E-Wallet") return "bg-emerald-50";
    if (type === "Tunai") return "bg-amber-50";
    return "bg-rose-50";
  };

  if (loading && wallets.length === 0) {
    return <div className="p-12 flex justify-center"><div className="animate-pulse w-8 h-8 rounded-full bg-rose-200"></div></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pt-12 md:pt-4 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2C2C2C] flex items-center gap-2">
            Dompet
          </h1>
          <p className="text-[#848484] text-[15px] font-medium mt-1">Atur semua sumber uangmu.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-[#FFEFEF] hover:bg-[#FFDFDF] text-[#E06363] px-6 py-3 rounded-2xl text-[14px] font-extrabold transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} strokeWidth={3} /> Tambah Baru
        </button>
      </div>

      <div className="px-4 md:px-0 space-y-12">
        {/* Saldo & Tabungan Section */}
        <div>
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
            <h3 className="text-[11px] font-black text-[#848484] uppercase tracking-widest flex items-center gap-2">
              <TrendingUpIcon /> Saldo & Tabungan
            </h3>
            <span className="text-[#E06363] text-[13px] font-extrabold">{formatRupiah(totalSavings)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savingsCards.map(w => {
              const isExpanded = expandedId === w.id;
              return (
                <div 
                  key={w.id} 
                  className={`${isExpanded ? 'row-span-2 col-span-1 border-[#FFDFDF] shadow-md' : 'cursor-pointer hover:border-gray-200 hover:shadow-sm'} bg-white border border-[#EAEAEA] rounded-[24px] p-5 transition-all overflow-hidden flex flex-col justify-between h-fit`}
                  onClick={() => !isExpanded && setExpandedId(w.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative ${getIconBg(w.type)}`}>
                        <div className="absolute top-0 left-0 w-2 h-2 rounded-full bg-yellow-400 -mt-1 -ml-1" />
                        {getIcon(w.type)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[15px] text-[#2C2C2C] leading-snug">{w.name}</h4>
                        <p className="text-[10px] font-black text-[#B0B0B0] uppercase tracking-wider">{w.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-[16px] text-[#2C2C2C] font-mono tracking-tight">{formatRupiah(w.balance)}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-6 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between bg-[#F8F8F8] p-3 rounded-xl mb-6">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-[#E06363]" />
                          <div className="text-[11px] text-[#B0B0B0]">
                            <p className="font-bold text-[#E06363]">BARU SAJA</p>
                            <p>Saldo terverifikasi & akurat</p>
                          </div>
                        </div>
                        <button className="text-[#E06363] border border-[#FFDFDF] bg-white text-[10px] font-black px-3 py-1.5 rounded-lg">VERIFIKASI</button>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-[11px] font-black text-[#848484] tracking-widest uppercase">TERSEDIA</h5>
                        <span className="text-[13px] font-bold text-[#E06363]">{formatRupiah(w.balance)}</span>
                      </div>

                      <div className="flex items-center gap-3 mt-6">
                         <div className="w-10 h-10 rounded-xl bg-[#F8F8F8] flex items-center justify-center cursor-pointer text-[#848484] hover:text-[#2C2C2C]" onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}>
                           <ChevronUp size={18} />
                         </div>
                         <button 
                           onClick={(e) => { e.stopPropagation(); openEditModal(w); }} 
                           className="flex-1 border border-[#EAEAEA] text-[#2C2C2C] text-[13px] font-extrabold py-3 rounded-xl hover:bg-[#F8F8F8] transition-colors flex justify-center items-center gap-2"
                         >
                           <Edit2 size={14} /> Ubah
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); setConfirmDelete({ open: true, id: w.id }) }} 
                           className="flex-1 border border-[#EAEAEA] text-[#2C2C2C] text-[13px] font-extrabold py-3 rounded-xl hover:bg-[#FFEFEF] hover:text-[#E06363] transition-colors flex justify-center items-center gap-2"
                         >
                           <Trash2 size={14} /> Hapus
                         </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {savingsCards.length === 0 && (
             <div className="text-center py-8 text-[#B0B0B0] font-semibold text-sm">Belum ada akun bank atau e-wallet.</div>
          )}
        </div>

        {/* Kartu Kredit & Cicilan Section */}
        <div>
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
            <h3 className="text-[11px] font-black text-[#848484] uppercase tracking-widest flex items-center gap-2">
              <TrendingDownIcon /> Kartu Kredit & Cicilan
            </h3>
            <span className="text-[#E06363] text-[13px] font-extrabold">{formatRupiah(totalCredit)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCards.map(w => {
              const isExpanded = expandedId === w.id;
              return (
                <div 
                  key={w.id} 
                  className={`${isExpanded ? 'row-span-2 col-span-1 shadow-md' : 'cursor-pointer hover:shadow-sm'} bg-[#2C2C2C] rounded-[24px] p-5 transition-all overflow-hidden flex flex-col justify-between h-fit`}
                  onClick={() => !isExpanded && setExpandedId(w.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative ${getIconBg(w.type, true)}`}>
                        <div className="absolute top-0 left-0 w-2 h-2 rounded-full bg-yellow-400 -mt-1 -ml-1" />
                        {getIcon(w.type) && <CreditCard size={20} className="text-[#FFEFEF]" />}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[15px] text-white leading-snug">{w.name}</h4>
                        <p className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-wider">{w.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-[16px] text-white font-mono tracking-tight">{formatRupiah(w.balance)}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-6 pt-4 border-t border-white/10 animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-3 mt-6">
                         <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center cursor-pointer text-[#A0A0A0] hover:text-white" onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}>
                           <ChevronUp size={18} />
                         </div>
                         <button 
                           onClick={(e) => { e.stopPropagation(); openEditModal(w); }} 
                           className="flex-1 bg-white/10 text-white text-[13px] font-extrabold py-3 rounded-xl hover:bg-white/20 transition-colors flex justify-center items-center gap-2"
                         >
                           <Edit2 size={14} /> Ubah
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); setConfirmDelete({ open: true, id: w.id }) }} 
                           className="flex-1 text-[#E06363] bg-[#FFEFEF]/10 text-[13px] font-extrabold py-3 rounded-xl hover:bg-[#FFEFEF]/20 transition-colors flex justify-center items-center gap-2"
                         >
                           <Trash2 size={14} /> Hapus
                         </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {creditCards.length === 0 && (
             <div className="text-center py-8 text-[#B0B0B0] font-semibold text-sm">Belum ada kartu kredit.</div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[#F6F6F6] max-w-md w-full rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-white p-8 rounded-[32px] shadow-sm relative">
              <button 
                onClick={() => setModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-black"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-[20px] font-extrabold text-[#2C2C2C] mb-8">{isEditing ? "Ubah Dompet" : "Tambah Dompet"}</h2>

              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black tracking-widest text-[#B0B0B0] uppercase mb-1.5 block">Tipe</label>
                  <div className="relative">
                    <select 
                      required 
                      value={form.type} 
                      onChange={e => setForm({...form, type: e.target.value})} 
                      className="w-full bg-white border border-[#EAEAEA] rounded-[16px] px-4 py-3.5 text-[14px] font-semibold text-[#2C2C2C] outline-none appearance-none"
                    >
                      {walletTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B0B0B0] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black tracking-widest text-[#B0B0B0] uppercase mb-1.5 block">Nama</label>
                  <input 
                    required 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    className="w-full bg-white border border-[#EAEAEA] rounded-[16px] px-4 py-3.5 text-[14px] font-semibold text-[#2C2C2C] outline-none placeholder:text-[#D0D0D0]"
                    placeholder="cth. BCA Pribadi" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black tracking-widest text-[#B0B0B0] uppercase mb-1.5 block">Nomor Rekening (Opsional)</label>
                  <input 
                    value={form.accountNumber} 
                    onChange={e => setForm({...form, accountNumber: e.target.value})} 
                    className="w-full bg-white border border-[#EAEAEA] rounded-[16px] px-4 py-3.5 text-[14px] font-semibold text-[#2C2C2C] outline-none placeholder:text-[#D0D0D0]"
                    placeholder="Nomor Rekening" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black tracking-widest text-[#B0B0B0] uppercase mb-1.5 block">Saldo Saat Ini</label>
                  <CurrencyInput 
                    value={form.balance} 
                    onChangeValue={(val) => setForm({...form, balance: val})} 
                    className="w-full bg-white border border-[#EAEAEA] rounded-[16px] px-4 py-3.5 text-[14px] font-semibold text-[#2C2C2C] outline-none"
                    placeholder="Rp 0"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    className="w-full bg-[#FFEFEF] hover:bg-[#FFDFDF] text-[#E06363] py-4 rounded-[16px] text-[14px] font-extrabold transition-colors"
                  >
                    {isEditing ? "Simpan Perubahan" : "Tambah"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Hapus Dompet"
        message="Yakin ingin menghapus dompet ini?"
        confirmLabel="Ya, Hapus"
      />
    </div>
  );
}

function TrendingUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#FFBDBD]">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
      <polyline points="16 7 22 7 22 13"></polyline>
    </svg>
  );
}

function TrendingDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#FFBDBD]">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
      <polyline points="16 17 22 17 22 11"></polyline>
    </svg>
  );
}
