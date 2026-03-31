"use client";
import { useState, useMemo } from "react";
import { formatRupiah } from "@/lib/utils";
import { Landmark, Plus, Home, Car, Coins, LineChart, BadgeDollarSign, ShieldCheck } from "lucide-react";

interface AssetItem {
  id: number;
  category: string;
  name: string;
  value: number;
  growth: number; // percentage
  icon: any;
  color: string;
}

const INITIAL_ASSETS: AssetItem[] = [
  {
    id: 1,
    category: "Properti",
    name: "Rumah Bekasi",
    value: 650000000,
    growth: 5.2,
    icon: Home,
    color: "from-emerald-500 to-teal-400"
  },
  {
    id: 2,
    category: "Investasi",
    name: "Reksa Dana Campuran",
    value: 45000000,
    growth: 8.4,
    icon: LineChart,
    color: "from-blue-500 to-indigo-400"
  },
  {
    id: 3,
    category: "Logam Mulia",
    name: "Emas 50g ANTAM",
    value: 62500000,
    growth: 12.1,
    icon: Coins,
    color: "from-amber-500 to-yellow-400"
  },
  {
    id: 4,
    category: "Kendaraan",
    name: "Honda HR-V 2022",
    value: 280000000,
    growth: -15.5, // depresiasi
    icon: Car,
    color: "from-slate-500 to-gray-400"
  }
];

export default function AsetPage() {
  const [assets, setAssets] = useState<AssetItem[]>(INITIAL_ASSETS);
  const [modalOpen, setModalOpen] = useState(false);

  const totalAsset = useMemo(() => {
    return assets.reduce((acc, curr) => acc + curr.value, 0);
  }, [assets]);

  const totalGrowthValue = useMemo(() => {
    return assets.reduce((acc, curr) => acc + (curr.value * (curr.growth / 100)), 0);
  }, [assets]);

  const overallGrowthPercent = totalAsset ? (totalGrowthValue / (totalAsset - totalGrowthValue)) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pt-12 md:pt-4 pb-20 fade-in zoom-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2C2C2C] flex items-center gap-3">
             <Landmark className="text-emerald-500" size={32} /> Portofolio Aset
          </h1>
          <p className="text-[#848484] text-[15px] font-medium mt-1">Lacak kekayaan bersih dan investasi jangka panjangmu.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 px-6 py-3.5 rounded-2xl text-[14px] font-extrabold transition-all ease-out flex items-center justify-center gap-2"
        >
          <Plus size={18} strokeWidth={3} /> Tambah Aset
        </button>
      </div>

      <div className="px-4 md:px-0 space-y-10">
        
        {/* Top Summary Widget */}
        <div className="bg-slate-900 rounded-[32px] p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
           <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-blue-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
           
           <div className="relative z-10 w-full md:w-1/2">
             <h3 className="text-[13px] font-black tracking-widest uppercase text-slate-400 mb-2 flex items-center gap-2">
               <BadgeDollarSign size={16} className="text-emerald-400" /> Total Kekayaan Berwujud
             </h3>
             <div className="text-[40px] md:text-[54px] font-black tracking-tighter leading-none text-white font-mono">
               {formatRupiah(totalAsset)}
             </div>
             
             <div className="flex items-center gap-4 mt-6">
                <div className={`px-3 py-1.5 rounded-xl text-[13px] font-bold flex items-center gap-1 ${overallGrowthPercent >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                   {overallGrowthPercent >= 0 ? "▲" : "▼"} {Math.abs(overallGrowthPercent).toFixed(2)}% (Mendekati)
                </div>
                <div className="text-[13px] font-medium text-slate-400">vs Tahun Lalu</div>
             </div>
           </div>

           <div className="relative z-10 w-full md:w-1/2 flex justify-end">
             <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="bg-white/5 border border-white/10 rounded-[24px] p-5 backdrop-blur-md">
                   <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                     <ShieldCheck size={20} />
                   </div>
                   <div className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aset Aman</div>
                   <div className="text-[18px] font-black text-white">{formatRupiah(assets.find(a => a.category === "Logam Mulia")?.value || 0)}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-[24px] p-5 backdrop-blur-md">
                   <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                     <LineChart size={20} />
                   </div>
                   <div className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pertumbuhan</div>
                   <div className="text-[18px] font-black text-white">+{formatRupiah(Math.max(0, totalGrowthValue))}</div>
                </div>
             </div>
           </div>
        </div>

        {/* Assets Listing */}
        <div>
           <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-6">
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Daftar Aset</h3>
              <span className="text-[12px] font-bold text-slate-400">{assets.length} Item Tersimpan</span>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {assets.map(asset => {
                const Icon = asset.icon;
                const isGrowing = asset.growth >= 0;
                
                return (
                  <div key={asset.id} className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-emerald-100 transition-all duration-300 flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-[20px] bg-gradient-to-br ${asset.color} flex items-center justify-center text-white shadow-md shrink-0`}>
                      <Icon size={28} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                         <h4 className="font-extrabold text-[16px] text-slate-800 leading-tight">{asset.name}</h4>
                         <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-500 tracking-wider uppercase">
                           {asset.category}
                         </span>
                      </div>
                      
                      <div className="flex justify-between items-end mt-4">
                        <div>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Estimasi Nilai</p>
                          <span className="font-black text-[18px] text-slate-900 font-mono tracking-tight">{formatRupiah(asset.value)}</span>
                        </div>
                        <div className={`text-right flex flex-col items-end`}>
                           <span className={`text-[12px] font-black px-2 py-1 rounded-lg ${isGrowing ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                             {isGrowing ? '+' : ''}{asset.growth}%
                           </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
           </div>

        </div>
      </div>
    </div>
  );
}
